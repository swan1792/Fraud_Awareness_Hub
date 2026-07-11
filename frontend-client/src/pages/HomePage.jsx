import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { MessageSquareWarning, Gamepad2, FileSearch, ArrowUpRight } from "lucide-react"
import { HeroSection } from "@/components/features/hero-section"
import { ScamPatternsGrid } from "@/components/features/scam-patterns-grid"

export function HomePage() {
  const { t } = useTranslation()

  const games = [
    {
      to: "/game",
      title: t("home.games.phishing.title"),
      description: t("home.games.phishing.description"),
      eyebrow: t("home.games.phishing.eyebrow"),
      icon: Gamepad2,
      accent: "text-red-700",
      iconBg: "bg-red-100",
      glow: "group-hover:shadow-red-200/70",
      gradient: "from-red-500 to-orange-500",
    },
    {
      to: "/simulator",
      title: t("home.games.simulator.title"),
      description: t("home.games.simulator.description"),
      eyebrow: t("home.games.simulator.eyebrow"),
      icon: MessageSquareWarning,
      accent: "text-purple-700",
      iconBg: "bg-purple-100",
      glow: "group-hover:shadow-purple-200/70",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      to: "/spot-fake",
      title: t("home.games.spotFake.title"),
      description: t("home.games.spotFake.description"),
      eyebrow: t("home.games.spotFake.eyebrow"),
      icon: FileSearch,
      accent: "text-orange-700",
      iconBg: "bg-orange-100",
      glow: "group-hover:shadow-orange-200/70",
      gradient: "from-orange-500 to-yellow-500",
    },
  ]

  return (
    <>
      <HeroSection />

      {/* Games CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-white px-4 py-16 md:py-24">
        <div className="absolute top-12 left-[8%] h-36 w-36 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute right-[5%] bottom-8 h-48 w-48 rounded-full bg-red-200/25 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
              {t("home.sectionTitle")}
            </h2>
            <p className="mt-3 text-base leading-7 text-gray-600 md:text-lg">
              {t("home.sectionSubtitle")}
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
            {games.map((game) => (
              <Link
                key={game.to}
                to={game.to}
                className={`group relative flex h-full min-h-64 flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-orange-200 hover:shadow-xl hover:-translate-y-2 ${game.glow}`}
              >
                {/* Gradient glow blob */}
                <div className={`absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br ${game.gradient} opacity-10 group-hover:opacity-20 blur-2xl transition-opacity`} />

                <div className="relative mb-8 flex items-start justify-between">
                  <div className={`rounded-2xl p-3.5 transition-transform duration-300 group-hover:scale-110 ${game.iconBg}`}>
                    <game.icon className={`h-7 w-7 ${game.accent}`} />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-400 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gray-900" />
                </div>

                <div className="relative mt-auto">
                  <p className={`mb-2 text-xs font-bold tracking-widest uppercase ${game.accent}`}>
                    {game.eyebrow}
                  </p>
                  <h3 className="text-xl font-bold text-gray-950">{game.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{game.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ScamPatternsGrid />
    </>
  )
}
