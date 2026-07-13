# Working Agreement — Fraud Awareness Hub V1

> How this team works together. Agreed by all members.

## Communication
- Main channel: <!-- your team chat (Discord / Telegram / WhatsApp) -->
- Async **standup** daily: post *yesterday / today / blockers*.
- Weekly **planning** (30–60 min) + a short **retro** each week.
- Expected response time on a mention: ~24h.

## Decisions
- Default: consensus. If stuck, the week's **Anchor** decides and records it as an ADR
  (`docs/decisions/`).
- Big choices (framework, DB, AI model, hosting) get a one-line ADR.

## Code & Reviews
- **GitHub Flow:** branch off `main` (`feat/…` / `fix/…`) → PR → **1 review from a
  teammate (not the author)** → merge. **No direct push to `main`. No self-merge.**
- PR title prefix: `[backend]`, `[client]`, `[admin]`, `[shared]`, `[infra]`
- Keep PRs small (< ~300 lines). Open a **Draft PR** early.
- CI must be green. Never commit secrets, `.env`, or `*.db` files.
- Pull `main` daily to avoid merge conflicts.

## Service Scoping
- **backend/** changes require review from someone familiar with Express/SQLite
- **frontend-client/** and **frontend-admin/** changes can be reviewed by any frontend dev
- **Shared UI changes** (`components/ui/`) must be synced to both frontends in the same PR

## Roles (rotate weekly)
- **Anchor** — owns the board + `main` health + unblocking. (this week: ____)
- **Driver / Navigator** — pair on hard issues, swap who types.
- **Reviewer of the week** — first to review open PRs. (this week: ____)

## When Someone Is Stuck or Absent
- Say so early — being blocked is normal, staying silent is the problem.
- Pair with the Anchor or a teammate. Use `good-first-issue` labels for newer members.
- If a member goes quiet 3+ days, the Anchor checks in privately first.

## Development Setup
Each developer needs:
- Node.js 18+ installed
- Run `npm run install:all` once after cloning
- Run `npm run dev` to start all services
- Backend auto-creates `fraud_hub.db` on first start — no manual DB setup needed

---

_Signed (all members):_
-
