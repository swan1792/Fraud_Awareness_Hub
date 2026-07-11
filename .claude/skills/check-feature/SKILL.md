---
name: check-feature
description: Check if a feature is fully implemented across backend API, frontend UI, and i18n — identifies gaps and missing pieces
---

# Check Feature

Use this skill when verifying that a feature is complete end-to-end across all services in the Fraud Awareness Hub.

## When to Use

- After implementing a new feature
- Before creating a PR
- When a feature seems partially working
- When reviewing what's left to do

## Checklist

### 1. Backend (Express + SQLite)

- [ ] Route added in `backend/server.js`
- [ ] SQL query uses `toCamel()` for response
- [ ] Proper HTTP status codes (200, 201, 400, 404, 500)
- [ ] Error handling with `if (err) return res.status(500).json(...)`
- [ ] Input validation (if accepting POST/PUT body)
- [ ] Schema changes reflected in `backend/schema.sql`

### 2. API Layer (Frontend)

- [ ] Query hook added in `frontend-client/src/lib/api.js`
- [ ] Hook exported from `api.js`
- [ ] If admin needs it: hook added in `frontend-admin/src/lib/api.js`
- [ ] `queryKey` is correct and unique
- [ ] Cache invalidation configured (if mutation)

### 3. Frontend UI

- [ ] Page component created in `pages/`
- [ ] Route added in `App.jsx`
- [ ] Nav link added in layout (if accessible page)
- [ ] Component uses named export (`export function MyComponent`)
- [ ] No hardcoded API URLs — uses `api.js` hooks
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Empty state handled

### 4. i18n (if text is user-facing)

- [ ] All strings use `t("key")` — no hardcoded English
- [ ] Key added to `src/locales/en.json`
- [ ] Key added to `src/locales/my.json`
- [ ] Interpolation variables match: `t("key", { var: value })`
- [ ] Pluralization handled (if applicable)

### 5. Shared UI Components

- [ ] If modified `components/ui/`, synced to both frontends
- [ ] No new UI library installed (stick with shadcn)

### 6. Build Verification

- [ ] `npx vite build` passes in affected frontend
- [ ] No console errors in dev mode
- [ ] No TypeScript/JSX parse errors

## How to Run the Check

### Quick Check (one service)

```bash
# Backend
cd backend && node -c server.js

# Frontend build
cd frontend-client && npx vite build
cd frontend-admin && npx vite build
```

### Full Check

Ask Claude:
```
Check if the [feature name] feature is fully implemented
across backend, frontend-client, and i18n.
```

## Common Gaps

| Symptom | Likely Missing |
|---|---|
| Page shows "Loading..." forever | API hook not wired or endpoint URL wrong |
| 404 on API call | Route not added in server.js |
| Text stays in English when switching to MY | i18n key missing in my.json |
| `t("some.key")` shows raw key | Key missing in en.json |
| Admin can't see new data | Hook not added to frontend-admin api.js |
| Build fails with "X is not defined" | Missing import or export |

## Verification Commands

```bash
# Check for missing i18n keys (compare en.json vs my.json)
diff <(jq -r 'paths | join(".")' frontend-client/src/locales/en.json | sort) \
     <(jq -r 'paths | join(".")' frontend-client/src/locales/my.json | sort)
```
