import { useState, useCallback } from "react"
import { Plus, Trash2, Loader2, Target, Edit2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMissionsQuery, useChaptersQuery, useCreateMissionMutation, useDeleteMissionMutation } from "@/lib/api"

const missionTypes = ["main", "side", "random", "emergency"]
const fraudTypes = ["Phishing", "Smishing", "Vishing", "QR Scam", "Fake APK", "Romance Scam", "Lottery Scam", "Investment Scam", "Social Engineering"]

export function MissionsPage() {
  const [filterChapter, setFilterChapter] = useState("all")
  const { data: missions = [], isLoading } = useMissionsQuery(filterChapter === "all" ? undefined : filterChapter)
  const { data: chapters = [] } = useChaptersQuery()
  const createMission = useCreateMissionMutation()
  const deleteMission = useDeleteMissionMutation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMission, setNewMission] = useState({
    chapterId: "", title: "", description: "", missionType: "main", fraudType: "",
    objectives: '[{"id":"obj-1","description":"Complete the task","type":"talk","target":"","done":false}]',
    rewards: '{"xp":100}', mapId: "", npcId: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = useCallback(async () => {
    if (!newMission.title || !newMission.chapterId) return
    setIsSubmitting(true)
    try {
      await createMission.mutateAsync({
        ...newMission,
        objectives: JSON.parse(newMission.objectives),
        rewards: JSON.parse(newMission.rewards),
      })
      setIsDialogOpen(false)
      setNewMission({ chapterId: "", title: "", description: "", missionType: "main", fraudType: "", objectives: '[{"id":"obj-1","description":"Complete the task","type":"talk","target":"","done":false}]', rewards: '{"xp":100}', mapId: "", npcId: "" })
    } catch (error) {
      console.error("Failed to create mission:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [newMission, createMission])

  const handleDelete = useCallback(async (id) => {
    try { await deleteMission.mutateAsync(id) } catch (e) { console.error(e) }
  }, [deleteMission])

  const typeColors = { main: "bg-blue-100 text-blue-800", side: "bg-green-100 text-green-800", random: "bg-yellow-100 text-yellow-800", emergency: "bg-red-100 text-red-800" }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Missions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage game missions, objectives, and rewards.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterChapter} onValueChange={setFilterChapter}>
            <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="All Chapters" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chapters</SelectItem>
              {chapters.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Create Mission
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Mission</DialogTitle><DialogDescription>Add a new mission to a chapter.</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Chapter *</Label>
                    <Select value={newMission.chapterId} onValueChange={(v) => setNewMission(p => ({ ...p, chapterId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select chapter" /></SelectTrigger>
                      <SelectContent>{chapters.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Mission Type *</Label>
                    <Select value={newMission.missionType} onValueChange={(v) => setNewMission(p => ({ ...p, missionType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{missionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Title *</Label><Input value={newMission.title} onChange={(e) => setNewMission(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={newMission.description} onChange={(e) => setNewMission(p => ({ ...p, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Fraud Type</Label>
                    <Select value={newMission.fraudType} onValueChange={(v) => setNewMission(p => ({ ...p, fraudType: v }))}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>{fraudTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Map</Label><Input placeholder="e.g., neighborhood" value={newMission.mapId} onChange={(e) => setNewMission(p => ({ ...p, mapId: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Objectives (JSON)</Label><Textarea rows={3} value={newMission.objectives} onChange={(e) => setNewMission(p => ({ ...p, objectives: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Rewards (JSON)</Label><Input value={newMission.rewards} onChange={(e) => setNewMission(p => ({ ...p, rewards: e.target.value }))} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newMission.title || !newMission.chapterId || isSubmitting}>
                  {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create Mission"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[120px]">Fraud Type</TableHead>
                <TableHead className="w-[100px]">Chapter</TableHead>
                <TableHead className="w-[80px]">Objectives</TableHead>
                <TableHead className="w-[60px]">XP</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missions.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div><p className="font-medium">{m.title}</p><p className="text-sm text-gray-500 line-clamp-1">{m.description}</p></div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className={typeColors[m.missionType]}>{m.missionType}</Badge></TableCell>
                  <TableCell className="text-sm">{m.fraudType || "—"}</TableCell>
                  <TableCell className="text-sm font-mono">{m.chapterId}</TableCell>
                  <TableCell className="text-sm">{m.objectives?.length || 0}</TableCell>
                  <TableCell className="text-sm font-bold text-amber-600">{m.rewards?.xp || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
