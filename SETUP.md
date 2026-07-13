# SETUP.md — Fraud Awareness Hub V1

> ~30-minute onboarding checklist for new team members.

## Prerequisites

- Node.js 18+ (recommend using nvm)
- Git
- A GitHub account with access to the repo

## 1. Clone & install

```bash
git clone https://github.com/swan1792/Fraud_Awarness_Hub_V1.git
cd Fraud_Awarness_Hub_V1
npm run install:all
```

## 2. Environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your own values:
- `JWT_SECRET` — any random string (e.g., `openssl rand -hex 32`)
- `ADMIN_EMAIL` — your admin login email
- `ADMIN_PASSWORD` — your admin login password

## 3. Start all services

```bash
npm run dev
```

This starts:
- Backend API on `http://localhost:3001`
- Client frontend on `http://localhost:5173`
- Admin dashboard on `http://localhost:5174`

The backend auto-creates `fraud_hub.db` on first start — no manual DB setup needed.

## 4. Verify it works

- Open `http://localhost:5173` — you should see the public fraud awareness hub
- Open `http://localhost:5174` — you should see the admin login page
- Login with the credentials from your `.env` file

## 5. GitHub setup

### Enable Dependabot alerts
1. Go to **Settings > Code security and analysis**
2. Enable **Dependabot alerts** and **Dependabot security updates**

### Branch protection for `main`
1. Go to **Settings > Branches > Add branch protection rule**
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1
   - ✅ Require status checks to pass (add `ci` once it runs)
   - ✅ Block force pushes

## 6. Project board (optional)

Create a GitHub Project board with columns:
- Backlog
- In Progress
- In Review
- Done

## 7. Team docs

Read these before your first PR:
- `CLAUDE.md` — project overview and architecture
- `AGENTS.md` — agent instructions and conventions
- `working-agreement.md` — how the team works together
- `docs/ARCHITECTURE.md` — system design and API endpoints

## 8. First PR

1. Create a branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Push and open a PR using the PR template
4. Get 1 review from a teammate
5. Merge after CI is green

## 9. Common commands

| Command | Description |
|---|---|
| `npm run dev` | Start all 3 services |
| `npm run dev:backend` | Backend only |
| `npm run dev:client` | Client only |
| `npm run dev:admin` | Admin only |
| `npm run install:all` | Install all dependencies |

## Troubleshooting

### Port already in use
Kill the process using the port:
```bash
lsof -ti:3001 | xargs kill -9  # backend
lsof -ti:5173 | xargs kill -9  # client
lsof -ti:5174 | xargs kill -9  # admin
```

### Database issues
Delete `backend/fraud_hub.db` and restart the backend — it will re-seed automatically.

### Build errors
Make sure you're on Node 18+:
```bash
node --version  # should be 18.x or higher
```
