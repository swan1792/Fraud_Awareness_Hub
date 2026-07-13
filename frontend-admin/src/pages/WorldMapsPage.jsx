import { useState, useEffect } from "react"
import { Loader2, Map, TreePine, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import apiClient from "@/lib/axios"

export function WorldMapsPage() {
  const [worlds, setWorlds] = useState([])
  const [selectedWorld, setSelectedWorld] = useState(null)
  const [objects, setObjects] = useState([])
  const [npcs, setNpcs] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.get("/worlds").then(r => {
      setWorlds(r.data)
      setIsLoading(false)
    })
  }, [])

  const loadWorld = (worldId) => {
    setSelectedWorld(worldId)
    Promise.all([
      apiClient.get(`/worlds/${worldId}/objects`).then(r => setObjects(r.data)),
      apiClient.get(`/worlds/${worldId}/npcs`).then(r => setNpcs(r.data)),
    ])
  }

  const objectTypeColors = {
    building: "bg-amber-100 text-amber-800", tree: "bg-green-100 text-green-800",
    bench: "bg-yellow-100 text-yellow-800", light: "bg-gray-100 text-gray-800",
    sign: "bg-blue-100 text-blue-800", door: "bg-red-100 text-red-800",
    wall: "bg-zinc-100 text-zinc-800", water: "bg-cyan-100 text-cyan-800",
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">World Maps</h1>
        <p className="text-sm text-gray-500 mt-1">View world maps, objects, and NPC placements.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* World List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-500 uppercase">Maps</h3>
            {worlds.map(world => (
              <Card
                key={world.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedWorld === world.id ? "border-green-500 shadow-md" : ""}`}
                onClick={() => loadWorld(world.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Map className="h-4 w-4 text-green-600" />
                    {world.displayName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 line-clamp-2">{world.description}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs">{world.width}×{world.height}</Badge>
                    <Badge variant="outline" className="text-xs">{world.tileSize}px tiles</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Objects & NPCs */}
          <div className="lg:col-span-2 space-y-6">
            {selectedWorld ? (
              <>
                {/* Objects */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <TreePine className="h-4 w-4" /> Objects ({objects.length})
                  </h3>
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Name</th>
                          <th className="text-left px-4 py-2 font-medium">Type</th>
                          <th className="text-left px-4 py-2 font-medium">Position</th>
                          <th className="text-left px-4 py-2 font-medium">Size</th>
                          <th className="text-left px-4 py-2 font-medium">Solid</th>
                          <th className="text-left px-4 py-2 font-medium">Interactive</th>
                        </tr>
                      </thead>
                      <tbody>
                        {objects.map(obj => (
                          <tr key={obj.id} className="border-t">
                            <td className="px-4 py-2 font-medium">{obj.name || "—"}</td>
                            <td className="px-4 py-2"><Badge variant="secondary" className={objectTypeColors[obj.objectType] || ""}>{obj.objectType}</Badge></td>
                            <td className="px-4 py-2 font-mono text-xs">{obj.x}, {obj.y}</td>
                            <td className="px-4 py-2 text-xs">{obj.width}×{obj.height}</td>
                            <td className="px-4 py-2">{obj.solid ? "✅" : "—"}</td>
                            <td className="px-4 py-2">{obj.interactive ? "✅" : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* NPCs */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" /> NPCs ({npcs.length})
                  </h3>
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Name</th>
                          <th className="text-left px-4 py-2 font-medium">Type</th>
                          <th className="text-left px-4 py-2 font-medium">Position</th>
                          <th className="text-left px-4 py-2 font-medium">Patrol</th>
                          <th className="text-left px-4 py-2 font-medium">Trust</th>
                        </tr>
                      </thead>
                      <tbody>
                        {npcs.map(npc => (
                          <tr key={npc.id} className="border-t">
                            <td className="px-4 py-2 font-medium">{npc.name}</td>
                            <td className="px-4 py-2 text-xs">{npc.npcType}</td>
                            <td className="px-4 py-2 font-mono text-xs">{npc.x}, {npc.y}</td>
                            <td className="px-4 py-2 text-xs">{npc.patrolX1},{npc.patrolY1} → {npc.patrolX2},{npc.patrolY2}</td>
                            <td className="px-4 py-2">{npc.trustLevel}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <p>Select a world map to view its contents</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
