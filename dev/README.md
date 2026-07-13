# Fraud City - Game Development Files

This directory contains all game-related source files for reference and development.

## Structure

```
dev/
├── frontend-client/
│   ├── game/                    # Phaser game engine
│   │   ├── config.js            # Phaser config with pixelArt
│   │   ├── lib/
│   │   │   └── gameApi.js       # Shared game API client
│   │   └── scenes/
│   │       ├── BootScene.js     # Action shooter sprites
│   │       ├── GameScene.js     # Action shooter gameplay
│   │       ├── WorldBootScene.js # RPG world sprites
│   │       ├── WorldScene.js    # Top-down RPG exploration
│   │       ├── DialogueUI.js    # NPC dialogue system
│   │       ├── MissionTracker.js # Mission HUD overlay
│   │       ├── PhoneUI.js       # Smartphone with apps
│   │       ├── EvidenceBoard.js # Evidence collection UI
│   │       └── BossBattle.js    # Boss confrontation scene
│   ├── components/game/         # React game wrappers
│   │   ├── WorldGame.jsx        # RPG game wrapper
│   │   ├── GameStage.jsx        # Action shooter orchestrator
│   │   ├── PhaserGame.jsx       # Phaser React wrapper
│   │   ├── StageSelect.jsx      # Stage picker
│   │   ├── StageGameplay.jsx    # Shooter gameplay
│   │   ├── StageResult.jsx      # Win/lose screen
│   │   └── ShareCard.jsx        # Social sharing
│   ├── contexts/
│   │   └── GameContext.jsx       # Game state context
│   └── pages/
│       └── GamePage.jsx          # Game mode selector
├── frontend-admin/
│   └── pages/                    # Admin CMS pages
│       ├── StagesPage.jsx        # Action shooter stages
│       ├── ChaptersPage.jsx      # RPG chapters
│       ├── MissionsPage.jsx      # RPG missions
│       ├── NpcsPage.jsx          # NPC management
│       ├── WorldMapsPage.jsx     # World map viewer
│       └── PlayerProgressPage.jsx # Player progress viewer
├── backend/                      # (see main backend/)
├── Fraud-City-Game-Design-Bible.md  # Game design document
├── gitWorkflow.md                    # Git workflow guide
└── game-dev-instruction-guide.md     # AI dev instructions
```

## Game Features

### Action Shooter Mode (`/game/actionshooter`)
- 6 stages with parallax scrolling
- Pixel art sprites (16×16 grid, scaled 4×)
- On-screen touch controls
- Intervention selection and scoring

### Fraud City RPG (`/game/fraudcity`)
- Top-down world exploration
- NPC dialogue system with choices
- Mission tracking with objectives
- Evidence collection and boss battles
- Skill tree progression
- Save/Load system
- Smartphone with 8 apps

### Admin CMS
- Chapter management
- Mission editor
- NPC and dialogue management
- World map viewer
- Player progress dashboard
