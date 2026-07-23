import { describe, expect, it } from "vitest";

import { toForceGraphData } from "./graph-data";
import type { KnowledgeGraph } from "./types";

describe("toForceGraphData", () => {
  it("keeps node metadata and adapts semantic edges to force-graph links", () => {
    const graph: KnowledgeGraph = {
      nodes: [
        {
          id: "one",
          title: "First",
          domain: "one.example",
          enrichmentStatus: "ready",
          createdAt: 2,
        },
        {
          id: "two",
          title: "Second",
          domain: "two.example",
          enrichmentStatus: "analyzing",
          createdAt: 1,
        },
      ],
      edges: [
        {
          id: "edge",
          source: "one",
          target: "two",
          score: 0.87,
          reasons: ["topic: design"],
        },
      ],
    };

    expect(toForceGraphData(graph)).toEqual({
      nodes: [
        expect.objectContaining({ id: "one", title: "First" }),
        expect.objectContaining({ id: "two", title: "Second" }),
      ],
      links: [
        expect.objectContaining({
          id: "edge",
          source: "one",
          target: "two",
          score: 0.87,
        }),
      ],
    });
  });

  it("filters links whose endpoints are outside the visible snapshot", () => {
    const graph: KnowledgeGraph = {
      nodes: [
        {
          id: "one",
          title: "First",
          domain: "one.example",
          enrichmentStatus: "ready",
          createdAt: 1,
        },
      ],
      edges: [
        {
          id: "edge",
          source: "one",
          target: "missing",
          score: 0.9,
          reasons: [],
        },
      ],
    };

    expect(toForceGraphData(graph).links).toEqual([]);
  });

  it("centers a single bookmark in simulation coordinates", () => {
    const graph: KnowledgeGraph = {
      nodes: [
        {
          id: "one",
          title: "First",
          domain: "one.example",
          enrichmentStatus: "queued",
          createdAt: 1,
        },
      ],
      edges: [],
    };

    expect(toForceGraphData(graph).nodes[0]).toEqual(
      expect.objectContaining({ x: 0, y: 0, fx: 0, fy: 0 }),
    );
  });
});
