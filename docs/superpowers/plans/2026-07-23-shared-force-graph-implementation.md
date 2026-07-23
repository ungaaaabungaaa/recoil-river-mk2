# Shared Force Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the same interactive `react-force-graph-2d` knowledge graph in the Chrome popup and the authenticated Next.js `/graph` route.

**Architecture:** Add a client-only `@recoil-river/graph` workspace that owns graph adaptation and presentation. The popup supplies a fixed canvas and opens website readers; the website supplies a responsive canvas and client-side private-reader navigation.

**Tech Stack:** React 19, TypeScript 5.9, `react-force-graph-2d`, WXT, Next.js App Router, Convex React, Vitest, Testing Library.

## Global Constraints

- Pin every dependency to an exact version in the root lockfile.
- Keep the popup at `380 × 560px` and its graph viewport at `356 × 326px`.
- Use only `api.graph.getPopupSnapshot`; do not create a second graph backend.
- Preserve the monochrome Space Grotesk design and honest empty/error states.
- Do not commit or push until the complete checkpoint suite passes.

---

### Task 1: Shared graph workspace

**Files:**
- Create: `graph/package.json`
- Create: `graph/tsconfig.json`
- Create: `graph/src/types.ts`
- Create: `graph/src/graph-data.ts`
- Create: `graph/src/graph-data.test.ts`
- Create: `graph/src/KnowledgeGraph2D.tsx`
- Create: `graph/src/KnowledgeGraph2D.test.tsx`
- Create: `graph/src/styles.css`
- Create: `graph/src/index.ts`
- Modify: `pnpm-workspace.yaml`

**Interfaces:**
- Consumes: `{nodes, edges}` from `api.graph.getPopupSnapshot`.
- Produces: `KnowledgeGraph2D`, `KnowledgeNode`, `KnowledgeEdge`, `KnowledgeGraph`.

- [ ] **Step 1: Write failing graph adapter and component tests**

Assert that edges become `source`/`target` links, missing endpoints are filtered, empty data renders the shared empty state, and the force-graph receives the fixed width, height, and interaction callbacks.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `pnpm --filter @recoil-river/graph test`

Expected: failure because the package implementation does not exist yet.

- [ ] **Step 3: Implement the shared package**

Wrap the default `ForceGraph2D` export with `graphData`, `nodeCanvasObject`, `nodePointerAreaPaint`, semantic link styling, deterministic initial coordinates, zoom/pan/drag support, and one-time `zoomToFit`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `pnpm --filter @recoil-river/graph test`

Expected: all shared graph tests pass.

### Task 2: Chrome popup integration

**Files:**
- Modify: `plugin/package.json`
- Modify: `plugin/src/popup/GraphCanvas.tsx`
- Modify: `plugin/src/popup/PopupView.tsx`
- Modify: `plugin/src/popup/PopupView.test.tsx`
- Modify: `plugin/entrypoints/popup/style.css`
- Delete: `plugin/src/popup/graph-layout.ts`
- Delete: `plugin/src/popup/graph-layout.test.ts`

**Interfaces:**
- Consumes: `KnowledgeGraph2D` and the existing `PopupGraph`.
- Produces: popup graph node clicks that open `${webUrl}/bookmarks/{id}`.

- [ ] **Step 1: Write a failing popup deep-link test**

Mock the shared graph, click a node, and assert `window.open` receives the private reader URL, `_blank`, and `noopener,noreferrer`.

- [ ] **Step 2: Run the popup test and verify RED**

Run: `pnpm --filter @recoil-river/plugin test -- PopupView.test.tsx`

- [ ] **Step 3: Replace the custom canvas**

Render `KnowledgeGraph2D` in popup mode and remove the direct `d3-force` layout dependency and tests.

- [ ] **Step 4: Run popup tests and verify GREEN**

Run: `pnpm --filter @recoil-river/plugin test`

### Task 3: Authenticated website graph

**Files:**
- Modify: `web/package.json`
- Create: `web/src/app/graph/page.tsx`
- Create: `web/src/components/graph/GraphPage.tsx`
- Create: `web/src/components/graph/GraphPage.test.tsx`
- Modify: `web/src/lib/returnTo.ts`
- Modify: `web/src/lib/returnTo.test.ts`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Consumes: `useConvexAuth`, `useQuery(api.graph.getPopupSnapshot)`, and `KnowledgeGraph2D`.
- Produces: authenticated `/graph`, login redirection, reader navigation, and an accessible bookmark list.

- [ ] **Step 1: Write failing auth, data, navigation, and default-return tests**

Cover loading, signed-out redirect, signed-in data rendering, node navigation, and `safeReturnTo(null) === '/graph'`.

- [ ] **Step 2: Run focused website tests and verify RED**

Run: `pnpm --filter recoil-river-web test -- GraphPage.test.tsx returnTo.test.ts`

- [ ] **Step 3: Implement `/graph`**

Use a client component, `ResizeObserver`, Convex auth/query hooks, safe router navigation, and a full-screen monochrome shell.

- [ ] **Step 4: Run website tests and verify GREEN**

Run: `pnpm --filter recoil-river-web test`

### Task 4: Install, verify, document, and publish checkpoint

**Files:**
- Modify: `pnpm-lock.yaml`
- Modify: `README.md`
- Modify: `plugin/README.md`
- Modify: `web/README.md`

**Interfaces:**
- Consumes: all three implementation tasks.
- Produces: a reproducible tested branch and user acceptance checklist.

- [ ] **Step 1: Install exact dependencies**

Run `pnpm install` after pinning the current `react-force-graph-2d` release.

- [ ] **Step 2: Run the complete checkpoint suite**

Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm --filter @recoil-river/plugin zip`, `git diff --check`, manifest inspection, and a secret/configuration scan.

- [ ] **Step 3: Review the complete diff**

Confirm shared ownership, no provider secrets, no permission expansion, and no unrelated regressions.

- [ ] **Step 4: Commit and push**

Stage the complete MVP, commit with a single checkpoint message, and push `codex/chrome-mvp`.
