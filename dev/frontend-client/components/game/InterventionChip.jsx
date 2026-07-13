import { useState, useEffect } from "react"

/**
 * InterventionChip - Tappable pill for intervention options
 * Positioned near the Good Friend character, staggered entrance
 *
 * @param {string} text - Intervention text
 * @param {function} onTap - Called when chip is tapped
 * @param {boolean} disabled - Whether chip is disabled
 * @param {number} delay - Animation delay in ms
 */
export function InterventionChip({ text, onTap, disabled = false, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  const [tapped, setTapped] = useState(false)
  const [tapResult, setTapResult] = useState(null) // null, 'correct', 'wrong'

  // Staggered entrance
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  // Handle tap
  const handleTap = () => {
    if (disabled || tapped) return

    setTapped(true)
    // Brief visual feedback before calling onTap
    setTimeout(() => {
      onTap()
    }, 150)
  }

  if (!visible) return null

  return (
    <button
      onClick={handleTap}
      disabled={disabled || tapped}
      className={`
        relative px-4 py-2 rounded-full text-sm font-medium
        border-2 shadow-md transition-all duration-200
        ${tapped
          ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-white border-cyan-300 text-gray-700 hover:bg-cyan-50 hover:border-cyan-400 hover:shadow-lg cursor-pointer active:scale-95"
        }
        ${disabled && !tapped ? "opacity-60 cursor-not-allowed" : ""}
        animate-in slide-in-from-left-4 fade-in duration-300
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Tap indicator */}
      {!tapped && !disabled && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
      )}

      {/* Chip text */}
      <span className="line-clamp-2">{text}</span>

      {/* Tap feedback */}
      {tapped && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg">👆</span>
        </span>
      )}
    </button>
  )
}
