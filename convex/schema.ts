import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const enrichmentStatus = v.union(
  v.literal("queued"),
  v.literal("extracting"),
  v.literal("analyzing"),
  v.literal("indexing"),
  v.literal("ready"),
  v.literal("retrying"),
  v.literal("failed"),
);

const enrichmentStage = v.union(
  v.literal("extract"),
  v.literal("analyze"),
  v.literal("embed"),
  v.literal("connect"),
  v.literal("complete"),
  v.literal("failed"),
);

export default defineSchema({
  ...authTables,
  bookmarks: defineTable({
    userId: v.id("users"),
    originalUrl: v.string(),
    canonicalUrl: v.string(),
    title: v.string(),
    domain: v.string(),
    faviconUrl: v.optional(v.string()),
    enrichmentStatus,
    failureMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_canonical", ["userId", "canonicalUrl"])
    .index("by_user_created", ["userId", "createdAt"]),
  enrichmentJobs: defineTable({
    userId: v.id("users"),
    bookmarkId: v.id("bookmarks"),
    stage: enrichmentStage,
    attempt: v.number(),
    runToken: v.optional(v.string()),
    leaseExpiresAt: v.optional(v.number()),
    retryAt: v.optional(v.number()),
    failureKind: v.optional(v.string()),
    failureMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bookmark", ["bookmarkId"])
    .index("by_user", ["userId"]),
  extractedDocuments: defineTable({
    userId: v.id("users"),
    bookmarkId: v.id("bookmarks"),
    sourceUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    markdown: v.string(),
    contentHash: v.string(),
    truncated: v.boolean(),
    fetchedAt: v.number(),
  }).index("by_bookmark", ["bookmarkId"]),
  insights: defineTable({
    userId: v.id("users"),
    bookmarkId: v.id("bookmarks"),
    summary: v.string(),
    topics: v.array(v.string()),
    entities: v.array(v.string()),
    language: v.string(),
    model: v.string(),
    createdAt: v.number(),
  }).index("by_bookmark", ["bookmarkId"]),
  bookmarkEmbeddings: defineTable({
    userId: v.id("users"),
    bookmarkId: v.id("bookmarks"),
    embedding: v.array(v.float64()),
    model: v.string(),
    createdAt: v.number(),
  })
    .index("by_bookmark", ["bookmarkId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["userId"],
    }),
  graphEdges: defineTable({
    userId: v.id("users"),
    leftBookmarkId: v.id("bookmarks"),
    rightBookmarkId: v.id("bookmarks"),
    kind: v.literal("semantic"),
    score: v.number(),
    reasons: v.array(v.string()),
    generatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_pair", [
      "userId",
      "leftBookmarkId",
      "rightBookmarkId",
    ])
    .index("by_user_left", ["userId", "leftBookmarkId"])
    .index("by_user_right", ["userId", "rightBookmarkId"]),
});
