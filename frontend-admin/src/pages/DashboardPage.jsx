import { useState, useCallback } from "react"
import { Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  useAlertsQuery,
  useCreateAlertMutation,
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
  const deleteAlert = useDeleteAlertMutation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({ title: "", category: "", description: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    } catch (error) {
      console.error("Failed to create alert:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [newAlert, createAlert])

  const handleDeleteAlert = useCallback(
    async (id) => {
      try {
        await deleteAlert.mutateAsync(id)
      } catch (error) {
        console.error("Failed to delete alert:", error)
      }
    },
    [deleteAlert]
  )

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
                <TableHead className="w-[80px] text-right">Actions</TableHead>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
