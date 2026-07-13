import { createContext, useContext, useState, useCallback } from "react"

const GameContext = createContext(null)

/**
 * GameProvider - Manages game state without window globals
 */
export function GameProvider({ children }) {
  const [selectedWorld, setSelectedWorld] = useState(null)
  const [worldData, setWorldData] = useState(null)
  const [worldObjects, setWorldObjects] = useState([])
  const [worldNpcs, setWorldNpcs] = useState([])
  const [playerStats, setPlayerStats] = useState(null)
  const [currentLocation, setCurrentLocation] = useState("neighborhood")

  const value = {
    selectedWorld,
    setSelectedWorld,
    worldData,
    setWorldData,
    worldObjects,
    setWorldObjects,
    worldNpcs,
    setWorldNpcs,
    playerStats,
    setPlayerStats,
    currentLocation,
    setCurrentLocation,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
