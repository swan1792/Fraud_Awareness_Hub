import { useState, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  MessageSquare,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useScenariosQuery } from "@/lib/api"

const channelConfig = {
  SMS: { icon: Phone, bg: "bg-green-100 text-green-800" },
  Viber: { icon: MessageSquare, bg: "bg-purple-100 text-purple-800" },
  Email: { icon: Mail, bg: "bg-blue-100 text-blue-800" },
}

export function PhishingGame() {
  const { t, i18n } = useTranslation()
  const { data: allScenarios = [], isLoading } = useScenariosQuery()
  const scenarios = useMemo(() => [...allScenarios].sort(() => Math.random() - 0.5), [allScenarios])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gameState, setGameState] = useState("playing")
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)

  const scenario = scenarios[currentIndex]
  const channel = scenario ? channelConfig[scenario.channel] : null

  // Get translated scenario content, falling back to API data
  const getTranslatedScenario = (s) => {
    if (!s) return s
    const key = `gameScenarios.${s.id}`
    const sender = t(`${key}.sender`, s.sender)
    const message = t(`${key}.message`, s.message)
    const explanation = t(`${key}.explanation`, s.explanation)
    let redFlags = s.redFlags
    try {
      const translated = i18n.getResource(i18n.language, 'translation', `${key}.redFlags`)
      if (Array.isArray(translated)) redFlags = translated
    } catch (e) { /* use API fallback */ }
    return { ...s, sender, message, explanation, redFlags }
  }
  const displayScenario = getTranslatedScenario(scenario)

  const handleAnswer = useCallback(
    (answer) => {
      setSelectedAnswer(answer)
      if (answer === scenario.isScam) setScore((prev) => prev + 1)
      setGameState("feedback")
    },
    [scenario]
  )

  const handleNext = useCallback(() => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setGameState("playing")
    } else {
      setGameState("finished")
    }
  }, [currentIndex, scenarios.length])

  const handleRestart = useCallback(() => {
    setCurrentIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setGameState("playing")
  }, [])

  if (isLoading || scenarios.length === 0) {
    return <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-500">{t("phishing.loading")}</div>
  }

  const isCorrect = selectedAnswer === scenario?.isScam

  if (gameState === "finished") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Card className="border-2">
          <CardHeader>
            <div className="mx-auto mb-4 p-4 bg-yellow-50 rounded-full w-fit">
              <Trophy className="h-12 w-12 text-yellow-500" />
            </div>
            <CardTitle className="text-3xl">{t("phishing.gameComplete")}</CardTitle>
            <CardDescription className="text-lg">
              {t("phishing.youScored")} <span className="font-bold text-red-600">{score}</span> {t("phishing.outOf")}{" "}
              <span className="font-bold">{scenarios.length}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {score === scenarios.length
                ? t("phishing.perfectScore")
                : score >= scenarios.length * 0.7
                ? t("phishing.greatJob")
                : t("phishing.keepLearning")}
            </p>
            <Button onClick={handleRestart} size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("phishing.playAgain")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-2 gap-2">
          <span className="min-w-0 truncate">{t("phishing.question", { current: currentIndex + 1, total: scenarios.length })}</span>
          <span className="shrink-0">{t("phishing.score", { score, total: scenarios.length })}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / scenarios.length) * 100}%` }}
          />
        </div>
      </div>

      <Card className="mb-6 border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={channel.bg}>
              <channel.icon className="h-3 w-3 mr-1" />
              {t(`phishing.channels.${scenario.channel}`, scenario.channel)}
            </Badge>
            <span className="text-sm text-gray-500">{t("phishing.from", { sender: displayScenario.sender })}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-sm leading-relaxed">{displayScenario.message}</p>
          </div>
        </CardContent>
      </Card>

      {gameState === "playing" && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button onClick={() => handleAnswer(false)} variant="outline" size="lg" className="flex-1 border-green-300 hover:bg-green-50 hover:text-green-700">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
            {t("phishing.legit")}
          </Button>
          <Button onClick={() => handleAnswer(true)} variant="outline" size="lg" className="flex-1 border-red-300 hover:bg-red-50 hover:text-red-700">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            {t("phishing.scam")}
          </Button>
        </div>
      )}

      {gameState === "feedback" && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <div className={`rounded-lg p-4 flex items-center gap-3 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            {isCorrect ? <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" /> : <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />}
            <div>
              <p className={`font-semibold ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                {isCorrect ? t("phishing.correct") : t("phishing.incorrect")}
              </p>
              <p className="text-sm text-gray-600">
                {t("phishing.thisMessageIs")} <span className="font-bold">{scenario.isScam ? t("phishing.aScam") : t("phishing.legitimate")}</span>
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">{displayScenario.explanation}</p>
          </div>

          {displayScenario.isScam && displayScenario.redFlags.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-xs font-semibold text-red-800 mb-2">{t("phishing.redFlags")}</p>
              <ul className="space-y-1">
                {displayScenario.redFlags.map((flag, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                    <span className="text-red-500 mt-0.5">&bull;</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={handleNext} size="lg" className="w-full">
            {currentIndex < scenarios.length - 1 ? t("phishing.nextQuestion") : t("phishing.seeResults")}
          </Button>
        </div>
      )}
    </div>
  )
}
