import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import type ForceGraph2D from "react-force-graph-2d";

import { KnowledgeGraph2D } from "./KnowledgeGraph2D";
import type { KnowledgeGraph } from "./types";

type ForceGraphProps = ComponentProps<typeof ForceGraph2D>;
const forceGraphSpy = vi.hoisted(() => vi.fn());

vi.mock("react-force-graph-2d", () => ({
  default: (props: ForceGraphProps) => {
    forceGraphSpy(props);
    const firstNode = props.graphData?.nodes[0];
    return (
      <button
        type="button"
        data-testid="force-graph"
        onClick={() =>
          firstNode &&
          props.onNodeClick?.(firstNode, new MouseEvent("click"))
        }
      >
        force graph
      </button>
    );
  },
}));

const graph: KnowledgeGraph = {
  nodes: [
    {
      id: "bookmark-one",
      title: "An article",
      domain: "example.com",
      enrichmentStatus: "ready",
      createdAt: 1,
    },
  ],
  edges: [],
};

describe("KnowledgeGraph2D", () => {
  it("renders the honest shared empty state", () => {
    render(
      <KnowledgeGraph2D
        graph={{ nodes: [], edges: [] }}
        width={356}
        height={326}
        variant="popup"
      />,
    );

    expect(screen.getByText("Your river starts here.")).toBeInTheDocument();
    expect(screen.queryByTestId("force-graph")).not.toBeInTheDocument();
  });

  it("passes graph data and viewport dimensions to react-force-graph-2d", () => {
    render(
      <KnowledgeGraph2D
        graph={graph}
        width={356}
        height={326}
        variant="popup"
      />,
    );

    expect(forceGraphSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        width: 356,
        height: 326,
        backgroundColor: "#111111",
        enablePanInteraction: true,
        enableZoomInteraction: true,
        enableNodeDrag: true,
      }),
    );
  });

  it("returns the original bookmark when a graph node is selected", () => {
    const onNodeClick = vi.fn();
    render(
      <KnowledgeGraph2D
        graph={graph}
        width={900}
        height={600}
        variant="fullscreen"
        onNodeClick={onNodeClick}
      />,
    );

    fireEvent.click(screen.getByTestId("force-graph"));
    expect(onNodeClick).toHaveBeenCalledWith(graph.nodes[0]);
  });
});
