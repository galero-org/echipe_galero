# Auth migration plan for smooth PWA behavior

## Goal
Create a stable, low-risk authentication flow for this Astro + Supabase app that works well in a PWA and supports long-lived sessions without breaking the app.

## What I found
- The current auth setup mixes several strategies at once: cookies, server middleware, session storage helpers, and refresh handling.
- Some session-related imports are missing, which is why the build currently fails.
- For a PWA, the safest model is: one source of truth on the server, short-lived access tokens in secure cookies, and refresh logic that runs only when needed.
- Avoid making localStorage or IndexedDB the primary session store for login state.

## Migration principles
1. Keep the change small and staged.
2. Do not rewrite the whole auth system in one pass.
3. Keep the UI and routes stable while the underlying auth flow is improved.
4. Use one canonical auth helper for sign-in, sign-out, refresh, and session validation.
5. Test each phase before moving to the next.

## Recommended target architecture
- Server-side session authority: use Supabase auth with secure httpOnly cookies.
- Access token: stored in an httpOnly cookie and used for server validation.
- Refresh token: stored in an httpOnly cookie and used only by the server.
- Session refresh: performed on protected requests or on a dedicated refresh endpoint, not by random client-side logic.
- PWA-safe behavior: session survives reloads and app restarts, but does not depend on fragile browser storage as the primary source of truth.

## Phase 1 — Stabilize the current build
Scope: 2 files max

Files to touch:
- [src/pages/api/auth/signout.ts](src/pages/api/auth/signout.ts)
- [src/middleware.ts](src/middleware.ts)

What to do:
- Remove the broken dependency on the missing session helper imports.
- Make sign-out and middleware cleanup resilient.
- Keep the rest of the app unchanged.

Why first:
- This removes the current blocker and makes the app build again before we do any deeper auth changes.

## Phase 2 — Introduce one canonical auth helper
Scope: 1 new file + 2 existing auth route files

New file:
- [src/lib/auth/session.ts](src/lib/auth/session.ts)

Existing files to update:
- [src/pages/api/auth/signin.ts](src/pages/api/auth/signin.ts)
- [src/pages/api/auth/callback.ts](src/pages/api/auth/callback.ts)

What to do:
- Create one helper that handles:
  - sign-in with email/password
  - OAuth callback handling
  - cookie write/read/delete
  - refresh token handling
  - session validation
- Keep the existing route endpoints as thin wrappers.

Why this matters:
- All auth behavior becomes predictable and easier to test.
- Later changes will be much safer because they will not be scattered across files.

## Phase 3 — Simplify middleware and protected routes
Scope: 2 files max

Files to touch:
- [src/middleware.ts](src/middleware.ts)
- [src/pages/signin.astro](src/pages/signin.astro)

What to do:
- Make middleware rely only on the canonical helper for session validation.
- Redirect users to the login page only when the session is truly invalid or missing.
- Avoid trying multiple recovery strategies in parallel.

Why this matters:
- This is the part that improves stability for long sessions and reloads.
- It prevents the app from getting into confusing auth states.

## Phase 4 — Add refresh-on-demand for long sessions
Scope: 1 optional file + 1 route

Files to touch:
- [src/pages/api/auth/refresh.ts](src/pages/api/auth/refresh.ts) (new)
- [src/middleware.ts](src/middleware.ts)

What to do:
- Add a dedicated refresh endpoint that uses the refresh token to renew the session.
- Call it only when the access token is near expiry or when the session is being revalidated.
- Keep the logic server-side and silent.

Why this matters:
- This is the main improvement for smoother long-session behavior in PWAs.
- It avoids client-side login loops and reduces auth flicker.

## Phase 5 — Optional PWA polish
Scope: 1 small change

Files to touch:
- [src/components/UserProfileCard.tsx](src/components/UserProfileCard.tsx) or any client component that reads auth state

What to do:
- Keep client-side auth checks minimal.
- Only use the user information already provided by the server.
- Avoid doing full auth logic in the browser.

## What to avoid
- Do not replace the whole auth flow in one commit.
- Do not rely on localStorage or IndexedDB as the main login store.
- Do not add new auth libraries unless absolutely necessary.
- Do not change all pages and components at once.

## Suggested test order
1. Build the app after Phase 1.
2. Test login with email/password.
3. Test refresh after leaving the tab open for a while.
4. Test reload and reopen in the PWA.
5. Test logout and sign-in again.

## Recommended rollout
- Implement one phase, run the build, test it, and only then continue.
- Keep each phase isolated so any issue is easy to trace.
- If one phase fails, stop there and fix only that part.
