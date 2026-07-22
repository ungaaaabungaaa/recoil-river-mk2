# Splash Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first running Next.js website surface inside `web/`, with an Astryx-powered splash screen at `/` and a login/register destination at `/login`.

**Architecture:** The App Router owns two routes. A focused `SplashScreen` component renders four CSS background layers from stable public asset paths and a client-side Astryx button that navigates to `/login`. Local CSS defines the monochrome composition while Astryx supplies reset, theme tokens, and the button primitive.

**Tech Stack:** Next.js App Router, React, TypeScript, Astryx core/theme/CLI, Vitest, Testing Library, ESLint.

## Global Constraints

- Keep the implementation inside `web/`; preserve the root documentation, `plugin/`, and `convex/` boundaries.
- Keep the CTA text exactly `FU*K ME` and route it to `/login`.
- Reserve four stable assets at `web/public/splash/art-1.png` through `art-4.png`; use CSS background layers so missing user artwork does not create broken-image icons.
- Use Astryx reset/theme CSS once at the app root and load the cascade layer order before Astryx imports.
- Keep authentication out of this slice; `/login` is a destination shell until an auth provider is selected.
- Respect reduced-motion preferences and keyboard focus visibility.
- Run focused tests, the full test suite, lint, type checking, and a production build before claiming completion.

---

### Task 1: Scaffold the nested Next.js website and Astryx dependencies

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/next.config.ts`, `web/eslint.config.mjs`
- Create: `web/src/app/layout.tsx`, `web/src/app/globals.css`
- Create: `web/vitest.config.ts`, `web/vitest.setup.ts`
- Create: `web/README.md` (preserve the existing ownership text and append run/deploy commands)

**Interfaces:**
- Produces a runnable `web` package with `dev`, `build`, `lint`, `typecheck`, and `test` scripts.
- Provides the Astryx reset, component styles, and neutral theme to every route through `globals.css`.

- [x] **Step 1: Create the package manifest and config files**

Use Next.js App Router with TypeScript and add the Astryx runtime, theme, CLI, Vitest, jsdom, and Testing Library dependencies. Configure the `@/*` import alias to `src/*`.

- [x] **Step 2: Add the root layout and layered Astryx stylesheet**

Declare the cascade order before imports, then load Astryx reset, component CSS, and neutral theme. Set `html` metadata to `Recoil River` and give the body a full-height black base.

- [x] **Step 3: Add test configuration**

Configure Vitest for jsdom, global test APIs, and the Testing Library setup file. Keep test discovery inside `src/**/*.test.{ts,tsx}`.

- [x] **Step 4: Install dependencies from `web`**

Run:

```bash
pnpm install
pnpm exec astryx init
```

Expected: dependency installation succeeds, the Astryx CLI initializes its agent guidance, and `pnpm exec astryx component Button --props` returns Button documentation.

### Task 2: Write the failing splash behavior tests

**Files:**
- Create: `web/src/components/splash/SplashScreen.test.tsx`
- Create: `web/src/app/login/page.test.tsx`

**Interfaces:**
- Tests import `SplashScreen` from `./SplashScreen` and the login page from `@/app/login/page`.
- The required public behavior is an accessible `FU*K ME` control with an `/login` destination and four named art layers.

- [x] **Step 1: Write the splash tests**

Assert that rendering `SplashScreen` exposes one control named `FU*K ME`, that it carries an accessible description for entering Recoil River, and that the four layers use `/splash/art-1.png` through `/splash/art-4.png` in their style declarations.

- [x] **Step 2: Write the login destination test**

Assert that rendering the login page exposes a single `h1` containing `Enter your river` and visible options for `Log in` and `Register`.

- [x] **Step 3: Run the focused tests and verify RED**

Run:

```bash
pnpm test --run src/components/splash/SplashScreen.test.tsx src/app/login/page.test.tsx
```

Expected: Vitest fails because the route and component files do not exist yet.

### Task 3: Implement the splash composition and login destination

**Files:**
- Create: `web/src/components/splash/SplashScreen.tsx`
- Create: `web/src/components/splash/splash.module.css`
- Create: `web/src/app/page.tsx`
- Create: `web/src/app/login/page.tsx`, `web/src/app/login/login.module.css`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- `SplashScreen` renders four decorative layers and a single CTA.
- `SplashScreen` uses `useRouter()` to navigate to `/login` after Astryx's button receives activation.
- `/login` is a server-rendered destination shell with login/register labels and no fake auth state.

- [x] **Step 1: Implement the minimum component to satisfy the tests**

Define the four asset paths in a typed array, render each as an `aria-hidden` layer with a `data-art-layer` attribute and inline `backgroundImage`, then render Astryx `Button` with the exact label and an accessible description. Use `router.push('/login')` in the click handler.

- [x] **Step 2: Implement the responsive visual system**

Use CSS variables for the charcoal viewport, black stage, white CTA, radii, and spacing. Place the four layers asymmetrically with `background-size: contain`; keep the CTA in the lower-left safe zone. Add desktop framing, mobile edge-to-edge behavior, focus-visible styling, entrance animation, and a reduced-motion media query.

- [x] **Step 3: Implement the login/register destination shell**

Render a monochrome panel with `h1` `Enter your river`, two visible mode buttons labeled `Log in` and `Register`, and a short line explaining that authentication will be connected next. Keep the panel static and accessible.

- [x] **Step 4: Run the focused tests and verify GREEN**

Run:

```bash
pnpm test --run src/components/splash/SplashScreen.test.tsx src/app/login/page.test.tsx
```

Expected: both test files pass with zero failures.

### Task 4: Verify the website and commit the implementation

**Files:**
- Review: all files under `web/`
- Modify: `web/README.md` with local and Vercel root-directory instructions

- [x] **Step 1: Run the complete validation set**

From `web/`, run:

```bash
pnpm test --run
pnpm lint
pnpm typecheck
pnpm build
```

Expected: every command exits with code 0.

- [x] **Step 2: Inspect the rendered routes**

Start `pnpm dev`, open `/` and `/login`, and check desktop and mobile widths. Confirm keyboard focus reaches `FU*K ME`, activation navigates to `/login`, missing art paths leave a clean black stage, and reduced motion removes the entrance animation.

- [x] **Step 3: Check repository scope**

Run:

```bash
git diff --check
git status --short
```

Expected: only the new `web` implementation, the plan, and any intentional generated Astryx guidance appear.

- [x] **Step 4: Commit the implementation**

```bash
git add web docs/superpowers/plans/2026-07-23-splash-screen-implementation.md
git commit -m "feat: add recoil river splash screen"
```
