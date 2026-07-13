# Fraud City - Game Design Bible

> Version: 1.0

## Vision
Build a story-driven 2D top-down action adventure inspired by Stardew Valley and classic RPGs. The game teaches fraud awareness through exploration instead of quizzes.

## Core Pillars
- Explore a living city.
- Talk to NPCs.
- Investigate suspicious situations.
- Collect evidence.
- Save citizens from scams.
- Learn naturally through consequences.

## Story
You are an ordinary citizen with exceptional fraud detection skills. A hidden syndicate is targeting families, banks, businesses, and communities. Every chapter uncovers another layer of the organization.

## World
- Home
- Neighborhood
- Market
- School
- Coffee Shop
- ATM
- Bank
- Hospital
- Bus Station
- Shopping Mall
- Facebook World
- Messenger World
- Telegram World
- Online Marketplace
- Scam Call Center (Final Area)

## Gameplay Loop
1. Receive mission
2. Explore
3. Talk to NPCs
4. Inspect objects
5. Collect clues
6. Analyze evidence
7. Make decisions
8. Save or fail
9. Learn
10. Unlock next chapter

## Player Mechanics
- Walk
- Run
- Interact
- Inspect
- Use Phone
- Scan QR
- Take Screenshot
- Photograph Evidence
- Report Scam
- Call Police
- Help Citizens

## NPC Types
Citizens, Police, Bank Staff, Teachers, Delivery Riders, Elderly, Students, Scammers, Business Owners.

Each NPC has:
- Daily routine
- Relationship
- Trust level
- Dialogue tree
- Hidden state

## Fraud Types
- Phishing
- Smishing
- Vishing
- QR Scam
- Fake APK
- Romance Scam
- Lottery Scam
- Investment Scam
- Crypto Scam
- Fake Charity
- Identity Theft
- AI Voice Scam
- Deepfake Scam

## Missions
Main Story, Side Quests, Random Events, Emergency Calls, Seasonal Events.

## Smartphone System
Apps:
- Messages
- Browser
- Camera
- Scanner
- Notebook
- Contacts
- Map
- Inventory

## RPG Progression
XP, Knowledge, Trust, Reputation, Community Safety, Investigation Skill.

## Consequences
Ignoring victims changes the world:
- Shops close
- Families lose savings
- NPC dialogue changes
- New missions appear

## Boss Battles
Bosses are defeated by evidence instead of combat.
Evidence includes:
- SMS
- Call logs
- CCTV
- QR history
- Screenshots
- Witnesses

## Admin CMS
Everything is data-driven:
- Chapters
- Missions
- Dialogues
- NPCs
- Fraud types
- Rewards
- Localization

## JSON Example

```json
{
 "chapter":"ATM Scam",
 "mission":"Help Elderly Customer",
 "fraudType":"QR Scam",
 "objectives":["Inspect QR","Talk to Guard","Report"],
 "reward":{"xp":100,"trust":10}
}
```

## Backend
Express + SQLite
REST APIs:
- /chapters
- /missions
- /npc
- /dialogues
- /fraud-types
- /player
- /progress

## Client
React + Phaser 3 + TanStack Query.

## Art Direction
Top-down pixel art.
Warm daytime colors.
Animated NPCs.
Weather.
Day/Night cycle.

## Audio
Ambient city sounds.
Rain.
Phone notifications.
Suspense music during investigations.

## Milestones
1. Vertical Slice
2. First Town
3. 5 Fraud Missions
4. NPC AI
5. Smartphone
6. Admin CMS
7. Save/Load
8. Mobile Build
9. Beta
10. Release

## AI Development Rules
- Never hardcode missions.
- Everything loaded from API.
- Reusable components.
- Modular Phaser scenes.
- Clean architecture.
- Localization first.
- Accessibility supported.

## Long-term Roadmap
Seasonal updates:
- AI scams
- Election scams
- Holiday scams
- Banking updates
- Community-created missions

This document serves as the master design reference for the Fraud City project.
