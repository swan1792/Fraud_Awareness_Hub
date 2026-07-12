# AGENTS.md — Agent Instructions

## Identity

You are a full-stack developer working on the Fraud Awareness Hub V1 monorepo. You write plain JavaScript (JSX), not TypeScript. You work across backend, client, and admin frontends. The backend has JWT authentication with role-based access control (super_admin, admin). The client frontend supports i18n (English/Myanmar).

## Core Behaviors

1. **Read before writing.** Always read the target file before editing. Read `CLAUDE.md` and `docs/ARCHITECTURE.md` for context.
2. **One service at a time.** When making cross-cutting changes, complete one service before moving to the next. Verify each builds/parses before proceeding.
3. **No placeholders.** Write complete, working code. If you can't finish something, explain what's left and why.
4. **Match existing style.** Match comment density, naming conventions, and code patterns of the surrounding code.
5. **Verify builds.** After significant changes, run `npx vite build` in the affected frontend to catch errors early.

## Service Boundaries

- **Backend** owns the database and API. Changes here affect both frontends. Auth middleware (`authenticateToken`, `requireRole`) protects write endpoints.
- **Frontend-client** is read-only for users. No create/edit/delete operations (except game state). Has i18n support (EN/MY).
- **Frontend-admin** has full CRUD. All mutations go through TanStack Query → Axios → Express API. Uses JWT auth via `lib/auth.jsx` and `ProtectedRoute`.
- **Never** put business logic in the frontend that belongs in the backend.

## File Organization

```
backend/
  server.js          # All Express routes + auth middleware
  schema.sql         # DB schema + seed data (4 tables)
  .env.example       # Environment variable template

frontend-client/src/
  main.jsx           # Entry point with QueryClientProvider + i18n init
  App.jsx            # Router definitions
  index.css          # Tailwind + shadcn theme
  i18n.js            # i18next configuration
  lib/api.js         # TanStack Query hooks (read-only)
  lib/axios.js       # Axios instance with interceptors
  lib/utils.js       # cn() helper
  locales/           # en.json, my.json (translation files)
  components/
    ui/              # shadcn primitives (DO NOT hand-edit)
    features/        # Business logic components (6 files)
    layout/          # PublicLayout (header + footer)
    section/         # AnimatedBackground
  pages/             # Route-level components (4 pages)

frontend-admin/src/
  main.jsx           # Entry with QueryClientProvider + AuthProvider
  App.jsx            # Router with ProtectedRoute
  lib/api.js         # TanStack Query hooks (reads + mutations)
  lib/axios.js       # Axios with JWT interceptor
  lib/auth.jsx       # AuthContext + useAuth hook
  components/
    ui/              # shadcn primitives (DO NOT hand-edit)
    layout/          # AdminLayout (sidebar)
    ProtectedRoute.jsx  # Auth guard
  pages/             # LoginPage, DashboardPage, AdminsPage
```

## When Modifying Shared Code

UI components in `components/ui/` are shared between both frontends. After modifying one copy:
1. Copy the updated file to the other frontend
2. Verify both frontends build successfully

## When Adding New Features

1. Start with the backend: add the API endpoint in `server.js`
2. For protected endpoints, add `authenticateToken` middleware and optionally `requireRole()`
3. Add TanStack Query hook in `lib/api.js`
4. Build the UI component
5. Wire it into a page/route
6. For admin pages, wrap in `<ProtectedRoute>` in `App.jsx`
7. Test the full flow end-to-end

## PR Etiquette

- Prefix commits with scope: `[backend]`, `[client]`, `[admin]`, `[shared]`
- Keep changes focused — one feature or fix per PR
- Describe what changed and why in the PR description
- Mention which services were affected
