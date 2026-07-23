import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api, internal } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import schema from "../../convex/schema";

const modules = import.meta.glob("../../convex/**/*.ts");

async function createUser(
  test: ReturnType<typeof convexTest<typeof schema>>,
  email: string,
) {
  return await test.run(async (ctx) => {
    return await ctx.db.insert("users", { email });
  });
}

function asUser(
  test: ReturnType<typeof convexTest<typeof schema>>,
  userId: Id<"users">,
) {
  return test.withIdentity({
    subject: `${userId}|test-session`,
    email: "reader@example.com",
  });
}

describe("bookmark public contract", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-23T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("requires authentication to save a page", async () => {
    const test = convexTest(schema, modules);

    await expect(
      test.mutation(api.bookmarks.addCurrentPage, {
        url: "https://example.com",
        title: "Example",
      }),
    ).rejects.toThrow("Authentication required");
  });

  it("atomically creates one canonical bookmark, job, and schedule", async () => {
    const test = convexTest(schema, modules);
    const userId = await createUser(test, "one@example.com");
    const user = asUser(test, userId);

    const created = await user.mutation(api.bookmarks.addCurrentPage, {
      url: "https://example.com/read?utm_source=mail&b=2&a=1#section",
      title: "Read this",
      faviconUrl: "https://example.com/favicon.ico",
    });
    const duplicate = await user.mutation(api.bookmarks.addCurrentPage, {
      url: "https://EXAMPLE.com:443/read?a=1&b=2",
      title: "A duplicate title",
    });

    expect(created.result).toBe("created");
    expect(duplicate).toMatchObject({
      bookmarkId: created.bookmarkId,
      result: "existing",
      enrichmentStatus: "queued",
    });

    const state = await test.run(async (ctx) => ({
      bookmarks: await ctx.db.query("bookmarks").collect(),
      jobs: await ctx.db.query("enrichmentJobs").collect(),
      schedules: await ctx.db.system.query("_scheduled_functions").collect(),
    }));
    expect(state.bookmarks).toHaveLength(1);
    expect(state.bookmarks[0]?.canonicalUrl).toBe(
      "https://example.com/read?a=1&b=2",
    );
    expect(state.jobs).toHaveLength(1);
    expect(state.schedules).toHaveLength(1);
  });

  it("returns only the authenticated user's newest 12 bookmarks", async () => {
    const test = convexTest(schema, modules);
    const firstUserId = await createUser(test, "first@example.com");
    const secondUserId = await createUser(test, "second@example.com");
    const firstUser = asUser(test, firstUserId);
    const secondUser = asUser(test, secondUserId);

    for (let index = 0; index < 13; index += 1) {
      vi.setSystemTime(new Date(`2026-07-23T12:00:${String(index).padStart(2, "0")}.000Z`));
      await firstUser.mutation(api.bookmarks.addCurrentPage, {
        url: `https://example.com/article-${index}`,
        title: `Article ${index}`,
      });
    }
    await secondUser.mutation(api.bookmarks.addCurrentPage, {
      url: "https://private.example/foreign",
      title: "Foreign",
    });

    const recent = await firstUser.query(api.bookmarks.listRecent);

    expect(recent).toHaveLength(12);
    expect(recent.map((bookmark) => bookmark.title)).toEqual([
      "Article 12",
      "Article 11",
      "Article 10",
      "Article 9",
      "Article 8",
      "Article 7",
      "Article 6",
      "Article 5",
      "Article 4",
      "Article 3",
      "Article 2",
      "Article 1",
    ]);
  });

  it("returns a private not-found result for another user's bookmark", async () => {
    const test = convexTest(schema, modules);
    const ownerId = await createUser(test, "owner@example.com");
    const strangerId = await createUser(test, "stranger@example.com");
    const owner = asUser(test, ownerId);
    const stranger = asUser(test, strangerId);

    const { bookmarkId } = await owner.mutation(
      api.bookmarks.addCurrentPage,
      {
        url: "https://example.com/private",
        title: "Private bookmark",
      },
    );

    expect(
      await stranger.query(api.bookmarks.getById, { bookmarkId }),
    ).toBeNull();
  });

  it("rejects stale enrichment writes while preserving the bookmark", async () => {
    const test = convexTest(schema, modules);
    const userId = await createUser(test, "run@example.com");
    const user = asUser(test, userId);
    const { bookmarkId } = await user.mutation(
      api.bookmarks.addCurrentPage,
      {
        url: "https://example.com/durable",
        title: "Durable",
      },
    );
    const jobId = await test.run(async (ctx) => {
      const job = await ctx.db
        .query("enrichmentJobs")
        .withIndex("by_bookmark", (query) => query.eq("bookmarkId", bookmarkId))
        .unique();
      return job!._id;
    });

    const claimed = await test.mutation(internal.enrichment.claimJob, {
      jobId,
    });
    expect(claimed?.stage).toBe("extract");

    const staleWrite = await test.mutation(
      internal.enrichment.storeExtraction,
      {
        jobId,
        runToken: "stale-token",
        document: {
          markdown: "This must not be stored.",
          contentHash: "wrong",
          truncated: false,
          fetchedAt: Date.now(),
        },
      },
    );
    const currentWrite = await test.mutation(
      internal.enrichment.storeExtraction,
      {
        jobId,
        runToken: claimed!.runToken,
        document: {
          markdown: "# Durable content",
          contentHash: "right",
          truncated: false,
          fetchedAt: Date.now(),
        },
      },
    );

    expect(staleWrite).toBe(false);
    expect(currentWrite).toBe(true);
    expect(
      await user.query(api.bookmarks.getById, { bookmarkId }),
    ).toMatchObject({
      id: bookmarkId,
      markdown: "# Durable content",
      enrichmentStatus: "analyzing",
    });
  });

  it("waits for retryAt and resumes from the last durable stage", async () => {
    const test = convexTest(schema, modules);
    const userId = await createUser(test, "retry@example.com");
    const user = asUser(test, userId);
    const { bookmarkId } = await user.mutation(
      api.bookmarks.addCurrentPage,
      {
        url: "https://example.com/retry",
        title: "Retry me",
      },
    );
    const jobId = await test.run(async (ctx) => {
      const job = await ctx.db
        .query("enrichmentJobs")
        .withIndex("by_bookmark", (query) => query.eq("bookmarkId", bookmarkId))
        .unique();
      return job!._id;
    });
    const firstRun = await test.mutation(internal.enrichment.claimJob, {
      jobId,
    });
    await test.mutation(internal.enrichment.storeExtraction, {
      jobId,
      runToken: firstRun!.runToken,
      document: {
        markdown: "# Extracted once",
        contentHash: "content",
        truncated: false,
        fetchedAt: Date.now(),
      },
    });

    expect(
      await test.mutation(internal.enrichment.recordFailure, {
        jobId,
        runToken: firstRun!.runToken,
        stage: "analyze",
        kind: "retryable",
        message: "The provider is temporarily unavailable.",
      }),
    ).toBe("retrying");
    expect(
      await test.mutation(internal.enrichment.claimJob, { jobId }),
    ).toBeNull();
    expect(
      await user.query(api.bookmarks.getById, { bookmarkId }),
    ).toMatchObject({
      markdown: "# Extracted once",
      enrichmentStatus: "retrying",
    });

    vi.setSystemTime(new Date("2026-07-23T12:00:30.000Z"));
    const resumed = await test.mutation(internal.enrichment.claimJob, {
      jobId,
    });

    expect(resumed).toMatchObject({ stage: "analyze", attempt: 2 });
  });

  it("retains a bookmark after a terminal provider failure", async () => {
    const test = convexTest(schema, modules);
    const userId = await createUser(test, "failed@example.com");
    const user = asUser(test, userId);
    const { bookmarkId } = await user.mutation(
      api.bookmarks.addCurrentPage,
      {
        url: "https://example.com/failed",
        title: "Still saved",
      },
    );
    const jobId = await test.run(async (ctx) => {
      const job = await ctx.db
        .query("enrichmentJobs")
        .withIndex("by_bookmark", (query) => query.eq("bookmarkId", bookmarkId))
        .unique();
      return job!._id;
    });
    const run = await test.mutation(internal.enrichment.claimJob, { jobId });

    await test.mutation(internal.enrichment.recordFailure, {
      jobId,
      runToken: run!.runToken,
      stage: "extract",
      kind: "terminal",
      message: "A provider credential was rejected.",
    });

    expect(
      await user.query(api.bookmarks.getById, { bookmarkId }),
    ).toMatchObject({
      id: bookmarkId,
      title: "Still saved",
      enrichmentStatus: "failed",
      failureMessage: "A provider credential was rejected.",
    });
  });

  it("reclaims an abandoned run only after its lease expires", async () => {
    const test = convexTest(schema, modules);
    const userId = await createUser(test, "lease@example.com");
    const user = asUser(test, userId);
    const { bookmarkId } = await user.mutation(
      api.bookmarks.addCurrentPage,
      {
        url: "https://example.com/lease",
        title: "Lease",
      },
    );
    const jobId = await test.run(async (ctx) => {
      const job = await ctx.db
        .query("enrichmentJobs")
        .withIndex("by_bookmark", (query) => query.eq("bookmarkId", bookmarkId))
        .unique();
      return job!._id;
    });

    const first = await test.mutation(internal.enrichment.claimJob, { jobId });
    expect(first?.attempt).toBe(1);
    expect(
      await test.mutation(internal.enrichment.claimJob, { jobId }),
    ).toBeNull();

    vi.setSystemTime(new Date("2026-07-23T12:05:00.000Z"));
    const recovered = await test.mutation(internal.enrichment.claimJob, {
      jobId,
    });

    expect(recovered).toMatchObject({ attempt: 2, stage: "extract" });
    expect(recovered?.runToken).not.toBe(first?.runToken);
  });
});
