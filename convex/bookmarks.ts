import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type {
  BookmarkDetail,
  EnrichmentStatus,
  RecentBookmark,
} from "./contracts";
import { normalizeBookmarkUrl } from "./lib/urls";

const MAX_RECENT_BOOKMARKS = 12;

async function requireUserId(ctx: {
  auth: Parameters<typeof getAuthUserId>[0]["auth"];
}): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Authentication required.");
  }
  return userId;
}

function cleanFaviconUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }
    url.username = "";
    url.password = "";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

export const addCurrentPage = mutation({
  args: {
    url: v.string(),
    title: v.string(),
    faviconUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const normalized = normalizeBookmarkUrl(args.url);
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_canonical", (index) =>
        index
          .eq("userId", userId)
          .eq("canonicalUrl", normalized.canonicalUrl),
      )
      .unique();

    if (existing) {
      return {
        bookmarkId: existing._id,
        result: "existing" as const,
        enrichmentStatus: existing.enrichmentStatus as EnrichmentStatus,
      };
    }

    const now = Date.now();
    const title = args.title.trim().slice(0, 500) || normalized.domain;
    const bookmarkId = await ctx.db.insert("bookmarks", {
      userId,
      originalUrl: normalized.originalUrl,
      canonicalUrl: normalized.canonicalUrl,
      title,
      domain: normalized.domain,
      faviconUrl: cleanFaviconUrl(args.faviconUrl),
      enrichmentStatus: "queued",
      createdAt: now,
      updatedAt: now,
    });
    const jobId = await ctx.db.insert("enrichmentJobs", {
      userId,
      bookmarkId,
      stage: "extract",
      attempt: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.enrichment.processJob, { jobId });

    return {
      bookmarkId,
      result: "created" as const,
      enrichmentStatus: "queued" as const,
    };
  },
});

export const listRecent = query({
  args: {},
  handler: async (ctx): Promise<RecentBookmark[]> => {
    const userId = await requireUserId(ctx);
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_created", (index) => index.eq("userId", userId))
      .order("desc")
      .take(MAX_RECENT_BOOKMARKS);

    return bookmarks.map((bookmark) => ({
      id: bookmark._id,
      title: bookmark.title,
      domain: bookmark.domain,
      faviconUrl: bookmark.faviconUrl,
      enrichmentStatus: bookmark.enrichmentStatus,
      createdAt: bookmark.createdAt,
    }));
  },
});

export const getById = query({
  args: { bookmarkId: v.id("bookmarks") },
  handler: async (ctx, args): Promise<BookmarkDetail | null> => {
    const userId = await requireUserId(ctx);
    const bookmark = await ctx.db.get(args.bookmarkId);

    if (!bookmark || bookmark.userId !== userId) {
      return null;
    }

    const [document, insight, job] = await Promise.all([
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
        .query("enrichmentJobs")
        .withIndex("by_bookmark", (index) =>
          index.eq("bookmarkId", bookmark._id),
        )
        .unique(),
    ]);

    return {
      id: bookmark._id,
      title: bookmark.title,
      domain: bookmark.domain,
      faviconUrl: bookmark.faviconUrl,
      enrichmentStatus: bookmark.enrichmentStatus,
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.updatedAt,
      originalUrl: bookmark.originalUrl,
      canonicalUrl: bookmark.canonicalUrl,
      summary: insight?.summary,
      topics: insight?.topics ?? [],
      entities: insight?.entities ?? [],
      language: insight?.language,
      markdown: document?.markdown,
      markdownTruncated: document?.truncated,
      failureMessage: bookmark.failureMessage ?? job?.failureMessage,
    };
  },
});
