# System architecture

## Ownership

`web/` owns the Next.js landing page, sign-in entry, private library, mind map, and later discovery views.

`plugin/` owns the Chrome Manifest V3 popup. It presents current-page context, authenticated access to the same account, a dense graph preview, and one capture action.

`convex/` owns shared data, user-scoped mutations, realtime queries, job orchestration, provider calls, and activity records.

## Write and enrichment flow

```text
Website or extension
  -> authenticated Convex bookmark mutation
  -> bookmark stored for one user
  -> durable enrichment job scheduled
  -> Firecrawl extracts the public page
  -> OpenRouter returns a structured summary and embedding
  -> Convex stores derived records and emits realtime updates
```

The bookmark mutation succeeds before any enrichment request starts. A provider error records a failed or retryable job. It does not delete, hide, or transfer the bookmark.

Exa enters after a user has enough saved history to support related-page discovery. It finds related or unseen pages. The default pipeline selects one extractor for a URL and does not scrape the same URL through two providers.

## Trust boundary

Clients authenticate to the product and call Convex through scoped interfaces. Convex environment variables hold Firecrawl, OpenRouter, and Exa credentials. Browser and extension code never receive provider keys or Convex deployment credentials.

Each query and mutation must scope records to the authenticated user. Server-side jobs must preserve that scope while they process a bookmark.

## Current boundary

These interfaces are design commitments. This foundation contains no production schema, API endpoint, auth integration, provider call, or job implementation.
