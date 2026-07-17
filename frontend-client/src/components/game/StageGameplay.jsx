import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Zap, Flame, Target, Crosshair } from "lucide-react"
import { PhaserGame } from "./PhaserGame"

/**
 * StageGameplay - Action shooter gameplay component using Phaser 3
 * Player shoots correct interventions to stop the scammer
 *
 * @param {object} stage - Stage data with scammerLine, targetLines, interventions
 * @param {function} onComplete - Called with result when stage ends
 */
export function StageGameplay({ stage, onComplete }) {
  const { t, i18n } = useTranslation()

  // Game state
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  // Handle game completion from Phaser
  const handleGameComplete = useCallback(
    (result) => {
      // Calculate score based on result
      const earnedScore = result.success ? (result.score || 300) : 0
      const newStreak = result.success ? streak + 1 : 0

      setScore(earnedScore)
      setStreak(newStreak)

      // Call parent onComplete
      onComplete({
        success: result.success,
        score: earnedScore,
        reactionTime: result.reactionTime || 5,
        streak: newStreak,
      })
    },
    [streak, onComplete]
  )

  return (
    <div className="space-y-4">
      {/* Score and Streak Display */}
      <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-red-600" />
            <span className="font-bold text-red-700">{t("game.stopScammer")}</span>
          </div>
          {score > 0 && (
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              <span className="font-bold text-amber-700">{score} pts</span>
            </div>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-bold text-orange-600">{streak}x Streak</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Target className="h-4 w-4" />
          <span>{t("game.tapRight")}</span>
        </div>
      </div>

      {/* Phaser Game - key forces remount on language change */}
      <PhaserGame key={`shooter-${i18n.language}`} stage={stage} onComplete={handleGameComplete} />

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500">
        {t("game.shootInstruction")}
      </div>
    </div>
  )
}
