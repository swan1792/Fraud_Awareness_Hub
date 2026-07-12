import { useState } from "react"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { ShieldAlert, LayoutDashboard, Users, LogOut, Menu, X } from "lucide-react"
import { useAuth } from "@/lib/auth"

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

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
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          {user?.role === "super_admin" && (
            <Link
              to="/admins"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm"
            >
              <Users className="h-4 w-4" />
              Admin Users
            </Link>
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
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-white transition-colors">
              Logout
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="grid size-8 place-items-center rounded-md hover:bg-gray-800 transition-colors"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Nav Dropdown */}
        {mobileOpen && (
          <nav className="md:hidden bg-gray-900 border-t border-gray-700 p-3 space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm text-gray-300"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            {user?.role === "super_admin" && (
              <Link
                to="/admins"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm text-gray-300"
              >
                <Users className="h-4 w-4" />
                Admin Users
              </Link>
            )}
          </nav>
        )}

        <main className="flex-1 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
