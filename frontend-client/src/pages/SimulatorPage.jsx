import { useTranslation } from "react-i18next"
import { AlertTriangle, ShieldCheck } from "lucide-react"
import { ScammerChatSimulator } from "@/components/features/scammer-chat-simulator"
import { AnimatedBackground } from "@/components/section/animated-background"

export function SimulatorPage() {
  const { t } = useTranslation()

  return (
    <div className="relative isolate min-h-screen bg-[#09090c]">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden text-red-950">
          <div className="relative mx-auto flex max-w-6xl flex-col gap-3 px-4 pt-24 pb-6 sm:pt-28 sm:pb-12 md:pt-32 md:pb-20">
            <h1 className="text-2xl sm:text-5xl md:text-7xl font-bold text-white leading-tight">
              {t("simulator.title")}
            </h1>

            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:gap-10">
              <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl p-3 sm:p-4 border-2 border-red-500/55 bg-red-500/20 shadow-lg backdrop-blur-3xl backdrop-saturate-150">
                <AlertTriangle className="size-6 sm:size-8 md:size-10 text-red-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-sm sm:text-lg md:text-xl text-red-500">{t("simulator.neverShare")}</h2>
                  <p className="text-slate-300 mt-0.5 sm:mt-1 text-xs sm:text-sm">
                    {t("simulator.neverShareDesc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl p-3 sm:p-4 border-2 border-green-500/55 bg-green-500/20 shadow-lg backdrop-blur-3xl backdrop-saturate-150">
                <ShieldCheck className="size-6 sm:size-8 md:size-10 text-green-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-sm sm:text-lg md:text-xl text-green-500">{t("simulator.verifyFirst")}</h2>
                  <p className="text-slate-300 mt-0.5 sm:mt-1 text-xs sm:text-sm">
                    {t("simulator.verifyFirstDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chat Simulator */}
        <section className="px-3 sm:px-4 pb-12 sm:pb-20">
          <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_30px_90px_-35px_rgba(9,9,12,0.35)]">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-5 py-3 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                </span>
                {t("simulator.liveSimulation")}
              </div>
              <span>{t("simulator.doNotShare")}</span>
            </div>
            <ScammerChatSimulator />
          </div>
        </section>
      </div>
    </div>
  )
}
