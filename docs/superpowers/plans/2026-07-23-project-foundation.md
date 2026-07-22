# Recoil River Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the documentation and standalone visual-reference foundation for Recoil River in one reviewable commit.

**Architecture:** The repository contains focused Markdown documents for surface ownership, product scope, system behavior, AI processing, privacy, and delivery sequencing. Four approved Codex fragments are rendered into standalone HTML references under `docs/mockups/`.

**Tech Stack:** Markdown, Git, Python renderer at `/Users/syedabdulmuqeeth/.codex/plugins/cache/openai-bundled/visualize/1.0.14/skills/visualize/scripts/render.py`.

## Global Constraints

- Create documentation and standalone mockups only.
- Do not add package manifests, dependencies, generated code, production schemas, API implementations, or an auth-provider choice.
- Preserve manual capture, bookmark-first writes, asynchronous enrichment, private-by-default data, Convex source-of-truth ownership, and backend-only secrets.
- Do not stage, commit, push, or modify `.git` while preparing the foundation. The controller performs the one final commit.
- Keep prose direct and free of placeholders, fake metrics, and shipping claims.

---

### Task 1: Establish the repository entry points

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `web/README.md`
- Create: `plugin/README.md`
- Create: `convex/README.md`
- Create: `docs/README.md`

**Interfaces:**
- Consumes: The agreed MVP surface boundaries.
- Produces: Linked repository and surface entry points.

- [ ] **Step 1: Write the root and surface READMEs**

Document each ownership boundary, link all entry points, and state that the repository has no application implementation yet.

- [ ] **Step 2: Add repository ignores**

Write `.gitignore` entries for `.env`, `.env.*`, `node_modules/`, `.next/`, `dist/`, `build/`, `.output/`, `.wxt/`, `.turbo/`, `coverage/`, `.DS_Store`, `.vercel/`, `.superpowers/`, `.codex/`, and `.agents/`. Do not ignore `docs/mockups/`.

- [ ] **Step 3: Check navigation**

Run: `rg -n '\\]\([^)]*\\)' README.md web/README.md plugin/README.md convex/README.md docs/README.md`

Expected: Each entry point contains local Markdown links that resolve from its own directory.

### Task 2: Document product and architecture decisions

**Files:**
- Create: `docs/product/vision.md`
- Create: `docs/product/mvp.md`
- Create: `docs/architecture/system.md`
- Create: `docs/architecture/data-model.md`
- Create: `docs/architecture/ai-pipeline.md`
- Create: `docs/design/ui-direction.md`
- Create: `docs/privacy.md`
- Create: `docs/roadmap.md`

**Interfaces:**
- Consumes: Surface entry points from Task 1.
- Produces: Shared requirements for later website, extension, and backend implementation.

- [ ] **Step 1: Record capture and ownership behavior**

State that users initiate saves manually, Convex stores a user-scoped bookmark before scheduling enrichment, and failed jobs retain the bookmark.

- [ ] **Step 2: Record provider flow and trust boundary**

Document Firecrawl as the primary public-page extractor, OpenRouter for structured summaries and embeddings, Exa for later related-page discovery, one extractor route per URL by default, and Convex environment variables for credentials.

- [ ] **Step 3: Record UI, privacy, and future boundaries**

Describe the monochrome visual language, library and mind-map surfaces, private-by-default expectations, future export and deletion behavior, source exclusions, provider disclosure, scrub timeline, daily resurfacing, and discovery as future work.

- [ ] **Step 4: Inspect the requirement vocabulary**

Run: `rg -n 'manual|bookmark|Convex|Firecrawl|OpenRouter|Exa|private|export|deletion|scrub timeline|daily resurfacing' docs/product docs/architecture docs/design docs/privacy.md docs/roadmap.md`

Expected: The documents state each required product decision without claiming an unbuilt control exists.

### Task 3: Render approved standalone mockups

**Files:**
- Create: `docs/mockups/login.html`
- Create: `docs/mockups/landing.html`
- Create: `docs/mockups/plugin.html`
- Create: `docs/mockups/library-map.html`

**Interfaces:**
- Consumes: Four approved fragments in the thread visualization directory.
- Produces: Browser-openable standalone HTML visual references.

- [ ] **Step 1: Render each fragment with the approved renderer**

Run:

```bash
python3 /Users/syedabdulmuqeeth/.codex/plugins/cache/openai-bundled/visualize/1.0.14/skills/visualize/scripts/render.py /Users/syedabdulmuqeeth/.codex/visualizations/2026/07/22/019f8aff-9957-7771-9cb6-2b7378192840/login-screen-monochrome.html docs/mockups/login.html
python3 /Users/syedabdulmuqeeth/.codex/plugins/cache/openai-bundled/visualize/1.0.14/skills/visualize/scripts/render.py /Users/syedabdulmuqeeth/.codex/visualizations/2026/07/22/019f8aff-9957-7771-9cb6-2b7378192840/landing-page-monochrome.html docs/mockups/landing.html
python3 /Users/syedabdulmuqeeth/.codex/plugins/cache/openai-bundled/visualize/1.0.14/skills/visualize/scripts/render.py /Users/syedabdulmuqeeth/.codex/visualizations/2026/07/22/019f8aff-9957-7771-9cb6-2b7378192840/chrome-graph-capture-popup.html docs/mockups/plugin.html
python3 /Users/syedabdulmuqeeth/.codex/plugins/cache/openai-bundled/visualize/1.0.14/skills/visualize/scripts/render.py /Users/syedabdulmuqeeth/.codex/visualizations/2026/07/22/019f8aff-9957-7771-9cb6-2b7378192840/website-library-map-concept.html docs/mockups/library-map.html
```

Expected: Four standalone HTML documents exist under `docs/mockups/`.

- [ ] **Step 2: Confirm standalone safety**

Run: `for f in docs/mockups/*.html; do head -n 1 "$f"; done; ! rg -n 'window\\.openai' docs/mockups`

Expected: Every file begins with `<!doctype html>` and no export calls `window.openai`.

### Task 4: Review, validate, and hand off the single commit

**Files:**
- Review: `README.md`, `.gitignore`, `web/README.md`, `plugin/README.md`, `convex/README.md`, and `docs/**`

**Interfaces:**
- Consumes: Tasks 1 through 3.
- Produces: A reviewed worktree for the controller’s one commit.

- [ ] **Step 1: List the required files**

Run: `find README.md .gitignore web/README.md plugin/README.md convex/README.md docs -type f -print | sort`

Expected: The output includes all required documentation and four mockup files.

- [ ] **Step 2: Scan authored content and exports**

Run:

```bash
! rg -n -i 'TODO|TBD|/tmp/|screenshot|api[_-]?key[[:space:]]*[:=]|secret[[:space:]]*[:=]|sk-[A-Za-z0-9_-]{10,}' README.md web plugin convex docs --glob '!docs/superpowers/plans/**' --glob '!docs/mockups/**'
! rg -n -i '/var/folders|TemporaryItems|file://|api[_-]?key[[:space:]]*[:=]|secret[[:space:]]*[:=]|sk-[A-Za-z0-9_-]{10,}' .gitignore
! rg -n 'window\.openai' docs/mockups
```

Expected: The authored product documentation contains no placeholders, temporary screenshot paths, or obvious secret values. The ignore file contains no machine-specific paths or secrets, while retaining its deliberate screenshot patterns. The exported mockups contain no host-only calls. The implementation plan is excluded because it preserves renderer source paths and validation literals.

- [ ] **Step 3: Review scope and prose**

Check each document for active, direct prose; consistent bookmark-first behavior; manual capture; private-by-default data; and clear future-feature labels.

- [ ] **Step 4: Controller creates the one final commit**

Run:

```bash
git status --short
git add README.md .gitignore web/README.md plugin/README.md convex/README.md docs
git commit -m "docs: establish Recoil River foundation"
git status --short
```

Expected: The controller commits all foundation files in one commit and the final status shows no untracked foundation files. The controller then uses the project’s authorized push process.
