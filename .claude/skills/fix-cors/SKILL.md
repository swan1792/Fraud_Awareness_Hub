---
name: fix-cors
description: Diagnose and fix CORS issues between frontend and backend
---

# Fix CORS Issues

Use this skill when encountering CORS errors in the browser console.

## Common Causes

1. **Origin not in allowed list** — Backend CORS config doesn't include the frontend's origin
2. **Port mismatch** — Vite auto-increments ports (5174 → 5175) when taken
3. **Protocol mismatch** — `http://localhost` vs `http://127.0.0.1`
4. **Missing preflight** — Non-simple requests need OPTIONS handling

## Steps

1. **Check the error** — Look at the `Access-Control-Allow-Origin` header in the response
2. **Identify the origin** — What URL is the frontend running on?
3. **Read `backend/server.js`** CORS configuration:
   ```javascript
   app.use(cors({
     origin: (origin, callback) => {
       const allowed = [...]
       if (!origin || allowed.includes(origin)) {
         callback(null, true)
       } else {
         callback(new Error('Not allowed by CORS'))
       }
     },
   }))
   ```
4. **Add the missing origin** to the allowed list
5. **Also update `.env.example`** CORS_ORIGINS if needed
6. **Restart the backend** for changes to take effect

## Quick Fix

If the port keeps changing, use a dynamic origin checker:

```javascript
origin: (origin, callback) => {
  if (!origin || origin.match(/^http:\/\/localhost:\d+$/)) {
    callback(null, true)
  } else {
    callback(new Error('Not allowed by CORS'))
  }
}
```

## Don'ts

- Don't use `origin: '*'` in production
- Don't forget to restart the backend after changes
- Don't hardcode ports — use environment variables in production
