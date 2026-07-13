import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Tag } from "lucide-react"
import { useAlertsQuery } from "@/lib/api"
import { ScamCard } from "./scam-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const categories = ["Fake APK", "Phishing Link", "Social Engineering"]

export function ScamPatternsGrid() {
  const { t } = useTranslation()
  const { data: patterns = [], isLoading } = useAlertsQuery()
  const [activeFilter, setActiveFilter] = useState(null)

  const filteredPatterns = activeFilter
    ? patterns.filter((p) => p.category === activeFilter)
    : patterns

  if (isLoading) {
    return (
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="relative mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">{t("patterns.title")}</h2>
          <p className="mt-3 text-gray-500">{t("patterns.loading")}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      {/* Background accents */}
      <div className="absolute top-20 left-[10%] h-48 w-48 rounded-full bg-red-200/20 blur-3xl" />
      <div className="absolute right-[8%] bottom-16 h-40 w-40 rounded-full bg-orange-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-red-800 shadow-sm backdrop-blur-sm">
            <span className="text-base">🛡</span>
            {t("patterns.knowTactics")}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
            {t("patterns.title")}
          </h2>
          <p className="mt-3 text-base leading-7 text-gray-600 md:text-lg">
            {t("patterns.subtitle")}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mb-8">
          {/* Mobile: Select dropdown */}
          <div className="md:hidden">
            <Select
              value={activeFilter ?? "all"}
              onValueChange={(v) => setActiveFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="h-11 min-w-0 rounded-full border-border/70 bg-background/90 px-3 shadow-none backdrop-blur-sm focus:ring-2 focus:ring-red-300/30 sm:px-4">
                <div className="flex min-w-0 items-center gap-2">
                  <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder={t("patterns.allTags")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("patterns.all")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{t(`scamCard.categories.${cat}`, cat)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Button pills */}
          <div className="hidden flex-wrap gap-2 md:flex">
            <button
              onClick={() => setActiveFilter(null)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeFilter === null
                  ? "bg-red-600 text-white shadow-md shadow-red-200/50"
                  : "bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm hover:bg-gray-100"
              }`}
            >
              {t("patterns.all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeFilter === cat
                    ? "bg-red-600 text-white shadow-md shadow-red-200/50"
                    : "bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm hover:bg-gray-100"
                }`}
              >
                {t(`scamCard.categories.${cat}`, cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Scam Cards Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatterns.map((pattern) => (
            <ScamCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      </div>
    </section>
  )
}
