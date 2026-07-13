import { useEffect, useState } from "react"

/**
 * ThoughtBubble - Cloud-style thought bubble for characters
 * @param {string} text - The text to display (max 2 lines, 4-6 words per line)
 * @param {'scammer'|'target'|'good_friend'} role - Character role (determines color)
 * @param {boolean} visible - Whether bubble is shown
 * @param {number} delay - Animation delay in ms
 */
export function ThoughtBubble({ text, role = "target", visible = false, delay = 0 }) {
  const [show, setShow] = useState(false)
  const [displayText, setDisplayText] = useState("")

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setShow(true)
        setDisplayText(text)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      setShow(false)
      setDisplayText("")
    }
  }, [visible, text, delay])

  // Color schemes by role
  const roleStyles = {
    scammer: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-800",
      tail: "bg-red-50",
      // Slightly sharper edges for scammer
      shape: "rounded-xl",
    },
    target: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-800",
      tail: "bg-blue-50",
      // Soft rounded for target
      shape: "rounded-2xl",
    },
    good_friend: {
      bg: "bg-green-50",
      border: "border-green-300",
      text: "text-green-800",
      tail: "bg-green-50",
      // Rounded for good friend
      shape: "rounded-2xl",
    },
  }

  const styles = roleStyles[role] || roleStyles.target

  if (!show || !displayText) return null

  return (
    <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Bubble body */}
      <div
        className={`
          relative px-4 py-2.5 min-w-[120px] max-w-[200px]
          ${styles.bg} ${styles.border} ${styles.shape}
          border-2 shadow-lg
        `}
      >
        <p className={`text-xs sm:text-sm font-medium text-center leading-tight ${styles.text}`}>
          {displayText}
        </p>
      </div>

      {/* Tail */}
      <div className="flex justify-center">
        <div
          className={`
            w-3 h-3 ${styles.tail} ${styles.border}
            border-b-2 border-r-2 rotate-45 -mt-1.5
          `}
        />
      </div>
    </div>
  )
}
