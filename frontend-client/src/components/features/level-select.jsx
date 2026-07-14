import { useTranslation } from "react-i18next"
import { Shield, Lock, ChevronRight, Star, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

const LEVELS = [
  {
    id: 1,
    key: "otp",
    icon: "📱",
    color: "green",
    status: "available",
    difficulty: "Easy",
    time: "3 min",
    tactics: ["Authority", "Urgency", "Fear"],
  },
  {
    id: 2,
    key: "fakeApp",
    icon: "📲",
    color: "gray",
    status: "coming_soon",
    difficulty: "Medium",
    time: "5 min",
    tactics: ["Fake Links", "Fake Updates"],
  },
  {
    id: 3,
    key: "jobScam",
    icon: "💼",
    color: "gray",
    status: "coming_soon",
    difficulty: "Medium",
    time: "5 min",
    tactics: ["Fake Offers", "Upfront Fees"],
  },
  {
    id: 4,
    key: "loanScam",
    icon: "💰",
    color: "gray",
    status: "coming_soon",
    difficulty: "Hard",
    time: "4 min",
    tactics: ["Guaranteed Approval", "Processing Fees"],
  },
  {
    id: 5,
    key: "romanceScam",
    icon: "💕",
    color: "gray",
    status: "coming_soon",
    difficulty: "Hard",
    time: "7 min",
    tactics: ["Emotional Manipulation", "Time Investment"],
  },
]

export function LevelSelect({ onSelectLevel }) {
  const { t } = useTranslation()

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("levels.title")}</h1>
        <p className="text-sm text-gray-500">{t("levels.subtitle")}</p>
      </div>

      {/* Levels Grid */}
      <div className="space-y-3">
        {LEVELS.map((level) => {
          const isAvailable = level.status === "available"

          return (
            <div
              key={level.id}
              className={`relative rounded-xl border-2 p-4 transition-all ${
                isAvailable
                  ? "border-green-200 bg-green-50 hover:border-green-400 hover:shadow-md cursor-pointer"
                  : "border-gray-200 bg-gray-50 opacity-75"
              }`}
              onClick={() => isAvailable && onSelectLevel(level.id)}
            >
              <div className="flex items-center gap-3">
                {/* Level Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  isAvailable ? "bg-green-100" : "bg-gray-100"
                }`}>
                  {level.icon}
                </div>

                {/* Level Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Level {level.id}</span>
                    {!isAvailable && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-medium">
                        <Lock className="h-2.5 w-2.5" />
                        {t("levels.comingSoon")}
                      </span>
                    )}
                  </div>
                  <h3 className={`font-semibold text-sm ${isAvailable ? "text-gray-900" : "text-gray-500"}`}>
                    {t(`levels.level${level.id}.name`)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t(`levels.level${level.id}.description`)}
                  </p>
                </div>

                {/* Arrow or Lock */}
                <div className="flex-shrink-0">
                  {isAvailable ? (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <ChevronRight className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <Lock className="h-5 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Level Meta */}
              {isAvailable && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-green-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="h-3 w-3 text-amber-400" />
                    <span>{level.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{level.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{level.tactics.length} tactics</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom Info */}
      <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-amber-800">{t("levels.educationalNote")}</p>
            <p className="text-[10px] text-amber-700 mt-1">{t("levels.educationalNoteDesc")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
