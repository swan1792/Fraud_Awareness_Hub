---
name: game-feature-progress
description: Game feature development status: stages CRUD, Phaser integration, admin UI with intervention creation
metadata: project
---

## Game Feature Status (as of 2026-07-13)

### Backend (Complete)
- `game_stages` table with nested `target_lines` and `stage_interventions` tables
- 6 seeded stages with target lines and interventions
- Public endpoint `GET /api/stages` (published only)
- Admin endpoint `GET /api/stages/all` (all stages)
- Full CRUD: POST/PUT/DELETE `/api/stages`, PATCH `/api/stages/:id/publish`
- Individual line/intervention CRUD endpoints

### Admin Frontend (Complete)
- `StagesPage.jsx` — full CRUD with create/edit dialogs, toggle publish, stats bar
- API hooks: `useStagesQuery`, `useCreateStageMutation`, `useUpdateStageMutation`, `useDeleteStageMutation`, `useTogglePublishMutation`
- Admin uses `/api/stages/all` (requires auth), client uses `/api/stages` (public)

### Client Frontend (Complete)
- `GamePage` → `GameStage` orchestrator (state machine: select → intro → playing → result)
- `StageSelect` — grid of published stages with category badges and difficulty labels
- `StageGameplay` — wraps `PhaserGame` component
- `StageResult` — success/failure with Why/Do/Don't explainer, score, reaction time, streak
- `PhaserGame` — React wrapper for Phaser 3, passes stage data via `window.__GAME_STAGE_DATA`
- `BootScene` — procedural sprite generation (scammer, target, good_friend, projectile, explosion)
- `GameScene` — action shooter: move player, select intervention chips, shoot at scammer, health bar, timer, target line progression
- `ShareCard` — social sharing with Web Share API fallback
- Localization keys in `en.json` and `my.json`

### Unused Components (from pre-Phaser iteration)
- `Character.jsx`, `InterventionChip.jsx`, `ThoughtBubble.jsx` — not imported anywhere
- These were from the original card-based game concept before Phaser was integrated

**Why:** Core game feature for fraud awareness education
**How to apply:** All game infrastructure is in place. Next steps could be: Capacitor mobile wrapping, additional stages, cleanup of unused components, or new features.

### Burmese Text in Phaser (Complete - 2026-07-13)
- Added `game.phaser` translation keys to `en.json` and `my.json`
- `PhaserGame.jsx` passes translations via `window.__GAME_TRANSLATIONS` using `i18n.getResourceBundle()`
- `BootScene.js` uses translated loading text
- `GameScene.js` uses `this.t(key)` helper for all visible strings: character labels, score, HP, controls hint, success/fail messages, time bonus
- Language switching works reactively since translations are read on game init

### Pixel Art + Parallax (Complete - 2026-07-13)
- Sprites drawn pixel-by-pixel on 16×16 grid, scaled 4× with `pixelArt: true`
- 5-layer parallax scrolling: sky, far buildings, near buildings, trees, road
- On-screen touch controls (d-pad, shoot, chip select)
- Improved message bubbles with drop shadows and solid backgrounds

### Fraud City RPG - Phase 1: Top-Down World (Complete - 2026-07-13)
- Backend: `world_maps`, `world_objects`, `world_npcs` tables with seed data for home, neighborhood, market
- API: `GET /api/worlds`, `GET /api/worlds/:id`, `GET /api/worlds/:id/objects`, `GET /api/worlds/:id/npcs`
- Phaser: `WorldBootScene` (procedural tile/character/NPC textures), `WorldScene` (top-down exploration with camera follow, collision, NPC patrol, interactions)
- React: `WorldGame.jsx` wrapper, GamePage with mode selector (Shooter / RPG), world selector
- Client API hooks: `useWorldsQuery`, `useWorldQuery`, `useWorldObjectsQuery`, `useWorldNpcsQuery`

### Fraud City Phase 2: NPC Dialogue System (Complete - 2026-07-13)
- Backend: `dialogues` table (13 branching dialogues), `npc_relationships` table
- API: `GET /api/npcs/:id/dialogue`, `POST /api/npcs/:id/talk`, `GET /api/npcs/:id/relationship`
- Phaser: `DialogueUI` scene with typewriter text, choice buttons, trust indicators
- All 6 NPCs have unique dialogue trees about different scam types

### Fraud City Phase 3: Mission System (Complete - 2026-07-13)
- Backend: `chapters` (5), `missions` (7), `player_progress` tables
- API: `GET /api/chapters`, `GET /api/missions`, `POST /api/missions/:id/accept`, `POST /api/missions/:id/complete`, `GET /api/progress`
- Phaser: `MissionTracker` overlay with objective checklist, XP counter, notifications
- Auto-accepts first mission, objectives complete on NPC talk/dialogue choices

### Fraud City Phase 4: Smartphone System (Complete - 2026-07-13)
- Phaser: `PhoneUI` overlay scene with 6 apps
- Messages app: scam messages with phishing warnings
- Contacts app: NPC list with trust bars (fetched from API)
- Camera app: evidence photography with flash effect
- Scanner app: QR code scanning animation
- Notebook app: investigation clue log
- Map app: city locations with pin markers
- Phone button in WorldScene HUD opens/closes the phone

### Fraud City Phase 5: Investigation & Evidence (Complete - 2026-07-13)
- Backend: `evidence` (8 items), `bosses` (2 bosses), `player_evidence` tables
- API: `GET/POST /api/evidence`, `GET/POST /api/bosses/:id/present`
- Phaser: `EvidenceBoard` (cork board with evidence cards), `BossBattle` (HP bar, evidence selection, defeat dialogue)
- Bosses: Phone Faker (3 HP, weak to photos), Scam Mastermind (5 HP, needs all evidence)

### Fraud City Phase 6: RPG Progression (Complete - 2026-07-13)
- Backend: `player_stats` table with level, xp, skills, reputation, titles
- API: `GET/POST /api/player/stats`, `POST /api/player/xp`, `POST /api/player/skill`, `POST /api/player/reputation`
- 4 skill branches: Investigation, Communication, Trust, Technology (max level 10 each)
- Titles unlocked at levels 5, 10, 15, 20, 25, 30
- PhoneUI: Skills app (upgrade skills), Evidence app (view collected evidence)
- WorldScene: Level badge, XP bar, level-up animation

### Fraud City Phase 7: Admin CMS Expansion (Complete - 2026-07-13)
- Admin pages: ChaptersPage, MissionsPage, NpcsPage, WorldMapsPage, PlayerProgressPage
- Routes added to admin App.jsx
- Sidebar nav with sections: Fraud City, Game, System
- API hooks for chapters, missions CRUD

### Burmese Text in Phaser (Complete - 2026-07-13)
- Added `game.phaser` translation keys to `en.json` and `my.json`
- `PhaserGame.jsx` passes translations via `window.__GAME_TRANSLATIONS` using `i18n.getResourceBundle()`
- `BootScene.js` uses translated loading text
- `GameScene.js` uses `this.t(key)` helper for all visible strings: character labels, score, HP, controls hint, success/fail messages, time bonus
- Language switching works reactively since translations are read on game init
