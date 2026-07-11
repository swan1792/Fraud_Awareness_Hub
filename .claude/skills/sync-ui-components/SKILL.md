---
name: sync-ui-components
description: Keep shadcn UI components in sync between client and admin frontends
---

# Sync UI Components

Use this skill when modifying or adding shadcn UI components.

## Rules

- Both frontends (`frontend-client` and `frontend-admin`) must have identical `components/ui/` files
- Never hand-edit shadcn components — regenerate if possible
- After modifying one copy, copy to the other frontend

## Steps

1. **Identify which frontend** was modified
2. **Copy the changed file(s)** to the other frontend:
   ```bash
   cp frontend-client/src/components/ui/button.jsx frontend-admin/src/components/ui/button.jsx
   ```
3. **Verify both frontends build**:
   ```bash
   cd frontend-client && npx vite build
   cd frontend-admin && npx vite build
   ```

## Adding New shadcn Component

1. **Generate in client**:
   ```bash
   cd frontend-client && npx shadcn@latest add <component-name>
   ```
2. **Copy to admin**:
   ```bash
   cp frontend-client/src/components/ui/<component>.jsx frontend-admin/src/components/ui/
   ```
3. **Verify both build**

## Don'ts

- Don't hand-edit `components/ui/` files — regenerate instead
- Don't forget to sync after changes
- Don't use different versions between frontends
