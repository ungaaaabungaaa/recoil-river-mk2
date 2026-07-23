# Public Entry and Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the approved Recoil River splash/auth experience and route authenticated users directly to `/graph`.

**Architecture:** Keep Convex auth and existing route boundaries intact. Update the splash CTA to preserve a safe graph return path, add an auth-aware home redirect, and restyle the existing login component with the reference’s dark-card/pale-art composition.

**Tech Stack:** Next.js App Router, React, Convex Auth, Space Grotesk Variable, Vitest, Testing Library, Tailwind/CSS.

## Global Constraints

- Preserve the exact splash CTA label `FU*K ME`.
- Keep password authentication client-side with the existing Convex `signIn` action.
- Keep safe return paths through `safeReturnTo`.
- Do not add middleware, new auth providers, or backend schema changes.
- Keep all artwork local under `web/public`.

### Task 1: Make the splash auth-aware

**Files:**
- Modify: `web/src/components/splash/SplashScreen.tsx`
- Test: `web/src/components/splash/SplashScreen.test.tsx`

**Interfaces:**
- Consumes: `useConvexAuth`, `useRouter`.
- Produces: a public splash that sends the user to `/login?returnTo=/graph` and redirects an authenticated session to `/graph`.

- [ ] Write a failing test asserting an authenticated session replaces the home route with `/graph`.
- [ ] Run `pnpm --filter recoil-river-web test -- SplashScreen.test.tsx` and verify the new assertion fails.
- [ ] Add the auth-aware effect and change the CTA destination to `/login?returnTo=%2Fgraph`.
- [ ] Run the focused test and verify it passes.

### Task 2: Match the reference auth composition

**Files:**
- Modify: `web/src/components/auth/LoginForm.tsx`
- Modify: `web/src/app/globals.css`
- Test: `web/src/components/auth/LoginForm.test.tsx`

**Interfaces:**
- Consumes: the existing `onSubmit`, `error`, `isSubmitting`, and `LoginFlow` props.
- Produces: accessible sign-in/sign-up controls inside a responsive dark auth card over local artwork.

- [ ] Add a failing test for the reference copy and stable form labels.
- [ ] Run the focused auth test and verify the new assertion fails.
- [ ] Implement the centered card layout, mode copy, focus states, and responsive artwork backdrop without changing submit behavior.
- [ ] Run the focused auth test and verify it passes.

### Task 3: Validate the website slice

**Files:**
- Modify: `web/src/app/page.tsx` only if route composition needs a wrapper.

**Interfaces:**
- Consumes: the updated splash and login components.
- Produces: `/` for public entry, `/login` for auth, and `/graph` after authentication.

- [ ] Run `pnpm --filter recoil-river-web test` and verify all web tests pass.
- [ ] Run `pnpm lint` and `pnpm typecheck` and verify both pass.
- [ ] Run `pnpm build` and verify the production routes compile.

### Task 4: Commit and push

**Files:**
- Add: design and plan docs plus the implementation changes.

- [ ] Run `git diff --check` and inspect `git status`.
- [ ] Commit with `feat: polish public entry and auth flow`.
- [ ] Push the current branch with `git push`.
