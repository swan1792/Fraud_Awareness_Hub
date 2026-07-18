import { BarChart3, ExternalLink, AlertTriangle, Shield, FileSearch, Gamepad2, MousePointerClick, MessageSquareWarning, Globe, Home, Filter } from "lucide-react"
import { useAlertsQuery, usePatternsQuery, useScenariosQuery } from "@/lib/api"

const UMAMI_URL = "https://cloud.umami.is/share/FfI4DpFnWDB5Ni3J"

const trackedEvents = [
  // Navigation
  { name: "nav-home", label: "Nav — Home", icon: Home, color: "text-blue-600", bg: "bg-blue-50", section: "Navigation" },
  { name: "nav-chat-simulator", label: "Nav — Chat Simulator", icon: MessageSquareWarning, color: "text-purple-600", bg: "bg-purple-50", section: "Navigation" },
  { name: "nav-spot-fake", label: "Nav — Spot Fake", icon: FileSearch, color: "text-orange-600", bg: "bg-orange-50", section: "Navigation" },
  { name: "toggle-language", label: "Language Toggle (EN/MY)", icon: Globe, color: "text-green-600", bg: "bg-green-50", section: "Navigation" },

  // Game CTAs
  { name: "play-game-cta", label: "Play Game (Header CTA)", icon: Gamepad2, color: "text-orange-600", bg: "bg-orange-50", section: "Game CTAs" },
  { name: "click-phishing-quiz", label: "Phishing Quiz Card", icon: MousePointerClick, color: "text-red-600", bg: "bg-red-50", section: "Game CTAs" },
  { name: "click-chat-simulator", label: "Chat Simulator Card", icon: MessageSquareWarning, color: "text-purple-600", bg: "bg-purple-50", section: "Game CTAs" },
  { name: "click-spot-fake-slip", label: "Spot Fake Slip Card", icon: FileSearch, color: "text-orange-600", bg: "bg-orange-50", section: "Game CTAs" },

  // Footer
  { name: "footer-phishing-quiz", label: "Footer — Phishing Quiz", icon: Gamepad2, color: "text-red-600", bg: "bg-red-50", section: "Footer" },
  { name: "footer-chat-simulator", label: "Footer — Chat Simulator", icon: MessageSquareWarning, color: "text-purple-600", bg: "bg-purple-50", section: "Footer" },
  { name: "footer-spot-fake-slip", label: "Footer — Spot Fake Slip", icon: FileSearch, color: "text-orange-600", bg: "bg-orange-50", section: "Footer" },

  // Filters
  { name: "filter-all", label: "Filter — All Patterns", icon: Filter, color: "text-gray-600", bg: "bg-gray-50", section: "Scam Filters" },
  { name: "filter-fake-apk", label: "Filter — Fake APK", icon: Filter, color: "text-red-600", bg: "bg-red-50", section: "Scam Filters" },
  { name: "filter-phishing-link", label: "Filter — Phishing Link", icon: Filter, color: "text-orange-600", bg: "bg-orange-50", section: "Scam Filters" },
  { name: "filter-social-engineering", label: "Filter — Social Engineering", icon: Filter, color: "text-purple-600", bg: "bg-purple-50", section: "Scam Filters" },
]

export function DashboardPage() {
  const { data: alerts = [], isLoading: alertsLoading } = useAlertsQuery()
  const { data: patterns = [], isLoading: patternsLoading } = usePatternsQuery()
  const { data: scenarios = [], isLoading: scenariosLoading } = useScenariosQuery()

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Website Traffic & Analytics</h1>
              <p className="text-sm text-gray-500">Visitor data, locations, and top click events</p>
            </div>
          </div>
          <a
            href={UMAMI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
          >
            <ExternalLink className="h-4 w-4" />
            Full Dashboard
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Content Stats */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Content Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Scam Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{alertsLoading ? "—" : alerts.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2.5">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fraud Patterns</p>
                  <p className="text-2xl font-bold text-gray-900">{patternsLoading ? "—" : patterns.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2.5">
                  <Gamepad2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Game Scenarios</p>
                  <p className="text-2xl font-bold text-gray-900">{scenariosLoading ? "—" : scenarios.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracked Click Events */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Tracked Click Events ({trackedEvents.length})</h2>
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            {["Navigation", "Game CTAs", "Footer", "Scam Filters"].map((section) => (
              <div key={section}>
                <div className="px-5 py-2 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section}</p>
                </div>
                {trackedEvents.filter((e) => e.section === section).map((event) => {
                  const Icon = event.icon
                  return (
                    <div key={event.name} className="flex items-center gap-3 px-5 py-3.5">
                      <div className={`rounded-lg p-2 ${event.bg}`}>
                        <Icon className={`h-4 w-4 ${event.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{event.label}</p>
                        <p className="text-xs text-gray-400 font-mono">{event.name}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Info note */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Click <strong>"Full Dashboard"</strong> above to view detailed visitor data, locations, page views, and click event counts on the Umami Analytics dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
