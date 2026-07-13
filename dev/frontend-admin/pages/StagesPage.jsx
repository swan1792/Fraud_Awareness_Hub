import { useState, useCallback } from "react"
import { Plus, Trash2, Loader2, Gamepad2, Eye, EyeOff, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  useStagesQuery,
  useCreateStageMutation,
  useUpdateStageMutation,
  useDeleteStageMutation,
  useTogglePublishMutation,
} from "@/lib/api"

const categoryColors = {
  "Fake APK": "bg-orange-100 text-orange-800",
  "Phishing Link": "bg-blue-100 text-blue-800",
  "Social Engineering": "bg-purple-100 text-purple-800",
}

const categories = ["Fake APK", "Phishing Link", "Social Engineering"]

const difficultyLabels = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
  4: "Expert",
  5: "Master",
}

export function StagesPage() {
  const { data: stages = [], isLoading } = useStagesQuery()
  const createStage = useCreateStageMutation()
  const updateStage = useUpdateStageMutation()
  const deleteStage = useDeleteStageMutation()
  const togglePublish = useTogglePublishMutation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState(null)
  const [newStage, setNewStage] = useState({
    title: "",
    category: "",
    description: "",
    difficulty: 2,
    scammerLine: "",
    correctIntervention: "",
    whyText: "",
    doText: "",
    dontText: "",
    targetLines: [
      { lineText: "", lineOrder: 1 },
      { lineText: "", lineOrder: 2 },
      { lineText: "", lineOrder: 3 },
    ],
    interventions: [
      { interventionText: "", isCorrect: true, displayOrder: 1 },
      { interventionText: "", isCorrect: false, displayOrder: 2 },
      { interventionText: "", isCorrect: false, displayOrder: 3 },
    ],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateStage = useCallback(async () => {
    if (!newStage.title || !newStage.category || !newStage.scammerLine) return
    setIsSubmitting(true)
    try {
      // Filter out empty target lines and interventions
      const targetLines = newStage.targetLines.filter((l) => l.lineText.trim())
      const interventions = newStage.interventions.filter((i) => i.interventionText.trim())
      await createStage.mutateAsync({
        ...newStage,
        targetLines,
        interventions,
      })
      setNewStage({
        title: "",
        category: "",
        description: "",
        difficulty: 2,
        scammerLine: "",
        correctIntervention: "",
        whyText: "",
        doText: "",
        dontText: "",
        targetLines: [
          { lineText: "", lineOrder: 1 },
          { lineText: "", lineOrder: 2 },
          { lineText: "", lineOrder: 3 },
        ],
        interventions: [
          { interventionText: "", isCorrect: true, displayOrder: 1 },
          { interventionText: "", isCorrect: false, displayOrder: 2 },
          { interventionText: "", isCorrect: false, displayOrder: 3 },
        ],
      })
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Failed to create stage:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [newStage, createStage])

  const handleDeleteStage = useCallback(
    async (id) => {
      try {
        await deleteStage.mutateAsync(id)
      } catch (error) {
        console.error("Failed to delete stage:", error)
      }
    },
    [deleteStage]
  )

  const handleTogglePublish = useCallback(
    async (id) => {
      try {
        await togglePublish.mutateAsync(id)
      } catch (error) {
        console.error("Failed to toggle publish:", error)
      }
    },
    [togglePublish]
  )

  const openEditDialog = useCallback((stage) => {
    setEditingStage({
      ...stage,
      targetLines: stage.targetLines?.length > 0
        ? stage.targetLines.map((l) => ({ id: l.id, lineText: l.lineText, lineOrder: l.lineOrder }))
        : [{ lineText: "", lineOrder: 1 }],
      interventions: stage.interventions?.length > 0
        ? stage.interventions.map((i) => ({ id: i.id, interventionText: i.interventionText, isCorrect: i.isCorrect, displayOrder: i.displayOrder }))
        : [{ interventionText: "", isCorrect: true, displayOrder: 1 }],
    })
    setIsEditDialogOpen(true)
  }, [])

  const handleUpdateStage = useCallback(async () => {
    if (!editingStage?.title || !editingStage?.category || !editingStage?.scammerLine) return
    setIsSubmitting(true)
    try {
      // Filter out empty target lines and interventions
      const targetLines = editingStage.targetLines.filter((l) => l.lineText.trim())
      const interventions = editingStage.interventions.filter((i) => i.interventionText.trim())
      await updateStage.mutateAsync({
        id: editingStage.id,
        ...editingStage,
        targetLines,
        interventions,
      })
      setIsEditDialogOpen(false)
      setEditingStage(null)
    } catch (error) {
      console.error("Failed to update stage:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [editingStage, updateStage])

  const addTargetLine = useCallback(() => {
    setNewStage((prev) => ({
      ...prev,
      targetLines: [
        ...prev.targetLines,
        { lineText: "", lineOrder: prev.targetLines.length + 1 },
      ],
    }))
  }, [])

  const updateTargetLine = useCallback((index, value) => {
    setNewStage((prev) => {
      const lines = [...prev.targetLines]
      lines[index] = { ...lines[index], lineText: value }
      return { ...prev, targetLines: lines }
    })
  }, [])

  const removeTargetLine = useCallback((index) => {
    setNewStage((prev) => ({
      ...prev,
      targetLines: prev.targetLines.filter((_, i) => i !== index),
    }))
  }, [])

  const addIntervention = useCallback(() => {
    setNewStage((prev) => ({
      ...prev,
      interventions: [
        ...prev.interventions,
        { interventionText: "", isCorrect: false, displayOrder: prev.interventions.length + 1 },
      ],
    }))
  }, [])

  const updateIntervention = useCallback((index, field, value) => {
    setNewStage((prev) => {
      const interventions = [...prev.interventions]
      interventions[index] = { ...interventions[index], [field]: value }
      return { ...prev, interventions }
    })
  }, [])

  const removeIntervention = useCallback((index) => {
    setNewStage((prev) => ({
      ...prev,
      interventions: prev.interventions.filter((_, i) => i !== index),
    }))
  }, [])

  // Edit stage helpers
  const updateEditingStage = useCallback((field, value) => {
    setEditingStage((prev) => ({ ...prev, [field]: value }))
  }, [])

  const addEditingTargetLine = useCallback(() => {
    setEditingStage((prev) => ({
      ...prev,
      targetLines: [
        ...prev.targetLines,
        { lineText: "", lineOrder: prev.targetLines.length + 1 },
      ],
    }))
  }, [])

  const updateEditingTargetLine = useCallback((index, value) => {
    setEditingStage((prev) => {
      const lines = [...prev.targetLines]
      lines[index] = { ...lines[index], lineText: value }
      return { ...prev, targetLines: lines }
    })
  }, [])

  const removeEditingTargetLine = useCallback((index) => {
    setEditingStage((prev) => ({
      ...prev,
      targetLines: prev.targetLines.filter((_, i) => i !== index),
    }))
  }, [])

  const addEditingIntervention = useCallback(() => {
    setEditingStage((prev) => ({
      ...prev,
      interventions: [
        ...prev.interventions,
        { interventionText: "", isCorrect: false, displayOrder: prev.interventions.length + 1 },
      ],
    }))
  }, [])

  const updateEditingIntervention = useCallback((index, field, value) => {
    setEditingStage((prev) => {
      const interventions = [...prev.interventions]
      interventions[index] = { ...interventions[index], [field]: value }
      return { ...prev, interventions }
    })
  }, [])

  const removeEditingIntervention = useCallback((index) => {
    setEditingStage((prev) => ({
      ...prev,
      interventions: prev.interventions.filter((_, i) => i !== index),
    }))
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Game Stages</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage game stages for the 2D action story game.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Create New Stage
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Game Stage</DialogTitle>
              <DialogDescription>
                Add a new game stage for the 2D action story game.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Fake KPay APK"
                    value={newStage.title}
                    onChange={(e) => setNewStage((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newStage.category}
                    onValueChange={(value) => setNewStage((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the scam scenario..."
                  rows={2}
                  value={newStage.description}
                  onChange={(e) => setNewStage((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                <Select
                  value={String(newStage.difficulty)}
                  onValueChange={(value) => setNewStage((prev) => ({ ...prev, difficulty: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} - {difficultyLabels[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Character Lines */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Character Lines</h4>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="scammerLine">Scammer's Thought (always visible)</Label>
                    <Input
                      id="scammerLine"
                      placeholder="e.g., They'll install it without checking"
                      value={newStage.scammerLine}
                      onChange={(e) => setNewStage((prev) => ({ ...prev, scammerLine: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correctIntervention">Good Friend's Warning (correct choice)</Label>
                    <Input
                      id="correctIntervention"
                      placeholder="e.g., Wait — real updates come from app stores!"
                      value={newStage.correctIntervention}
                      onChange={(e) => setNewStage((prev) => ({ ...prev, correctIntervention: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Target Lines */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Target's Escalating Lines (progresses over time)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTargetLine}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Line
                  </Button>
                </div>

                <div className="space-y-2">
                  {newStage.targetLines.map((line, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-sm text-gray-500 w-6 pt-2">{index + 1}.</span>
                      <Input
                        placeholder={`Line ${index + 1} (e.g., ${
                          index === 0
                            ? "Should I download this?"
                            : index === 1
                            ? "It says it's urgent..."
                            : "Fine, I'll do it"
                        })`}
                        value={line.lineText}
                        onChange={(e) => updateTargetLine(index, e.target.value)}
                      />
                      {newStage.targetLines.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTargetLine(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Interventions */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Intervention Options (tappable chips)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addIntervention}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {newStage.interventions.map((intervention, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex flex-col gap-1 pt-2">
                        <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                        <select
                          value={intervention.isCorrect ? "correct" : "wrong"}
                          onChange={(e) => updateIntervention(index, "isCorrect", e.target.value === "correct")}
                          className="text-xs border rounded px-1 py-1"
                        >
                          <option value="correct">✓ Correct</option>
                          <option value="wrong">✗ Wrong</option>
                        </select>
                      </div>
                      <Input
                        placeholder={`Intervention ${index + 1} (e.g., ${
                          index === 0
                            ? "Check the official app store"
                            : index === 1
                            ? "Download it quickly"
                            : "Ask for more details"
                        })`}
                        value={intervention.interventionText}
                        onChange={(e) => updateIntervention(index, "interventionText", e.target.value)}
                      />
                      {newStage.interventions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIntervention(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Mark one option as "Correct" — this is the right intervention the player should tap.
                </p>
              </div>

              {/* Why/Do/Don't */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Why / Do / Don't Explainer</h4>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="whyText">Why (scam mechanism)</Label>
                    <Textarea
                      id="whyText"
                      placeholder="Explain how the scam works..."
                      rows={2}
                      value={newStage.whyText}
                      onChange={(e) => setNewStage((prev) => ({ ...prev, whyText: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doText">Do (correct action)</Label>
                    <Textarea
                      id="doText"
                      placeholder="What should users do instead..."
                      rows={2}
                      value={newStage.doText}
                      onChange={(e) => setNewStage((prev) => ({ ...prev, doText: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dontText">Don't (never do this)</Label>
                    <Textarea
                      id="dontText"
                      placeholder="What users should never do..."
                      rows={2}
                      value={newStage.dontText}
                      onChange={(e) => setNewStage((prev) => ({ ...prev, dontText: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateStage}
                disabled={!newStage.title || !newStage.category || !newStage.scammerLine || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Stage"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Stages</p>
          <p className="text-2xl font-bold">{stages.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-bold text-green-600">
            {stages.filter((s) => s.isPublished).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Drafts</p>
          <p className="text-2xl font-bold text-yellow-600">
            {stages.filter((s) => !s.isPublished).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold">{categories.length}</p>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading stages...</span>
        </div>
      ) : stages.length === 0 ? (
        <div className="text-center py-12">
          <Gamepad2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No game stages yet.</p>
          <p className="text-sm text-gray-400">Click "Create New Stage" to add one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-[120px]">Category</TableHead>
                <TableHead className="w-[80px]">Difficulty</TableHead>
                <TableHead className="w-[80px]">Lines</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((stage) => (
                <TableRow key={stage.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{stage.title}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{stage.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={categoryColors[stage.category]}>
                      {stage.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {difficultyLabels[stage.difficulty] || "Medium"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {stage.targetLines?.length || 0} lines
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={stage.isPublished ? "default" : "secondary"}
                      className={stage.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                    >
                      {stage.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(stage)}
                        title="Edit stage"
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(stage.id)}
                        title={stage.isPublished ? "Unpublish" : "Publish"}
                      >
                        {stage.isPublished ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStage(stage.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Stage Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Game Stage</DialogTitle>
            <DialogDescription>
              Update the game stage details, target lines, and interventions.
            </DialogDescription>
          </DialogHeader>

          {editingStage && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g., Fake KPay APK"
                    value={editingStage.title}
                    onChange={(e) => updateEditingStage("title", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={editingStage.category}
                    onValueChange={(value) => updateEditingStage("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe the scam scenario..."
                  rows={2}
                  value={editingStage.description || ""}
                  onChange={(e) => updateEditingStage("description", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-difficulty">Difficulty (1-5)</Label>
                <Select
                  value={String(editingStage.difficulty || 2)}
                  onValueChange={(value) => updateEditingStage("difficulty", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} - {difficultyLabels[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Character Lines */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Character Lines</h4>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-scammerLine">Scammer's Thought (always visible)</Label>
                    <Input
                      id="edit-scammerLine"
                      placeholder="e.g., They'll install it without checking"
                      value={editingStage.scammerLine}
                      onChange={(e) => updateEditingStage("scammerLine", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-correctIntervention">Good Friend's Warning (correct choice)</Label>
                    <Input
                      id="edit-correctIntervention"
                      placeholder="e.g., Wait — real updates come from app stores!"
                      value={editingStage.correctIntervention}
                      onChange={(e) => updateEditingStage("correctIntervention", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Target Lines */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Target's Escalating Lines (progresses over time)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEditingTargetLine}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Line
                  </Button>
                </div>

                <div className="space-y-2">
                  {editingStage.targetLines.map((line, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-sm text-gray-500 w-6 pt-2">{index + 1}.</span>
                      <Input
                        placeholder={`Line ${index + 1}`}
                        value={line.lineText}
                        onChange={(e) => updateEditingTargetLine(index, e.target.value)}
                      />
                      {editingStage.targetLines.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEditingTargetLine(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Interventions */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Intervention Options (tappable chips)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEditingIntervention}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {editingStage.interventions.map((intervention, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex flex-col gap-1 pt-2">
                        <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                        <select
                          value={intervention.isCorrect ? "correct" : "wrong"}
                          onChange={(e) => updateEditingIntervention(index, "isCorrect", e.target.value === "correct")}
                          className="text-xs border rounded px-1 py-1"
                        >
                          <option value="correct">✓ Correct</option>
                          <option value="wrong">✗ Wrong</option>
                        </select>
                      </div>
                      <Input
                        placeholder={`Intervention ${index + 1}`}
                        value={intervention.interventionText}
                        onChange={(e) => updateEditingIntervention(index, "interventionText", e.target.value)}
                      />
                      {editingStage.interventions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEditingIntervention(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Mark one option as "Correct" — this is the right intervention the player should tap.
                </p>
              </div>

              {/* Why/Do/Don't */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Why / Do / Don't Explainer</h4>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-whyText">Why (scam mechanism)</Label>
                    <Textarea
                      id="edit-whyText"
                      placeholder="Explain how the scam works..."
                      rows={2}
                      value={editingStage.whyText}
                      onChange={(e) => updateEditingStage("whyText", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-doText">Do (correct action)</Label>
                    <Textarea
                      id="edit-doText"
                      placeholder="What should users do instead..."
                      rows={2}
                      value={editingStage.doText}
                      onChange={(e) => updateEditingStage("doText", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-dontText">Don't (never do this)</Label>
                    <Textarea
                      id="edit-dontText"
                      placeholder="What users should never do..."
                      rows={2}
                      value={editingStage.dontText}
                      onChange={(e) => updateEditingStage("dontText", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStage}
              disabled={!editingStage?.title || !editingStage?.category || !editingStage?.scammerLine || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
