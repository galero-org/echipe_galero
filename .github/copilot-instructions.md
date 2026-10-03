# Copilot Instructions

## Repository Overview

Galero is a Romanian football application for organizing players, tournament editions, confirmations, team generation, matches, and statistics. It is a small-to-medium Astro 5 project using TypeScript, React 19 islands, Tailwind CSS 3, Supabase (`@supabase/supabase-js`), and `vite-plugin-pwa`. It runs on Node.js 20 in production and uses the Netlify adapter with server output.

The root application is the deployable project. `packages/shared/` is a separate, small TypeScript package with its own `build` and `dev` scripts, but it is not wired into the root `package.json` scripts. There is no workspace declaration or root lockfile. Do not assume this is a monorepo with npm workspaces.

## Start Here

- `src/pages/`: Astro routes, dynamic pages, and API endpoints under `src/pages/api/`.
- `src/components/`: React islands and reusable UI, grouped by feature (`players`, `editii`, `confirmari`, `admin`, `profile`).
- `src/services/`: Supabase-backed business/data operations (`playersService.ts`, `editionService.ts`, `confirmariService.ts`).
- `src/hooks/`: client-side data fetching and feature state.
- `src/lib/`: auth, Supabase clients, domain types, and team-generation logic.
- `src/middleware.ts`: session loading, auth redirects, auth-cookie refresh, and admin-route authorization.
- `src/layouts/Layout.astro` and `src/styles/global.css`: shared page shell and design tokens.
- `astro.config.mjs`: SSR, React, Tailwind, Netlify, and PWA configuration.
- `tsconfig.json`: Astro strict TypeScript configuration with React JSX.
- `tailwind.config.js`: content globs, CSS-variable colors, and project font aliases.
- `netlify.toml`: Node 20, `npm run build`, `dist` publish directory, and local dev settings.
- `src/env.d.ts`: typed `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `App.Locals` declarations.
- `supabase_*.sql`: manual database migration/helper SQL; inspect before changing persistence behavior.
- `AUTH_MIGRATION_PLAN.md`: authentication migration context.

Use existing services, hooks, types, UI components, and auth helpers before introducing new abstractions. Keep user-facing text in Romanian and preserve established route names and CSS variables.

## Development and Validation

Run commands from the repository root. PowerShell, Bash, or a normal CI shell is sufficient.

### Prerequisites and bootstrap

- Always use Node.js 20.x, matching `netlify.toml`. npm is the package manager implied by `package.json`.
- Run `npm install` when dependencies are absent or `package.json` changes. The repository currently has installed dependencies but no root lockfile, so do not invent a lockfile-only workflow.
- Required runtime configuration is `SUPABASE_URL` and `SUPABASE_ANON_KEY`; local development may also need the Supabase project values used by the existing deployment. `.env` and `.env.production` are ignored and must never be committed.
- `start-dev.bat` contains a developer-specific worktree path and is not portable. Start from the current repository root with `npm run dev` instead.

### Commands

| Purpose              | Command                                  | Observed result                                                                                                                                                                                         |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Development server   | `npm run dev`                            | Astro dev server; default Astro port is 4321. Netlify local config requests port 3000. This is a long-running command.                                                                                  |
| Production build     | `npm run build`                          | **Passes**. Builds SSR output into `dist/` with the Netlify adapter and generates the PWA service worker. A clean build took about 23 seconds in this environment.                                      |
| Astro diagnostics    | `npm run astro -- check`                 | Runs successfully as a command but currently reports pre-existing errors and warnings. Do not claim type-clean status until these are fixed.                                                            |
| Astro CLI            | `npm run astro ...`                      | Use for Astro commands, for example `npm run astro -- --help`.                                                                                                                                          |
| Preview              | `npm run preview`                        | Serves the existing `dist/` build; run `npm run build` first after source changes.                                                                                                                      |
| Shared package build | `npm --prefix packages/shared run build` | TypeScript build for `packages/shared/`; run only when that package changes.                                                                                                                            |
| Smoke tests          | `npm run test:smoke`                     | Runs the Playwright Chromium smoke suite in `tests/smoke/`; starts Astro automatically at `127.0.0.1:4321`. No Supabase credentials are required for the current unauthenticated coverage.              |
| Integration tests    | `npm run test:integration`               | Runs `tests/integration/authenticated-auth.spec.ts` with a dedicated Supabase test account. Requires `SUPABASE_TEST_EMAIL` and `SUPABASE_TEST_PASSWORD` in the shell; never use production credentials. |
| Tests                | No unit suite yet                        | `tests/smoke/auth.spec.ts` covers public auth screens and unauthenticated guards. `test-randomization.ts` remains a manual script and its suggested `npx ts-node` runner is not a declared dependency.  |
| Lint/format          | No scripts or configuration found        | No repository lint or format gate is configured. Preserve local style and use the Astro check/build as available validation.                                                                            |

For a normal source change, run the narrowest relevant check first, then run `npm run test:smoke` and always run `npm run build` before handing off when practical. For route, API, auth, or data changes, manually exercise success, validation failure, empty-data, expired-session, and unauthorized cases when the required Supabase environment is available.

The confirmed baseline is that `npm run build` passes. `npm run astro -- check` currently reports errors including an optional `user_role`, API-context typing mismatches in `requireAuthAndRole`, and inferred parser-error types in `src/pages/api/players.ts`; it also reports unused imports/variables. These findings predate onboarding and are not evidence that an unrelated change caused them. Do not weaken strict typing to silence them.

There are no `.github/workflows/` files in this repository, so no repository-defined GitHub Actions pipeline was found. Netlify's configured build is `npm run build` with `dist` as the publish directory. Generated `dist/`, `.astro/`, and `.netlify/` content is ignored; do not edit or commit it.

Authentication test setup, Supabase test-project configuration, and Google OAuth limitations are documented in `docs/testing-auth.md`.

## Architecture and Safety Rules

- Astro pages own server-side composition and routing; React components are interactive islands. Keep browser-only APIs in client-side code paths.
- `src/middleware.ts` populates `context.locals.user` and `profile`, refreshes auth cookies, redirects unauthenticated users, and protects admin paths. Preserve this flow when changing auth.
- Use `src/lib/supabase.ts` for browser-safe operations. Keep service-role/admin access isolated in `src/lib/supabaseAdmin.ts` and server-only code. Never expose service-role keys or tokens to the client or logs.
- API handlers must validate input, enforce authentication and authorization server-side, return meaningful HTTP status codes, and use the existing JSON response style. UI-only role hiding is not security.
- Prefer Supabase Row Level Security and existing service methods. Do not duplicate database access in components.
- Keep shared types in the existing type modules and avoid `any`, unsafe casts, and silently changing public data shapes.
- Treat all request bodies, route parameters, query strings, and database values as untrusted. Do not log passwords, access tokens, refresh tokens, or secrets.
- Preserve responsive behavior, accessible labels/focus/keyboard behavior, and loading/error/empty states. Reuse existing shared components such as `Button` and `AlertDialog`.
- Do not add dependencies, migrations, routes, or broad refactors unless the task requires them. Keep unrelated user changes intact.

Trust these instructions and search the repository only when a detail here is incomplete, stale, or contradicted by the code. When that happens, update the implementation based on the nearest owning module and report the discrepancy.
