import { useState, useEffect } from "react"
import { Loader2, BarChart3, Trophy, Shield, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import apiClient from "@/lib/axios"

export function PlayerProgressPage() {
  const [stats, setStats] = useState(null)
  const [progress, setProgress] = useState([])
  const [relationships, setRelationships] = useState([])
  const [evidence, setEvidence] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get("/player/stats").then(r => setStats(r.data)),
      apiClient.get("/progress").then(r => setProgress(r.data)),
      apiClient.get("/relationships").then(r => setRelationships(r.data)),
      apiClient.get("/evidence").then(r => setEvidence(r.data)),
    ]).finally(() => setIsLoading(false))
  }, [])

  const statusColors = {
    locked: "bg-gray-100 text-gray-600", available: "bg-blue-100 text-blue-800",
    active: "bg-yellow-100 text-yellow-800", completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Player Progress</h1>
        <p className="text-sm text-gray-500 mt-1">View player stats, mission progress, and relationships.</p>
      </div>

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 flex items-center gap-1"><Star className="h-4 w-4" /> Level</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{stats.level}</p><p className="text-xs text-gray-400">{stats.xp}/{stats.xpToNext} XP</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 flex items-center gap-1"><BarChart3 className="h-4 w-4" /> Total XP</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-amber-600">{stats.totalXp}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 flex items-center gap-1"><Trophy className="h-4 w-4" /> Skill Points</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-blue-600">{stats.skillPoints}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 flex items-center gap-1"><Shield className="h-4 w-4" /> Title</CardTitle></CardHeader>
              <CardContent><p className="text-lg font-bold">{stats.titles[stats.titles.length - 1] || "None"}</p></CardContent>
            </Card>
          </div>

          {/* Skills */}
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-sm">Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(stats.skills).map(([skill, level]) => (
                  <div key={skill}>
                    <div className="flex justify-between text-sm mb-1"><span className="capitalize">{skill}</span><span className="font-bold">{level}/10</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${level * 10}%` }} /></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reputation */}
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-sm">Reputation</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(stats.reputation).map(([loc, rep]) => (
                  <div key={loc}>
                    <div className="flex justify-between text-sm mb-1"><span className="capitalize">{loc}</span><span className="font-bold">{rep}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${rep}%` }} /></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mission Progress */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Mission Progress ({progress.length})</CardTitle></CardHeader>
          <CardContent>
            {progress.length === 0 ? (
              <p className="text-sm text-gray-400">No missions started yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {progress.map(p => (
                  <div key={p.missionId} className="flex items-center justify-between p-2 rounded bg-gray-50 text-sm">
                    <div>
                      <p className="font-medium">{p.missionTitle}</p>
                      <p className="text-xs text-gray-400">{p.chapterId}</p>
                    </div>
                    <Badge variant="secondary" className={statusColors[p.status]}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* NPC Relationships */}
        <Card>
          <CardHeader><CardTitle className="text-sm">NPC Relationships ({relationships.length})</CardTitle></CardHeader>
          <CardContent>
            {relationships.length === 0 ? (
              <p className="text-sm text-gray-400">No relationships formed yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {relationships.map(r => (
                  <div key={r.npcId} className="flex items-center justify-between p-2 rounded bg-gray-50 text-sm">
                    <div>
                      <p className="font-medium">{r.npcName}</p>
                      <p className="text-xs text-gray-400">{r.totalTalks} talks</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${r.trustLevel}%` }} /></div>
                      <span className="text-xs font-bold w-8">{r.trustLevel}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evidence Collected */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Evidence Collected ({evidence.length})</CardTitle></CardHeader>
          <CardContent>
            {evidence.length === 0 ? (
              <p className="text-sm text-gray-400">No evidence collected yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {evidence.map(ev => (
                  <div key={ev.id} className="p-3 rounded-lg border bg-gray-50 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{ev.evidenceType}</Badge>
                      {!ev.isRead && <span className="w-2 h-2 bg-green-400 rounded-full" />}
                    </div>
                    <p className="font-medium text-xs">{ev.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{ev.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
