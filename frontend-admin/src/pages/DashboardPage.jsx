import { useState, useCallback } from "react"
import { Plus, Pencil, Trash2, AlertTriangle, Loader2 } from "lucide-react"
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
} from "@/lib/api"

const categoryColors = {
  "Fake APK": "bg-orange-100 text-orange-800",
  "Phishing Link": "bg-blue-100 text-blue-800",
  "Social Engineering": "bg-purple-100 text-purple-800",
}

const categories = ["Fake APK", "Phishing Link", "Social Engineering"]

export function DashboardPage() {
  const { data: alerts = [], isLoading } = useAlertsQuery()
  const createAlert = useCreateAlertMutation()
  const updateAlert = useUpdateAlertMutation()
  const deleteAlert = useDeleteAlertMutation()
  const { toasts, toast, dismiss } = useToast()

  // Create dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({ title: "", category: "", description: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState(null)
  const [editForm, setEditForm] = useState({ title: "", category: "", description: "" })
  const [isUpdating, setIsUpdating] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [alertToDelete, setAlertToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreateAlert = useCallback(async () => {
    if (!newAlert.title || !newAlert.category || !newAlert.description) return
    setIsSubmitting(true)
    try {
      await createAlert.mutateAsync({
        title: newAlert.title,
        category: newAlert.category,
        description: newAlert.description,
      })
      setNewAlert({ title: "", category: "", description: "" })
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
    setEditForm({ title: alert.title, category: alert.category, description: alert.description })
    setIsEditDialogOpen(true)
  }, [])

  const handleUpdateAlert = useCallback(async () => {
    if (!editForm.title || !editForm.category || !editForm.description) return
    setIsUpdating(true)
    try {
      await updateAlert.mutateAsync({
        id: editingAlert.id,
        title: editForm.title,
        category: editForm.category,
        description: editForm.description,
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Scam Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and publish scam alerts for the awareness hub.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Create New Alert
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Scam Alert</DialogTitle>
              <DialogDescription>
                Add a new scam alert to the awareness hub. Fill in all fields below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Fake KPay APK Spreading via Viber"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the scam pattern, how it works, and what users should watch out for..."
                  rows={4}
                  value={newAlert.description}
                  onChange={(e) => setNewAlert((prev) => ({ ...prev, description: e.target.value }))}
                />
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
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-[150px]">Category</TableHead>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{alert.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={categoryColors[alert.category]}>
                      {alert.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{alert.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Alert</DialogTitle>
            <DialogDescription>
              Update the scam alert details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Fake KPay APK Spreading via Viber"
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
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

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe the scam pattern, how it works, and what users should watch out for..."
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              />
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

      <Toaster toasts={toasts} dismiss={dismiss} />
    </div>
  )
}