import { BrowserRouter, Routes, Route } from "react-router-dom"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { HomePage } from "@/pages/HomePage"
import { GamePage } from "@/pages/GamePage"
import { SimulatorPage } from "@/pages/SimulatorPage"
import { SpotFakePage } from "@/pages/SpotFakePage"
import { NotFoundPage } from "@/pages/NotFoundPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/game/actionshooter" element={<GamePage mode="shooter" />} />
          <Route path="/game/fraudcity" element={<GamePage mode="rpg" />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/spot-fake" element={<SpotFakePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
