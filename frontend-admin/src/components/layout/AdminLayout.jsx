import { Link, Outlet, useNavigate } from "react-router-dom"
import { ShieldAlert, LayoutDashboard, AlertTriangle, Gamepad2, BookOpen, Target, Users, Map, BarChart3, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth"

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <ShieldAlert className="h-6 w-6 text-red-400" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>

        <nav className="space-y-1 flex-1">
          <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm">
            <AlertTriangle className="h-4 w-4" /> Scam Alerts
          </Link>

          {/* Fraud City Section */}
          <div className="pt-3 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">Fraud City</div>
          <Link to="/chapters" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm">
            <BookOpen className="h-4 w-4" /> Chapters
          </Link>
          <Link to="/missions" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm">
            <Target className="h-4 w-4" /> Missions
          </Link>
          <Link to="/npcs" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm">
            <Users className="h-4 w-4" /> NPCs
          </Link>
          <Link to="/worlds" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm">
            <Map className="h-4 w-4" /> World Maps
          </Link>
          <Link to="/progress" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm">
            <BarChart3 className="h-4 w-4" /> Player Progress
          </Link>

          {/* Game Section */}
          <div className="pt-3 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">Game</div>
          <Link to="/stages" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm">
            <Gamepad2 className="h-4 w-4" /> Game Stages
          </Link>

          {user?.role === "super_admin" && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">System</div>
              <Link to="/admins" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm">
                <Users className="h-4 w-4" /> Admin Users
              </Link>
            </>
          )}
        </nav>

        {/* User Info + Logout */}
        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="text-sm text-gray-400 truncate mb-2">{user?.email}</div>
          <div className="text-xs text-gray-500 capitalize mb-3">{user?.role?.replace('_', ' ')}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm text-gray-400 w-full"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar + Content */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-gray-900 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            <span className="font-bold">Admin Panel</span>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-white transition-colors">
            Logout
          </button>
        </header>

        <main className="flex-1 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
