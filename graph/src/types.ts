export type KnowledgeEnrichmentStatus =
  | "queued"
  | "extracting"
  | "analyzing"
  | "indexing"
  | "ready"
  | "retrying"
  | "failed";

export type KnowledgeNode = {
  id: string;
  title: string;
  domain: string;
  faviconUrl?: string;
  enrichmentStatus: KnowledgeEnrichmentStatus;
  createdAt: number;
};

export type KnowledgeEdge = {
  id: string;
  source: string;
  target: string;
  score: number;
  reasons: string[];
};

export type KnowledgeGraph = {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
};

export type ForceKnowledgeNode = KnowledgeNode & {
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
};

export type ForceKnowledgeLink = KnowledgeEdge;

export type ForceKnowledgeGraph = {
  nodes: ForceKnowledgeNode[];
  links: ForceKnowledgeLink[];
};
