# CLAUDE.md — Fraud Awareness Hub V1

@AGENTS.md
@docs/ARCHITECTURE.md
@working-agreement.md

## Project Overview

Decoupled monorepo for the Digital Fraud Pattern & Awareness Hub. Migrated from a single Next.js app into three independent services:

- **backend/** — Express.js REST API with SQLite + JWT auth (port 3001)
- **frontend-client/** — Public-facing React 19 SPA with i18n (Vite, port 5173)
- **frontend-admin/** — Admin dashboard React 19 SPA with JWT auth (Vite, port 5174)

## Quick Start

```bash
npm run install:all    # install all dependencies
npm run dev            # start all 3 services via concurrently
npm run dev:backend    # backend only
npm run dev:client     # client only
npm run dev:admin      # admin only
```

## Architecture Rules

### Backend (Express + SQLite + JWT)
- All API routes live in `backend/server.js`. Keep it as a single file until it exceeds ~500 lines, then split into `backend/routes/`.
- Database schema is in `backend/schema.sql`. Any schema change MUST be reflected here first.
- Seed data lives in the same `schema.sql` file using `INSERT OR IGNORE` to be idempotent.
- Use `sqlite3` (callback API) — NOT `better-sqlite3` or `sql.js`.
- CORS must allow origins `http://localhost:5173` and `http://localhost:5174`.
- API base URL is `http://localhost:3001/api`. Both frontends reference this via the Axios instance in `lib/axios.js`.
- JWT auth: tokens via `POST /api/auth/login`, middleware checks `Authorization: Bearer` header.
- Roles: `super_admin` (full access) and `admin` (alert CRUD only).
- Security: `helmet`, `express-rate-limit`, `express-validator`, `winston` logging.

### Frontend (React 19 + Vite + Tailwind + shadcn)
- Both frontends share the same UI components (`components/ui/`) and lib (`lib/`).
- UI components are plain JSX (not TypeScript) — use `.jsx` extension.
- Server state: TanStack React Query for caching, invalidation, loading states.
- HTTP client: Axios with interceptors configured in `lib/axios.js`. Never use raw `fetch`.
- Data fetching: ONLY through TanStack Query hooks in `lib/api.js`. Never fetch directly in components.
- Routing: React Router v7. No Next.js patterns (no `"use client"`, no `useRouter` from next).
- Styling: Tailwind CSS 4 utility classes + shadcn/ui primitives. No CSS modules, no styled-components.
- Path alias: `@/` maps to `src/` (configured in `vite.config.js`).
- Client has i18n via `i18next` (EN/MY locales in `locales/`). Admin is English-only.
- Admin has JWT auth via `lib/auth.jsx` (React Context + localStorage). Protected routes use `ProtectedRoute` component.

### Component Rules
- Feature components go in `components/features/`.
- Shared UI primitives go in `components/ui/` (shadcn-generated, do not hand-edit).
- Layout components go in `components/layout/`.
- Section-level visual components go in `components/section/` (e.g., `animated-background.jsx`).
- Page components go in `pages/`.
- Auth components (e.g., `ProtectedRoute`) go in `components/`.
- Never import from `@/components/ui/` inside another `@/components/ui/` file (causes circular deps).

### Data Flow
```
SQLite DB → Express API → Axios → TanStack Query → React Component
```
- Backend owns the data. Frontends are pure consumers.
- Static data (scam patterns, game scenarios) is seeded in the DB, not hardcoded in frontend.
- The only exception: `hubStats` is a simple GET endpoint returning static JSON.

### Auth Flow
```
Login Form → POST /api/auth/login → JWT token → localStorage → Axios interceptor → Protected API calls
```
- Admin login returns a JWT stored in `localStorage` (`auth_token`).
- Axios request interceptor attaches `Authorization: Bearer <token>` to all admin requests.
- 401 responses clear the token and redirect to `/login`.
- `AuthProvider` (React Context) wraps the admin app, exposing `useAuth()` hook.

## Code Style

- **No TypeScript** in V1 monorepo. All `.jsx` files. Types are documented via JSDoc comments where helpful.
- **No semicolons** (match existing codebase style).
- **Single quotes** for strings.
- **2-space indentation**.
- **No default exports for components** — use named exports (e.g., `export function HeroSection()`).
- Keep components under ~200 lines. Split into sub-components if larger.

## Git Workflow

- Branch naming: `feat/short-description`, `fix/short-description`, `chore/short-description`.
- PR titles: `[client] Fix login button` or `[backend] Add rate limiting`.
- Prefix PR titles with the affected scope: `[backend]`, `[client]`, `[admin]`, `[shared]`, `[infra]`.
- No direct pushes to `main`. All changes go through PRs.
- Keep commits atomic — one logical change per commit.

## Common Tasks

### Add a new API endpoint
1. Add route in `backend/server.js`
2. Add TanStack Query hook in `frontend-client/src/lib/api.js` (and `frontend-admin/src/lib/api.js` if admin needs it)
3. Export the new hook from `api.js`
4. Use the hook in the component

### Add a new protected API endpoint
1. Add route in `backend/server.js` with `authenticateToken` middleware
2. Optionally add role check with `requireRole('super_admin')` for admin-only routes
3. Add TanStack Query hook in `frontend-admin/src/lib/api.js`
4. The Axios interceptor automatically attaches the JWT token

### Add a new page
1. Create page component in `frontend-client/src/pages/` (or `frontend-admin/src/pages/`)
2. Add route in `frontend-client/src/App.jsx` (or `frontend-admin/src/App.jsx`)
3. Add nav link in the relevant layout component
4. For admin pages requiring auth, wrap in `<ProtectedRoute>` in `App.jsx`

### Add a new Axios interceptor
1. Edit `lib/axios.js` in the relevant frontend
2. Add request or response interceptor to the `apiClient`
3. Common use cases: auth headers, error normalization, request logging, retry logic

### Add a new shadcn component
1. Copy an existing component from `frontend-client/src/components/ui/` as reference
2. Or generate via `npx shadcn@latest add <component>` in the relevant frontend
3. Keep both frontends in sync — copy to admin after adding to client

### Modify database schema
1. Update `backend/schema.sql` — add columns/tables with migration-safe SQL
2. Update `server.js` endpoints that use the changed tables
3. Update TanStack Query hooks in `lib/api.js` if response shape changed
4. Delete `backend/fraud_hub.db` and restart to re-seed

## Environment Variables

Backend uses `dotenv` with `.env.example` as template. For local development:
- Backend port: `3001` (in `server.js`)
- Client port: `5173` (in `vite.config.js`)
- Admin port: `5174` (in `vite.config.js`)
- API URL: `http://localhost:3001/api` (in `lib/api.js`)
- JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD — see `backend/.env.example`

When deploying, these MUST be externalized. Do not hardcode production URLs.

## Testing

No test framework configured yet. When adding tests:
- Backend: use `node:test` (built-in) or `vitest`
- Frontend: use `vitest` + `@testing-library/react`
- Test files live next to source: `component.test.jsx`

## Don'ts

- Do NOT use Next.js patterns (no `page.tsx`, no `layout.tsx` convention, no `useRouter` from next)
- Do NOT add TypeScript — keep it plain JS/JSX for V1
- Do NOT install new UI libraries — stick with shadcn/ui + Tailwind
- Do NOT hardcode API URLs in components — always use the Axios instance from `lib/axios.js`
- Do NOT commit `node_modules/`, `dist/`, or `*.db` files
- Do NOT modify shadcn `components/ui/` files directly — regenerate if needed
