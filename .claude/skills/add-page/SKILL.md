---
name: add-page
description: Add a new page to either frontend with proper routing, layout, and navigation
---

# Add Page

Use this skill when adding new pages to the client or admin frontend.

## Steps

1. **Read the existing pages** in `frontend-client/src/pages/` or `frontend-admin/src/pages/`
2. **Read `App.jsx`** to understand routing patterns
3. **Read the layout component** (`PublicLayout.jsx` or `AdminLayout.jsx`) for navigation
4. **Create the page component** in the appropriate `pages/` directory:
   - Use named export: `export function PageName() {}`
   - Follow the project's code style (no semicolons, single quotes, 2-space indent)
   - Keep under ~200 lines
5. **Add route** in `App.jsx`:
   ```jsx
   <Route path="/new-page" element={<NewPage />} />
   ```
6. **Add nav link** in the relevant layout component:
   - Client: `PublicLayout.jsx` nav items array
   - Admin: `AdminLayout.jsx` sidebar links
7. **Verify build**: `npx vite build` in the affected frontend

## Page Template

```jsx
import { SomeIcon } from "lucide-react"

export function NewPage() {
  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="...">
        <h1>Page Title</h1>
      </section>
      
      {/* Content */}
      <section className="...">
        {/* Page content */}
      </section>
    </div>
  )
}
```

## Don'ts

- Don't use Next.js patterns (`page.tsx`, `useRouter` from next)
- Don't use default exports
- Don't forget to add the route before testing
