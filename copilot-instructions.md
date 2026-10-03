# Copilot / Claude Code Instructions — Galero

## Project Overview

Galero is a Romanian football team and tournament management web application. It is built as an Astro 5 server-rendered (SSR) application deployed with the Netlify adapter, featuring React 19 interactive islands, TypeScript, Tailwind CSS, Supabase (Auth, RLS, & Data Access), and PWA support.

## Core Working Rules

- **Read Before Write:** Read relevant routes, components, services, hooks, and type definitions before modifying behavior.
- **Scope Control:** Keep changes focused. Preserve existing public APIs, route paths, Romanian user-facing copy, and visual patterns unless explicitly instructed otherwise.
- **Single Source of Truth:** Prefer existing helpers and services in `src/services/` over creating redundant data-access or authentication utility functions.
- **Strict TypeScript:** Avoid `any`, unchecked casts (`as Type`), and duplicate type definitions. Use `src/lib/types.ts` or `packages/shared/`.
- **Dependency Guard:** Do not add external npm packages unless existing primitives cannot solve the problem. Always update `package.json` and `package-lock.json` together.
- **Git Hygiene:** Do not commit, reset, or discard uncommitted user changes in the working directory.
- **Secret Safety:** Never expose `SUPABASE_SERVICE_ROLE_KEY` or any server-only environment variables to client bundle/islands (`PUBLIC_` prefix only for public keys).

## Architecture Conventions & Path Aliases

- **Astro Pages (`src/pages/`):** Own routing, server-side data fetching (SSR), and initial page composition.
- **React Islands (`src/components/`):** Interactive UI elements. Ensure browser-only APIs (`window`, `localStorage`, `document`) are guarded inside `useEffect` or client-only paths to prevent SSR crashes.
- **Shared Logic:**
  - Business & Supabase queries $\rightarrow$ `src/services/`
  - React Hooks $\rightarrow$ `src/hooks/`
  - Types & Interfaces $\rightarrow$ `src/lib/types.ts` (or `@shared/...` if applicable)
  - Helper Functions $\rightarrow$ `src/lib/`
- **API Endpoints (`src/pages/api/`):** Handle server-side mutations and webhooks. Always validate request input, return standard HTTP status codes, and return JSON responses formatted as `{ data?, error? }`.
- **Auth & Middleware (`src/middleware.ts`):** Enforce authentication and role-based access control (RBAC) on the server side. Admin functionality must be validated in server code/API routes, not just visually hidden in React components.
- **Supabase Clients:**
  - Client-side / React Islands $\rightarrow$ Use browser-safe Supabase client (`src/lib/supabaseClient.ts` or similar).
  - Server-side / API / Astro SSR $\rightarrow$ Use server-safe client or `src/lib/supabaseAdmin.ts` for privileged operations.

## Security and Data Integrity

- **Zero Trust:** Treat all form data, URL params, headers, and query strings as untrusted inputs.
- **Row Level Security (RLS):** Rely on Supabase RLS policies for database queries. Never bypass RLS with service-role credentials unless the operation strictly requires elevated admin privileges.
- **Auth Flow:** Maintain PKCE flow integrity and proper cookie handling when modifying auth routes (`login`, `callback`, `logout`, `refresh`).
- **Data Privacy:** Never log passwords, tokens, API keys, or sensitive personal data to console/logs.
- **UI States:** Always implement loading, empty, error, and unauthorized states gracefully.

## Frontend & Styling Guidelines

- **Design System:** Use design tokens and CSS variables from `src/styles/global.css` alongside Tailwind CSS.
- **Reusable UI:** Reuse existing UI components (`Button`, `AlertDialog`, Modals, Navbars) before creating new UI primitives.
- **Language & i18n:** Preserve Romanian for all UI strings and error messages. Do not introduce English translations into Romanian UI flows.
- **Accessibility (a11y):** Include accessible aria-labels, keyboard navigation (`Tab`, `Esc`, `Enter`), clear focus states, and visible form validation messages.
- **Optimistic UI:** Avoid optimistic state updates unless rollback/error-handling mechanics are explicitly implemented.

## Validation & Verification Steps

Run checks in the following order after making changes:

```powershell
# 1. Type check Astro and TypeScript files
npm run check

# 2. Verify production build
npm run build
```
