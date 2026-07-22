# Website

`web/` will own the Next.js product surface.

The first release will provide a public landing page, a sign-in entry point, a private visual library, and an Obsidian-style mind map. The library will lead with source imagery and page context. The map will show saved pages as a dense, navigable graph.

The website reads and writes through Convex. It does not call Firecrawl, OpenRouter, or Exa from the browser, and it does not receive provider keys or Convex deployment credentials.

See the [system architecture](../docs/architecture/system.md), [data model](../docs/architecture/data-model.md), and [UI direction](../docs/design/ui-direction.md). The [library and map mockup](../docs/mockups/library-map.html) shows the intended product language.

Later work may add discovery views, a scrub timeline, and daily resurfacing. Those features do not exist in the MVP.

## Local development

Run these commands from `web/`:

```bash
pnpm install
pnpm dev
```

The splash screen is available at `http://localhost:3000/`. Its four replaceable artwork layers use `public/splash/art-1.png` through `art-4.png`. The login destination is at `/login`.

## Vercel

Set the Vercel project Root Directory to `web`. Vercel will detect the Next.js app from `web/package.json` and run its install and build commands from that directory.
