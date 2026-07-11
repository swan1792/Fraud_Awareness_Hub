import { useTranslation } from "react-i18next"
import { FileSearch, Eye, AlertTriangle } from "lucide-react"
import { SpotTheFakeGame } from "@/components/features/spot-the-fake-game"
import { AnimatedBackground } from "@/components/section/animated-background"

export function SpotFakePage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-zinc-50">
      <section className="relative isolate overflow-hidden text-white">
        <AnimatedBackground />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-24 md:pt-40 md:pb-32">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-orange-200 uppercase backdrop-blur-xl">
              <Eye className="size-4" />
              {t("spotFake.badge")}
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
              {t("spotFake.title")}{" "}
              <span className="bg-gradient-to-r from-orange-300 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                {t("spotFake.titleHighlight")}
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-xl md:leading-8">
              {t("spotFake.description")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-zinc-300 backdrop-blur-xl">
                <AlertTriangle className="size-4 text-orange-300" />
                {t("spotFake.flagsToFind")}
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-zinc-300 backdrop-blur-xl">
                <Eye className="size-4 text-orange-300" />
                {t("spotFake.clickToIdentify")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-12 px-4 pb-20 md:-mt-16 md:pb-28">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_30px_90px_-35px_rgba(9,9,12,0.35)]">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-5 py-3 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-orange-500" />
              </span>
              {t("spotFake.challengeActive")}
            </div>
            <span className="hidden sm:inline">{t("spotFake.clickSuspicious")}</span>
          </div>
          <SpotTheFakeGame />
        </div>
      </section>
    </div>
  )
}
