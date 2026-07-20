import { useState, useCallback } from "react"
import { Plus, Pencil, Trash2, Loader2, Newspaper, ExternalLink } from "lucide-react"
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
  useNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
} from "@/lib/api"

const categoryColors = {
  international: "bg-blue-100 text-blue-800",
  myanmar: "bg-emerald-100 text-emerald-800",
}

const categoryLabels = {
  international: "International",
  myanmar: "Myanmar",
}

export function NewsPage() {
  const { data: news = [], isLoading } = useNewsQuery()
  const createNews = useCreateNewsMutation()
  const updateNews = useUpdateNewsMutation()
  const deleteNews = useDeleteNewsMutation()
  const { toasts, toast, dismiss } = useToast()

  // Create dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    category: "international",
    sourceUrl: "",
    sourceName: "",
    imageUrl: "",
    publishedAt: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [isUpdating, setIsUpdating] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const resetForm = useCallback(() => {
    setForm({
      title: "",
      summary: "",
      content: "",
      category: "international",
      sourceUrl: "",
      sourceName: "",
      imageUrl: "",
      publishedAt: "",
    })
  }, [])

  const handleCreate = useCallback(async () => {
    if (!form.title || !form.category) return
    setIsSubmitting(true)
    try {
      await createNews.mutateAsync({
        title: form.title,
        summary: form.summary || null,
        content: form.content || null,
        category: form.category,
        sourceUrl: form.sourceUrl || null,
        sourceName: form.sourceName || null,
        imageUrl: form.imageUrl || null,
        publishedAt: form.publishedAt || null,
      })
      resetForm()
      setIsDialogOpen(false)
      toast({ title: "News article created", variant: "success" })
    } catch (error) {
      toast({ title: "Failed to create article", description: error.message, variant: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }, [form, createNews, toast, resetForm])

  const handleEditClick = useCallback((item) => {
    setEditingItem(item)
    setEditForm({
      title: item.title || "",
      summary: item.summary || "",
      content: item.content || "",
      category: item.category || "international",
      sourceUrl: item.sourceUrl || "",
      sourceName: item.sourceName || "",
      imageUrl: item.imageUrl || "",
      publishedAt: item.publishedAt ? item.publishedAt.split("T")[0] : "",
    })
    setIsEditDialogOpen(true)
  }, [])

  const handleUpdate = useCallback(async () => {
    if (!editForm.title || !editForm.category) return
    setIsUpdating(true)
    try {
      await updateNews.mutateAsync({
        id: editingItem.id,
        title: editForm.title,
        summary: editForm.summary || null,
        content: editForm.content || null,
        category: editForm.category,
        sourceUrl: editForm.sourceUrl || null,
        sourceName: editForm.sourceName || null,
        imageUrl: editForm.imageUrl || null,
        publishedAt: editForm.publishedAt || null,
      })
      setIsEditDialogOpen(false)
      setEditingItem(null)
      toast({ title: "News article updated", variant: "success" })
    } catch (error) {
      toast({ title: "Failed to update article", description: error.message, variant: "error" })
    } finally {
      setIsUpdating(false)
    }
  }, [editForm, editingItem, updateNews, toast])

  const handleDeleteClick = useCallback((item) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      await deleteNews.mutateAsync(itemToDelete.id)
      toast({ title: "News article deleted", variant: "success" })
    } catch (error) {
      toast({ title: "Failed to delete article", description: error.message, variant: "error" })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }, [itemToDelete, deleteNews, toast])

  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">News</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage news articles about international and Myanmar scam trends.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create News Article</span>
            <span className="sm:hidden">Create</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create News Article</DialogTitle>
              <DialogDescription>
                Add a new news article about scam trends.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Global Scam Networks Target Southeast Asian Users"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="international">International</SelectItem>
                    <SelectItem value="myanmar">Myanmar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Brief summary of the article..."
                  rows={2}
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Full Content</Label>
                <Textarea
                  id="content"
                  placeholder="Full article content..."
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceName">Source Name</Label>
                  <Input
                    id="sourceName"
                    placeholder="e.g., Reuters"
                    value={form.sourceName}
                    onChange={(e) => setForm((prev) => ({ ...prev, sourceName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishedAt">Publish Date</Label>
                  <Input
                    id="publishedAt"
                    type="date"
                    value={form.publishedAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, publishedAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceUrl">Source URL</Label>
                <Input
                  id="sourceUrl"
                  placeholder="https://..."
                  value={form.sourceUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, sourceUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!form.title || !form.category || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Article"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Articles</p>
          <p className="text-2xl font-bold">{news.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">International</p>
          <p className="text-2xl font-bold">{news.filter((n) => n.category === "international").length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Myanmar</p>
          <p className="text-2xl font-bold">{news.filter((n) => n.category === "myanmar").length}</p>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading news...</span>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-12">
          <Newspaper className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No news articles yet.</p>
          <p className="text-sm text-gray-400">Click "Create News Article" to add one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-[130px] hidden sm:table-cell">Category</TableHead>
                <TableHead className="w-[100px] hidden md:table-cell">Source</TableHead>
                <TableHead className="w-[110px] hidden md:table-cell">Published</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium line-clamp-1">{item.title}</p>
                    {item.summary && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.summary}</p>
                    )}
                    <Badge variant="secondary" className={`text-xs mt-1 sm:hidden ${categoryColors[item.category]}`}>
                      {categoryLabels[item.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className={categoryColors[item.category]}>
                      {categoryLabels[item.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 hidden md:table-cell">
                    {item.sourceName || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 hidden md:table-cell">
                    {formatDate(item.publishedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.sourceUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(item)}
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(item)}
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
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit News Article</DialogTitle>
            <DialogDescription>
              Update the news article details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                placeholder="Article title"
                value={editForm.title || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={editForm.category || "international"}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="international">International</SelectItem>
                  <SelectItem value="myanmar">Myanmar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-summary">Summary</Label>
              <Textarea
                id="edit-summary"
                placeholder="Brief summary..."
                rows={2}
                value={editForm.summary || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, summary: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Full Content</Label>
              <Textarea
                id="edit-content"
                placeholder="Full article content..."
                rows={4}
                value={editForm.content || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sourceName">Source Name</Label>
                <Input
                  id="edit-sourceName"
                  placeholder="e.g., Reuters"
                  value={editForm.sourceName || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, sourceName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-publishedAt">Publish Date</Label>
                <Input
                  id="edit-publishedAt"
                  type="date"
                  value={editForm.publishedAt || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, publishedAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sourceUrl">Source URL</Label>
              <Input
                id="edit-sourceUrl"
                placeholder="https://..."
                value={editForm.sourceUrl || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, sourceUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input
                id="edit-imageUrl"
                placeholder="https://..."
                value={editForm.imageUrl || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editForm.title || !editForm.category || isUpdating}
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
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
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
