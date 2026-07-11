# Fraud Awareness Hub V1 — Monorepo

Decoupled monorepo migration of the original Next.js Fraud Awareness Hub.

## Structure

```
Fraud_Awarness_Hub_V1/
├── backend/                  # Express API with SQLite
│   ├── server.js             # Express server (port 3001)
│   ├── schema.sql            # SQLite schema + seed data
│   └── package.json
├── frontend-client/          # Public-facing React 19 app (Vite, port 5173)
│   └── src/
│       ├── components/       # UI + feature components
│       ├── lib/              # RTK Query API, store, utils
│       └── pages/            # Route pages
├── frontend-admin/           # Admin dashboard React 19 app (Vite, port 5174)
│   └── src/
│       ├── components/       # UI + admin layout
│       ├── lib/              # RTK Query API, store, utils
│       └── pages/            # Dashboard page
└── package.json              # Root scripts with concurrently
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start all three services (backend + both frontends)
npm run dev

# Or start individually:
npm run dev:backend    # Express API on :3001
npm run dev:client     # Public app on :5173
npm run dev:admin      # Admin app on :5174
```

## API Endpoints (backend on port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/alerts | List all scam alerts |
| GET | /api/alerts/:id | Get single alert |
| POST | /api/alerts | Create alert |
| PUT | /api/alerts/:id | Update alert |
| DELETE | /api/alerts/:id | Delete alert |
| GET | /api/patterns | List all scam patterns |
| GET | /api/patterns/:id | Get single pattern |
| GET | /api/scenarios | List game scenarios |
| GET | /api/scenarios/:id | Get single scenario |
| GET | /api/stats | Get hub stats |

## Route Mapping (Next.js → React Router)

### frontend-client (port 5173)
- `/` → Landing page (Hero + ScamPatternsGrid + CTA)
- `/game` → Phishing or Not? game
- `/simulator` → Scammer Chat Simulator
- `/spot-fake` → Spot the Fake Slip game

### frontend-admin (port 5174)
- `/` or `/dashboard` → Admin dashboard (CRUD for alerts)

## Tech Stack

- **Backend**: Express.js, SQLite3 (via `sqlite` and `sqlite3` packages), CORS
- **Frontend**: React 19, Vite 6, Tailwind CSS 4, shadcn/ui, Redux Toolkit + RTK Query, React Router 7
- **UI Primitives**: @base-ui/react
