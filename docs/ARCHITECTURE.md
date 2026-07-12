# Architecture — Fraud Awareness Hub V1 (Monorepo)

> Last updated: 2026-07-12

## What it is

An interactive web application that educates users about digital fraud patterns common in Myanmar — phishing, scam messages, and suspicious payment slips — through games and simulations. Includes an admin dashboard with JWT authentication for managing fraud alerts and admin users.

Migrated from a single Next.js app into a decoupled monorepo with three independent services.

## Tech Stack

| Layer | Choice | Port |
|---|---|---|
| Backend API | Express.js + SQLite3 + JWT Auth | 3001 |
| Client (Public) | React 19 + Vite + Tailwind 4 + shadcn/ui + TanStack Query + Axios + i18next | 5173 |
| Admin Dashboard | React 19 + Vite + Tailwind 4 + shadcn/ui + TanStack Query + Axios + JWT Auth | 5174 |

## System Diagram

```
┌──────────────────────┐     ┌──────────────────────┐
│  frontend-client     │     │  frontend-admin       │
│  (Public Users)      │     │  (Admin Dashboard)    │
│  React 19 + Vite     │     │  React 19 + Vite      │
│  Port 5173           │     │  Port 5174            │
│  i18n (EN/MY)        │     │  JWT Auth             │
└──────────┬───────────┘     └──────────┬────────────┘
           │                            │
           │     Axios → TanStack Query │
           │                            │
           └────────────┬───────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  backend/       │
              │  Express.js     │
              │  Port 3001      │
              │  CORS: 5173,5174│
              │  helmet, rate   │
              │  limiting, JWT  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  SQLite DB      │
              │  fraud_hub.db   │
              │  (auto-created) │
              └─────────────────┘
```

## Project Structure

```
Fraud_Awarness_Hub_V1/
├── backend/
│   ├── server.js          # Express API (all routes + auth middleware)
│   ├── schema.sql         # DB schema + seed data (4 tables)
│   ├── .env.example       # Environment variable template
│   └── package.json
├── frontend-client/
│   ├── src/
│   │   ├── main.jsx       # Entry + QueryClientProvider + i18n init
│   │   ├── App.jsx        # React Router (4 routes)
│   │   ├── index.css      # Tailwind + shadcn theme
│   │   ├── i18n.js        # i18next configuration (EN/MY)
│   │   ├── lib/
│   │   │   ├── api.js     # TanStack Query hooks (read-only)
│   │   │   ├── axios.js   # Axios instance with interceptors
│   │   │   └── utils.js   # cn() helper
│   │   ├── locales/
│   │   │   ├── en.json    # English translations
│   │   │   └── my.json    # Myanmar translations
│   │   ├── components/
│   │   │   ├── ui/        # shadcn primitives (11 components)
│   │   │   ├── features/  # Business components (6 files)
│   │   │   ├── layout/    # PublicLayout (header + footer)
│   │   │   └── section/   # AnimatedBackground
│   │   └── pages/         # 4 route pages
│   ├── vite.config.js
│   └── package.json
├── frontend-admin/
│   ├── src/
│   │   ├── main.jsx       # Entry + QueryClientProvider + AuthProvider
│   │   ├── App.jsx        # React Router (3 routes + ProtectedRoute)
│   │   ├── index.css      # Tailwind + shadcn theme
│   │   ├── lib/
│   │   │   ├── api.js     # TanStack Query hooks (reads + mutations)
│   │   │   ├── axios.js   # Axios instance with JWT interceptor
│   │   │   ├── auth.jsx   # AuthContext + useAuth hook
│   │   │   └── utils.js   # cn() helper
│   │   ├── components/
│   │   │   ├── ui/        # shadcn primitives (11 components)
│   │   │   ├── layout/    # AdminLayout (sidebar)
│   │   │   └── ProtectedRoute.jsx  # Auth guard
│   │   └── pages/         # 3 route pages
│   ├── vite.config.js
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   └── decisions/
│       ├── 001-use-sqlite-over-postgresql.md
│       └── 002-use-plain-jsx-over-typescript.md
├── .claude/               # Claude Code config (agents, rules, skills)
├── CLAUDE.md              # Project instructions
├── AGENTS.md              # Agent rules
├── README.md              # Project overview
├── working-agreement.md   # Team working agreement
└── package.json           # Root scripts (concurrently)
```

## Database Schema

### admin_users
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | `user-{timestamp}` |
| email | TEXT UNIQUE | Login email |
| password | TEXT | bcrypt hash |
| name | TEXT | Display name |
| role | TEXT | `super_admin` or `admin` (CHECK constraint) |
| created_at | TEXT | ISO datetime |

### scam_alerts
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | `alert-{timestamp}` |
| title | TEXT | Alert title |
| category | TEXT | One of: Fake APK, Phishing Link, Social Engineering |
| description | TEXT | Full description |
| date | TEXT | ISO date string |

### scam_patterns
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | e.g., `fake-kpay-apk` |
| title | TEXT | Pattern name |
| category | TEXT | Same categories as alerts |
| description | TEXT | What this pattern is |
| red_flags | TEXT | JSON array of strings |
| example | TEXT | Example scam message |
| icon | TEXT | Lucide icon name |

### game_scenarios
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | e.g., `game-1` |
| channel | TEXT | SMS, Viber, or Email |
| sender | TEXT | Who the message appears to be from |
| message | TEXT | Full message content |
| is_scam | INTEGER | 0 or 1 |
| explanation | TEXT | Why it's a scam or legit |
| red_flags | TEXT | JSON array of strings |

## API Endpoints

### Public (no auth required)
| Method | Path | Description |
|---|---|---|
| GET | /api/health | Health check |
| GET | /api/alerts | List all alerts (newest first) |
| GET | /api/alerts/:id | Get single alert |
| GET | /api/patterns | List all patterns |
| GET | /api/patterns/:id | Get single pattern |
| GET | /api/scenarios | List all scenarios |
| GET | /api/scenarios/:id | Get single scenario |
| GET | /api/stats | Get hub stats |

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/login | No | Login, returns JWT |
| GET | /api/auth/me | Yes | Current user profile |

### Admin (JWT required)
| Method | Path | Role | Description |
|---|---|---|---|
| POST | /api/alerts | Any auth | Create alert |
| PUT | /api/alerts/:id | Any auth | Update alert |
| DELETE | /api/alerts/:id | Any auth | Delete alert |
| GET | /api/auth/admins | super_admin | List all admins |
| POST | /api/auth/admins | super_admin | Create admin |
| DELETE | /api/auth/admins/:id | super_admin | Delete admin |

## Authentication

- **JWT-based** with `jsonwebtoken` + `bcryptjs`
- Tokens stored in `localStorage` (`auth_token`)
- Admin Axios interceptor attaches `Authorization: Bearer <token>` header
- 401 responses clear token and redirect to `/login`
- Two roles: `super_admin` (full access) and `admin` (alert CRUD only)
- Passwords hashed with bcrypt (10 rounds)

## Security Middleware

- **helmet** — sets security-related HTTP headers
- **express-rate-limit** — 100 requests per 15-minute window
- **CORS** — whitelist of `http://localhost:5173` and `http://localhost:5174`
- **express-validator** — input validation on POST/PUT routes
- **Winston** — structured logging (replaces console.log)
- **Morgan** — HTTP request logging

## Internationalization (Client only)

- **i18next** + **react-i18next** + **i18next-browser-languagedetector**
- Two locales: English (`en`) and Myanmar/Burmese (`my`)
- Detection: localStorage → browser navigator → fallback to English
- Language toggle in the public header
- Admin dashboard is English-only

## Key Design Decisions

1. **Decoupled services** — Backend and frontends are fully independent. Each can be developed, deployed, and scaled separately.
2. **SQLite over PostgreSQL** — Zero-config for local dev. No Docker needed. Can migrate to PostgreSQL later by swapping the driver.
3. **TanStack Query + Axios** — Automatic caching, invalidation, loading states via TanStack Query. Axios interceptors handle auth, error normalization, and cross-cutting concerns.
4. **Plain JSX over TypeScript** — Faster iteration for educational project. Types documented via JSDoc where helpful.
5. **Shared UI components** — Both frontends use identical shadcn primitives. Keep in sync manually.
6. **JWT authentication** — Stateless auth with bcrypt password hashing. Role-based access control (super_admin, admin).

## Future Work

- Add more game scenarios and interactive content
- Add more languages (extend i18n beyond EN/MY)
- Swap SQLite for PostgreSQL in production
- Add CI/CD pipeline
- Add API documentation (OpenAPI/Swagger)
- Add unit and integration tests
