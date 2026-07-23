import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import {
  buildConnectionReasons,
  classifyProviderFailure,
  getRetryDelayMs,
  selectStrongestConnections,
  truncateUtf8,
} from "./lib/enrichment";
import {
  createEmbedding,
  hashContent,
  ProviderRequestError,
  scrapeDocument,
  summarizeDocument,
} from "./lib/providers";

const SUMMARY_MODEL =
  process.env.OPENROUTER_SUMMARY_MODEL ?? "openai/gpt-5-mini";
const EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL ??
  "openai/text-embedding-3-small";
const RUN_LEASE_MS = 5 * 60_000;

const stageValidator = v.union(
  v.literal("extract"),
  v.literal("analyze"),
  v.literal("embed"),
  v.literal("connect"),
  v.literal("complete"),
  v.literal("failed"),
);

const documentValidator = v.object({
  sourceUrl: v.optional(v.string()),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  markdown: v.string(),
  contentHash: v.string(),
  truncated: v.boolean(),
  fetchedAt: v.number(),
});

function createRunToken(job: Doc<"enrichmentJobs">): string {
  return `${job._id}:${job.attempt + 1}:${Date.now()}`;
}

function bookmarkStatusForStage(
  stage: Doc<"enrichmentJobs">["stage"],
): Doc<"bookmarks">["enrichmentStatus"] {
  if (stage === "extract") {
    return "extracting";
  }
  if (stage === "analyze") {
    return "analyzing";
  }
  if (stage === "embed" || stage === "connect") {
    return "indexing";
  }
  if (stage === "complete") {
    return "ready";
  }
  return "failed";
}

export const claimJob = internalMutation({
  args: { jobId: v.id("enrichmentJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    const now = Date.now();
    const hasActiveLease =
      job?.runToken !== undefined &&
      (job.leaseExpiresAt === undefined || job.leaseExpiresAt > now);
    if (
      !job ||
      job.stage === "complete" ||
      job.stage === "failed" ||
      hasActiveLease ||
      (job.retryAt !== undefined && job.retryAt > Date.now())
    ) {
      return null;
    }
    const bookmark = await ctx.db.get(job.bookmarkId);
    if (!bookmark || bookmark.userId !== job.userId) {
      return null;
    }

    const runToken = createRunToken(job);
    const attempt = job.attempt + 1;
    await ctx.db.patch(job._id, {
      runToken,
      leaseExpiresAt: now + RUN_LEASE_MS,
      attempt,
      retryAt: undefined,
      failureKind: undefined,
      failureMessage: undefined,
      updatedAt: now,
    });
    await ctx.db.patch(bookmark._id, {
      enrichmentStatus: bookmarkStatusForStage(job.stage),
      failureMessage: undefined,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(RUN_LEASE_MS, internal.enrichment.processJob, {
      jobId: job._id,
    });

    return {
      jobId: job._id,
      bookmarkId: bookmark._id,
      userId: job.userId,
      stage: job.stage,
      runToken,
      attempt,
      url: bookmark.canonicalUrl,
      title: bookmark.title,
      domain: bookmark.domain,
    };
  },
});

export const getPipelineState = internalQuery({
  args: {
    jobId: v.id("enrichmentJobs"),
    runToken: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.runToken !== args.runToken) {
      return null;
    }
    const bookmark = await ctx.db.get(job.bookmarkId);
    if (!bookmark || bookmark.userId !== job.userId) {
      return null;
    }
    const [document, insight, embedding] = await Promise.all([
      ctx.db
        .query("extractedDocuments")
        .withIndex("by_bookmark", (index) =>
          index.eq("bookmarkId", bookmark._id),
        )
        .unique(),
      ctx.db
        .query("insights")
        .withIndex("by_bookmark", (index) =>
          index.eq("bookmarkId", bookmark._id),
        )
        .unique(),
      ctx.db
        .query("bookmarkEmbeddings")
        .withIndex("by_bookmark", (index) =>
          index.eq("bookmarkId", bookmark._id),
        )
        .unique(),
    ]);
    return { job, bookmark, document, insight, embedding };
  },
});

export const storeExtraction = internalMutation({
  args: {
    jobId: v.id("enrichmentJobs"),
    runToken: v.string(),
    document: documentValidator,
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (
      !job ||
      job.runToken !== args.runToken ||
      job.stage !== "extract"
    ) {
      return false;
    }
    const existing = await ctx.db
      .query("extractedDocuments")
      .withIndex("by_bookmark", (index) =>
        index.eq("bookmarkId", job.bookmarkId),
      )
      .unique();
    const value = {
      userId: job.userId,
      bookmarkId: job.bookmarkId,
      ...args.document,
    };
    if (existing) {
      await ctx.db.replace(existing._id, value);
    } else {
      await ctx.db.insert("extractedDocuments", value);
    }
    const now = Date.now();
    await ctx.db.patch(job._id, { stage: "analyze", updatedAt: now });
    await ctx.db.patch(job.bookmarkId, {
      enrichmentStatus: "analyzing",
      updatedAt: now,
    });
    return true;
  },
});

export const storeInsight = internalMutation({
  args: {
    jobId: v.id("enrichmentJobs"),
    runToken: v.string(),
    insight: v.object({
      summary: v.string(),
      topics: v.array(v.string()),
      entities: v.array(v.string()),
      language: v.string(),
    }),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (
      !job ||
      job.runToken !== args.runToken ||
      job.stage !== "analyze"
    ) {
      return false;
    }
    const existing = await ctx.db
      .query("insights")
      .withIndex("by_bookmark", (index) =>
        index.eq("bookmarkId", job.bookmarkId),
      )
      .unique();
    const value = {
      userId: job.userId,
      bookmarkId: job.bookmarkId,
      ...args.insight,
      model: args.model,
      createdAt: Date.now(),
    };
    if (existing) {
      await ctx.db.replace(existing._id, value);
    } else {
      await ctx.db.insert("insights", value);
    }
    const now = Date.now();
    await ctx.db.patch(job._id, { stage: "embed", updatedAt: now });
    await ctx.db.patch(job.bookmarkId, {
      enrichmentStatus: "indexing",
      updatedAt: now,
    });
    return true;
  },
});

export const storeEmbedding = internalMutation({
  args: {
    jobId: v.id("enrichmentJobs"),
    runToken: v.string(),
    embedding: v.array(v.float64()),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (
      !job ||
      job.runToken !== args.runToken ||
      job.stage !== "embed" ||
      args.embedding.length !== 1536
    ) {
      return false;
    }
    const existing = await ctx.db
      .query("bookmarkEmbeddings")
      .withIndex("by_bookmark", (index) =>
        index.eq("bookmarkId", job.bookmarkId),
      )
      .unique();
    const value = {
      userId: job.userId,
      bookmarkId: job.bookmarkId,
      embedding: args.embedding,
      model: args.model,
      createdAt: Date.now(),
    };
    if (existing) {
      await ctx.db.replace(existing._id, value);
    } else {
      await ctx.db.insert("bookmarkEmbeddings", value);
    }
    await ctx.db.patch(job._id, {
      stage: "connect",
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const getCandidateData = internalQuery({
  args: {
    userId: v.id("users"),
    embeddingIds: v.array(v.id("bookmarkEmbeddings")),
  },
  handler: async (ctx, args) => {
    const candidates = [];
    for (const embeddingId of args.embeddingIds) {
      const embedding = await ctx.db.get(embeddingId);
      if (!embedding || embedding.userId !== args.userId) {
        continue;
      }
      const [bookmark, insight] = await Promise.all([
        ctx.db.get(embedding.bookmarkId),
        ctx.db
          .query("insights")
          .withIndex("by_bookmark", (index) =>
            index.eq("bookmarkId", embedding.bookmarkId),
          )
          .unique(),
      ]);
      if (bookmark && insight && bookmark.userId === args.userId) {
        candidates.push({
          embeddingId,
          bookmarkId: bookmark._id,
          domain: bookmark.domain,
          topics: insight.topics,
          entities: insight.entities,
        });
      }
    }
    return candidates;
  },
});

export const replaceEdges = internalMutation({
  args: {
    jobId: v.id("enrichmentJobs"),
    runToken: v.string(),
    connections: v.array(
      v.object({
        bookmarkId: v.id("bookmarks"),
        score: v.number(),
        reasons: v.array(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (
      !job ||
      job.runToken !== args.runToken ||
      job.stage !== "connect"
    ) {
      return false;
    }

    const oldLeft = await ctx.db
      .query("graphEdges")
      .withIndex("by_user_left", (index) =>
        index
          .eq("userId", job.userId)
          .eq("leftBookmarkId", job.bookmarkId),
      )
      .collect();
    const oldRight = await ctx.db
      .query("graphEdges")
      .withIndex("by_user_right", (index) =>
        index
          .eq("userId", job.userId)
          .eq("rightBookmarkId", job.bookmarkId),
      )
      .collect();
    for (const edge of [...oldLeft, ...oldRight]) {
      await ctx.db.delete(edge._id);
    }

    const touched = new Set<Id<"bookmarks">>([job.bookmarkId]);
    for (const connection of args.connections.slice(0, 6)) {
      if (connection.bookmarkId === job.bookmarkId) {
        continue;
      }
      const candidate = await ctx.db.get(connection.bookmarkId);
      if (!candidate || candidate.userId !== job.userId) {
        continue;
      }
      const [leftBookmarkId, rightBookmarkId] =
        String(job.bookmarkId) < String(connection.bookmarkId)
          ? [job.bookmarkId, connection.bookmarkId]
          : [connection.bookmarkId, job.bookmarkId];
      await ctx.db.insert("graphEdges", {
        userId: job.userId,
        leftBookmarkId,
        rightBookmarkId,
        kind: "semantic",
        score: connection.score,
        reasons: connection.reasons,
        generatedAt: Date.now(),
      });
      touched.add(connection.bookmarkId);
    }

    for (const bookmarkId of touched) {
      const [left, right] = await Promise.all([
        ctx.db
          .query("graphEdges")
          .withIndex("by_user_left", (index) =>
            index
              .eq("userId", job.userId)
              .eq("leftBookmarkId", bookmarkId),
          )
          .collect(),
        ctx.db
          .query("graphEdges")
          .withIndex("by_user_right", (index) =>
            index
              .eq("userId", job.userId)
              .eq("rightBookmarkId", bookmarkId),
          )
          .collect(),
      ]);
      const ranked = [...left, ...right].sort(
        (first, second) => second.score - first.score,
      );
      for (const edge of ranked.slice(6)) {
        await ctx.db.delete(edge._id);
      }
    }

    const now = Date.now();
    await ctx.db.patch(job._id, {
      stage: "complete",
      runToken: undefined,
      leaseExpiresAt: undefined,
      retryAt: undefined,
      failureKind: undefined,
      failureMessage: undefined,
      updatedAt: now,
    });
    await ctx.db.patch(job.bookmarkId, {
      enrichmentStatus: "ready",
      failureMessage: undefined,
      updatedAt: now,
    });
    return true;
  },
});

export const recordFailure = internalMutation({
  args: {
    jobId: v.id("enrichmentJobs"),
    runToken: v.string(),
    stage: stageValidator,
    kind: v.union(v.literal("retryable"), v.literal("terminal")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.runToken !== args.runToken) {
      return "stale" as const;
    }

    const delay =
      args.kind === "retryable" ? getRetryDelayMs(job.attempt) : null;
    const now = Date.now();
    if (delay !== null) {
      await ctx.db.patch(job._id, {
        stage: args.stage,
        runToken: undefined,
        leaseExpiresAt: undefined,
        retryAt: now + delay,
        failureKind: args.kind,
        failureMessage: args.message,
        updatedAt: now,
      });
      await ctx.db.patch(job.bookmarkId, {
        enrichmentStatus: "retrying",
        failureMessage: args.message,
        updatedAt: now,
      });
      await ctx.scheduler.runAfter(delay, internal.enrichment.processJob, {
        jobId: job._id,
      });
      return "retrying" as const;
    }

    await ctx.db.patch(job._id, {
      stage: "failed",
      runToken: undefined,
      leaseExpiresAt: undefined,
      retryAt: undefined,
      failureKind: args.kind,
      failureMessage: args.message,
      updatedAt: now,
    });
    await ctx.db.patch(job.bookmarkId, {
      enrichmentStatus: "failed",
      failureMessage: args.message,
      updatedAt: now,
    });
    return "failed" as const;
  },
});

function requiredSecret(name: "FIRECRAWL_API_KEY" | "OPENROUTER_API_KEY") {
  const value = process.env[name];
  if (!value) {
    throw new ProviderRequestError(`${name} is not configured.`, {
      invalidResponse: true,
    });
  }
  return value;
}

function isPrivateSource(rawUrl: string): boolean {
  const hostname = new URL(rawUrl).hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "0.0.0.0" ||
    hostname === "::1"
  ) {
    return true;
  }
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }
  const [first, second] = parts;
  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function safeFailure(error: unknown): {
  kind: "retryable" | "terminal";
  message: string;
} {
  const record =
    error && typeof error === "object"
      ? (error as {
          invalidResponse?: boolean;
          name?: string;
          status?: number;
        })
      : {};
  const kind = classifyProviderFailure(record);

  if (
    record.name === "AbortError" ||
    record.name === "TimeoutError"
  ) {
    return { kind, message: "The source request timed out." };
  }
  if (record.status === 401 || record.status === 403) {
    return { kind, message: "A provider credential was rejected." };
  }
  if (record.status === 429) {
    return { kind, message: "The provider is temporarily rate limited." };
  }
  if (typeof record.status === "number" && record.status >= 500) {
    return { kind, message: "The provider is temporarily unavailable." };
  }
  if (record.invalidResponse) {
    return { kind, message: "A provider returned an invalid response." };
  }
  return { kind, message: "This source could not be enriched." };
}

export const processJob = internalAction({
  args: { jobId: v.id("enrichmentJobs") },
  handler: async (ctx, args): Promise<void> => {
    const claimed = await ctx.runMutation(internal.enrichment.claimJob, args);
    if (!claimed) {
      return;
    }

    let stage = claimed.stage;
    try {
      if (isPrivateSource(claimed.url)) {
        throw new ProviderRequestError("Private sources are not allowed.", {
          status: 451,
        });
      }

      if (stage === "extract") {
        const scraped = await scrapeDocument({
          apiKey: requiredSecret("FIRECRAWL_API_KEY"),
          url: claimed.url,
        });
        const markdown = truncateUtf8(scraped.markdown);
        const stored = await ctx.runMutation(
          internal.enrichment.storeExtraction,
          {
            jobId: claimed.jobId,
            runToken: claimed.runToken,
            document: {
              ...scraped.metadata,
              markdown: markdown.value,
              contentHash: await hashContent(markdown.value),
              truncated: markdown.truncated,
              fetchedAt: Date.now(),
            },
          },
        );
        if (!stored) {
          return;
        }
        stage = "analyze";
      }

      let state = await ctx.runQuery(internal.enrichment.getPipelineState, {
        jobId: claimed.jobId,
        runToken: claimed.runToken,
      });
      if (!state) {
        return;
      }

      if (stage === "analyze") {
        if (!state.document) {
          throw new ProviderRequestError(
            "The extracted document is unavailable.",
            { invalidResponse: true },
          );
        }
        const insight = await summarizeDocument({
          apiKey: requiredSecret("OPENROUTER_API_KEY"),
          title: state.bookmark.title,
          metadata: { description: state.document.description },
          content: state.document.markdown,
          model: SUMMARY_MODEL,
        });
        const stored = await ctx.runMutation(internal.enrichment.storeInsight, {
          jobId: claimed.jobId,
          runToken: claimed.runToken,
          insight,
          model: SUMMARY_MODEL,
        });
        if (!stored) {
          return;
        }
        stage = "embed";
        state = await ctx.runQuery(internal.enrichment.getPipelineState, {
          jobId: claimed.jobId,
          runToken: claimed.runToken,
        });
        if (!state) {
          return;
        }
      }

      if (stage === "embed") {
        if (!state.insight) {
          throw new ProviderRequestError("The insight is unavailable.", {
            invalidResponse: true,
          });
        }
        const embedding = await createEmbedding({
          apiKey: requiredSecret("OPENROUTER_API_KEY"),
          input: [
            state.insight.summary,
            state.insight.topics.join(", "),
            state.insight.entities.join(", "),
          ].join("\n"),
          model: EMBEDDING_MODEL,
        });
        const stored = await ctx.runMutation(
          internal.enrichment.storeEmbedding,
          {
            jobId: claimed.jobId,
            runToken: claimed.runToken,
            embedding,
            model: EMBEDDING_MODEL,
          },
        );
        if (!stored) {
          return;
        }
        stage = "connect";
        state = await ctx.runQuery(internal.enrichment.getPipelineState, {
          jobId: claimed.jobId,
          runToken: claimed.runToken,
        });
        if (!state) {
          return;
        }
      }

      if (stage === "connect") {
        if (!state.embedding || !state.insight) {
          throw new ProviderRequestError(
            "The semantic index is unavailable.",
            { invalidResponse: true },
          );
        }
        const matches = await ctx.vectorSearch(
          "bookmarkEmbeddings",
          "by_embedding",
          {
            vector: state.embedding.embedding,
            limit: 25,
            filter: (query) => query.eq("userId", claimed.userId),
          },
        );
        const candidates = await ctx.runQuery(
          internal.enrichment.getCandidateData,
          {
            userId: claimed.userId,
            embeddingIds: matches
              .filter((match) => match._id !== state!.embedding!._id)
              .map((match) => match._id),
          },
        );
        const scoreByEmbedding = new Map(
          matches.map((match) => [match._id, match._score]),
        );
        const connections = selectStrongestConnections(
          candidates.map((candidate) => ({
            bookmarkId: candidate.bookmarkId,
            score: scoreByEmbedding.get(candidate.embeddingId) ?? 0,
            reasons: buildConnectionReasons(
              {
                domain: state!.bookmark.domain,
                topics: state!.insight!.topics,
                entities: state!.insight!.entities,
              },
              candidate,
            ),
          })),
        );
        await ctx.runMutation(internal.enrichment.replaceEdges, {
          jobId: claimed.jobId,
          runToken: claimed.runToken,
          connections,
        });
      }
    } catch (error) {
      const failure = safeFailure(error);
      await ctx.runMutation(internal.enrichment.recordFailure, {
        jobId: claimed.jobId,
        runToken: claimed.runToken,
        stage,
        kind: failure.kind,
        message: failure.message,
      });
    }
  },
});
