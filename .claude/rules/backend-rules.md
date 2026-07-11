# Backend Rules

## Express.js Conventions
- Single `server.js` file for now. Split into route files only when it exceeds ~500 lines.
- Use `express.json()` middleware for JSON body parsing.
- CORS must allow `http://localhost:5173` and `http://localhost:5174`.
- All routes prefixed with `/api/`.
- Return proper HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error).

## Database (SQLite)
- Schema lives in `schema.sql`. All changes start here.
- Use `INSERT OR IGNORE` for seed data to be idempotent.
- Use `sqlite3` callback API — NOT promises, NOT better-sqlite3.
- Snake_case column names in DB, camelCase in API responses.
- Convert between the two in the `toCamel()` helper.

## Error Handling
```js
// Always follow this pattern:
db.all('SELECT ...', [], (err, rows) => {
  if (err) return res.status(500).json({ error: err.message })
  res.json(rows.map(toCamel))
})
```

## Adding New Endpoints
1. Add SQL query in `server.js`
2. Use the `toCamel()` helper for response formatting
3. Add corresponding RTK Query endpoint in both frontends' `lib/api.js`
