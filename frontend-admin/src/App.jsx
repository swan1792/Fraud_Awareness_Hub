import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { StagesPage } from "@/pages/StagesPage"
import { ChaptersPage } from "@/pages/ChaptersPage"
import { MissionsPage } from "@/pages/MissionsPage"
import { NpcsPage } from "@/pages/NpcsPage"
import { WorldMapsPage } from "@/pages/WorldMapsPage"
import { PlayerProgressPage } from "@/pages/PlayerProgressPage"
import { AdminsPage } from "@/pages/AdminsPage"
import { NotFoundPage } from "@/pages/NotFoundPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/stages" element={<StagesPage />} />
          <Route path="/chapters" element={<ChaptersPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/npcs" element={<NpcsPage />} />
          <Route path="/worlds" element={<WorldMapsPage />} />
          <Route path="/progress" element={<PlayerProgressPage />} />
          <Route path="/admins" element={<AdminsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
