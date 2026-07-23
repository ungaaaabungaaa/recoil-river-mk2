# Recoil River Public Entry and Auth Design

## Goal

Make the website feel like a single visual product from first visit through authentication, while preserving the existing Convex password flow and routing authenticated users to the graph.

## Experience

- Signed-out visitors land on the existing black artwork splash at `/`.
- The splash CTA remains `FU*K ME` to match the approved reference and existing product direction.
- The CTA opens `/login?returnTo=/graph`.
- The login page uses the existing Space Grotesk styling and Convex password actions, presented as a centered dark card over the pale architectural artwork.
- Login and sign-up remain explicit modes with the existing eight-character password requirement and provider-safe error copy.
- Authenticated visitors who open `/` are redirected to `/graph`; the splash is never shown again for an authenticated session.
- `/login-sso` remains a redirect for compatibility with old links.

## Architecture

The route pages keep their current responsibilities. `SplashScreen` owns only the public CTA and artwork; `LoginForm` owns fields and mode switching; the login route owns Convex auth and safe return paths. Shared visual tokens and responsive rules live in `globals.css`. No backend or schema changes are required.

## Accessibility and responsive behavior

- Keep one visible heading per page and preserve the existing form labels.
- Keep keyboard focus rings and `aria-live`/`role="alert"` auth errors.
- On narrow screens, the auth artwork becomes a shallow header image and the form card remains readable without horizontal scrolling.
- Respect reduced-motion preferences for any entrance animation.

## Validation

- Update component tests for CTA destination and authenticated home routing.
- Run the web test suite, lint, typecheck, and production build before committing.
