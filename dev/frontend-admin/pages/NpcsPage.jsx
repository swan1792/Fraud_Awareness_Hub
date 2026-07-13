import { useState, useCallback, useEffect } from "react"
import { Plus, Trash2, Loader2, Users, Edit2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import apiClient from "@/lib/axios"

const npcTypes = ["citizen", "police", "bank_staff", "teacher", "delivery", "elderly", "student", "scammer", "business_owner"]

export function NpcsPage() {
  const [npcs, setNpcs] = useState([])
  const [worlds, setWorlds] = useState([])
  const [dialogues, setDialogues] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDialogueDialogOpen, setIsDialogueDialogOpen] = useState(false)
  const [selectedNpc, setSelectedNpc] = useState(null)
  const [newNpc, setNewNpc] = useState({ name: "", npcType: "citizen", mapId: "neighborhood", x: 10, y: 10, sprite: "citizen" })
  const [newDialogue, setNewDialogue] = useState({ title: "", lines: '[]', choices: "[]" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      apiClient.get("/worlds").then(r => setWorlds(r.data)),
      apiClient.get("/worlds/neighborhood/npcs").then(r => {
        setNpcs(r.data)
        // Fetch dialogues for each NPC
        r.data.forEach(npc => {
          apiClient.get(`/npcs/${npc.id}/dialogues`).then(d => {
            setDialogues(prev => ({ ...prev, [npc.id]: d.data }))
          }).catch(() => {})
        })
      }),
    ]).finally(() => setIsLoading(false))
  }, [])

  const handleCreate = useCallback(async () => {
    if (!newNpc.name) return
    setIsSubmitting(true)
    try {
      // Note: Would need POST /api/worlds/:mapId/npcs endpoint
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Failed to create NPC:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [newNpc])

  const openDialogueDialog = useCallback((npc) => {
    setSelectedNpc(npc)
    setNewDialogue({ title: "", lines: '[{"speaker":"' + npc.name + '","text":"Hello!","emotion":"neutral"}]', choices: "[]" })
    setIsDialogueDialogOpen(true)
  }, [])

  const handleCreateDialogue = useCallback(async () => {
    if (!selectedNpc || !newDialogue.title) return
    setIsSubmitting(true)
    try {
      await apiClient.post(`/npcs/${selectedNpc.id}/dialogues`, {
        title: newDialogue.title,
        lines: JSON.parse(newDialogue.lines),
        choices: JSON.parse(newDialogue.choices),
      })
      // Refresh dialogues
      const d = await apiClient.get(`/npcs/${selectedNpc.id}/dialogues`)
      setDialogues(prev => ({ ...prev, [selectedNpc.id]: d.data }))
      setIsDialogueDialogOpen(false)
    } catch (error) {
      console.error("Failed to create dialogue:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedNpc, newDialogue])

  const typeColors = {
    citizen: "bg-blue-100 text-blue-800", police: "bg-indigo-100 text-indigo-800",
    elderly: "bg-amber-100 text-amber-800", scammer: "bg-red-100 text-red-800",
    delivery: "bg-orange-100 text-orange-800", student: "bg-cyan-100 text-cyan-800",
    bank_staff: "bg-green-100 text-green-800", teacher: "bg-purple-100 text-purple-800",
    business_owner: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">NPCs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage NPCs, their types, locations, and dialogues.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[100px]">Map</TableHead>
                <TableHead className="w-[80px]">Position</TableHead>
                <TableHead className="w-[80px]">Trust</TableHead>
                <TableHead className="w-[80px]">Dialogues</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {npcs.map((npc) => (
                <TableRow key={npc.id}>
                  <TableCell className="font-medium">{npc.name}</TableCell>
                  <TableCell><Badge variant="secondary" className={typeColors[npc.npcType]}>{npc.npcType}</Badge></TableCell>
                  <TableCell className="text-sm font-mono">{npc.mapId}</TableCell>
                  <TableCell className="text-sm">{npc.x}, {npc.y}</TableCell>
                  <TableCell className="text-sm">{npc.trustLevel}%</TableCell>
                  <TableCell className="text-sm">{dialogues[npc.id]?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openDialogueDialog(npc)} title="Add dialogue">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialogue Dialog */}
      <Dialog open={isDialogueDialogOpen} onOpenChange={setIsDialogueDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Dialogue to {selectedNpc?.name}</DialogTitle>
            <DialogDescription>Create a new dialogue tree for this NPC.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={newDialogue.title} onChange={(e) => setNewDialogue(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Lines (JSON array)</Label><Textarea rows={4} value={newDialogue.lines} onChange={(e) => setNewDialogue(p => ({ ...p, lines: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Choices (JSON array)</Label><Textarea rows={3} value={newDialogue.choices} onChange={(e) => setNewDialogue(p => ({ ...p, choices: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogueDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDialogue} disabled={!newDialogue.title || isSubmitting}>Create Dialogue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
