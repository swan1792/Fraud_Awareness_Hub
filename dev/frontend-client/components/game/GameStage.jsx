import { useState, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Zap, Flame, Trophy, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StageSelect } from "./StageSelect"
import { StageGameplay } from "./StageGameplay"
import { StageResult } from "./StageResult"
import { useStageQuery } from "@/lib/api"

/**
 * GameStage - Main game container orchestrating stage flow
 */
export function GameStage() {
  const { t } = useTranslation()

  // Game state
  const [gameState, setGameState] = useState("select") // select, intro, playing, result
  const [selectedStageId, setSelectedStageId] = useState(null)
  const [stageResult, setStageResult] = useState(null) // { success, score, reactionTime, streak }
  const [stagesPlayed, setStagesPlayed] = useState([])

  // Overall game stats
  const [totalScore, setTotalScore] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [stagesCleared, setStagesCleared] = useState(0)

  // Fetch stage data
  const { data: stage, isLoading } = useStageQuery(selectedStageId)

  // Auto-advance intro after 3 seconds
  useEffect(() => {
    if (gameState !== "intro") return
    const timer = setTimeout(() => {
      setGameState("playing")
    }, 3000)
    return () => clearTimeout(timer)
  }, [gameState])

  // Handle stage selection
  const handleSelectStage = useCallback((stageId) => {
    setSelectedStageId(stageId)
    setGameState("intro")
  }, [])

  // Handle intro completion (auto after 2s)
  const handleIntroComplete = useCallback(() => {
    setGameState("playing")
  }, [])

  // Handle stage completion
  const handleStageComplete = useCallback(
    (result) => {
      setStageResult(result)
      setGameState("result")

      // Update overall stats
      if (result.success) {
        setTotalScore((prev) => prev + result.score)
        setCurrentStreak(result.streak)
        setStagesCleared((prev) => prev + 1)
        if (result.streak > bestStreak) {
          setBestStreak(result.streak)
        }
      } else {
        setCurrentStreak(0)
      }

      setStagesPlayed((prev) => [...prev, {
        stageId: selectedStageId,
        success: result.success,
        score: result.score,
        reactionTime: result.reactionTime,
      }])
    },
    [selectedStageId, bestStreak]
  )

  // Handle retry
  const handleRetry = useCallback(() => {
    setStageResult(null)
    setGameState("intro")
  }, [])

  // Handle next stage
  const handleNextStage = useCallback(() => {
    setSelectedStageId(null)
    setStageResult(null)
    setGameState("select")
  }, [])

  // Handle back to select
  const handleBack = useCallback(() => {
    setSelectedStageId(null)
    setGameState("select")
  }, [])

  // Render based on game state
  if (gameState === "select") {
    return (
      <div className="space-y-6">
        {/* Overall Stats Bar */}
        {(totalScore > 0 || stagesCleared > 0) && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                <span className="font-bold text-amber-700">{totalScore} Total Points</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">Best: {bestStreak}x</span>
                </div>
                <div className="text-sm text-gray-600">
                  {stagesCleared} stages cleared
                </div>
              </div>
            </div>
          </div>
        )}
        <StageSelect onSelectStage={handleSelectStage} />
      </div>
    )
  }

  if (isLoading || !stage) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        <p className="mt-2 text-gray-500">{t("game.loading")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and stats */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("game.backToStages")}
        </Button>
        <div className="flex items-center gap-4">
          {currentStreak > 0 && (
            <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-600">{currentStreak}x</span>
            </div>
          )}
          <h2 className="text-lg font-semibold text-gray-900">{stage.title}</h2>
        </div>
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Game Content */}
      {gameState === "intro" && (
        <div className="text-center py-12 space-y-4 animate-in fade-in duration-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium">
            {t("game.getReady")}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stage.title}</h3>
          <p className="text-gray-600 max-w-md mx-auto">{stage.description}</p>
          <div className="flex justify-center gap-4 mt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-xl mx-auto mb-2">
                🎭
              </div>
              <span className="text-xs text-red-600 font-medium">Scammer</span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl mx-auto mb-2">
                👤
              </div>
              <span className="text-xs text-blue-600 font-medium">Target</span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl mx-auto mb-2">
                👓
              </div>
              <span className="text-xs text-green-600 font-medium">You</span>
            </div>
          </div>
          <Button
            onClick={() => setGameState("playing")}
            size="lg"
            className="mt-6 bg-cyan-600 hover:bg-cyan-700"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Game
          </Button>
        </div>
      )}

      {gameState === "playing" && (
        <StageGameplay stage={stage} onComplete={handleStageComplete} />
      )}

      {gameState === "result" && stageResult && (
        <StageResult
          success={stageResult.success}
          stage={stage}
          score={stageResult.score}
          reactionTime={stageResult.reactionTime}
          streak={stageResult.streak}
          onNext={handleNextStage}
          onRetry={handleRetry}
        />
      )}
    </div>
  )
}
