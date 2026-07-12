import { useState, useRef, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Send, AlertTriangle, ShieldCheck, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function containsOTP(text) {
  return /\d{3,}/.test(text) || /otp/i.test(text)
}

export function ScammerChatSimulator() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState("")
  const [outcome, setOutcome] = useState(null)
  const [refusalCount, setRefusalCount] = useState(0)
  const [scammerTyping, setScammerTyping] = useState(false)
  const scrollRef = useRef(null)

  const sendScammerMessage = useCallback((text) => {
    setScammerTyping(true)
    const delay = 1000 + Math.random() * 1000
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: `scammer-${Date.now()}`, role: "scammer", text, time: new Date().toLocaleTimeString() }])
      setScammerTyping(false)
    }, delay)
  }, [])

  useEffect(() => {
    const initTimer = setTimeout(() => {
      sendScammerMessage(t("chat.initialMessage"))
    }, 800)
    return () => clearTimeout(initTimer)
  }, [sendScammerMessage, t])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, scammerTyping])

  const processUserMessage = useCallback(
    (text) => {
      if (containsOTP(text)) {
        sendScammerMessage(t("chat.thankYouMessage"))
        setTimeout(() => setOutcome("scammed"), 2500)
        return
      }
      const newRefusalCount = refusalCount + 1
      setRefusalCount(newRefusalCount)
      if (newRefusalCount === 1) {
        sendScammerMessage(t("chat.pressureMessage"))
      } else {
        sendScammerMessage(t("chat.goodbyeMessage"))
        setTimeout(() => setOutcome("safe"), 2500)
      }
    },
    [refusalCount, sendScammerMessage, t]
  )

  const handleSend = useCallback(() => {
    const trimmed = userInput.trim()
    if (!trimmed || outcome !== null) return
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", text: trimmed, time: new Date().toLocaleTimeString() }])
    setUserInput("")
    processUserMessage(trimmed)
  }, [userInput, outcome, processUserMessage])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleRestart = useCallback(() => {
    setMessages([])
    setUserInput("")
    setOutcome(null)
    setRefusalCount(0)
    setScammerTyping(false)
    setTimeout(() => {
      sendScammerMessage(t("chat.initialMessage"))
    }, 800)
  }, [sendScammerMessage, t])

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[min(500px,80vh)] sm:h-[min(550px,80vh)] md:h-[min(600px,80vh)]">
      {/* Chat Header - fixed at top */}
      <div className="flex items-center gap-3 p-4 bg-red-600 text-white rounded-t-xl shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-red-800 text-white text-sm">KBZ</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{t("chat.kbzSecurity")}</p>
          <p className="text-xs text-red-200">{scammerTyping ? t("chat.typing") : t("chat.online")}</p>
        </div>
      </div>

      {/* Messages Area - scrollable, takes remaining space */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 border-x p-4">
        <div ref={scrollRef} className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white text-gray-800 border rounded-bl-md shadow-sm"
                }`}
              >
                {msg.text}
                {msg.time && <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-blue-200" : "text-gray-400"}`}>{msg.time}</p>}
              </div>
            </div>
          ))}
          {scammerTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-500 border rounded-2xl rounded-bl-md px-4 py-2 text-sm shadow-sm">
                <span className="animate-pulse">&bull; &bull; &bull;</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Outcome Alert - fixed above input when visible */}
      {outcome !== null && (
        <div className={`p-4 flex items-start gap-3 shrink-0 ${outcome === "scammed" ? "bg-red-50 border-x border-t border-red-200" : "bg-green-50 border-x border-t border-green-200"}`}>
          {outcome === "scammed" ? (
            <>
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">{t("chat.scammedTitle")}</p>
                <p className="text-xs text-red-700 mt-1">
                  {t("chat.scammedDesc")}
                </p>
              </div>
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 text-sm">{t("chat.safeTitle")}</p>
                <p className="text-xs text-green-700 mt-1">
                  {t("chat.safeDesc")}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Input Area - always fixed at bottom */}
      <div className="p-3 bg-white border border-t-0 rounded-b-xl shrink-0">
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={outcome !== null ? t("chat.gameOver") : t("chat.placeholder")}
            disabled={outcome !== null}
            className="flex-1"
          />
          {outcome !== null ? (
            <Button onClick={handleRestart} variant="outline">
              <RotateCcw className="h-4 w-4 mr-1" />
              {t("chat.restart")}
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!userInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        {outcome === null && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            {t("chat.tip")}
          </p>
        )}
      </div>
    </div>
  )
}
