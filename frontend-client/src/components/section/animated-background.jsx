export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#09090c]"
    >
      {/* Soft base tint */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,182,212,0.08),transparent_35%,transparent_60%,rgba(59,130,246,0.1))]" />

      {/* Animated gradient fields */}
      <div className="absolute -left-[18%] -top-[45%] h-[140%] w-[55%] rounded-full bg-cyan-400/35 blur-[150px]" />
      <div className="absolute left-[17%] -top-[35%] h-[115%] w-[38%] rounded-full bg-purple-600/30 blur-[160px]" />
      <div className="absolute right-[4%] -top-[45%] h-[130%] w-[48%] rounded-full bg-violet-600/35 blur-[170px]" />
      <div className="absolute -right-[20%] -top-[40%] h-[145%] w-[55%] rounded-full bg-blue-500/35 blur-[160px]" />
      <div className="absolute left-[48%] top-[20%] h-[70%] w-[25%] rounded-full bg-emerald-500/10 blur-[130px]" />

      {/* Dark vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,8,12,0.88)_0%,rgba(8,8,12,0.48)_33%,transparent_68%)]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Dark edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />
      <div className="absolute inset-0 shadow-[inset_0_0_180px_30px_rgba(0,0,0,0.55)]" />

      {/* Center highlight */}
      <div className="absolute left-1/2 top-[45%] h-40 w-[45%] -translate-x-1/2 rounded-full bg-white/[0.025] blur-[80px]" />
    </div>
  )
}
