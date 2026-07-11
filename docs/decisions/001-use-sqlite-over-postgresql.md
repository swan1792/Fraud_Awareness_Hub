# ADR 001: Use SQLite over PostgreSQL

**Date:** 2026-07-11
**Status:** Accepted
**Decision maker:** Team

## Context

We need a database for the backend API. Options considered:
- SQLite (via `sqlite3` npm package)
- PostgreSQL (via `pg` or Prisma)
- Supabase (managed PostgreSQL)

## Decision

Use SQLite for local development. The schema is designed to be PostgreSQL-compatible for future migration.

## Rationale

- Zero configuration — no Docker, no server setup, no connection strings
- `fraud_hub.db` auto-created on first server start
- Data volume is small (< 1000 rows in all tables combined)
- Educational project — simplicity over production-readiness
- Can migrate to PostgreSQL later by swapping `sqlite3` for `pg` driver

## Consequences

- + Developers can start contributing with zero setup
- + No Docker dependency for local dev
- - No concurrent write support (acceptable for single-server usage)
- - No built-in auth (must add separately if needed)
