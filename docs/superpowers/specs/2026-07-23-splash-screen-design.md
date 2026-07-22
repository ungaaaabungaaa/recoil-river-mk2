# Recoil River Splash Screen Design

## Goal

Create the first running website surface inside `web/`: a responsive splash screen that matches the supplied monochrome reference and sends visitors to a combined login and registration route.

## Scope

This slice will:

- scaffold a Next.js application inside `web/`;
- render the splash screen at `/`;
- add a lightweight destination shell at `/login` for the later login and registration work;
- install and configure the Astryx design system;
- accept four replaceable transparent PNG assets; and
- document the `web` root directory required by Vercel.

Authentication remains outside this slice. A later auth pass will redirect signed-in users from `/` and `/login` to their private library. The splash implementation will not store a browser flag that could mistake an unauthenticated visitor for an authenticated user.

## Visual Design

The page uses a charcoal viewport with an inset black stage and a large corner radius. Four transparent PNGs form an asymmetrical technical-art collage. The composition reserves the lower-left corner for a white call-to-action block labeled `FU*K ME`, using the wording from the supplied reference.

Desktop screens keep the framed stage and generous outer margin. Small screens use an edge-to-edge black stage, reduce the artwork scale, and keep the call to action above the safe-area inset. Images may crop at the stage boundary, but they must not cover the call to action.

Motion stays limited to a short entrance sequence for the artwork and call to action. The page disables that motion when the visitor requests reduced motion.

## Asset Contract

The user will replace these files with four transparent PNGs:

```text
web/public/splash/art-1.png
web/public/splash/art-2.png
web/public/splash/art-3.png
web/public/splash/art-4.png
```

Each image sits in its own named layer with responsive position and size rules. Transparent placeholder files keep the route functional before the final artwork arrives. Replacing a file must not require component edits.

## Application Structure

The Next.js App Router will own both routes:

```text
web/src/app/page.tsx             splash route
web/src/app/login/page.tsx       login and registration destination shell
web/src/components/splash/*      splash composition and asset metadata
web/src/app/*.css                Astryx layer order, theme imports, and local styles
```

The splash call to action will navigate to `/login` with client-side routing. The auth destination shell will contain no working credential form in this slice because the project has not selected an authentication provider.

## Astryx Integration

The app will install `@astryxdesign/core`, `@astryxdesign/theme-neutral`, and `@astryxdesign/cli`. It will import the Astryx reset, component CSS, and neutral theme once at the app root. A dedicated cascade-layer declaration will load before those imports, following Astryx's Next.js guidance.

The call to action will use Astryx's accessible button primitive inside the route navigation pattern. Local CSS will override its scale, white background, black text, and corner radius through supported classes or style hooks. Astryx tokens will supply shared spacing, shape, and focus behavior where they fit the composition.

The implementation will run `astryx init` after installation and read the generated project guidance before using the component API.

Official references:

- [Astryx getting started](https://astryx.atmeta.com/docs/getting-started)
- [Astryx migration and cascade-layer guidance](https://astryx.atmeta.com/docs/migration)

## Accessibility

The route will provide one descriptive heading for Recoil River, even if the artwork makes that heading visually subtle. Decorative PNGs will use empty alternative text. The visible call-to-action wording will remain unchanged, while its accessible name will explain that the control enters Recoil River and opens the login page.

Keyboard users will receive a strong visible focus state. Text and controls will meet AA contrast. Touch targets will remain at least 44 pixels high, and the layout will not depend on hover.

## Failure Behavior

The page must remain usable if an artwork request fails. The black stage and call to action still render, and navigation still reaches `/login`. The route will not wait for image loading before enabling the link.

## Tests and Verification

Test-first implementation will cover these behaviors:

1. The splash route exposes the exact visible call-to-action wording.
2. The call to action has an accessible name and points to `/login`.
3. All four decorative image layers use the agreed stable asset paths.
4. The `/login` route renders as the navigation destination.

The final verification will run the focused tests, the full test suite, lint, type checking, and a production build. Browser checks will cover desktop and mobile viewport layouts, keyboard focus, missing-image behavior, and reduced motion.

## Vercel Deployment Boundary

Vercel must use `web` as the project root directory because the repository keeps documentation, the future extension, and Convex code beside the website. Vercel detects the Next.js framework from `web/package.json` and runs install and build commands from that directory.
