import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import type { GraphEdge, GraphNode } from "./contracts";

const MAX_POPUP_NODES = 120;

async function requireUserId(ctx: {
  auth: Parameters<typeof getAuthUserId>[0]["auth"];
}): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Authentication required.");
  }
  return userId;
}

export const getPopupSnapshot = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> => {
    const userId = await requireUserId(ctx);
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_created", (index) => index.eq("userId", userId))
      .order("desc")
      .take(MAX_POPUP_NODES);
    const nodeIds = new Set(bookmarks.map((bookmark) => bookmark._id));
    const allEdges = await ctx.db
      .query("graphEdges")
      .withIndex("by_user", (index) => index.eq("userId", userId))
      .collect();

    return {
      nodes: bookmarks.map((bookmark) => ({
        id: bookmark._id,
        title: bookmark.title,
        domain: bookmark.domain,
        faviconUrl: bookmark.faviconUrl,
        enrichmentStatus: bookmark.enrichmentStatus,
        createdAt: bookmark.createdAt,
      })),
      edges: allEdges
        .filter(
          (edge) =>
            nodeIds.has(edge.leftBookmarkId) &&
            nodeIds.has(edge.rightBookmarkId),
        )
        .map((edge) => ({
          id: edge._id,
          source: edge.leftBookmarkId,
          target: edge.rightBookmarkId,
          score: edge.score,
          reasons: edge.reasons,
        })),
    };
  },
});
