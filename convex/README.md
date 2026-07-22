# Convex Backend

`convex/` will own the shared backend and realtime data layer.

Later implementation will add user-scoped bookmark mutations, realtime queries, durable enrichment jobs, extracted documents, graph edges, suggestions, and append-only activity events. It will validate the authenticated user before each scoped operation and keep provider credentials in Convex environment variables.

The write path saves a bookmark before it schedules enrichment. A failed extraction or AI call changes job state, not bookmark ownership or availability. The backend will avoid sending the same URL to two extractors by default.

See the [system architecture](../docs/architecture/system.md), [data model](../docs/architecture/data-model.md), and [AI pipeline](../docs/architecture/ai-pipeline.md).
