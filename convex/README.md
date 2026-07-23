# Convex backend

This package is the shared backend for the website and Chrome extension. It
owns password auth, user-scoped bookmarks, durable enrichment jobs, extracted
documents, validated insights, 1536-dimension embeddings, and semantic edges.

`addCurrentPage` atomically inserts the bookmark and enrichment job before
scheduling work. Each durable pipeline write is fenced by a run token. Retryable
timeouts, 429s, and 5xx responses resume from the last completed stage after 30
seconds, 2 minutes, and 10 minutes. Terminal failures retain the bookmark and
any partial extraction.

Run `pnpm exec convex dev` from the repository root to link a deployment, then
`pnpm codegen` whenever the schema or functions change.
