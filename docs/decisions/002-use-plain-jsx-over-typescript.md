# ADR 002: Use Plain JSX over TypeScript

**Date:** 2026-07-11
**Status:** Accepted
**Decision maker:** Team

## Context

The original Next.js project used TypeScript. We need to decide the language for V1.

## Decision

Use plain JavaScript with JSX files (`.jsx` extension) for V1.

## Rationale

- Faster iteration for educational project
- Lower barrier for new contributors
- Types documented via JSDoc where helpful
- Can migrate to TypeScript later with IDE support

## Consequences

- + No build step for type checking
- + Easier onboarding for new developers
- - No compile-time type safety
- - IDE autocompletion is less precise
