# Fraud Awareness Hub V1 — Monorepo

Decoupled monorepo migration of the original Next.js Fraud Awareness Hub. An interactive web application that educates users about digital fraud patterns common in Myanmar through games and simulations.

## Structure

```
Fraud_Awarness_Hub_V1/
├── backend/                  # Express API with SQLite + JWT auth
│   ├── server.js             # Express server (port 3001)
│   ├── schema.sql            # SQLite schema + seed data (4 tables)
│   ├── .env.example          # Environment variable template
│   └── package.json
├── frontend-client/          # Public-facing React 19 app (Vite, port 5173)
│   └── src/
│       ├── components/       # UI + feature + layout components
│       ├── lib/              # TanStack Query API, Axios, utils
│       ├── locales/          # i18n translations (EN/MY)
│       └── pages/            # Route pages (4 pages)
├── frontend-admin/           # Admin dashboard React 19 app (Vite, port 5174)
│   └── src/
│       ├── components/       # UI + admin layout + ProtectedRoute
│       ├── lib/              # TanStack Query API, Axios, auth, utils
│       └── pages/            # Login, Dashboard, Admins pages
├── docs/                     # Architecture docs + ADRs
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

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/alerts | List all scam alerts |
| GET | /api/alerts/:id | Get single alert |
| GET | /api/patterns | List all scam patterns |
| GET | /api/patterns/:id | Get single pattern |
| GET | /api/scenarios | List game scenarios |
| GET | /api/scenarios/:id | Get single scenario |
| GET | /api/stats | Get hub stats |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login (returns JWT) |
| GET | /api/auth/me | Current user profile |

### Admin (JWT required)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/alerts | Any auth | Create alert |
| PUT | /api/alerts/:id | Any auth | Update alert |
| DELETE | /api/alerts/:id | Any auth | Delete alert |
| GET | /api/auth/admins | super_admin | List admins |
| POST | /api/auth/admins | super_admin | Create admin |
| DELETE | /api/auth/admins/:id | super_admin | Delete admin |

## Route Mapping

### frontend-client (port 5173)
- `/` → Landing page (Hero + ScamPatternsGrid + CTA)
- `/game` → Phishing or Not? game
- `/simulator` → Scammer Chat Simulator
- `/spot-fake` → Spot the Fake Slip game

### frontend-admin (port 5174)
- `/login` → Login page
- `/` or `/dashboard` → Admin dashboard (CRUD for alerts) — requires auth
- `/admins` → Admin user management — requires super_admin role

## Tech Stack

- **Backend**: Express.js, SQLite3, JWT auth (`jsonwebtoken` + `bcryptjs`), helmet, rate-limiting, Winston logging
- **Frontend**: React 19, Vite 6, Tailwind CSS 4, shadcn/ui, TanStack React Query, Axios, React Router 7
- **Client extras**: i18next (English/Myanmar localization)
- **Admin extras**: JWT auth via React Context, ProtectedRoute guard
- **UI Primitives**: @base-ui/react

## Database

Four SQLite tables (auto-created on first start):
- `admin_users` — admin accounts with bcrypt-hashed passwords and roles
- `scam_alerts` — fraud alerts managed by admins
- `scam_patterns` — reference data for scam types
- `game_scenarios` — quiz scenarios for the phishing game

## Security

- JWT authentication with role-based access control (super_admin, admin)
- bcrypt password hashing (10 rounds)
- Helmet security headers
- Rate limiting (100 requests / 15 min)
- CORS whitelist (localhost:5173, localhost:5174)
- Input validation via express-validator
