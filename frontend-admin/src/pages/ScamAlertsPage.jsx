import { useState, useCallback } from "react"
import { Plus, Pencil, Trash2, Eye, AlertTriangle, Loader2, Sparkles, Check, Square, CheckSquare, Globe, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/toast"
import { useToast } from "@/lib/use-toast"
import {
  useAlertsQuery,
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useDeleteAlertMutation,
  useUpdateAlertStatusMutation,
} from "@/lib/api"
import { generateAlerts } from "@/lib/ai-alerts"

const categoryColors = {
  "Fake APK": "bg-orange-100 text-orange-800",
  "Phishing Link": "bg-blue-100 text-blue-800",
  "Social Engineering": "bg-purple-100 text-purple-800",
}

const categories = ["Fake APK", "Phishing Link", "Social Engineering"]

const languages = [
  { code: "en", label: "English" },
  { code: "my", label: "Myanmar" },
]

function LanguageTabs({ activeLang, onChange }) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onChange(lang.code)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeLang === lang.code
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}

export function ScamAlertsPage() {
  const { data: alerts = [], isLoading } = useAlertsQuery()
  const createAlert = useCreateAlertMutation()
  const updateAlert = useUpdateAlertMutation()
  const deleteAlert = useDeleteAlertMutation()
  const updateStatus = useUpdateAlertStatusMutation()
  const { toasts, toast, dismiss } = useToast()

  // Create dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({ title: "", titleMy: "", category: "", description: "", descriptionMy: "" })
  const [createLang, setCreateLang] = useState("en")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState(null)
  const [editForm, setEditForm] = useState({ title: "", titleMy: "", category: "", description: "", descriptionMy: "" })
  const [editLang, setEditLang] = useState("en")
  const [isUpdating, setIsUpdating] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [alertToDelete, setAlertToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // View dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingAlert, setViewingAlert] = useState(null)
  const [viewLang, setViewLang] = useState("en")

  // AI Generate state
  const [aiStep, setAiStep] = useState("idle")
  const [alertCount, setAlertCount] = useState(3)
  const [generatedAlerts, setGeneratedAlerts] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())

  const handleViewClick = useCallback((alert) => {
    setViewingAlert(alert)
    setViewLang("en")
    setIsViewDialogOpen(true)
  }, [])

  const handleCreateAlert = useCallback(async () => {
    if (!newAlert.title || !newAlert.category || !newAlert.description) return
    setIsSubmitting(true)
    try {
      await createAlert.mutateAsync({
        title: newAlert.title,
        title_my: newAlert.titleMy || null,
        category: newAlert.category,
        description: newAlert.description,
        description_my: newAlert.descriptionMy || null,
        status: "published",
      })
      setNewAlert({ title: "", titleMy: "", category: "", description: "", descriptionMy: "" })
      setCreateLang("en")
      setIsDialogOpen(false)
      toast({ title: "Alert created", variant: "success" })
    } catch (error) {
      toast({ title: "Failed to create alert", description: error.message, variant: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }, [newAlert, createAlert, toast])

  const handleEditClick = useCallback((alert) => {
    setEditingAlert(alert)
    setEditForm({
      title: alert.title,
      titleMy: alert.titleMy || "",
      category: alert.category,
      description: alert.description,
      descriptionMy: alert.descriptionMy || "",
    })
    setEditLang("en")
    setIsEditDialogOpen(true)
  }, [])

  const handleUpdateAlert = useCallback(async () => {
    if (!editForm.title || !editForm.category || !editForm.description) return
    setIsUpdating(true)
    try {
      await updateAlert.mutateAsync({
        id: editingAlert.id,
        title: editForm.title,
        title_my: editForm.titleMy || null,
        category: editForm.category,
        description: editForm.description,
        description_my: editForm.descriptionMy || null,
      })
      setIsEditDialogOpen(false)
      setEditingAlert(null)
      toast({ title: "Alert updated", variant: "success" })
    } catch (error) {
      toast({ title: "Failed to update alert", description: error.message, variant: "error" })
    } finally {
      setIsUpdating(false)
    }
  }, [editForm, editingAlert, updateAlert, toast])

  const handleDeleteClick = useCallback((alert) => {
    setAlertToDelete(alert)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!alertToDelete) return
    setIsDeleting(true)
    try {
      await deleteAlert.mutateAsync(alertToDelete.id)
      toast({ title: "Alert deleted", variant: "success" })
    } catch (error) {
      toast({ title: "Failed to delete alert", description: error.message, variant: "error" })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setAlertToDelete(null)
    }
  }, [alertToDelete, deleteAlert, toast])

  const handleToggleStatus = useCallback(
    async (id, currentStatus) => {
      const newStatus = currentStatus === "published" ? "draft" : "published"
      try {
        await updateStatus.mutateAsync({ id, status: newStatus })
        toast({ title: `Alert ${newStatus === "published" ? "published" : "unpublished"}`, variant: "success" })
      } catch (error) {
        toast({ title: "Failed to update status", description: error.message, variant: "error" })
      }
    },
    [updateStatus, toast]
  )

  // AI Generate handlers
  const handleGenerateClick = useCallback(() => {
    setAlertCount(3)
    setAiStep("count")
  }, [])

  const handleGenerate = useCallback(() => {
    setAiStep("generating")
    setTimeout(() => {
      const alerts = generateAlerts(alertCount)
      setGeneratedAlerts(alerts)
      setSelectedIds(new Set(alerts.map((_, i) => i)))
      setAiStep("review")
    }, 800)
  }, [alertCount])

  const handleToggleSelect = useCallback((index) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === generatedAlerts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(generatedAlerts.map((_, i) => i)))
    }
  }, [selectedIds.size, generatedAlerts.length])

  const handleAddSelected = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const selected = generatedAlerts.filter((_, i) => selectedIds.has(i))
      for (const alert of selected) {
        await createAlert.mutateAsync({ ...alert, status: "draft" })
      }
      toast({ title: `${selected.length} alerts added as drafts`, variant: "success" })
      setAiStep("idle")
      setGeneratedAlerts([])
      setSelectedIds(new Set())
    } catch (error) {
      toast({ title: "Failed to create alerts", description: error.message, variant: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }, [generatedAlerts, selectedIds, createAlert, toast])

  const handleAiCancel = useCallback(() => {
    setAiStep("idle")
    setGeneratedAlerts([])
    setSelectedIds(new Set())
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Scam Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and publish scam alerts for the awareness hub.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateClick}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-700 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Generate New Alerts</span>
            <span className="sm:hidden">AI Generate</span>
          </button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create New Alert</span>
              <span className="sm:hidden">Create</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Scam Alert</DialogTitle>
                <DialogDescription>
                  Add a new scam alert. English is required, Myanmar is optional.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <LanguageTabs activeLang={createLang} onChange={setCreateLang} />

                {createLang === "en" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title (English) *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Fake KPay APK Spreading via Viber"
                        value={newAlert.title}
                        onChange={(e) => setNewAlert((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (English) *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the scam pattern, how it works, and what users should watch out for..."
                        rows={4}
                        value={newAlert.description}
                        onChange={(e) => setNewAlert((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="titleMy">Title (Myanmar)</Label>
                      <Input
                        id="titleMy"
                        placeholder="e.g., Viber တွင် ဖြန့်ဝေနေသော KPay APK အတု"
                        value={newAlert.titleMy}
                        onChange={(e) => setNewAlert((prev) => ({ ...prev, titleMy: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descriptionMy">Description (Myanmar)</Label>
                      <Textarea
                        id="descriptionMy"
                        placeholder="မြန်မာဘာသာဖြင့် ဖော်ပြပါ..."
                        rows={4}
                        value={newAlert.descriptionMy}
                        onChange={(e) => setNewAlert((prev) => ({ ...prev, descriptionMy: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newAlert.category}
                    onValueChange={(value) => setNewAlert((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAlert}
                  disabled={!newAlert.title || !newAlert.category || !newAlert.description || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Alert"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Generate - Count Dialog */}
      <Dialog open={aiStep === "count"} onOpenChange={(open) => !open && handleAiCancel()}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Generate Alerts
            </DialogTitle>
            <DialogDescription>
              How many scam alerts would you like to generate?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="alertCount">Number of alerts (1-10)</Label>
            <Input
              id="alertCount"
              type="number"
              min={1}
              max={10}
              value={alertCount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (v >= 1 && v <= 10) setAlertCount(v)
              }}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleAiCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate - Generating Animation */}
      <Dialog open={aiStep === "generating"}>
        <DialogContent className="sm:max-w-[340px]" hideClose>
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="relative">
              <Sparkles className="h-12 w-12 text-violet-500 animate-pulse" />
            </div>
            <p className="text-sm text-gray-500">Generating scam alerts...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Generate - Review Dialog */}
      <Dialog open={aiStep === "review"} onOpenChange={(open) => !open && handleAiCancel()}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Review Generated Alerts ({generatedAlerts.length})
            </DialogTitle>
            <DialogDescription>
              Select which alerts you want to add to the dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 space-y-3">
            {generatedAlerts.map((alert, index) => (
              <div
                key={index}
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  selectedIds.has(index)
                    ? "border-violet-400 bg-violet-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => handleToggleSelect(index)}
              >
                <div className="absolute top-3 left-3">
                  {selectedIds.has(index) ? (
                    <CheckSquare className="h-5 w-5 text-violet-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                <div className="ml-8">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{alert.title}</p>
                  </div>
                  <Badge variant="secondary" className={`text-xs ${categoryColors[alert.category]}`}>
                    {alert.category}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <button
              onClick={handleSelectAll}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              {selectedIds.size === generatedAlerts.length ? "Deselect All" : "Select All"} ({selectedIds.size}/{generatedAlerts.length})
            </button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAiCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={selectedIds.size === 0 || isSubmitting}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Add Selected ({selectedIds.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Alerts</p>
          <p className="text-2xl font-bold">{alerts.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold">{categories.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Latest Update</p>
          <p className="text-2xl font-bold">
            {alerts.length > 0 ? alerts[0].date : "—"}
          </p>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading alerts...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No scam alerts yet.</p>
          <p className="text-sm text-gray-400">Click "Create New Alert" to add one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-[150px] hidden sm:table-cell">Category</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px] hidden md:table-cell">Date</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <p className="font-medium">{alert.title}</p>
                    <Badge variant="secondary" className={`text-xs mt-1 sm:hidden ${categoryColors[alert.category]}`}>
                      {alert.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className={categoryColors[alert.category]}>
                      {alert.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(alert.id, alert.status)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        alert.status === "published"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      }`}
                    >
                      {alert.status === "published" ? (
                        <>
                          <Globe className="h-3 w-3" />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 hidden md:table-cell">{alert.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewClick(alert)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(alert)}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(alert)}
                        disabled={isDeleting}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Alert</DialogTitle>
            <DialogDescription>
              Update the scam alert details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <LanguageTabs activeLang={editLang} onChange={setEditLang} />

            {editLang === "en" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title (English) *</Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g., Fake KPay APK Spreading via Viber"
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description (English) *</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe the scam pattern, how it works, and what users should watch out for..."
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-titleMy">Title (Myanmar)</Label>
                  <Input
                    id="edit-titleMy"
                    placeholder="e.g., Viber တွင် ဖြန့်ဝေနေသော KPay APK အတု"
                    value={editForm.titleMy}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, titleMy: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-descriptionMy">Description (Myanmar)</Label>
                  <Textarea
                    id="edit-descriptionMy"
                    placeholder="မြန်မာဘာသာဖြင့် ဖော်ပြပါ..."
                    rows={4}
                    value={editForm.descriptionMy}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, descriptionMy: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAlert}
              disabled={!editForm.title || !editForm.category || !editForm.description || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Alert</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{alertToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Alert Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {viewLang === "my" && viewingAlert?.titleMy ? viewingAlert.titleMy : viewingAlert?.title}
            </DialogTitle>
            <DialogDescription>Scam alert details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <LanguageTabs activeLang={viewLang} onChange={setViewLang} />

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={categoryColors[viewingAlert?.category]}>
                {viewingAlert?.category}
              </Badge>
              <span className="text-sm text-gray-500">{viewingAlert?.date}</span>
            </div>

            <div>
              <Label>{viewLang === "my" ? "Myanmar Title" : "English Title"}</Label>
              <p className="mt-1 text-sm text-gray-700">
                {viewLang === "my" && viewingAlert?.titleMy ? viewingAlert.titleMy : viewingAlert?.title}
              </p>
            </div>

            <div>
              <Label>{viewLang === "my" ? "Myanmar Description" : "English Description"}</Label>
              <p className="mt-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {viewLang === "my" && viewingAlert?.descriptionMy
                  ? viewingAlert.descriptionMy
                  : viewingAlert?.description}
              </p>
            </div>

            {viewLang === "my" && !viewingAlert?.descriptionMy && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
                Myanmar translation not available yet.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
