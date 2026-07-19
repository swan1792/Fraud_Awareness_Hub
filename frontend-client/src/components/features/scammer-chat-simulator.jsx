import { useState, useRef, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Send, AlertTriangle, ShieldCheck, RotateCcw, Loader2, Flag, X, ChevronRight, MessageCircle, BookOpen, Phone } from "lucide-react"
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

// Helper: detect if user clicked/downloaded a fake link (Level 2)
function isFakeLinkClick(text) {
  const lower = text.toLowerCase()
  // Fake KBZ domains
  const fakeDomains = [
    "kbz-secure-update.com",
    "kbzbank-verify.net",
    "kbzpay-security.com",
    "kbz-update-portal.com",
    "kbz-app-fix.com",
  ]
  if (fakeDomains.some(d => lower.includes(d))) return true
  // Generic URL patterns with kbz
  if (/https?:\/\/kbz[^\s]+/i.test(lower)) return true
  if (/kbz[^\s]*\.com/i.test(lower)) return true
  if (/kbz[^\s]*\.net/i.test(lower)) return true
  return false
}

// Helper: detect if user downloaded/opened the fake app (Level 2)
function isDownloadAction(text) {
  const lower = text.toLowerCase().trim()

  // Exclude questions (contains ? or question words)
  const questionPatterns = ["?", "ဘာလို့", "ဘာကြောင့်", "ဘာဖြစ်", "ဘာလဲ", "ဘယ်လောက်", "မလုပ်ရင်", "why", "how", "what"]
  if (questionPatterns.some(w => lower.includes(w))) return false

  // Only match explicit confirmation
  const explicit = [
    "downloaded it", "i downloaded", "i opened it", "i clicked it",
    "i installed", "installed it", "opened the app", "clicked the link",
    "done it", "yes i downloaded", "yes i installed", "yes i opened",
    "yes i clicked", "i have downloaded", "i already downloaded",
    "just downloaded", "just installed", "just opened", "just clicked",
    // Burmese patterns
    "download ဆွဲပြီး", "download လုပ်ပြီး", "download ရပြီ", "downloadပြီ",
    "ဆွဲပြီးပါပြီ", "လုပ်ပြီးပါပြီ", "ရပြီပါပြီ", "ပြီပါပြီ",
    "installed", "open", "click",
  ]
  if (explicit.some(w => lower.includes(w))) return true

  // Match standalone "download" word (not part of a question)
  if (/^download$/i.test(lower)) return true

  return false
}

// Helper: detect if user agreed to pay fees (Level 3)
function isPaymentAction(text) {
  const lower = text.toLowerCase().trim()

  // Exclude questions
  const questionPatterns = ["?", "ဘာလို့", "ဘာကြောင့်", "ဘာဖြစ်", "ဘာလဲ", "ဘယ်လောက်", "မလုပ်ရင်", "why", "how", "what"]
  if (questionPatterns.some(w => lower.includes(w))) return false

  const explicit = [
    "pay", "transfer", "paid", "send money", "payment", "paid the fee", "money sent", "transferred", "done payment",
    "yes i'll pay", "i'll pay", "ok i'll pay", "sure i'll pay",
    "ငွေလွှဲ", "ပေးပြီ", "လွှဲပြီ", "ငွေပေး", "ပို့ပြီ", "လွှဲပြီးပါပြီ", "ငွေပို့ပြီ", "ဟုတ်ကဲ့ ပေးမယ်", "ကောင်းပြီ ပေးမယ်",
  ]
  return explicit.some(w => lower.includes(w))
}

// Helper: detect scam tactics in scammer message (level-aware)
function detectTactics(message, level = 1) {
  const tactics = []
  const lower = message.toLowerCase()

  // Common tactics (all levels)
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

  // Guilt manipulation
  if (lower.includes("family") || lower.includes("help you") || lower.includes("trying to")) {
    tactics.push({ type: "guilt", label: "Emotional Manipulation", explanation: "Scammers use guilt and sympathy to lower your defenses." })
  }

  // Level-specific tactics
  if (level === 1) {
    // OTP request
    if (lower.includes("otp") || lower.includes("code") || lower.includes("verification")) {
      tactics.push({ type: "otp_request", label: "OTP Request", explanation: "Banks NEVER ask for your OTP. This is always a scam." })
    }
  } else if (level === 2) {
    // Fake link / download request
    if (lower.includes("download") || lower.includes("link") || lower.includes("update") || lower.includes(".com") || lower.includes(".net") || lower.includes("patch") || lower.includes("install")) {
      tactics.push({ type: "fake_link", label: "Malicious Link", explanation: "Scammers send fake links to install malware or steal your data." })
    }
    // Fake security claim
    if (lower.includes("vulnerability") || lower.includes("security flaw") || lower.includes("hacked") || lower.includes("compromised version") || lower.includes("malware")) {
      tactics.push({ type: "fake_security", label: "Fake Security Alert", explanation: "Scammers create fake emergencies to make you act without thinking." })
    }
    // Fake proof
    if (lower.includes("version") || lower.includes("logs") || lower.includes("system shows") || lower.includes("i can see")) {
      tactics.push({ type: "fake_proof", label: "Fake Proof", explanation: "Scammers fabricate evidence to appear legitimate." })
    }
  }

  return tactics
}

// Educational Tooltip Component — overlay banner (doesn't affect layout)
function EducationalTooltip({ tactics, t, onDismiss }) {
  if (!tactics || tactics.length === 0) return null

  return (
    <div className="absolute top-14 left-0 right-0 z-10 mx-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="px-3 py-2 bg-amber-50/95 backdrop-blur border border-amber-200/60 rounded-lg flex items-center gap-2 shadow-sm">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-800">
            {tactics.map(t => t.label).join(" · ")}
          </p>
        </div>
        <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600 flex-shrink-0">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// Suggested replies (level-specific)
const SUGGESTED_REPLIES = {
  1: {
    en: [
      "Who are you?",
      "How did you get my number?",
      "Prove you're from KBZ",
      "Which branch are you from?",
      "Why do you need my OTP?",
      "I'll call the bank myself",
    ],
    my: [
      "ဘယ်သူလဲ?",
      "ဖုန်းနံပါတ်ကို ဘယ်လိုရတာလဲ?",
      "KBZ ကနေဖြစ်တယ်ဆိုတာ သက်သေပြပါ",
      "ဘယ် Branch ကလဲ?",
      "OTP ဘာလို့လိုတာလဲ?",
      "ကိုယ်တိုင် ဘဏ်ကို ဖုန်းဆက်မယ်",
    ],
  },
  2: {
    en: [
      "What is this app?",
      "Why do I need to download?",
      "What features does it have?",
      "What if I don't download?",
      "How do I know this is real?",
      "Can I update from Play Store?",
    ],
    my: [
      "ဒါဘာ app လဲ?",
      "ဘာလို့ download လုပ်ရတာလဲ?",
      "ဘာတွေ ပါဝင်လဲ?",
      "Download မလုပ်ရင် ဘာဖြစ်မလဲ?",
      "ဒါ ဘယ်လောက် စိတ်ချရလဲ?",
      "Play Store ကနေ update လုပ်လို့ မရဘူးလား?",
    ],
  },
  3: {
    en: [
      "What company is this?",
      "What job is available?",
      "Why do I need to pay fees?",
      "How do I know this is real?",
      "Can I verify your license?",
      "What if I don't pay?",
    ],
    my: [
      "ဘယ်ကုမ္ပဏီလဲ?",
      "ဘာအလုပ်လဲ?",
      "ဆောင်ရွက်ခ ဘာလို့ပေးရတာလဲ?",
      "ဒါ ဘယ်လောက် စိတ်ချရလဲ?",
      "လိုင်စင်ကို စစ်ဆေးလို့ ရလား?",
      "မပေးရင် ဘာဖြစ်မလဲ?",
    ],
  },
}

// Onboarding Screen
function OnboardingScreen({ onStart, t, level }) {
  const prefix = level ? `onboarding.level${level}` : "onboarding.level1"
  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[360px] h-[min(480px,75vh)] p-4 sm:p-6 text-center overflow-y-auto">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
        <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{t(`${prefix}.title`)}</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 max-w-xs">{t(`${prefix}.description`)}</p>
      <div className="w-full space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        <div className="flex items-start gap-3 text-left p-2.5 sm:p-3 bg-gray-50 rounded-lg">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-red-600 text-[10px] sm:text-xs font-bold">1</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700">{t(`${prefix}.step1`)}</p>
        </div>
        <div className="flex items-start gap-3 text-left p-2.5 sm:p-3 bg-gray-50 rounded-lg">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-orange-600 text-[10px] sm:text-xs font-bold">2</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700">{t(`${prefix}.step2`)}</p>
        </div>
        <div className="flex items-start gap-3 text-left p-2.5 sm:p-3 bg-gray-50 rounded-lg">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-600 text-[10px] sm:text-xs font-bold">3</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700">{t(`${prefix}.step3`)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4">
        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
        <span>{t(`${prefix}.warning`)}</span>
      </div>
      <Button onClick={onStart} className="w-full max-w-xs bg-green-600 hover:bg-green-700 h-9 sm:h-10">
        {t(`${prefix}.start`)}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}

// Comprehensive Debrief Screen
function DebriefScreen({ outcome, messages, onRestart, onClose, t, level }) {
  const wasScammed = outcome === "scammed"

  // Analyze tactics used (level-aware)
  const tacticsUsed = new Set()
  const scammerMessages = messages.filter(m => m.role === "assistant")
  scammerMessages.forEach(msg => {
    const tactics = detectTactics(msg.content, level)
    tactics.forEach(t => tacticsUsed.add(t.type))
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-[320px] w-full p-3 sm:p-4 shadow-xl max-h-[80vh] overflow-y-auto">
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
            {level === 2 ? (
              <>
                <div className="flex items-center gap-2 p-1.5 bg-red-50 rounded">
                  <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                  <p className="text-[10px] text-red-700">{t("debrief.redFlags.fakeLink")}</p>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-red-50 rounded">
                  <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                  <p className="text-[10px] text-red-700">{t("debrief.redFlags.fakeUpdate")}</p>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-red-50 rounded">
                  <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                  <p className="text-[10px] text-red-700">{t("debrief.redFlags.fakeSecurity")}</p>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
                <p className="text-[9px] text-green-600">{t("debrief.actions.bankPhone")}</p>
              </div>
            </div>
            {level === 2 ? (
              <>
                <div className="flex items-center gap-2 p-1.5 bg-green-50 rounded">
                  <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <p className="text-[10px] text-green-700">{t("debrief.actions.officialStore")}</p>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-green-50 rounded">
                  <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <p className="text-[10px] text-green-700">{t("debrief.actions.verifyLink")}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 p-1.5 bg-green-50 rounded">
                <ShieldCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
                <p className="text-[10px] text-green-700">{t("debrief.actions.neverShare")}</p>
              </div>
            )}
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

// Download Alert Popup - Shows when user falls for fake download
function DownloadAlertPopup({ onClose, t }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-[320px] w-full p-6 shadow-xl text-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-red-800 mb-2">
          {t("downloadAlert.title") || "⚠️ You've Been Scammed!"}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 mb-4">
          {t("downloadAlert.message") || "This was a fake app. In real life, downloading this would install malware on your phone and steal your money. Never download banking apps from unofficial links!"}
        </p>

        {/* Warning Points */}
        <div className="bg-red-50 rounded-lg p-3 mb-4 text-left">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{t("downloadAlert.warning1") || "Fake banking apps steal your login credentials"}</p>
          </div>
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{t("downloadAlert.warning2") || "Malware can access your OTP and drain your account"}</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{t("downloadAlert.warning3") || "Always download apps from official app stores only"}</p>
          </div>
        </div>

        {/* Action Button */}
        <Button onClick={onClose} className="w-full bg-red-600 hover:bg-red-700 text-white">
          {t("downloadAlert.continue") || "Continue to Debrief"}
        </Button>
      </div>
    </div>
  )
}

// Main Simulator Component
export function ScammerChatSimulator() {
  const { t, i18n } = useTranslation()
  const [phase, setPhase] = useState("levels") // levels | onboarding | chat | debrief
  const [selectedLevel, setSelectedLevel] = useState(null)

  // Push state to browser history when phase changes (so back button works)
  const setPhaseWithHistory = useCallback((newPhase) => {
    window.history.pushState({ phase: newPhase }, "", "")
    setPhase(newPhase)
  }, [])

  // Handle back button - always go to levels
  useEffect(() => {
    const handlePopState = (event) => {
      // Always go back to level select, not to chat
      setPhase("levels")
      setSelectedLevel(null)
      setMessages([])
      setOutcome(null)
      setShowDebrief(false)
      setShowDownloadAlert(false)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState("")
  const [outcome, setOutcome] = useState(null)
  const [scammerTyping, setScammerTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [modelStatus, setModelStatus] = useState(null)
  const [serverError, setServerError] = useState(false)
  const [showDebrief, setShowDebrief] = useState(false)
  const [showDownloadAlert, setShowDownloadAlert] = useState(false)
  const [persuasionCount, setPersuasionCount] = useState(0)
  const [currentTactics, setCurrentTactics] = useState([])
  const scrollRef = useRef(null)
  const tacticsTimeoutRef = useRef(null)
  const messagesRef = useRef([])
  messagesRef.current = messages

  const currentLang = i18n.language?.startsWith("my") ? "my" : "en"

  useEffect(() => {
    checkSimulatorHealth().then(setModelStatus).catch(() => setServerError(true))
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, scammerTyping, streamingText])

  const addScammerMessage = useCallback((text) => {
    setMessages((prev) => [
      ...prev,
      { id: `scammer-${crypto.randomUUID()}`, role: "assistant", content: text, timestamp: new Date() },
    ])
    // Detect and show tactics (level-aware)
    const tactics = detectTactics(text, selectedLevel || 1)
    setCurrentTactics(tactics)
    // Clear previous timeout and reset — tooltip stays visible until next message
    if (tacticsTimeoutRef.current) clearTimeout(tacticsTimeoutRef.current)
    tacticsTimeoutRef.current = setTimeout(() => setCurrentTactics([]), 15000)
  }, [selectedLevel])

  const [waitingPhase, setWaitingPhase] = useState("") // "connecting" | "warming" | "generating"

  const sendToLLM = useCallback(
    async (conversationMessages) => {
      setScammerTyping(true)
      setStreamingText("")
      setIsLoading(true)
      setServerError(false)
      setWaitingPhase("connecting")

      // Phase progression: connecting → warming → generating
      const phaseTimer1 = setTimeout(() => setWaitingPhase("warming"), 5000)
      const phaseTimer2 = setTimeout(() => setWaitingPhase("generating"), 15000)

      // 120s timeout to match backend
      const timeoutId = setTimeout(() => {
        clearTimeout(phaseTimer1)
        clearTimeout(phaseTimer2)
        setScammerTyping(false)
        setIsLoading(false)
        setServerError(true)
        setWaitingPhase("")
      }, 120000)

      let fullResponse = ""
      let firstTokenReceived = false

      await streamChatMessage(
        conversationMessages,
        {
          onToken: (token) => {
            if (!firstTokenReceived) {
              firstTokenReceived = true
              setWaitingPhase("")
            }
            fullResponse += token
            setStreamingText(fullResponse)
          },
          onDone: () => {
            clearTimeout(timeoutId)
            clearTimeout(phaseTimer1)
            clearTimeout(phaseTimer2)
            setWaitingPhase("")
            if (fullResponse) addScammerMessage(fullResponse)
            setStreamingText("")
            setScammerTyping(false)
            setIsLoading(false)

            setPersuasionCount((prev) => prev + 1)
          },
          onError: (err) => {
            clearTimeout(timeoutId)
            clearTimeout(phaseTimer1)
            clearTimeout(phaseTimer2)
            setWaitingPhase("")
            console.error("LLM error:", err); setScammerTyping(false); setIsLoading(false); setServerError(true)
          },
        },
        { max_tokens: 150, temperature: 0.8, language: currentLang, level: selectedLevel || 1 }
      )
    },
    [addScammerMessage, currentLang, persuasionCount, selectedLevel]
  )

  // Send initial greeting when entering chat phase (only once)
  const hasSentGreeting = useRef(false)
  const sendToLLMRef = useRef(sendToLLM)
  sendToLLMRef.current = sendToLLM
  useEffect(() => {
    if (phase === "chat" && !hasSentGreeting.current) {
      hasSentGreeting.current = true
      const initTimer = setTimeout(() => sendToLLMRef.current([{ role: "system", content: "start" }]), 800)
      return () => clearTimeout(initTimer)
    }
    if (phase !== "chat") {
      hasSentGreeting.current = false
    }
  }, [phase])

  const processUserMessage = useCallback(
    async (text) => {
      // Level 1: OTP detection
      if (selectedLevel === 1 && isExplicitOTP(text, currentLang)) {
        setMessages((prev) => [...prev, { id: `user-${crypto.randomUUID()}`, role: "user", content: text, timestamp: new Date() }])
        setScammerTyping(true)
        setTimeout(() => {
          addScammerMessage(currentLang === "my" ? "အတည်ပြုပြီးပါပြီ။ ကျေးဇူးတင်ပါသည်။" : "Verification complete. Your account has been secured.")
          setScammerTyping(false)
          setTimeout(() => { setOutcome("scammed"); setShowDebrief(true) }, 1500)
        }, 1500)
        return
      }

      // Level 3: Job scam payment detection
      if (selectedLevel === 3 && isPaymentAction(text)) {
        setMessages((prev) => [...prev, { id: `user-${crypto.randomUUID()}`, role: "user", content: text, timestamp: new Date() }])
        setScammerTyping(true)
        setTimeout(() => {
          addScammerMessage(currentLang === "my" ? "ငွေလွှဲပြီးပါပြီ။ ကျေးဇူးတင်ပါတယ်။ သင့်အလုပ်ကို စတင်ဆောင်ရွက်ပေးပါမယ်။" : "Payment received! Thank you. We'll start processing your visa immediately.")
          setScammerTyping(false)
          setTimeout(() => { setOutcome("scammed"); setShowDownloadAlert(true) }, 1500)
        }, 1500)
        return
      }

      // Level 2: Fake link / download detection
      if (selectedLevel === 2 && (isFakeLinkClick(text) || isDownloadAction(text))) {
        setMessages((prev) => [...prev, { id: `user-${crypto.randomUUID()}`, role: "user", content: text, timestamp: new Date() }])
        setScammerTyping(true)
        setTimeout(() => {
          addScammerMessage(currentLang === "my" ? "ပြီးပါပြီ။ ကျေးဇူးတင်ပါသည်။ သင့်အကောင့်ကို ကာကွယ်ပေးပြီ။" : "Done. Your account has been protected. Thank you for updating.")
          setScammerTyping(false)
          setTimeout(() => { setOutcome("scammed"); setShowDownloadAlert(true) }, 1500)
        }, 1500)
        return
      }

      const newUserMsg = { id: `user-${crypto.randomUUID()}`, role: "user", content: text, timestamp: new Date() }
      setMessages((prev) => [...prev, newUserMsg])
      // Send to LLM outside the updater to prevent double-calls in concurrent mode
      sendToLLM([...messagesRef.current, newUserMsg].map((m) => ({ role: m.role, content: m.content })))
    },
    [sendToLLM, addScammerMessage, currentLang, selectedLevel]
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
    setPhaseWithHistory("onboarding")
  }, [setPhaseWithHistory])

  const handleRestart = useCallback(() => {
    setMessages([]); setUserInput(""); setOutcome(null); setScammerTyping(false)
    setStreamingText(""); setIsLoading(false); setServerError(false); setShowDebrief(false); setShowDownloadAlert(false)
    setPersuasionCount(0); setCurrentTactics([]); setPhaseWithHistory("levels")
    setSelectedLevel(null); setWaitingPhase("")
  }, [])

  // Retry last failed message without restarting entire chat
  const retryLastMessage = useCallback(() => {
    setServerError(false)
    // Find the last user message and resend it
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")
    if (lastUserMsg) {
      sendToLLM(messages.map(m => ({ role: m.role, content: m.content })))
    }
  }, [messages, sendToLLM])

  const resetChat = useCallback(() => {
    setMessages([]); setPersuasionCount(0); setUserInput(""); setCurrentTactics([]); setWaitingPhase("")
    setTimeout(() => sendToLLM([{ role: "system", content: "start" }]), 800)
  }, [sendToLLM])

  if (phase === "levels") return <LevelSelect onSelectLevel={handleSelectLevel} />
  if (phase === "onboarding") return <OnboardingScreen onStart={() => setPhaseWithHistory("chat")} t={t} level={selectedLevel} />

  if (serverError && messages.length === 0) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[300px] h-[min(400px,70vh)] p-4 sm:p-6 text-center">
        <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 mb-3 sm:mb-4" />
        <h3 className="font-semibold text-gray-800 mb-2">{t("chat.serverError")}</h3>
        <p className="text-sm text-gray-500 mb-4">{t("chat.serverErrorDesc")}</p>
        <Button onClick={handleRestart} variant="outline"><RotateCcw className="h-4 w-4 mr-2" />{t("chat.tryAgain")}</Button>
      </div>
    )
  }

  const showSuggestions = messages.length <= 12 && !scammerTyping && outcome === null

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[min(480px,75vh)] sm:h-[min(550px,80vh)] md:h-[min(600px,80vh)] min-h-[360px] relative">
      {/* Header */}
      <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-xl shrink-0 shadow-md">
        <div className="relative">
          <Avatar className="h-9 w-9 sm:h-11 sm:w-11 border-2 border-white/30">
            <AvatarFallback className="bg-red-800 text-white text-xs sm:text-sm font-bold">{selectedLevel === 3 ? "GRA" : "KBZ"}</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-400 border-2 border-white rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-xs sm:text-sm truncate">
              {selectedLevel === 3 ? "Global Recruitment Agency" : selectedLevel === 2 ? t("chat.kbzTechSupport") : t("chat.kbzSecurity")}
            </p>
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-200 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[10px] sm:text-xs text-red-200">
            {scammerTyping ? <span className="animate-pulse">{t("chat.typing")}</span> :
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 bg-green-400 rounded-full inline-block" />{t("chat.online")}{modelStatus && !modelStatus.model_loaded && <span className="text-red-300 ml-1">(Demo)</span>}</span>}
          </p>
        </div>
        <button onClick={handleReport} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors" title={t("chat.report")}>
          <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* Hint: Report button */}
      {messages.length <= 3 && !scammerTyping && (
        <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 border-b border-blue-100 text-center transition-opacity duration-500">
          <p className="text-[9px] sm:text-[10px] text-blue-600">
            {t("chat.reportHint")}
          </p>
        </div>
      )}

      {/* Educational Tooltips */}
      <EducationalTooltip tactics={currentTactics} t={t} onDismiss={() => setCurrentTactics([])} />

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#e5ddd5] border-x">
        <div ref={scrollRef} className="space-y-1.5 sm:space-y-2 p-2.5 sm:p-4">
          {messages.map((msg, idx) => (
            <div key={msg.id} ref={idx === messages.length - 1 ? (el) => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }) } : undefined} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="max-w-[85%]">
                <div className="bg-white text-gray-800 rounded-xl rounded-tl-sm px-3 py-2 text-sm shadow-sm">
                  {streamingText}<span className="animate-pulse ml-0.5 text-gray-400">|</span>
                </div>
              </div>
            </div>
          )}
          {scammerTyping && !streamingText && (
            <div className="flex justify-start animate-in fade-in duration-200">
              <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                {waitingPhase && (
                  <p className="text-[10px] text-gray-400 mt-1 animate-pulse">
                    {waitingPhase === "connecting" && (currentLang === "my" ? "ချိတ်ဆက်နေသည်..." : "Connecting...")}
                    {waitingPhase === "warming" && (currentLang === "my" ? "AI ပြင်ဆင်နေသည်..." : "AI is warming up...")}
                    {waitingPhase === "generating" && (currentLang === "my" ? "စဉ်းစားနေသည်..." : "Thinking...")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline error when messages exist */}
      {serverError && messages.length > 0 && (
        <div className="mx-2 sm:mx-3 mb-1.5 sm:mb-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
          <p className="text-[10px] sm:text-xs text-red-700 flex-1">{t("chat.connectionLost")}</p>
          <button onClick={retryLastMessage} className="text-[10px] sm:text-xs text-red-600 underline shrink-0">{t("chat.retry")}</button>
        </div>
      )}

      {/* Suggested Replies - normal flow above input */}
      {showSuggestions && !scammerTyping && messages.length > 0 && (
        <div className="px-2 sm:px-3 py-2 bg-[#f0f0f0] border-t shrink-0">
          <p className="text-[10px] text-gray-500 mb-1.5 text-center">{t("chat.suggestedReplies")}</p>
          <div className="flex gap-1.5 justify-center flex-wrap">
            {(SUGGESTED_REPLIES[selectedLevel]?.[currentLang] || SUGGESTED_REPLIES[selectedLevel]?.en || SUGGESTED_REPLIES[1]?.en || []).map((reply, i) => (
              <button key={i} onClick={() => handleSuggestedReply(reply)} className="px-2.5 py-1 bg-white text-gray-700 text-[11px] rounded-full border hover:bg-gray-50 transition-colors whitespace-nowrap">
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input - fixed at bottom */}
      {outcome === null && (
        <div className="p-2 bg-[#f0f0f0] border-t shrink-0">
          <div className="flex gap-2 items-center">
            <Input value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder")} disabled={isLoading} className="flex-1 bg-white rounded-full border-0 h-9 sm:h-10 text-sm" />
            <Button onClick={handleSend} disabled={!userInput.trim() || isLoading} className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-green-600 hover:bg-green-700 p-0 shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 mt-1.5">
            <button onClick={handleReport} className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 text-green-600 text-[10px] sm:text-xs rounded-full hover:bg-green-100 transition-colors border border-green-200">
              <Flag className="h-3 w-3" />
              <span>{t("chat.report")}</span>
            </button>
            <button onClick={() => setPhaseWithHistory("levels")} className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-600 text-[10px] sm:text-xs rounded-full hover:bg-gray-200 transition-colors border border-gray-200">
              <X className="h-3 w-3" />
              <span>{t("chat.end")}</span>
            </button>
            <button onClick={() => { const nextLevel = selectedLevel < 5 ? selectedLevel + 1 : 1; setSelectedLevel(nextLevel); setPhaseWithHistory("onboarding") }} className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 text-green-600 text-[10px] sm:text-xs rounded-full hover:bg-green-100 transition-colors border border-green-200">
              <ChevronRight className="h-3 w-3" />
              <span>{t("chat.next")}</span>
            </button>
          </div>
          <p className="text-[9px] sm:text-[10px] text-gray-400 text-center mt-1">{t("chat.tip")}</p>
        </div>
      )}

      {/* Download Alert Popup */}
      {showDownloadAlert && (
        <DownloadAlertPopup
          onClose={() => { setShowDownloadAlert(false); setShowDebrief(true) }}
          t={t}
        />
      )}

      {/* Debrief Screen */}
      {showDebrief && (
        <DebriefScreen outcome={outcome} messages={messages} onRestart={handleRestart} onClose={() => { setShowDebrief(false); setPhaseWithHistory("levels") }} t={t} level={selectedLevel} />
      )}
    </div>
  )
}
