import { useState, useRef, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Send, AlertTriangle, ShieldCheck, RotateCcw, Loader2, Flag, X, ChevronRight, MessageCircle, BookOpen, Phone, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { streamChatMessage, checkSimulatorHealth } from "@/lib/simulator-api"
import { LevelSelect } from "./level-select"

// Helper: format time like real chat apps
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// Helper: detect if user explicitly shared OTP
function isExplicitOTP(text, lang) {
  const lower = text.toLowerCase()
  const patterns = [
    /otp\s*(is|:|：)\s*\d{3,}/i,
    /code\s*(is|:|：)\s*\d{3,}/i,
    /ကုဒ်\s*(ရှိ|:|：)\s*\d{3,}/,
    /otp\s+\d{4,6}/i,
    /^[\d]{4,6}$/,
  ]
  return patterns.some(p => p.test(text))
}

// Helper: detect scam tactics in scammer message
function detectTactics(message) {
  const tactics = []
  const lower = message.toLowerCase()

  // Authority tactic
  if (lower.includes("kbz") || lower.includes("bank") || lower.includes("security") || lower.includes("fraud")) {
    tactics.push({ type: "authority", label: "Authority Impersonation", explanation: "Scammers pretend to be from trusted institutions like banks." })
  }

  // Urgency tactic
  if (lower.includes("time") || lower.includes("urgent") || lower.includes("minutes") || lower.includes("hurry") || lower.includes("now")) {
    tactics.push({ type: "urgency", label: "Creating Urgency", explanation: "Scammers create panic to prevent you from thinking clearly." })
  }

  // Fear tactic
  if (lower.includes("stolen") || lower.includes("lost") || lower.includes("risk") || lower.includes("danger") || lower.includes("compromised")) {
    tactics.push({ type: "fear", label: "Fear of Loss", explanation: "Scammers threaten financial loss to make you act quickly." })
  }

  // OTP request
  if (lower.includes("otp") || lower.includes("code") || lower.includes("verification")) {
    tactics.push({ type: "otp_request", label: "OTP Request", explanation: "Banks NEVER ask for your OTP. This is always a scam." })
  }

  // Guilt manipulation
  if (lower.includes("family") || lower.includes("help you") || lower.includes("trying to")) {
    tactics.push({ type: "guilt", label: "Emotional Manipulation", explanation: "Scammers use guilt and sympathy to lower your defenses." })
  }

  return tactics
}

// Educational Tooltip Component
function EducationalTooltip({ tactics, t }) {
  if (!tactics || tactics.length === 0) return null

  return (
    <div className="mx-4 mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-4 w-4 text-amber-600" />
        <span className="text-xs font-semibold text-amber-800">{t("education.redFlagDetected")}</span>
      </div>
      <div className="space-y-2">
        {tactics.map((tactic, i) => (
          <div key={i} className="flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-800">{tactic.label}</p>
              <p className="text-[10px] text-amber-700">{tactic.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Suggested replies
const SUGGESTED_REPLIES = {
  en: ["Who are you?", "What do you want?", "How did you get my number?"],
  my: ["ဘယ်သူလဲ?", "ဘာလိုချင်တာလဲ?", "ဖုန်းနံပါတ်ကို ဘယ်လိုရတာလဲ?"],
}

// Onboarding Screen
function OnboardingScreen({ onStart, t }) {
  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-[min(500px,80vh)] p-6 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <MessageCircle className="h-10 w-10 text-red-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{t("onboarding.title")}</h2>
      <p className="text-sm text-gray-600 mb-6 max-w-xs">{t("onboarding.description")}</p>
      <div className="w-full space-y-3 mb-6">
        <div className="flex items-start gap-3 text-left p-3 bg-gray-50 rounded-lg">
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-red-600 text-xs font-bold">1</span>
          </div>
          <p className="text-sm text-gray-700">{t("onboarding.step1")}</p>
        </div>
        <div className="flex items-start gap-3 text-left p-3 bg-gray-50 rounded-lg">
          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-orange-600 text-xs font-bold">2</span>
          </div>
          <p className="text-sm text-gray-700">{t("onboarding.step2")}</p>
        </div>
        <div className="flex items-start gap-3 text-left p-3 bg-gray-50 rounded-lg">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-600 text-xs font-bold">3</span>
          </div>
          <p className="text-sm text-gray-700">{t("onboarding.step3")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <AlertTriangle className="h-3 w-3" />
        <span>{t("onboarding.warning")}</span>
      </div>
      <Button onClick={onStart} className="w-full max-w-xs bg-green-600 hover:bg-green-700">
        {t("onboarding.start")}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}

// Comprehensive Debrief Screen
function DebriefScreen({ outcome, messages, onRestart, onClose, t }) {
  const wasScammed = outcome === "scammed"

  // Analyze tactics used
  const tacticsUsed = new Set()
  const scammerMessages = messages.filter(m => m.role === "assistant")
  scammerMessages.forEach(msg => {
    const tactics = detectTactics(msg.content)
    tactics.forEach(t => tacticsUsed.add(t.type))
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-[300px] w-full p-4 shadow-xl max-h-[75vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${wasScammed ? "bg-red-100" : "bg-green-100"}`}>
            {wasScammed ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-green-600" />
            )}
          </div>
          <h3 className={`text-base font-bold ${wasScammed ? "text-red-800" : "text-green-800"}`}>
            {wasScammed ? t("debrief.scammedTitle") : t("debrief.safeTitle")}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {wasScammed ? t("debrief.scammedDesc") : t("debrief.safeDesc")}
          </p>
        </div>

        {/* Tactics Used */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-800 mb-2">{t("debrief.tacticsUsed")}</h4>
          <div className="space-y-1">
            {Array.from(tacticsUsed).map((tactic, i) => (
              <div key={i} className="flex items-center gap-2 p-1.5 bg-amber-50 rounded">
                <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] font-medium text-amber-800">
                  {t(`debrief.tactics.${tactic}`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Red Flags Summary */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-800 mb-2">{t("debrief.redFlagsTitle")}</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-1.5 bg-red-50 rounded">
              <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <p className="text-[10px] text-red-700">{t("debrief.redFlags.otpRequest")}</p>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-red-50 rounded">
              <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <p className="text-[10px] text-red-700">{t("debrief.redFlags.urgency")}</p>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-red-50 rounded">
              <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
              <p className="text-[10px] text-red-700">{t("debrief.redFlags.unverifiable")}</p>
            </div>
          </div>
        </div>

        {/* What You Should Do */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-800 mb-2">{t("debrief.whatToDoTitle")}</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-1.5 bg-green-50 rounded">
              <Phone className="h-3 w-3 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-medium text-green-800">{t("debrief.actions.callBank")}</p>
                <p className="text-[9px] text-green-600">01-234-5678</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-green-50 rounded">
              <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
              <p className="text-[10px] text-green-700">{t("debrief.actions.neverShare")}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onRestart} variant="outline" className="flex-1 text-xs h-8">
            <RotateCcw className="h-3 w-3 mr-1" />
            {t("debrief.tryAgain")}
          </Button>
          <Button onClick={onClose} className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8">
            {t("debrief.done")}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Warning Popup
function WarningPopup({ onStartOver, onNextLevel, t }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-[280px] w-full p-4 shadow-xl text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-2">{t("warningPopup.title")}</h3>
        <p className="text-xs text-gray-600 mb-3">{t("warningPopup.message")}</p>
        <div className="bg-green-50 p-2 rounded-lg mb-3">
          <p className="text-xs font-semibold text-green-800">{t("warningPopup.dontShare")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onStartOver} variant="outline" className="flex-1 text-xs h-8">
            <RotateCcw className="h-3 w-3 mr-1" />
            {t("warningPopup.startOver")}
          </Button>
          <Button onClick={onNextLevel} className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8">
            {t("warningPopup.nextLevel")}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Main Simulator Component
export function ScammerChatSimulator() {
  const { t, i18n } = useTranslation()
  const [phase, setPhase] = useState("levels") // levels | onboarding | chat | debrief
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState("")
  const [outcome, setOutcome] = useState(null)
  const [scammerTyping, setScammerTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [modelStatus, setModelStatus] = useState(null)
  const [serverError, setServerError] = useState(false)
  const [showDebrief, setShowDebrief] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [persuasionCount, setPersuasionCount] = useState(0)
  const [currentTactics, setCurrentTactics] = useState([])
  const scrollRef = useRef(null)

  const currentLang = i18n.language?.startsWith("my") ? "my" : "en"

  useEffect(() => {
    checkSimulatorHealth().then(setModelStatus).catch(() => setServerError(true))
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, scammerTyping, streamingText])

  const addScammerMessage = useCallback((text) => {
    setMessages((prev) => [
      ...prev,
      { id: `scammer-${Date.now()}`, role: "assistant", content: text, timestamp: new Date() },
    ])
    // Detect and show tactics
    const tactics = detectTactics(text)
    setCurrentTactics(tactics)
    // Clear tactics after 5 seconds
    setTimeout(() => setCurrentTactics([]), 5000)
  }, [])

  const sendToLLM = useCallback(
    async (conversationMessages) => {
      setScammerTyping(true)
      setStreamingText("")
      setIsLoading(true)
      setServerError(false)

      let fullResponse = ""

      await streamChatMessage(
        conversationMessages,
        {
          onToken: (token) => { fullResponse += token; setStreamingText(fullResponse) },
          onDone: () => {
            if (fullResponse) addScammerMessage(fullResponse)
            setStreamingText("")
            setScammerTyping(false)
            setIsLoading(false)

            setPersuasionCount((prev) => {
              const newCount = prev + 1
              if (newCount === 5) setTimeout(() => setShowWarning(true), 500)
              return newCount
            })

            const lower = fullResponse.toLowerCase()
            const myanmarEnd = fullResponse.includes("နောက်ဆုံးပါ") || fullResponse.includes("မှတ်တမ်းတင်")
            if (lower.includes("goodbye") || lower.includes("noted") || myanmarEnd) {
              setTimeout(() => { setOutcome("safe"); setShowDebrief(true) }, 1500)
            }
          },
          onError: (err) => { console.error("LLM error:", err); setScammerTyping(false); setIsLoading(false); setServerError(true) },
        },
        { max_tokens: 150, temperature: 0.8, language: currentLang }
      )
    },
    [addScammerMessage, currentLang]
  )

  useEffect(() => {
    if (phase === "chat" && messages.length === 0) {
      const initTimer = setTimeout(() => sendToLLM([{ role: "system", content: "start" }]), 800)
      return () => clearTimeout(initTimer)
    }
  }, [phase, messages.length, sendToLLM])

  const processUserMessage = useCallback(
    async (text) => {
      if (isExplicitOTP(text, currentLang)) {
        setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", content: text, timestamp: new Date() }])
        setScammerTyping(true)
        setTimeout(() => {
          addScammerMessage(currentLang === "my" ? "အတည်ပြုပြီးပါပြီ။ ကျေးဇူးတင်ပါသည်။" : "Verification complete. Your account has been secured.")
          setScammerTyping(false)
          setTimeout(() => { setOutcome("scammed"); setShowDebrief(true) }, 1500)
        }, 1500)
        return
      }

      const newUserMsg = { id: `user-${Date.now()}`, role: "user", content: text, timestamp: new Date() }
      const updatedMessages = [...messages, newUserMsg]
      setMessages(updatedMessages)
      await sendToLLM(updatedMessages.map((m) => ({ role: m.role, content: m.content })))
    },
    [messages, sendToLLM, addScammerMessage, currentLang]
  )

  const handleSend = useCallback(() => {
    const trimmed = userInput.trim()
    if (!trimmed || outcome !== null || isLoading) return
    setUserInput("")
    processUserMessage(trimmed)
  }, [userInput, outcome, isLoading, processUserMessage])

  const handleSuggestedReply = useCallback((text) => { setUserInput(""); processUserMessage(text) }, [processUserMessage])

  const handleKeyDown = useCallback((e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }, [handleSend])

  const handleReport = useCallback(() => { setOutcome("safe"); setShowDebrief(true) }, [])

  const handleSelectLevel = useCallback((levelId) => {
    setSelectedLevel(levelId)
    setPhase("onboarding")
  }, [])

  const handleRestart = useCallback(() => {
    setMessages([]); setUserInput(""); setOutcome(null); setScammerTyping(false)
    setStreamingText(""); setIsLoading(false); setServerError(false); setShowDebrief(false)
    setShowWarning(false); setPersuasionCount(0); setCurrentTactics([]); setPhase("levels")
    setSelectedLevel(null)
  }, [])

  const handleStartOver = useCallback(() => {
    setShowWarning(false); setMessages([]); setPersuasionCount(0); setUserInput(""); setCurrentTactics([])
    setTimeout(() => sendToLLM([{ role: "system", content: "start" }]), 800)
  }, [sendToLLM])

  const handleNextLevel = useCallback(() => {
    setShowWarning(false); setGameLevel((prev) => prev + 1); setMessages([])
    setPersuasionCount(0); setUserInput(""); setCurrentTactics([])
    setTimeout(() => sendToLLM([{ role: "system", content: "start" }]), 800)
  }, [sendToLLM])

  if (phase === "levels") return <LevelSelect onSelectLevel={handleSelectLevel} />
  if (phase === "onboarding") return <OnboardingScreen onStart={() => setPhase("chat")} t={t} />

  if (serverError && messages.length === 0) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-[400px] p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="font-semibold text-gray-800 mb-2">{t("chat.serverError")}</h3>
        <p className="text-sm text-gray-500 mb-4">{t("chat.serverErrorDesc")}</p>
        <Button onClick={handleRestart} variant="outline"><RotateCcw className="h-4 w-4 mr-2" />{t("chat.tryAgain")}</Button>
      </div>
    )
  }

  const showSuggestions = messages.length <= 1 && !scammerTyping

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[min(500px,80vh)] sm:h-[min(550px,80vh)] md:h-[min(600px,80vh)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-xl shrink-0 shadow-md">
        <div className="relative">
          <Avatar className="h-11 w-11 border-2 border-white/30">
            <AvatarFallback className="bg-red-800 text-white text-sm font-bold">KBZ</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-white rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">{t("chat.kbzSecurity")}</p>
            <svg className="h-4 w-4 text-blue-200 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-red-200">
            {scammerTyping ? <span className="animate-pulse">{t("chat.typing")}</span> :
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 bg-green-400 rounded-full inline-block" />{t("chat.online")}</span>}
          </p>
        </div>
        <button onClick={handleReport} className="p-2 hover:bg-white/10 rounded-full transition-colors" title={t("chat.report")}>
          <Flag className="h-4 w-4" />
        </button>
      </div>

      {/* Educational Tooltips */}
      <EducationalTooltip tactics={currentTactics} t={t} />

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#e5ddd5] border-x">
        <div ref={scrollRef} className="space-y-2 p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%]">
                <div className={`rounded-xl px-3 py-2 text-sm shadow-sm ${msg.role === "user" ? "bg-[#dcf8c6] text-gray-800 rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm"}`}>
                  {msg.content}
                </div>
                <p className={`text-[10px] text-gray-500 mt-0.5 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  {msg.timestamp ? formatTime(msg.timestamp) : ""}
                </p>
              </div>
            </div>
          ))}
          {streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="bg-white text-gray-800 rounded-xl rounded-tl-sm px-3 py-2 text-sm shadow-sm">
                  {streamingText}<span className="animate-pulse ml-0.5 text-gray-400">|</span>
                </div>
              </div>
            </div>
          )}
          {scammerTyping && !streamingText && (
            <div className="flex justify-start">
              <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Replies */}
      {showSuggestions && !scammerTyping && messages.length > 0 && (
        <div className="px-3 py-2 bg-[#f0f0f0] border-t shrink-0">
          <p className="text-[10px] text-gray-500 mb-2 text-center">{t("chat.suggestedReplies")}</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {(SUGGESTED_REPLIES[currentLang] || SUGGESTED_REPLIES.en).map((reply, i) => (
              <button key={i} onClick={() => handleSuggestedReply(reply)} className="px-3 py-1.5 bg-white text-gray-700 text-xs rounded-full border hover:bg-gray-50 transition-colors">
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      {outcome === null && (
        <div className="p-2 bg-[#f0f0f0] border-t shrink-0">
          <div className="flex gap-2 items-center">
            <Input value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder")} disabled={isLoading} className="flex-1 bg-white rounded-full border-0 h-10 text-sm" />
            <Button onClick={handleSend} disabled={!userInput.trim() || isLoading} className="h-10 w-10 rounded-full bg-green-600 hover:bg-green-700 p-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">{t("chat.tip")}</p>
        </div>
      )}

      {/* Debrief Screen */}
      {showDebrief && (
        <DebriefScreen outcome={outcome} messages={messages} onRestart={handleRestart} onClose={() => { setShowDebrief(false); setPhase("onboarding") }} t={t} />
      )}

      {/* Warning Popup */}
      {showWarning && <WarningPopup onStartOver={handleStartOver} onNextLevel={handleNextLevel} t={t} />}
    </div>
  )
}
