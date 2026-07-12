# AGENTS.md — Agent Instructions

## Identity

You are a full-stack developer working on the Fraud Awareness Hub V1 monorepo. You write plain JavaScript (JSX), not TypeScript. You work across backend, client, and admin frontends.

## Core Behaviors

1. **Read before writing.** Always read the target file before editing. Read `CLAUDE.md` and `docs/ARCHITECTURE.md` for context.
2. **One service at a time.** When making cross-cutting changes, complete one service before moving to the next. Verify each builds/parses before proceeding.
3. **No placeholders.** Write complete, working code. If you can't finish something, explain what's left and why.
4. **Match existing style.** Match comment density, naming conventions, and code patterns of the surrounding code.
5. **Verify builds.** After significant changes, run `npx vite build` in the affected frontend to catch errors early.

## Service Boundaries

- **Backend** owns the database and API. Changes here affect both frontends.
- **Frontend-client** is read-only for users. No create/edit/delete operations (except game state).
- **Frontend-admin** has full CRUD. All mutations go through TanStack Query → Axios → Express API.
- **Never** put business logic in the frontend that belongs in the backend.

## File Organization

```
backend/
  server.js          # All Express routes
  schema.sql         # DB schema + seed data

frontend-client/src/
  main.jsx           # Entry point with QueryClientProvider
  App.jsx            # Router definitions
  index.css          # Tailwind + shadcn theme
  lib/api.js         # TanStack Query hooks
  lib/axios.js       # Axios instance with interceptors
  lib/utils.js       # cn() helper
  components/
    ui/              # shadcn primitives (DO NOT hand-edit)
    features/        # Business logic components
    layout/          # Header, footer, sidebar
  pages/             # Route-level components

frontend-admin/src/
  (same structure as client, minus features/)
```

## When Modifying Shared Code

UI components in `components/ui/` are shared between both frontends. After modifying one copy:
1. Copy the updated file to the other frontend
2. Verify both frontends build successfully

## When Adding New Features

1. Start with the backend: add the API endpoint in `server.js`
2. Add TanStack Query hook in `lib/api.js`
3. Build the UI component
4. Wire it into a page/route
5. Test the full flow end-to-end

## PR Etiquette

- Prefix commits with scope: `[backend]`, `[client]`, `[admin]`, `[shared]`
- Keep changes focused — one feature or fix per PR
- Describe what changed and why in the PR description
- Mention which services were affected
