import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { Gamepad2, ScanSearch, ShieldCheck, Zap, Map, Sword } from "lucide-react"
import { GameStage } from "@/components/game/GameStage"
import { WorldGame } from "@/components/game/WorldGame"
import { AnimatedBackground } from "@/components/section/animated-background"
import { useWorldsQuery } from "@/lib/api"

export function GamePage({ mode: modeProp }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Determine mode from URL or prop
  const mode = modeProp || null

  const { data: worlds = [] } = useWorldsQuery()

  const gameFeatures = [
    { label: t("game.features.scenarios"), icon: Gamepad2 },
    { label: t("game.features.feedback"), icon: Zap },
    { label: t("game.features.redFlags"), icon: ScanSearch },
  ]

  // RPG mode: NPC interaction handler
  const handleNpcInteract = (npc) => {
    console.log("NPC Interaction:", npc)
  }

  const handleObjectInteract = (obj) => {
    console.log("Object Interaction:", obj)
  }

  // Mode select screen
  if (!mode) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <section className="relative isolate overflow-hidden text-white">
          <AnimatedBackground />
          <div className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-24 md:pt-40 md:pb-32">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-cyan-200 uppercase backdrop-blur-xl">
                <ShieldCheck className="size-4" />
                {t("game.badge")}
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight md:text-7xl">
                {t("game.title")}{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  {t("game.titleHighlight")}
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-xl md:leading-8">
                {t("game.description")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {gameFeatures.map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-zinc-300 backdrop-blur-xl"
                  >
                    <feature.icon className="size-4 text-cyan-300" />
                    {feature.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Game Mode Selection */}
        <section className="relative z-20 -mt-12 px-4 pb-20 md:-mt-16 md:pb-28">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Choose Your Mode</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Action Shooter Mode */}
              <button
                onClick={() => navigate("/game/actionshooter")}
                className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-cyan-400 hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-100 to-transparent rounded-bl-full opacity-50" />
                <div className="relative">
                  <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-200 transition-colors">
                    <Sword className="h-7 w-7 text-cyan-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Action Shooter</h3>
                  <p className="text-sm text-gray-600">
                    Fight scammers in real-time! Shoot correct interventions to save targets before time runs out.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-cyan-600 font-medium">
                    <Gamepad2 className="h-4 w-4" />
                    6 stages with parallax scrolling
                  </div>
                </div>
              </button>

              {/* RPG Adventure Mode */}
              <button
                onClick={() => navigate("/game/fraudcity")}
                className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-green-400 hover:shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-100 to-transparent rounded-bl-full opacity-50" />
                <div className="relative">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <Map className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Fraud City RPG</h3>
                  <p className="text-sm text-gray-600">
                    Explore the city, talk to NPCs, investigate scams, and save citizens through investigation.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600 font-medium">
                    <Map className="h-4 w-4" />
                    Open world with 15 locations
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Shooter mode
  if (mode === "shooter") {
    return (
      <div className="min-h-screen bg-zinc-50">
        <section className="relative isolate overflow-hidden text-white">
          <AnimatedBackground />
          <div className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-24 md:pt-40 md:pb-32">
            <div className="max-w-3xl">
              <button
                onClick={() => navigate("/game")}
                className="mb-4 text-sm text-cyan-300 hover:text-white transition-colors"
              >
                ← Back to mode select
              </button>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight md:text-7xl">
                Action{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Shooter
                </span>
              </h1>
            </div>
          </div>
        </section>
        <section className="relative z-20 -mt-12 px-4 pb-20 md:-mt-16 md:pb-28">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-[0_30px_90px_-35px_rgba(9,9,12,0.35)]">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-5 py-3 text-xs text-zinc-500 sm:px-7">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                {t("game.statusReady")}
              </div>
              <span className="hidden sm:inline">{t("game.noTimer")}</span>
            </div>
            <div className="p-4 sm:p-6">
              <GameStage />
            </div>
          </div>
        </section>
      </div>
    )
  }

  // RPG mode: World select
  if (mode === "rpg" && !window.__SELECTED_WORLD) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <section className="relative isolate overflow-hidden text-white">
          <AnimatedBackground />
          <div className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-24 md:pt-40 md:pb-32">
            <div className="max-w-3xl">
              <button
                onClick={() => navigate("/game")}
                className="mb-4 text-sm text-green-300 hover:text-white transition-colors"
              >
                ← Back to mode select
              </button>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight md:text-7xl">
                Fraud{" "}
                <span className="bg-gradient-to-r from-green-300 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  City
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-xl md:leading-8">
                Choose a location to explore. Talk to NPCs, investigate scams, and save citizens.
              </p>
            </div>
          </div>
        </section>
        <section className="relative z-20 -mt-12 px-4 pb-20 md:-mt-16 md:pb-28">
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {worlds.map((world) => (
                <button
                  key={world.id}
                  onClick={() => {
                    window.__SELECTED_WORLD = world.id
                    // Force re-render
                    navigate("/game/fraudcity", { state: { worldId: world.id } })
                  }}
                  className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-5 text-left transition-all hover:border-green-400 hover:shadow-lg"
                >
                  <div className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                    {world.displayName}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {world.description}
                  </p>
                  <div className="mt-3 text-xs text-green-600 font-medium">
                    {world.width}×{world.height} tiles
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  // RPG mode: Playing world
  return (
    <div className="min-h-screen bg-zinc-50">
      <section className="relative z-20 px-4 py-8">
        <WorldGame
          worldId={window.__SELECTED_WORLD || "neighborhood"}
          onNpcInteract={handleNpcInteract}
          onObjectInteract={handleObjectInteract}
          onBack={() => {
            window.__SELECTED_WORLD = null
            navigate("/game/fraudcity")
          }}
        />
      </section>
    </div>
  )
}
