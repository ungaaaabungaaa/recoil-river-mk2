"use client";

import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-2d";
import { useEffect, useMemo, useRef } from "react";

import { toForceGraphData } from "./graph-data";
import type {
  ForceKnowledgeLink,
  ForceKnowledgeNode,
  KnowledgeGraph,
  KnowledgeNode,
} from "./types";

export type KnowledgeGraph2DProps = {
  graph: KnowledgeGraph;
  width: number;
  height: number;
  variant: "popup" | "fullscreen";
  onNodeClick?(node: KnowledgeNode): void;
};

const BACKGROUND = "#111111";
const INK = "#f7f7f4";
const MUTED_INK = "rgba(247, 247, 244, 0.72)";

function isInProgress(node: ForceKnowledgeNode) {
  return (
    node.enrichmentStatus !== "ready" &&
    node.enrichmentStatus !== "failed"
  );
}

function drawNode(
  node: NodeObject<ForceKnowledgeNode>,
  context: CanvasRenderingContext2D,
  globalScale: number,
  variant: KnowledgeGraph2DProps["variant"],
) {
  if (typeof node.x !== "number" || typeof node.y !== "number") {
    return;
  }

  const radius = variant === "popup" ? 3.2 : 4.2;
  const failed = node.enrichmentStatus === "failed";
  const pending = isInProgress(node);

  context.save();
  context.beginPath();
  context.arc(node.x, node.y, radius, 0, Math.PI * 2);
  context.fillStyle = failed ? BACKGROUND : INK;
  context.fill();
  context.strokeStyle = failed ? INK : MUTED_INK;
  context.lineWidth = Math.max(0.8 / globalScale, 0.45);
  context.stroke();

  if (pending) {
    context.beginPath();
    context.setLineDash([2 / globalScale, 2 / globalScale]);
    context.arc(node.x, node.y, radius + 3 / globalScale, 0, Math.PI * 2);
    context.strokeStyle = "rgba(247, 247, 244, 0.55)";
    context.stroke();
  }

  if (failed) {
    const arm = radius * 0.55;
    context.beginPath();
    context.moveTo(node.x - arm, node.y - arm);
    context.lineTo(node.x + arm, node.y + arm);
    context.moveTo(node.x + arm, node.y - arm);
    context.lineTo(node.x - arm, node.y + arm);
    context.strokeStyle = INK;
    context.setLineDash([]);
    context.stroke();
  }

  if (variant === "fullscreen" && globalScale >= 0.68) {
    const fontSize = 11 / globalScale;
    const label =
      node.title.length > 34 ? `${node.title.slice(0, 33)}…` : node.title;
    context.font = `500 ${fontSize}px "Space Grotesk Variable", sans-serif`;
    context.fillStyle = "rgba(247, 247, 244, 0.78)";
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText(label, node.x, node.y + radius + 4 / globalScale);
  }
  context.restore();
}

function paintPointerArea(
  node: NodeObject<ForceKnowledgeNode>,
  color: string,
  context: CanvasRenderingContext2D,
) {
  if (typeof node.x !== "number" || typeof node.y !== "number") {
    return;
  }
  context.fillStyle = color;
  context.beginPath();
  context.arc(node.x, node.y, 9, 0, Math.PI * 2);
  context.fill();
}

function semanticLinkColor(link: LinkObject<ForceKnowledgeNode, ForceKnowledgeLink>) {
  const score = typeof link.score === "number" ? link.score : 0.72;
  const alpha = Math.min(0.5, Math.max(0.16, (score - 0.56) * 0.82));
  return `rgba(247, 247, 244, ${alpha.toFixed(2)})`;
}

function semanticLinkWidth(
  link: LinkObject<ForceKnowledgeNode, ForceKnowledgeLink>,
) {
  const score = typeof link.score === "number" ? link.score : 0.72;
  return 0.45 + Math.max(0, score - 0.72) * 2.4;
}

export function KnowledgeGraph2D({
  graph,
  width,
  height,
  variant,
  onNodeClick,
}: KnowledgeGraph2DProps) {
  const forceGraphRef =
    useRef<ForceGraphMethods<ForceKnowledgeNode, ForceKnowledgeLink>>(
      undefined,
    );
  const forceGraphData = useMemo(() => toForceGraphData(graph), [graph]);
  const originalNodes = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes],
  );

  useEffect(() => {
    if (forceGraphData.nodes.length === 0) {
      return;
    }

    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const frame = window.requestAnimationFrame(() => {
      if (forceGraphData.nodes.length === 1) {
        forceGraphRef.current?.centerAt(0, 0, reducedMotion ? 0 : 220);
        forceGraphRef.current?.zoom(
          variant === "popup" ? 7 : 5,
          reducedMotion ? 0 : 220,
        );
        return;
      }
      forceGraphRef.current?.zoomToFit(
        reducedMotion ? 0 : 360,
        variant === "popup" ? 24 : 72,
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [forceGraphData, variant]);

  if (graph.nodes.length === 0) {
    return (
      <div
        className={`rr-graph-empty rr-graph-empty--${variant}`}
        role="status"
      >
        <span className="rr-graph-empty__mark" aria-hidden="true" />
        <p>Your river starts here.</p>
        <small>Save a page to create the first node.</small>
      </div>
    );
  }

  return (
    <div
      className={`rr-graph rr-graph--${variant}`}
      role="img"
      aria-label={`Knowledge graph with ${graph.nodes.length} bookmark${
        graph.nodes.length === 1 ? "" : "s"
      }`}
    >
      <ForceGraph2D<ForceKnowledgeNode, ForceKnowledgeLink>
        ref={forceGraphRef}
        graphData={forceGraphData}
        width={width}
        height={height}
        backgroundColor={BACKGROUND}
        nodeCanvasObject={(node, context, globalScale) =>
          drawNode(node, context, globalScale, variant)
        }
        nodePointerAreaPaint={paintPointerArea}
        linkColor={semanticLinkColor}
        linkWidth={semanticLinkWidth}
        linkLineDash={() => null}
        warmupTicks={variant === "popup" ? 80 : 120}
        cooldownTicks={variant === "popup" ? 120 : 180}
        d3AlphaDecay={0.035}
        d3VelocityDecay={0.34}
        minZoom={0.18}
        maxZoom={18}
        enableNodeDrag
        enablePanInteraction
        enableZoomInteraction
        enablePointerInteraction
        showPointerCursor
        onNodeClick={(node) => {
          const original = originalNodes.get(node.id);
          if (original) {
            onNodeClick?.(original);
          }
        }}
      />
    </div>
  );
}
