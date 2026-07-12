# Architecture — Fraud Awareness Hub V1 (Monorepo)

> Last updated: 2026-07-12

## What it is

An interactive web application that educates users about digital fraud patterns common in Myanmar — phishing, scam messages, and suspicious payment slips — through games and simulations. Includes an admin dashboard for managing fraud alerts.

Migrated from a single Next.js app into a decoupled monorepo with three independent services.

## Tech Stack

| Layer | Choice | Port |
|---|---|---|
| Backend API | Express.js + SQLite3 | 3001 |
| Client (Public) | React 19 + Vite + Tailwind 4 + shadcn/ui + TanStack React Query + Axios | 5173 |
| Admin Dashboard | React 19 + Vite + Tailwind 4 + shadcn/ui + TanStack React Query + Axios | 5174 |

## System Diagram

```
┌──────────────────────┐     ┌──────────────────────┐
│  frontend-client     │     │  frontend-admin       │
│  (Public Users)      │     │  (Admin Dashboard)    │
│  React 19 + Vite     │     │  React 19 + Vite      │
│  Port 5173           │     │  Port 5174            │
└──────────┬───────────┘     └──────────┬────────────┘
           │                            │
           │  TanStack Query → Axios    │
           │                            │
           └────────────┬───────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  backend/       │
              │  Express.js     │
              │  Port 3001      │
              │  CORS: 5173,5174│
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
│   ├── server.js          # Express API (all routes)
│   ├── schema.sql         # DB schema + seed data
│   └── package.json
├── frontend-client/
│   ├── src/
│   │   ├── main.jsx       # Entry + QueryClientProvider
│   │   ├── App.jsx        # React Router
│   │   ├── index.css      # Tailwind + shadcn theme
│   │   ├── lib/
│   │   │   ├── api.js     # TanStack Query hooks
│   │   │   ├── axios.js   # Axios instance with interceptors
│   │   │   └── utils.js   # cn() helper
│   │   ├── components/
│   │   │   ├── ui/        # shadcn primitives
│   │   │   ├── features/  # Business components
│   │   │   └── layout/    # Header/Footer
│   │   └── pages/         # Route pages
│   ├── vite.config.js
│   └── package.json
├── frontend-admin/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── lib/           # Same as client
│   │   ├── components/
│   │   │   ├── ui/        # Same as client
│   │   │   └── layout/    # Admin sidebar
│   │   └── pages/         # Dashboard
│   ├── vite.config.js
│   └── package.json
├── docs/
│   └── ARCHITECTURE.md
├── .claude/               # Claude Code config
├── CLAUDE.md              # Project instructions
├── AGENTS.md              # Agent rules
└── package.json           # Root scripts
```

## Database Schema

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

### admins
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | `admin-{timestamp}` |
| username | TEXT UNIQUE | Admin username |
| password_hash | TEXT | Bcrypt hashed password |
| role | TEXT | `admin` or `super_admin` |
| created_at | TEXT | ISO datetime string |

## API Endpoints

### Scam Alerts

| Method | Path | Description |
|---|---|---|
| GET | /api/alerts | List all alerts (newest first) |
| GET | /api/alerts/:id | Get single alert |
| POST | /api/alerts | Create alert |
| PUT | /api/alerts/:id | Update alert |
| DELETE | /api/alerts/:id | Delete alert |

### Scam Patterns

| Method | Path | Description |
|---|---|---|
| GET | /api/patterns | List all patterns |
| GET | /api/patterns/:id | Get single pattern |

### Game Scenarios

| Method | Path | Description |
|---|---|---|
| GET | /api/scenarios | List all scenarios |
| GET | /api/scenarios/:id | Get single scenario |

### Stats

| Method | Path | Description |
|---|---|---|
| GET | /api/stats | Get hub stats |

### Authentication (Admin)

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/login | Admin login |
| POST | /api/auth/register | Register admin (super_admin only) |
| GET | /api/auth/admins | List all admins |
| POST | /api/auth/admins | Create admin (super_admin only) |
| DELETE | /api/auth/admins/:id | Delete admin (super_admin only) |

## Key Design Decisions

1. **Decoupled services** — Backend and frontends are fully independent. Each can be developed, deployed, and scaled separately.
2. **SQLite over PostgreSQL** — Zero-config for local dev. No Docker needed. Can migrate to PostgreSQL later by swapping the driver.
3. **TanStack React Query + Axios** — Automatic caching, invalidation, loading states via TanStack Query. Axios interceptors handle auth, error normalization, and cross-cutting concerns.
4. **Plain JSX over TypeScript** — Faster iteration for educational project. Types documented via JSDoc where helpful.
5. **Shared UI components** — Both frontends use identical shadcn primitives. Keep in sync manually.
6. **i18n support** — Client supports English and Myanmar via i18next.

## Future Work

- Add more game scenarios
- Swap SQLite for PostgreSQL in production
- Add rate limiting and input validation
- Add CI/CD pipeline
- Add more admin dashboard features (analytics, user management)
