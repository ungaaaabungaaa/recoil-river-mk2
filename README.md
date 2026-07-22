# Recoil River

Recoil River is a private knowledge river for pages you choose to save. It pairs a visual library with a connected mind map so you can return to useful material and see the paths between ideas.

The MVP has three surfaces:

- [Website](web/README.md): landing page, sign-in entry, private library, and mind map.
- [Chrome extension](plugin/README.md): manual capture from the current page.
- [Convex backend](convex/README.md): shared source of truth and realtime sync layer.

This repository currently contains the product, architecture, privacy, roadmap, and visual-direction foundation. It contains no production application code, schema, API, package manifest, dependency, or auth-provider decision.

Read the [documentation index](docs/README.md) for product scope, system boundaries, provider flow, data concepts, privacy expectations, delivery sequence, and exported mockups.

## Capture contract

You choose when to save a page. Recoil River writes the bookmark before it asks an AI provider to enrich anything. If extraction or AI work fails, the saved bookmark remains available and the backend can retry the work later.

Convex holds user-scoped records and pushes updates to the website and extension. Provider keys and Convex deployment credentials stay on the backend.
