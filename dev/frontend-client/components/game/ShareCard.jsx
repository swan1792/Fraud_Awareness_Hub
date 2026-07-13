import { Share2, Copy, Trophy, Clock, Flame, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * ShareCard - Shareable end-of-stage card for social media
 * @param {object} props
 * @param {string} props.stageTitle - Title of the completed stage
 * @param {string} props.stageCategory - Category of the stage
 * @param {boolean} props.success - Whether player succeeded
 * @param {number} props.score - Points earned
 * @param {number} props.reactionTime - Time in seconds
 * @param {number} props.streak - Current streak
 */
export function ShareCard({
  stageTitle,
  stageCategory,
  success,
  score,
  reactionTime,
  streak,
}) {
  // Generate share text
  const getShareText = () => {
    if (success) {
      return `🛡️ I just avoided a "${stageTitle}" scam!\n\n✅ Score: ${score} pts\n⚡ Reaction: ${reactionTime}s\n🔥 Streak: ${streak}x\n\nCan you beat my score? Play now!`
    }
    return `📚 I just learned about the "${stageTitle}" scam!\n\nEvery mistake is a lesson. Play now to protect yourself!`
  }

  // Handle share
  const handleShare = async () => {
    const text = getShareText()
    const url = window.location.origin

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Fraud Awareness Hub",
          text,
          url,
        })
      } catch (err) {
        console.log("Share cancelled")
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text + "\n" + url)
      alert("Copied to clipboard!")
    }
  }

  // Handle copy to clipboard
  const handleCopy = async () => {
    const text = getShareText()
    const url = window.location.origin
    await navigator.clipboard.writeText(text + "\n" + url)
    alert("Copied to clipboard!")
  }

  return (
    <div className="space-y-4">
      {/* Shareable Card */}
      <div
        className={`
          relative overflow-hidden rounded-2xl p-6
          ${success
            ? "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600"
            : "bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600"
          }
          text-white shadow-xl
        `}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 text-8xl">🛡️</div>
          <div className="absolute bottom-4 left-4 text-6xl">🔒</div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6" />
            <span className="font-bold text-sm uppercase tracking-wide opacity-90">
              Fraud Awareness Hub
            </span>
          </div>

          {/* Result */}
          <h3 className="text-2xl font-bold mb-2">
            {success ? "Scam Avoided!" : "Learned a Lesson!"}
          </h3>
          <p className="text-white/80 text-sm mb-4">
            {stageTitle} ({stageCategory})
          </p>

          {/* Stats */}
          {success && (
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <span className="font-bold">{score} pts</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{reactionTime}s</span>
              </div>
              {streak > 1 && (
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  <span>{streak}x Streak</span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-white/60 mt-4">
            Play now at fraud-awareness-hub.vercel.app
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleShare}
          variant="outline"
          className="flex-1"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button
          onClick={handleCopy}
          variant="outline"
          className="flex-1"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
      </div>
    </div>
  )
}
