# Backend Rules

## Express.js Conventions
- Single `server.js` file for now. Split into route files only when it exceeds ~500 lines.
- Use `express.json()` middleware for JSON body parsing.
- CORS must allow `http://localhost:5173` and `http://localhost:5174`.
- All routes prefixed with `/api/`.
- Return proper HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error).

## Authentication & Authorization
- JWT-based auth with `jsonwebtoken` + `bcryptjs`.
- Use `authenticateToken` middleware for protected routes.
- Use `requireRole('super_admin')` for admin-only routes.
- Passwords hashed with bcrypt (10 rounds).
- Token expiry: 24 hours (configurable via `JWT_EXPIRES_IN` env var).

## Security Middleware
- `helmet` — security headers (enabled by default).
- `express-rate-limit` — 100 requests per 15-minute window.
- `express-validator` — input validation on POST/PUT routes. Use `handleValidation` helper.
- `winston` — structured logging. Use `logger` instead of `console.log`.
- `morgan` — HTTP request logging (combined format).

## Database (SQLite)
- Schema lives in `schema.sql`. All changes start here.
- Use `INSERT OR IGNORE` for seed data to be idempotent.
- Use `sqlite3` callback API — NOT promises, NOT better-sqlite3.
- Snake_case column names in DB, camelCase in API responses.
- Convert between the two in the `toCamel()` helper.
- WAL mode enabled for better concurrent read performance.

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
3. For protected routes, add `authenticateToken` middleware
4. For admin-only routes, add `requireRole('super_admin')` middleware
5. Add input validation with `express-validator` where needed
6. Log errors with `logger.error()` instead of `console.log()`
7. Add corresponding TanStack Query hook in both frontends' `lib/api.js`
