import type {
  ForceKnowledgeGraph,
  ForceKnowledgeNode,
  KnowledgeGraph,
} from "./types";

function hashId(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function withInitialPosition(
  node: KnowledgeGraph["nodes"][number],
  index: number,
  count: number,
): ForceKnowledgeNode {
  if (count === 1) {
    return { ...node, x: 0, y: 0, fx: 0, fy: 0 };
  }

  const hash = hashId(node.id);
  const baseAngle = (index / count) * Math.PI * 2 - Math.PI / 2;
  const jitter = ((hash % 2_001) / 2_000 - 0.5) * 0.34;
  const radius = 48 + ((hash >>> 11) % 42);
  const angle = baseAngle + jitter;
  return {
    ...node,
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

export function toForceGraphData(graph: KnowledgeGraph): ForceKnowledgeGraph {
  const visibleIds = new Set(graph.nodes.map((node) => node.id));
  return {
    nodes: graph.nodes.map((node, index) =>
      withInitialPosition(node, index, graph.nodes.length),
    ),
    links: graph.edges
      .filter(
        (edge) =>
          visibleIds.has(edge.source) && visibleIds.has(edge.target),
      )
      .map((edge) => ({ ...edge })),
  };
}
