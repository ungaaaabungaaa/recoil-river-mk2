# Roadmap

## Foundation

Define the product boundary, system ownership, provider route, private-by-default posture, visual direction, and standalone mockups. This repository stage is complete when the documentation passes review and the controller commits it.

## MVP implementation

Build account-scoped Convex data, manual bookmark capture, realtime library reads, durable enrichment jobs, Firecrawl extraction, OpenRouter structured output, and the website and extension views. Verify that a provider failure leaves a saved bookmark available.

## Library depth

Add extracted-document inspection, graph edges, richer page context, user-data export, document deletion, source exclusion handling, and provider disclosure in the product flow. Validate privacy behavior with account-scoped tests.

## Discovery and return

After users have enough saved history, introduce Exa-powered related and unseen-page suggestions. Add a scrub timeline and daily resurfacing after the core library earns user trust. Treat suggestions as candidates until a user saves them.

## Release criteria

Ship only after the team verifies capture boundaries, user scoping, retry behavior, secret isolation, provider disclosure, deletion behavior, export behavior, and source exclusions. Each release needs evidence from the running product.
