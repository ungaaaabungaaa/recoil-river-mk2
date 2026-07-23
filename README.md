# Recoil River

Recoil River turns deliberately saved pages into a private, semantic knowledge
graph. This repository contains the first complete Chrome MVP vertical slice:

- `plugin/` — WXT Manifest V3 popup with password auth, current-page capture,
  an interactive force graph, and 12 recent bookmark shortcuts.
- `web/` — Next.js login/signup, authenticated `/graph`, and a private Markdown
  bookmark reader.
- `convex/` — shared Convex Auth, user-scoped data, durable Firecrawl/OpenRouter
  enrichment, vector search, and semantic edges.
- `graph/` — the shared `react-force-graph-2d` component used by the extension
  and website.

The packages are sibling pnpm workspaces. The website and extension point at
the same Convex deployment and account data, while Convex Auth persists a
separate `localStorage` session for each origin.

## Quick start

Requirements: Node.js 20+, pnpm 11.13.0, a Convex account, Firecrawl, and
OpenRouter.

```bash
pnpm install
pnpm exec convex dev
pnpm --filter @recoil-river/backend exec auth
```

The first Convex command links or creates a development deployment. The Auth
command generates backend signing variables. It does not enable email
verification or password recovery; this MVP intentionally uses demo-grade
password auth with normalized emails and an eight-character minimum.

Set backend-only provider variables on Convex:

```bash
pnpm exec convex env set FIRECRAWL_API_KEY
pnpm exec convex env set OPENROUTER_API_KEY
pnpm exec convex env set OPENROUTER_SUMMARY_MODEL openai/gpt-5-mini
pnpm exec convex env set OPENROUTER_EMBEDDING_MODEL openai/text-embedding-3-small
```

Do not place provider keys in `NEXT_PUBLIC_*` or `WXT_PUBLIC_*` variables. Copy
the public values from [.env.example](.env.example) into `web/.env.local` and
`plugin/.env.local`, then run:

```bash
pnpm dev:convex
pnpm dev:web
pnpm dev:plugin
```

## Verification

All provider adapters are mocked in tests; automated verification consumes no
Firecrawl or OpenRouter credits.

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm zip:plugin
git diff --check
```

`pnpm codegen` runs official Convex code generation after a deployment is
linked. Until then, `_generated/` contains the matching Convex 1.42 TypeScript
bootstrap templates so local tests and clients remain type-safe.

## Security and privacy boundaries

- Every public data function derives ownership from Convex Auth.
- A cross-account bookmark lookup returns the same private not-found state as a
  missing record.
- Only HTTP(S) pages can be saved; URL credentials, fragments, and known
  trackers are removed before deduplication.
- The extension requests only `activeTab` and one configured Convex origin.
- Provider keys execute only inside Convex actions.
- Firecrawl is configured for no cache, zero data retention, ad blocking, and
  base64-image removal.
- OpenRouter requests require ZDR and deny data collection.
- A bookmark is durable before enrichment starts and remains visible after a
  provider failure.

## Deployment

Set the Vercel Root Directory to `web` and enable **Include source files outside
of the Root Directory** so Vercel can read the root lockfile and
`@recoil-river/backend` and `@recoil-river/graph`. The checked-in
[`web/vercel.json`](web/vercel.json) follows Convex's Vercel build flow:
`npx convex deploy` deploys the backend first, injects the production URL as
`NEXT_PUBLIC_CONVEX_URL`, and then runs the Next.js build.

Create a **production Convex deployment** before creating the Vercel project:

```bash
pnpm exec convex deploy
```

After `vercel login` and `vercel link`, create a **production deploy key** in
the Convex dashboard with the `deployment:deploy` permission. Add that key to
the Vercel **Production** environment (or add it in Project Settings →
Environment Variables):

```bash
printf '%s\n' 'your-convex-production-deploy-key' | \
  vercel env add CONVEX_DEPLOY_KEY production
```

The build command injects `NEXT_PUBLIC_CONVEX_URL` automatically, so it does
not need to be entered manually in Vercel.

Do not add `FIRECRAWL_API_KEY`, `OPENROUTER_API_KEY`, `JWT_PRIVATE_KEY`, or
`JWKS` to Vercel. They belong only to the production Convex deployment.

Configure these variables on the production Convex deployment only. The two
provider values are secrets and must be entered interactively; the model names
are non-secret defaults:

```bash
pnpm exec convex env set FIRECRAWL_API_KEY
pnpm exec convex env set OPENROUTER_API_KEY
pnpm exec convex env set OPENROUTER_SUMMARY_MODEL openai/gpt-5-mini
pnpm exec convex env set OPENROUTER_EMBEDDING_MODEL openai/text-embedding-3-small
```

Run the Auth setup against the production deployment and set its `SITE_URL` to
the final Vercel URL. Auth signing variables stay inside Convex and are never
copied to Vercel or the extension:

```bash
CONVEX_DEPLOYMENT=prod:your-team:your-project \
pnpm --shell-mode --filter @recoil-river/backend exec 'cd .. && auth'
```

Build the extension with its real public origins:

```bash
WXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud \
WXT_PUBLIC_WEB_URL=https://your-site.example \
pnpm zip:plugin
```

Inspect `plugin/.output/chrome-mv3/manifest.json`, then load that directory as
an unpacked extension for live acceptance.
