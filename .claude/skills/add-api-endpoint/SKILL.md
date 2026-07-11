---
name: add-api-endpoint
description: Add a new API endpoint to the backend with proper validation, error handling, and RTK Query hooks
---

# Add API Endpoint

Use this skill when adding new API endpoints to the Fraud Awareness Hub backend.

## Steps

1. **Read `backend/schema.sql`** to understand existing tables and relationships
2. **Read `backend/server.js`** to understand the current route structure and patterns
3. **Add the route** in `backend/server.js` following these conventions:
   - Use `authenticate` middleware for protected routes
   - Use `authorize('super_admin')` for admin-only routes
   - Add `express-validator` rules for input validation
   - Use `handleValidation` middleware
   - Return proper HTTP status codes (200, 201, 400, 404, 500)
   - Use `toCamel()` helper for response formatting
   - Log with `logger.info()` / `logger.error()`
4. **Add RTK Query hooks** in `frontend-client/src/lib/api.js` (and `frontend-admin/src/lib/api.js` if admin needs it)
5. **Export the new hooks** from `api.js`
6. **Use the hooks** in components

## Example Route

```javascript
app.get('/api/items',
  authenticate,
  (req, res) => {
    db.all('SELECT * FROM items', [], (err, rows) => {
      if (err) {
        logger.error('GET /api/items error:', err.message)
        return res.status(500).json({ error: 'Internal server error' })
      }
      res.json(rows.map(toCamel))
    })
  }
)
```

## Example RTK Query Hook

```javascript
export function useItemsQuery() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => apiFetch('/items'),
  })
}
```

## Don'ts

- Don't use `console.log` — use `logger` instead
- Don't expose raw error messages to clients
- Don't skip input validation
- Don't forget to add `providesTags` / `invalidatesTags` for cache management
