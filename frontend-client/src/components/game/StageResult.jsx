import { useTranslation } from "react-i18next"
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Lightbulb, ShieldCheck, ShieldX, Zap, Clock, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShareCard } from "./ShareCard"

/**
 * StageResult - Shows success/failure outcome with Why/Do/Don't explainer
 * @param {boolean} success - Whether player succeeded
 * @param {object} stage - The stage data with whyText, doText, dontText
 * @param {number} score - Points earned (0 if failed)
 * @param {number} reactionTime - Time in seconds to make choice
 * @param {number} streak - Current streak count
 * @param {function} onNext - Called to proceed to next stage
 * @param {function} onRetry - Called to retry the stage
 */
export function StageResult({ success, stage, score = 0, reactionTime = 0, streak = 0, onNext, onRetry }) {
  const { t } = useTranslation()

  if (!stage) return null

  // Determine rating based on reaction time
  const getRating = () => {
    if (!success) return null
    if (reactionTime <= 3) return { label: "Lightning Fast!", emoji: "⚡", color: "text-yellow-500" }
    if (reactionTime <= 6) return { label: "Quick Reflexes!", emoji: "🏃", color: "text-green-500" }
    if (reactionTime <= 10) return { label: "Good Job!", emoji: "👍", color: "text-blue-500" }
    return { label: "Just in Time!", emoji: "⏰", color: "text-orange-500" }
  }

  const rating = getRating()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Outcome Header */}
      <div
        className={`
          rounded-2xl p-6 text-center
          ${success
            ? "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
            : "bg-gradient-to-br from-red-50 to-orange-50 border border-red-200"
          }
        `}
      >
        {success ? (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-green-800">Smart choice!</h2>
            <p className="text-green-600 mt-1">You listened to your friend and avoided the scam. Great job staying alert!</p>
          </>
        ) : (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-red-800">You got scammed!</h2>
            <p className="text-red-600 mt-1">You fell for the scam. But don't worry — let's learn how to spot it next time.</p>
          </>
        )}

        {/* Score and Stats */}
        {success && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {/* Score */}
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold text-amber-600">{score}</span>
                <span className="text-sm text-gray-500">pts</span>
              </div>

              {/* Reaction Time */}
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-lg font-semibold text-blue-600">{reactionTime}s</span>
                {rating && (
                  <span className={`text-sm font-medium ${rating.color}`}>
                    {rating.emoji} {rating.label}
                  </span>
                )}
              </div>

              {/* Streak */}
              {streak > 1 && (
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-lg font-semibold text-orange-600">{streak}x Streak!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Shareable Card */}
      <ShareCard
        stageTitle={stage.title}
        stageCategory={stage.category}
        success={success}
        score={score}
        reactionTime={reactionTime}
        streak={streak}
      />

      {/* Why / Do / Don't Explainer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            {t("game.learnFromThis")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Why */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 text-sm uppercase tracking-wide">
                  {t("game.why")}
                </h3>
                <p className="text-yellow-700 text-sm mt-1">{stage.whyText}</p>
              </div>
            </div>
          </div>

          {/* Do */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 text-sm uppercase tracking-wide">
                  {t("game.do")}
                </h3>
                <p className="text-green-700 text-sm mt-1">{stage.doText}</p>
              </div>
            </div>
          </div>

          {/* Don't */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800 text-sm uppercase tracking-wide">
                  {t("game.dont")}
                </h3>
                <p className="text-red-700 text-sm mt-1">{stage.dontText}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onRetry}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t("game.retry")}
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="flex-1 bg-cyan-600 hover:bg-cyan-700"
        >
          {t("game.nextStage")}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
