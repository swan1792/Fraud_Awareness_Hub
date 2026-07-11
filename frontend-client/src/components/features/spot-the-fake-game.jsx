import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { CheckCircle2, AlertTriangle, RotateCcw, Eye, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

const anomalyIds = ["transaction-id", "amount", "date"]

export function SpotTheFakeGame() {
  const { t } = useTranslation()
  const [foundAnomalies, setFoundAnomalies] = useState(new Set())
  const [gameState, setGameState] = useState("playing")

  const anomalies = [
    {
      id: "transaction-id",
      label: t("spotGame.transactionId"),
      value: "84721",
      hint: t("spotGame.hintTransactionId"),
    },
    {
      id: "amount",
      label: t("spotGame.amount"),
      value: "500,000 MMK",
      hint: t("spotGame.hintAmount"),
    },
    {
      id: "date",
      label: t("spotGame.dateTime"),
      value: "15/07/2026 14:32",
      hint: t("spotGame.hintDate"),
    },
  ]

  const handleAnomalyClick = useCallback(
    (anomalyId) => {
      if (gameState !== "playing") return
      setFoundAnomalies((prev) => {
        const next = new Set(prev)
        next.add(anomalyId)
        if (next.size === anomalyIds.length) {
          setTimeout(() => setGameState("success"), 500)
        }
        return next
      })
    },
    [gameState]
  )

  const handleRestart = useCallback(() => {
    setFoundAnomalies(new Set())
    setGameState("playing")
  }, [])

  const remainingCount = anomalyIds.length - foundAnomalies.size

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Progress Counter */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">
          {t("spotGame.redFlagsFound")} <span className="font-bold text-red-600">{foundAnomalies.size}</span> / {anomalyIds.length}
        </p>
        <div className="flex justify-center gap-2 mt-2">
          {anomalyIds.map((id) => (
            <div key={id} className={`w-3 h-3 rounded-full transition-colors ${foundAnomalies.has(id) ? "bg-red-500" : "bg-gray-300"}`} />
          ))}
        </div>
      </div>

      {gameState === "playing" && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <Search className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-800">{t("spotGame.examineSlip")}</p>
        </div>
      )}

      {/* Fake Payment Slip */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-5 text-center">
          <p className="text-lg font-bold tracking-wide">KPay</p>
          <p className="text-xs text-purple-200 mt-1">{t("spotGame.paymentSuccessful")}</p>
        </div>
        <div className="flex justify-center -mt-4">
          <div className="bg-green-500 rounded-full p-2 shadow-md">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Amount — ANOMALY */}
          <button
            onClick={() => handleAnomalyClick("amount")}
            disabled={foundAnomalies.has("amount")}
            className={`w-full text-center p-3 min-h-11 rounded-lg transition-all ${
              foundAnomalies.has("amount")
                ? "bg-red-50 border-2 border-red-400 ring-2 ring-red-200"
                : "hover:bg-gray-50 cursor-pointer border-2 border-transparent"
            }`}
          >
            <p className="text-xs text-gray-500">{t("spotGame.amount")}</p>
            <p className={`font-extrabold tracking-tight ${foundAnomalies.has("amount") ? "text-red-600 text-3xl sm:text-4xl" : "text-gray-900 text-3xl sm:text-4xl"}`}>
              500,000 MMK
            </p>
            {foundAnomalies.has("amount") && (
              <p className="text-xs sm:text-sm text-red-600 mt-2 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {anomalies.find((a) => a.id === "amount")?.hint}
              </p>
            )}
          </button>

          <div className="border-t border-dashed border-gray-200" />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{t("spotGame.from")}</span>
              <span className="text-sm font-medium">Ma Thida</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{t("spotGame.to")}</span>
              <span className="text-sm font-medium">U Kyaw Zin</span>
            </div>

            {/* Date & Time — ANOMALY */}
            <button
              onClick={() => handleAnomalyClick("date")}
              disabled={foundAnomalies.has("date")}
              className={`w-full flex justify-between items-center p-3 min-h-11 rounded-lg transition-all ${
                foundAnomalies.has("date")
                  ? "bg-red-50 border-2 border-red-400"
                  : "hover:bg-gray-50 cursor-pointer border-2 border-transparent"
              }`}
            >
              <span className="text-xs sm:text-sm text-gray-500">{t("spotGame.dateTime")}</span>
              <span className={`text-sm font-medium ${foundAnomalies.has("date") ? "text-red-600" : ""}`}>
                15/07/2026 14:32
              </span>
            </button>
            {foundAnomalies.has("date") && (
              <p className="text-xs sm:text-sm text-red-600 flex items-start gap-1 px-2">
                <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                {anomalies.find((a) => a.id === "date")?.hint}
              </p>
            )}

            {/* Transaction ID — ANOMALY */}
            <button
              onClick={() => handleAnomalyClick("transaction-id")}
              disabled={foundAnomalies.has("transaction-id")}
              className={`w-full flex justify-between items-center p-3 min-h-11 rounded-lg transition-all ${
                foundAnomalies.has("transaction-id")
                  ? "bg-red-50 border-2 border-red-400"
                  : "hover:bg-gray-50 cursor-pointer border-2 border-transparent"
              }`}
            >
              <span className="text-xs sm:text-sm text-gray-500">{t("spotGame.transactionId")}</span>
              <span className={`text-sm font-mono ${foundAnomalies.has("transaction-id") ? "text-red-600" : ""}`}>
                84721
              </span>
            </button>
            {foundAnomalies.has("transaction-id") && (
              <p className="text-xs sm:text-sm text-red-600 flex items-start gap-1 px-2">
                <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                {anomalies.find((a) => a.id === "transaction-id")?.hint}
              </p>
            )}
          </div>

          <div className="border-t border-dashed border-gray-200" />

          <div className="text-center">
            <p className="text-xs text-gray-400">{t("spotGame.simulatedSlip")}</p>
          </div>
        </div>
      </div>

      {/* Game Status & Actions */}
      <div className="mt-6 space-y-3">
        {gameState === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 text-sm">{t("spotGame.successTitle")}</p>
              <p className="text-xs text-green-700 mt-1">
                {t("spotGame.successDesc")}
              </p>
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <Button
            onClick={() => { if (foundAnomalies.size === anomalyIds.length) setGameState("success") }}
            variant="outline"
            className="w-full"
            disabled={foundAnomalies.size < anomalyIds.length}
          >
            <Eye className="h-4 w-4 mr-2" />
            {foundAnomalies.size === anomalyIds.length
              ? t("spotGame.checkSlip")
              : t("spotGame.findMore", { count: remainingCount })}
          </Button>
        )}

        {gameState === "success" && (
          <Button onClick={handleRestart} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("spotGame.playAgain")}
          </Button>
        )}
      </div>
    </div>
  )
}
