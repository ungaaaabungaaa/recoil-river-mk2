import type { Id } from "./_generated/dataModel";

export type EnrichmentStatus =
  | "queued"
  | "extracting"
  | "analyzing"
  | "indexing"
  | "ready"
  | "retrying"
  | "failed";

export type RecentBookmark = {
  id: Id<"bookmarks">;
  title: string;
  domain: string;
  faviconUrl?: string;
  enrichmentStatus: EnrichmentStatus;
  createdAt: number;
};

export type GraphNode = RecentBookmark;

export type GraphEdge = {
  id: Id<"graphEdges">;
  source: Id<"bookmarks">;
  target: Id<"bookmarks">;
  score: number;
  reasons: string[];
};

export type BookmarkDetail = RecentBookmark & {
  originalUrl: string;
  canonicalUrl: string;
  updatedAt: number;
  summary?: string;
  topics: string[];
  entities: string[];
  language?: string;
  markdown?: string;
  markdownTruncated?: boolean;
  failureMessage?: string;
};
