# MVP

## Included surfaces

### Website

The website will provide a landing page, sign-in entry, a private image-led library, and a full mind-map view. The library will show saved page context and source imagery. The map will let users inspect connections among their own saved pages.

### Chrome extension

The Chrome Manifest V3 extension will show the current page, a compact account graph preview, and one primary `Add this page` action. It will use the same authenticated account and Convex data as the website.

### Convex backend

Convex will own account-scoped bookmark writes and reads, realtime updates, enrichment-job state, extracted documents, graph edges, suggestions, and append-only activity events. This foundation does not add those schemas or functions.

## Required capture behavior

1. The user starts a save from the extension or website.
2. Convex writes the bookmark with its source URL and user scope.
3. Convex schedules enrichment after the write succeeds.
4. Extraction and AI work update their own durable job state.
5. A failed or retried job leaves the bookmark available.

## Excluded from the MVP

The MVP does not include passive history collection, autonomous capture, production discovery, a scrub timeline, daily resurfacing, an auth-provider selection, or native desktop surfaces.

## Completion boundary

This repository foundation documents the intended product and exports visual references. It does not ship a running website, extension, backend, authentication flow, provider integration, or privacy-control implementation.
