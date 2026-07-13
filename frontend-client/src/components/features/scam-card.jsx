import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  Download,
  Link,
  Phone,
  Users,
  Package,
  Landmark,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const iconMap = {
  download: Download,
  link: Link,
  phone: Phone,
  users: Users,
  package: Package,
  landmark: Landmark,
}

const categoryIcons = {
  "Fake APK": Download,
  "Phishing Link": Link,
  "Social Engineering": Phone,
}

const categoryColors = {
  "Fake APK": "bg-orange-100 text-orange-800",
  "Phishing Link": "bg-blue-100 text-blue-800",
  "Social Engineering": "bg-purple-100 text-purple-800",
}

const categoryGradients = {
  "Fake APK": "from-orange-500 to-amber-500",
  "Phishing Link": "from-blue-500 to-cyan-500",
  "Social Engineering": "from-purple-500 to-pink-500",
}

const categoryGlows = {
  "Fake APK": "group-hover:shadow-orange-200/70",
  "Phishing Link": "group-hover:shadow-blue-200/70",
  "Social Engineering": "group-hover:shadow-purple-200/70",
}

export function ScamCard({ pattern }) {
  const { t, i18n } = useTranslation()
  const [isFlipped, setIsFlipped] = useState(false)
  const Icon = iconMap[pattern.icon] || categoryIcons[pattern.category] || AlertTriangle
  const gradient = categoryGradients[pattern.category] || "from-red-500 to-orange-500"
  const glow = categoryGlows[pattern.category] || "group-hover:shadow-red-200/70"
  const categoryLabel = t(`scamCard.categories.${pattern.category}`, pattern.category)

  // Check if this is an alert (has titleMy/descriptionMy) or a pattern (has redFlags/icon)
  const isAlert = !pattern.redFlags && !pattern.icon
  const lang = i18n.language

  // Check if Myanmar translation is available for alerts
  const hasMyanmar = isAlert && !!(pattern.titleMy || pattern.descriptionMy)

  // For alerts: use language-specific fields, fall back to English
  // For patterns: use i18n translation keys, fall back to API data
  const patternKey = `scamPatterns.${pattern.id}`
  const title = isAlert
    ? (lang === "my" && pattern.titleMy ? pattern.titleMy : pattern.title)
    : t(`${patternKey}.title`, pattern.title)
  const description = isAlert
    ? (lang === "my" && pattern.descriptionMy ? pattern.descriptionMy : pattern.description)
    : t(`${patternKey}.description`, pattern.description)

  let redFlags = pattern.redFlags
  if (!isAlert) {
    try {
      const translated = i18n.getResource(i18n.language, 'translation', `${patternKey}.redFlags`)
      if (Array.isArray(translated)) redFlags = translated
    } catch (e) { /* use API fallback */ }
  }

  // For alerts (no redFlags), split description into warning points
  const hasRedFlags = Array.isArray(redFlags) && redFlags.length > 0
  const warningPoints = !hasRedFlags
    ? description.split(/[.!?]+/).filter((s) => s.trim().length > 10).slice(0, 3)
    : []

  const handleTap = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  return (
    <article
      tabIndex={0}
      onClick={handleTap}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTap() } }}
      className="group relative h-full min-h-64 md:min-h-[380px] outline-none [perspective:1200px] cursor-pointer"
    >
      {/* Rotating card */}
      <div
        className={`relative h-full min-h-64 md:min-h-[380px] rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus:[transform:rotateY(180deg)] ${isFlipped ? "[transform:rotateY(180deg)]" : ""} group-hover:shadow-2xl group-focus:shadow-2xl ${glow}`}
      >
        {/* Front */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm [backface-visibility:hidden]">
          {/* Decorative glow */}
          <div className={`pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-gradient-to-br opacity-10 blur-3xl ${gradient}`} />

          <div className="relative flex h-full flex-col p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className={`grid size-10 sm:size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md ${gradient}`}>
                <Icon className="size-5" />
              </div>
              <Badge variant="secondary" className={`shrink-0 border-0 px-2 sm:px-2.5 py-1 text-[11px] font-semibold ${categoryColors[pattern.category] || ""}`}>
                {categoryLabel}
              </Badge>
            </div>

            {/* Main information */}
            <div className="mt-5 sm:mt-7">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-gray-950">{title}</h3>
              <p className="mt-2 sm:mt-3 text-sm sm:text-[15px] leading-6 sm:leading-7 text-gray-600">{description}</p>
              {isAlert && lang === "my" && !hasMyanmar && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-md px-2 py-1 inline-block">
                  Myanmar text is not available
                </p>
              )}
            </div>

            {/* Tap instruction (mobile) + Hover instruction (desktop) */}
            <div className="mt-auto pt-6 sm:pt-8">
              <div className="flex items-center gap-2 border-t border-gray-100 pt-4 text-sm font-medium text-gray-500">
                <RotateCcw className="size-4 text-orange-500" />
                <span className="sm:hidden">{t("scamCard.tapToReveal")}</span>
                <span className="hidden sm:inline">{t("scamCard.hoverToReveal")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-red-200 bg-white shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {/* Top accent */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-red-600" />

          <div className="relative flex h-full flex-col p-5 sm:p-6">
            {/* Back header */}
            <div className="flex items-center justify-between gap-3 border-b border-red-500 pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="grid size-8 sm:size-10 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
                  <AlertTriangle className="size-4 sm:size-5" />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-red-500">{t("scamCard.warningSigns")}</p>
                  <h3 className="text-base sm:text-lg font-bold text-gray-950">{t("scamCard.redFlags")}</h3>
                </div>
              </div>
              <span className="rounded-full bg-red-100 px-2 sm:px-2.5 py-1 text-xs font-bold text-red-700">
                {hasRedFlags ? redFlags.length : warningPoints.length}
              </span>
            </div>

            {/* Red flags or Warning points */}
            <ul className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
              {(hasRedFlags ? redFlags : warningPoints).map((flag, index) => (
                <li
                  key={`${flag}-${index}`}
                  className="flex items-start gap-2 sm:gap-3 rounded-xl border border-red-500 bg-red-50/70 px-3 py-2.5 sm:px-3.5 sm:py-3"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-red-500 text-[10px] sm:text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-medium leading-5 text-red-950">{flag.trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  )
}
