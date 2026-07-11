import { useTranslation } from "react-i18next"
import { AlertTriangle, ShieldCheck } from "lucide-react"
import { useStatsQuery } from "@/lib/api"

export function HeroSection() {
  const { t } = useTranslation()
  const { data: hubStats = [] } = useStatsQuery()

  return (
    <section className="relative overflow-hidden text-red-950">
      {/* Dark animated background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#09090c]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,182,212,0.08),transparent_35%,transparent_60%,rgba(59,130,246,0.1))]" />
        <div className="absolute -left-[18%] -top-[45%] h-[140%] w-[55%] rounded-full bg-cyan-400/35 blur-[150px]" />
        <div className="absolute left-[17%] -top-[35%] h-[115%] w-[38%] rounded-full bg-purple-600/30 blur-[160px]" />
        <div className="absolute right-[4%] -top-[45%] h-[130%] w-[48%] rounded-full bg-violet-600/35 blur-[170px]" />
        <div className="absolute -right-[20%] -top-[40%] h-[145%] w-[55%] rounded-full bg-blue-500/35 blur-[160px]" />
        <div className="absolute left-[48%] top-[20%] h-[70%] w-[25%] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,8,12,0.88)_0%,rgba(8,8,12,0.48)_33%,transparent_68%)]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />
        <div className="absolute inset-0 shadow-[inset_0_0_180px_30px_rgba(0,0,0,0.55)]" />
        <div className="absolute left-1/2 top-[45%] h-40 w-[45%] -translate-x-1/2 rounded-full bg-white/[0.025] blur-[80px]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-3 px-4 pt-28 pb-12 md:pt-32 md:pb-20">
        {/* Main Headline */}
        <div className="flex items-start gap-3 mb-4">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white leading-tight">
            {t("hero.title")}
          </h1>
        </div>

        {/* Urgent Warning Banner - Glass Effect */}
        <div className="flex flex-wrap items-start gap-3 rounded-xl p-4 mb-8 border-2 border-red-500/55 bg-red-500/20 shadow-lg backdrop-blur-3xl backdrop-saturate-150">
          <AlertTriangle className="size-10 sm:size-14 text-red-500 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-lg sm:text-2xl text-red-500">
              {t("hero.warningBanner")}
            </h2>
            <p className="text-slate-300 mt-1 text-sm sm:text-base">
              {t("hero.warningMessage")}
            </p>
          </div>
        </div>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10">
          {t("hero.subtitle")}
        </p>

        {/* Stats Grid - Glass Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {hubStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-5 text-center border border-white/55 bg-white/5 shadow-lg backdrop-blur-3xl backdrop-saturate-150 text-white"
            >
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-white mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
