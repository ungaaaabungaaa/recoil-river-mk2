# Chrome extension

The WXT React popup is a 380×560 monochrome capture surface. It reads the active
tab only when the toolbar popup opens, saves it through Convex, draws the
authenticated user’s real 120-node snapshot with `react-force-graph-2d`, and
links graph nodes plus the newest 12 bookmarks to the private website reader.

The canvas supports force clustering, zoom, pan, and node dragging. Ready,
in-progress, and failed bookmarks have distinct monochrome node treatments.

Configure `WXT_PUBLIC_CONVEX_URL` and `WXT_PUBLIC_WEB_URL` in `.env.local`.

The workspace install safely skips WXT manifest preparation when the Convex
URL is absent (for example, when Vercel is installing only the website). A
real extension build or zip still requires the HTTPS `WXT_PUBLIC_CONVEX_URL`.

```bash
pnpm --filter @recoil-river/plugin dev
pnpm --filter @recoil-river/plugin build
pnpm --filter @recoil-river/plugin zip
```

The generated manifest must contain only `activeTab`, the exact configured
Convex host permission, and matching HTTPS/WSS `connect-src` entries.
