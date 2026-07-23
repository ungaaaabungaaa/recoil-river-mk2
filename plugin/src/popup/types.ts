export type PopupEnrichmentStatus =
  | "queued"
  | "extracting"
  | "analyzing"
  | "indexing"
  | "ready"
  | "retrying"
  | "failed";

export type PopupBookmark = {
  id: string;
  title: string;
  domain: string;
  faviconUrl?: string;
  enrichmentStatus: PopupEnrichmentStatus;
  createdAt: number;
};

export type PopupGraphEdge = {
  id: string;
  source: string;
  target: string;
  score: number;
  reasons: string[];
};

export type PopupGraph = {
  nodes: PopupBookmark[];
  edges: PopupGraphEdge[];
};
