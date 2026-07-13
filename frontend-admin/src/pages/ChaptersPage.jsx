import { useState, useCallback } from "react"
import { Plus, Trash2, Loader2, BookOpen, Eye, EyeOff, Edit2, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useChaptersQuery, useCreateChapterMutation, useUpdateChapterMutation, useDeleteChapterMutation } from "@/lib/api"

export function ChaptersPage() {
  const { data: chapters = [], isLoading } = useChaptersQuery()
  const createChapter = useCreateChapterMutation()
  const updateChapter = useUpdateChapterMutation()
  const deleteChapter = useDeleteChapterMutation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState(null)
  const [newChapter, setNewChapter] = useState({ title: "", description: "", chapterOrder: 1, unlockedBy: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = useCallback(async () => {
    if (!newChapter.title) return
    setIsSubmitting(true)
    try {
      await createChapter.mutateAsync({
        ...newChapter,
        unlockedBy: newChapter.unlockedBy || null,
      })
      setNewChapter({ title: "", description: "", chapterOrder: chapters.length + 1, unlockedBy: "" })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Failed to create chapter:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [newChapter, createChapter, chapters.length])

  const handleDelete = useCallback(async (id) => {
    try { await deleteChapter.mutateAsync(id) } catch (e) { console.error(e) }
  }, [deleteChapter])

  const openEdit = useCallback((chapter) => {
    setEditingChapter({ ...chapter })
    setIsEditDialogOpen(true)
  }, [])

  const handleUpdate = useCallback(async () => {
    if (!editingChapter?.title) return
    setIsSubmitting(true)
    try {
      await updateChapter.mutateAsync({ id: editingChapter.id, ...editingChapter })
      setIsEditDialogOpen(false)
      setEditingChapter(null)
    } catch (error) {
      console.error("Failed to update chapter:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [editingChapter, updateChapter])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chapters</h1>
          <p className="text-sm text-gray-500 mt-1">Manage game chapters and their unlock order.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Create Chapter
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Chapter</DialogTitle>
              <DialogDescription>Add a new chapter to the game story.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input placeholder="e.g., The ATM Mystery" value={newChapter.title} onChange={(e) => setNewChapter(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the chapter..." rows={2} value={newChapter.description} onChange={(e) => setNewChapter(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input type="number" value={newChapter.chapterOrder} onChange={(e) => setNewChapter(p => ({ ...p, chapterOrder: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Unlocked By (chapter ID)</Label>
                  <Input placeholder="e.g., chapter-1" value={newChapter.unlockedBy} onChange={(e) => setNewChapter(p => ({ ...p, unlockedBy: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newChapter.title || isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create Chapter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Unlocked By</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapters.map((ch) => (
                <TableRow key={ch.id}>
                  <TableCell className="font-mono text-sm">{ch.chapterOrder}</TableCell>
                  <TableCell className="font-medium">{ch.title}</TableCell>
                  <TableCell className="text-sm text-gray-500 line-clamp-1">{ch.description}</TableCell>
                  <TableCell className="text-sm">{ch.unlockedBy || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={ch.isUnlocked ? "default" : "secondary"} className={ch.isUnlocked ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {ch.isUnlocked ? <><Unlock className="h-3 w-3 mr-1" /> Unlocked</> : <><Lock className="h-3 w-3 mr-1" /> Locked</>}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(ch)}><Edit2 className="h-4 w-4 text-blue-600" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(ch.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Edit Chapter</DialogTitle></DialogHeader>
          {editingChapter && (
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={editingChapter.title} onChange={(e) => setEditingChapter(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={editingChapter.description || ""} onChange={(e) => setEditingChapter(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Order</Label><Input type="number" value={editingChapter.chapterOrder} onChange={(e) => setEditingChapter(p => ({ ...p, chapterOrder: parseInt(e.target.value) || 1 }))} /></div>
                <div className="space-y-2"><Label>Unlocked By</Label><Input value={editingChapter.unlockedBy || ""} onChange={(e) => setEditingChapter(p => ({ ...p, unlockedBy: e.target.value }))} /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!editingChapter?.title || isSubmitting}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
