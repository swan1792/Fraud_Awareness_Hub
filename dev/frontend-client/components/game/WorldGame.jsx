import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import Phaser from "phaser"
import { gameConfig } from "@/game/config"
import { WorldBootScene } from "@/game/scenes/WorldBootScene"
import { WorldScene } from "@/game/scenes/WorldScene"
import { DialogueUI } from "@/game/scenes/DialogueUI"
import { MissionTracker } from "@/game/scenes/MissionTracker"
import { PhoneUI } from "@/game/scenes/PhoneUI"
import { EvidenceBoard } from "@/game/scenes/EvidenceBoard"
import { BossBattle } from "@/game/scenes/BossBattle"
import { useWorldsQuery, useWorldQuery, useWorldObjectsQuery, useWorldNpcsQuery } from "@/lib/api"

/**
 * WorldGame - React wrapper for Fraud City top-down RPG world
 * @param {string} worldId - ID of the world to load
 * @param {function} onNpcInteract - Called when player talks to NPC
 * @param {function} onObjectInteract - Called when player inspects object
 * @param {function} onBack - Called to return to world select
 */
export function WorldGame({ worldId, onNpcInteract, onObjectInteract, onBack }) {
  const gameRef = useRef(null)
  const containerRef = useRef(null)
  const callbacksRef = useRef({ onNpcInteract, onObjectInteract })
  const { i18n } = useTranslation()

  const { data: world } = useWorldQuery(worldId)
  const { data: objects = [] } = useWorldObjectsQuery(worldId)
  const { data: npcs = [] } = useWorldNpcsQuery(worldId)

  // Keep callbacks ref current without triggering re-render
  useEffect(() => {
    callbacksRef.current = { onNpcInteract, onObjectInteract }
  }, [onNpcInteract, onObjectInteract])

  useEffect(() => {
    if (!containerRef.current || !world) return

    // Clean up existing game
    if (gameRef.current) {
      try { gameRef.current.destroy(true) } catch (e) { /* ignore */ }
      gameRef.current = null
    }

    // Store world data globally for scenes (use refs for non-render data)
    window.__WORLD_DATA = world
    window.__WORLD_OBJECTS = objects
    window.__WORLD_NPCS = npcs

    // Pass translations
    const bundle = i18n.getResourceBundle(i18n.language, "translation")
    window.__GAME_TRANSLATIONS = bundle?.game?.phaser || {}

    // Create game
    const config = {
      ...gameConfig,
      parent: containerRef.current,
      scene: [WorldBootScene, WorldScene, DialogueUI, MissionTracker, PhoneUI, EvidenceBoard, BossBattle],
      // Override for top-down view
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false },
      },
    }

    try {
      const game = new Phaser.Game(config)
      gameRef.current = game

      // Pass callbacks to scene once it's ready
      game.events.on("ready", () => {
        const worldScene = game.scene.getScene("WorldScene")
        if (worldScene) {
          worldScene.onNpcInteract = (...args) => callbacksRef.current.onNpcInteract?.(...args)
          worldScene.onObjectInteract = (...args) => callbacksRef.current.onObjectInteract?.(...args)
        }
      })
    } catch (err) {
      console.error("Failed to create world game:", err)
    }

    return () => {
      if (gameRef.current) {
        try { gameRef.current.destroy(true) } catch (e) { /* ignore */ }
        gameRef.current = null
      }
      delete window.__WORLD_DATA
      delete window.__WORLD_OBJECTS
      delete window.__WORLD_NPCS
      delete window.__GAME_TRANSLATIONS
    }
  }, [world, i18n.language]) // Only re-create when world or language changes, NOT when objects/npcs change

  if (!world) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Game Container */}
      <div
        ref={containerRef}
        className="w-full aspect-[8/5] max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg border-2 border-gray-200 bg-[#2d5016]"
      />

      {/* World Info Overlay */}
      <div className="absolute top-2 left-2 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm">
        <span className="font-bold">{world.displayName}</span>
        <span className="text-gray-300 ml-2 text-xs">{world.description}</span>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-black/80 transition-colors backdrop-blur-sm"
      >
        ← Back
      </button>

      {/* Controls Help */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-lg text-xs backdrop-blur-sm">
        Arrow Keys: Move | Shift: Run | E: Interact
      </div>
    </div>
  )
}
