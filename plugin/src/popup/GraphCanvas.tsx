import { KnowledgeGraph2D } from "@recoil-river/graph";

import type { PopupBookmark, PopupGraph } from "./types";

const WIDTH = 356;
const HEIGHT = 326;

export function GraphCanvas({
  graph,
  onNodeClick,
}: {
  graph: PopupGraph;
  onNodeClick?(node: PopupBookmark): void;
}) {
  return (
    <KnowledgeGraph2D
      graph={graph}
      width={WIDTH}
      height={HEIGHT}
      variant="popup"
      onNodeClick={onNodeClick}
    />
  );
}
