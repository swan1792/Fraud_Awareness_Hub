import { ThoughtBubble } from "./ThoughtBubble"

/**
 * Character - A game character with thought bubble
 * @param {'scammer'|'target'|'good_friend'} type - Character type
 * @param {string} name - Display name
 * @param {string} bubbleText - Current bubble text (null to hide)
 * @param {boolean} bubbleVisible - Whether bubble is shown
 * @param {number} bubbleDelay - Animation delay for bubble
 * @param {boolean} isPlayer - Whether this character is the player (Good Friend)
 */
export function Character({
  type = "target",
  name,
  bubbleText,
  bubbleVisible = false,
  bubbleDelay = 0,
  isPlayer = false,
  className = "",
}) {
  // Character visual styles
  const characterStyles = {
    scammer: {
      avatar: "bg-red-100 border-red-300",
      label: "text-red-600",
      emoji: "🎭", // Mask emoji for scammer
      roleLabel: "Scammer",
    },
    target: {
      avatar: "bg-blue-100 border-blue-300",
      label: "text-blue-600",
      emoji: "👤", // Person emoji for target
      roleLabel: "Target",
    },
    good_friend: {
      avatar: "bg-green-100 border-green-300",
      label: "text-green-600",
      emoji: "👓", // Glasses for tech-savvy friend
      roleLabel: "You (Good Friend)",
    },
  }

  const styles = characterStyles[type] || characterStyles.target

  return (
    <div className={`relative flex flex-col items-center gap-2 ${className}`}>
      {/* Thought Bubble */}
      <ThoughtBubble
        text={bubbleText}
        role={type}
        visible={bubbleVisible}
        delay={bubbleDelay}
      />

      {/* Character Avatar */}
      <div className="relative">
        {/* Player indicator ring - only on Good Friend */}
        {isPlayer && (
          <div className="absolute -inset-2 rounded-full border-4 border-green-500 animate-pulse" />
        )}
        <div
          className={`
            w-16 h-16 sm:w-20 sm:h-20
            rounded-full border-3 ${styles.avatar}
            flex items-center justify-center
            text-2xl sm:text-3xl
            shadow-md
          `}
        >
          {styles.emoji}
        </div>
      </div>

      {/* Character Name/Role */}
      <div className="text-center">
        {name && (
          <p className="text-xs sm:text-sm font-medium text-gray-700">{name}</p>
        )}
        <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${styles.label}`}>
          {styles.roleLabel}
        </p>
      </div>
    </div>
  )
}
