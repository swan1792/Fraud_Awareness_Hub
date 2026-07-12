import { useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ShieldAlert, Gamepad2, MessageSquareWarning, FileSearch, Home, Menu, X, LockKeyhole, Globe } from "lucide-react"

export function PublicLayout() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: t("nav.home"), href: "/", icon: Home },
    { label: t("nav.chatSim"), href: "/simulator", icon: MessageSquareWarning },
    { label: t("nav.spotFake"), href: "/spot-fake", icon: FileSearch },
  ]

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "my" : "en")
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 p-3 sm:px-5">
        <nav className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-slate-950/70 via-zinc-900/70 to-indigo-950/70 shadow-[0_18px_55px_-18px_rgba(0,0,0,0.75)] ring-1 ring-black/10 backdrop-blur-2xl backdrop-saturate-150">
          {/* Decorative glows */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 size-48 rounded-full bg-orange-500/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-48 rounded-full bg-indigo-500/15 blur-3xl" />

          <div className="relative flex h-16 items-center justify-between px-4 sm:px-5">
            {/* Brand */}
            <Link to="/" onClick={() => setIsOpen(false)} className="group flex min-w-0 items-center gap-3">
              <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-orange-400/30 bg-orange-500/15 text-orange-300 shadow-inner shadow-orange-400/10 transition duration-300 group-hover:border-orange-400/50 group-hover:bg-orange-500/20">
                <ShieldAlert className="size-5" />
                <span className="absolute inset-x-1 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-400/80 to-transparent" />
              </span>
              <span className="min-w-0">
                <span className="block truncate bg-gradient-to-r from-orange-200 via-orange-400 to-red-400 bg-clip-text text-base font-bold tracking-tight text-transparent sm:text-lg">
                  {t("nav.brand")}
                </span>
                <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 sm:block">
                  {t("nav.tagline")}
                </span>
              </span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1 shadow-inner md:flex">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition duration-200 ${
                      isActive
                        ? "bg-white/15 text-white shadow-sm"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className={`size-4 transition-colors ${isActive ? "text-orange-300" : "text-zinc-400"}`} />
                    {item.label}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-1 h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 min-h-11 text-xs font-semibold text-zinc-300 transition hover:border-orange-400/40 hover:bg-orange-500/15 hover:text-orange-200"
              >
                <Globe className="size-3.5" />
                {i18n.language === "en" ? "မြန်မာ" : "EN"}
              </button>

              {/* Desktop CTA */}
              <Link
                to="/game"
                className="group relative hidden items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/40 transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-orange-950/50 active:translate-y-0 active:scale-[0.98] sm:flex"
              >
                <span className="absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                <Gamepad2 className="relative size-4" />
                <span className="relative">{t("nav.playGame")}</span>
              </Link>

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="grid size-11 place-items-center rounded-xl border border-white/15 bg-white/10 text-zinc-100 transition hover:border-orange-400/40 hover:bg-orange-500/15 hover:text-orange-200 md:hidden"
              >
                {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>

          {/* Mobile navigation */}
          <div className={`relative grid transition-[grid-template-rows] duration-300 md:hidden ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div className="border-t border-white/10 bg-black/10 p-3">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium transition ${
                          isActive
                            ? "border-orange-400/25 bg-orange-500/15 text-orange-100"
                            : "border-transparent text-zinc-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon className={`size-4 ${isActive ? "text-orange-300" : "text-zinc-400"}`} />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
                <Link
                  to="/game"
                  onClick={() => setIsOpen(false)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-950/40 transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Gamepad2 className="size-4" />
                  {t("nav.playGame")}
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-r from-blue-950/95 via-zinc-950/95 to-slate-950/95 text-zinc-300">
        <div aria-hidden="true" className="absolute -top-24 left-[8%] size-64 rounded-full bg-orange-500/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-20 bottom-0 size-72 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-7 md:pt-16">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
            {/* Brand */}
            <div className="max-w-md">
              <Link to="/" className="group inline-flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-400 shadow-inner shadow-orange-400/10 transition group-hover:bg-orange-500/15">
                  <ShieldAlert className="size-5" />
                </span>
                <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-red-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                  {t("nav.brand")}
                </span>
              </Link>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                {t("footer.description")}
              </p>
            </div>

            {/* Links */}
            <div>
              <h2 className="text-xs font-semibold tracking-[0.18em] text-zinc-200 uppercase">{t("footer.practiseSafely")}</h2>
              <nav className="mt-4 space-y-3">
                {[
                  { to: "/game", label: t("footer.phishingQuiz"), icon: Gamepad2 },
                  { to: "/simulator", label: t("footer.chatSimulator"), icon: MessageSquareWarning },
                  { to: "/spot-fake", label: t("footer.spotFakeSlip"), icon: FileSearch },
                ].map((item) => (
                  <Link key={item.to} to={item.to} className="group flex w-fit items-center gap-2.5 py-2 text-sm text-zinc-400 transition hover:text-white">
                    <item.icon className="size-4 text-zinc-600 transition group-hover:text-orange-400" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Remember */}
            <div>
              <h2 className="text-xs font-semibold tracking-[0.18em] text-zinc-200 uppercase">{t("footer.remember")}</h2>
              <div className="mt-4 rounded-2xl border border-emerald-400 bg-emerald-500/10 backdrop-blur-md p-4">
                <div className="flex gap-3">
                  <LockKeyhole className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <p className="text-sm leading-6 text-emerald-300/80">
                    {t("footer.bankWarning")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 text-xs text-zinc-500">
            <p>&copy; {new Date().getFullYear()} {t("footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
