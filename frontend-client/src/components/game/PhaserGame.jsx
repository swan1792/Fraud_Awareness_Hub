import { useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import Phaser from "phaser"
import { gameConfig } from "@/game/config"
import { BootScene } from "@/game/scenes/BootScene"
import { GameScene } from "@/game/scenes/GameScene"

/**
 * PhaserGame - React wrapper for Phaser 3 game
 * @param {object} stage - Stage data to play
 * @param {function} onComplete - Called when game completes
 */
export function PhaserGame({ stage, onComplete }) {
  const gameRef = useRef(null)
  const containerRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  const { i18n } = useTranslation()

  // Keep the ref current without triggering effect re-runs
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!containerRef.current || !stage) return

    // Clean up existing game
    if (gameRef.current) {
      try { gameRef.current.destroy(true) } catch (e) { /* ignore */ }
      gameRef.current = null
    }

    // Store stage data globally for scenes to access (with translations)
    const t = (key) => window.__GAME_TRANSLATIONS?.[key] || key
    const translated = i18n.getResourceBundle(i18n.language, "translation")?.game?.stages?.[stage.id]
    window.__GAME_STAGE_DATA = {
      ...stage,
      title: translated?.title || stage.title,
      description: translated?.description || stage.description,
      scammerLine: translated?.scammerLine || stage.scammerLine,
      correctIntervention: translated?.correctIntervention || stage.correctIntervention,
      whyText: translated?.whyText || stage.whyText,
      doText: translated?.doText || stage.doText,
      dontText: translated?.dontText || stage.dontText,
      targetLines: translated?.targetLines
        ? translated.targetLines.map((line, i) => ({ lineText: line, lineOrder: i + 1 }))
        : stage.targetLines,
      interventions: translated?.interventions
        ? translated.interventions.map((int, i) => ({
            interventionText: int.text,
            isCorrect: int.correct,
            displayOrder: i + 1,
          }))
        : stage.interventions,
    }
    window.__GAME_ON_COMPLETE = (...args) => onCompleteRef.current?.(...args)

    // Pass current language translations to Phaser (flatten nested keys)
    const bundle = i18n.getResourceBundle(i18n.language, "translation")
    const phaser = bundle?.game?.phaser || {}
    const flat = {}
    function flatten(obj, prefix = '') {
      for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          flatten(val, fullKey)
        } else {
          flat[fullKey] = val
        }
      }
    }
    flatten(phaser)
    window.__GAME_TRANSLATIONS = flat

    // Create new game with stage data
    const config = {
      ...gameConfig,
      parent: containerRef.current,
      scene: [BootScene, GameScene],
    }

    try {
      const game = new Phaser.Game(config)
      gameRef.current = game
    } catch (err) {
      console.error("Failed to create Phaser game:", err)
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        try { gameRef.current.destroy(true) } catch (e) { /* ignore */ }
        gameRef.current = null
      }
      delete window.__GAME_STAGE_DATA
      delete window.__GAME_ON_COMPLETE
      delete window.__GAME_TRANSLATIONS
    }
  }, [stage, i18n.language]) // re-create when stage or language changes, NOT when onComplete changes

  return (
    <div className="relative">
      {/* Phaser Game Container */}
      <div
        ref={containerRef}
        id="game-container"
        className="w-full min-h-[320px] aspect-[8/5] max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg border-2 border-gray-200 bg-[#1a1a2e]"
      />

      {/* Stage Info Overlay */}
      <div className="absolute top-2 left-2 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
        {stage?.title}
      </div>
    </div>
  )
}
