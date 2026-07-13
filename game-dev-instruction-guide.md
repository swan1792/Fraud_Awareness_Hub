# Giving Instructions to AI Development Tools

A guide for briefing AI coding tools (Claude Code, Cursor, Copilot Workspace, v0, etc.) to build the Scam/Fraud Awareness 2D game.

## 1. Give it a one-paragraph product summary first

Set context before diving into specifics — one or two sentences on what the game is and who it's for.

> "Build a 2D educational game that teaches scam/fraud awareness. Player character walks through scenarios (SMS, calls, social media messages); correct word/phrase choices open a path forward, wrong choices trigger a consequence animation + explainer. Target: web + mobile (iOS/Android), Burmese-language first."

## 2. Specify the tech stack explicitly — don't let the AI choose

AI tools will default to whatever's popular in training data, which may not match your goals. Be explicit. Here's the stack laid out as a monorepo:

```
                          MONOREPO
  ├─────────────────┬─────────────────┬─────────────┤
  │    Backend      │  Client App     │ Admin Panel │
  ├─────────────────┼─────────────────┼─────────────┤
  │  Node.js        │  React (JSX)    │  React (JSX)│
  │  Express        │  TanStack Query │  TanStack   │
  │  SQLite3        │  Axios          │  Axios      │
  │  JWT Auth       │  shadcn/ui      │  shadcn/ui  │
  │  REST API       │  Tailwind CSS   │  Tailwind   │
  └─────────────────┴─────────────────┴─────────────┘
```

> "Use a monorepo with three packages: `backend` (Node.js + Express + better-sqlite3, JWT auth, REST API), `client` (React with JSX + TanStack Query for data fetching + Axios for HTTP calls + shadcn/ui + Tailwind CSS), and `admin` (same frontend stack — React/JSX + TanStack Query + Axios + shadcn/ui + Tailwind — with CRUD screens for managing scenarios/stages). Use Phaser 3 for the game engine layer inside the client app, and Capacitor to wrap the client for iOS/Android."

**Where each piece fits the game:**
- **Backend** — serves scenario/stage JSON, handles auth (admin login), stores user progress/scores in SQLite
- **Client app** — the actual game: Phaser 3 canvas embedded in a React shell, TanStack Query + Axios fetch scenario data from the backend
- **Admin panel** — dashboard for non-technical staff to create/edit scam scenarios, stages, and choices without touching code — shadcn/ui gives you fast, consistent CRUD forms out of the box

This also keeps it consistent with your SchoolHub stack, so the same conventions, auth pattern, and folder structure carry over.

## 3. Give it the data schema, not just a description

This is the single highest-leverage thing you can hand over — a concrete JSON schema removes ambiguity:

```json
{
  "scenario": "You get an SMS saying you won a lottery you never entered",
  "npc_message": "Click here to claim your prize!",
  "choices": [
    {"text": "Click the link", "correct": false, "consequence": "phishing_site"},
    {"text": "Delete and report", "correct": true},
    {"text": "Reply asking for details", "correct": false, "consequence": "data_harvest"}
  ],
  "explainer": "Legitimate lotteries don't contact winners who never entered..."
}
```

> "Scenarios are defined in this JSON shape: [paste schema above]. In the backend, expose this via a REST endpoint (e.g. `GET /api/scenarios/:stageId`). In the client app, fetch it with TanStack Query (using Axios as the HTTP client) and build a ScenarioLoader module that reads the response and dynamically generates the choice-paths in a Phaser scene."

## 4. Break the ask into phases, not one giant prompt

AI coding tools handle scoped tasks far better than "build the whole game." Give it in this order:

1. Set up the monorepo skeleton: `backend`, `client`, `admin` packages, shared conventions (JWT auth, folder structure) carried over from your SchoolHub setup
2. Backend: build the scenario/stage schema in SQLite + REST endpoints (`GET /api/scenarios/:stageId`, `POST/PUT` for admin CRUD)
3. Client: build one working Phaser scene inside the React shell — character sprite, two choice-paths, walk animation on selection, consequence trigger on wrong choice — fetched via TanStack Query + Axios
4. Client: build the ScenarioLoader that consumes the API response and generates scenes dynamically; add Burmese/English content support
5. Admin: build the CRUD dashboard (shadcn/ui + Tailwind) for creating/editing scenarios and stages
6. Add scoring/progress tracking to the backend + client
7. Wrap the client with Capacitor for mobile build

## 5. Include constraints and acceptance criteria

Tell it what "done" looks like and what NOT to do:

> "Keep scenario content fully data-driven — no scenario text or choice logic hardcoded in scene files. Support Burmese Unicode text rendering in Phaser (test with actual Burmese strings, not just Latin placeholder text). Do not use deprecated Phaser 2 APIs."

## 6. If using Claude Code specifically

It works well with a `CLAUDE.md` file in your repo root describing project conventions (stack, folder structure, coding style) — every session then has that context automatically instead of you re-explaining it each time.

## Quick reusable template

```
CONTEXT: [1-2 sentences on the product]
STACK: [exact frameworks/languages, no ambiguity]
TASK: [one scoped task, not the whole project]
DATA SHAPE: [paste schema/interfaces if relevant]
CONSTRAINTS: [what to avoid, what must be true]
DONE WHEN: [specific, testable outcome]
```
