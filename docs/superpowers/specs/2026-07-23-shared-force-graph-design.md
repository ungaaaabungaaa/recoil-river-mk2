# Shared Force Graph Design

## Goal

Replace the popup's hand-drawn force layout with `react-force-graph-2d` and make the same interactive graph the authenticated default website experience at `/graph`.

## Product Contract

- Signing into the website without a deep-link return path lands at `/graph`.
- The website graph fills the available viewport below a compact Recoil River header.
- The extension keeps its existing `380 × 560px` shell and renders the graph inside the existing `356 × 326px` panel.
- Empty libraries keep the honest “Your river starts here” state.
- A single bookmark starts centered.
- Multiple bookmarks use the library's force simulation, zoom, pan, dragging, and clustering behavior.
- Selecting a node opens `/bookmarks/{id}`. The website navigates in the current tab; the extension opens the configured website in a new tab.
- Ready nodes are solid, in-progress nodes have a dashed halo, and failed nodes are outlined with an `×`.
- Links vary subtly by semantic score while remaining monochrome.

## Architecture

Create a fourth pnpm workspace, `graph/`, published locally as `@recoil-river/graph`. It owns the client-only `KnowledgeGraph2D` component, graph-data adapter, canvas drawing callbacks, empty state, and shared CSS. Both `web/` and `plugin/` depend on this package.

The wrapper accepts backend-compatible graph data with string IDs and a `variant` prop:

```ts
type KnowledgeGraph2DProps = {
  graph: {nodes: KnowledgeNode[]; edges: KnowledgeEdge[]};
  width: number;
  height: number;
  variant: 'popup' | 'fullscreen';
  onNodeClick?(node: KnowledgeNode): void;
};
```

`react-force-graph-2d` stays inside a browser-only component. Next.js imports the shared component from a client route component, so it is never evaluated as a server-rendered canvas. The popup imports it directly because WXT already runs the popup in a browser document.

## Website Authentication Flow

`safeReturnTo` defaults to `/graph`, while continuing to accept private bookmark deep links. `/graph` checks `useConvexAuth`:

- loading: full-screen loading state;
- signed out: replace with `/login?returnTo=%2Fgraph`;
- signed in: subscribe to `api.graph.getPopupSnapshot` and render the shared graph;
- node selection: push `/bookmarks/{id}`.

The existing public splash route remains available at `/`; authentication simply no longer returns there by default.

## Accessibility and Motion

The canvas has an accessible graph label and a keyboard-adjacent list of visible bookmarks on the website. Canvas nodes expose pointer interactions; the accompanying list provides a reliable keyboard path to every reader. Reduced-motion users get an immediate fit rather than an animated fit.

## Verification

Tests cover graph adaptation, shared empty/loaded states, popup node deep links, authenticated website redirects, website node navigation, and the new `/graph` default return path. The checkpoint finishes with the full test, lint, typecheck, production build, extension ZIP, manifest inspection, diff check, and secret scan.
