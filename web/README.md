# Website

The Next.js website provides shared Convex password login/signup, the private
`/bookmarks/[id]` reader, and an authenticated full-screen `/graph` route using
the same `react-force-graph-2d` component as the Chrome popup. Login lands on
`/graph` unless a safe private reader deep link was requested.

The reader shows partial data when enrichment fails and renders extracted
Markdown without raw HTML execution or embedded remote images.

Configure `NEXT_PUBLIC_CONVEX_URL` in `.env.local`, then run:

```bash
pnpm --filter recoil-river-web dev
```

For Vercel, set the project Root Directory to `web`, enable source files outside
that directory, and configure the same public Convex deployment URL used by the
extension.
