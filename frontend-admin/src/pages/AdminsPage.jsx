import { useState, useCallback } from "react"
import { Plus, Trash2, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { Toaster } from "@/components/ui/toast"
import { useToast } from "@/lib/use-toast"
import {
  useAdminsQuery,
  useCreateAdminMutation,
  useDeleteAdminMutation,
} from "@/lib/api"

const roleColors = {
  super_admin: "bg-red-100 text-red-800",
  admin: "bg-blue-100 text-blue-800",
}

export function AdminsPage() {
  const { user } = useAuth()
  const { data: admins = [], isLoading } = useAdminsQuery()
  const createAdmin = useCreateAdminMutation()
  const deleteAdmin = useDeleteAdminMutation()
  const { toasts, toast, dismiss } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role: "admin" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const isSuperAdmin = user?.role === "super_admin"

  const handleCreateAdmin = useCallback(async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) return
    setError("")
    setIsSubmitting(true)
    try {
      await createAdmin.mutateAsync({
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password,
        role: newAdmin.role,
      })
      setNewAdmin({ name: "", email: "", password: "", role: "admin" })
      setIsDialogOpen(false)
      toast({ title: "Admin created", variant: "success" })
    } catch (err) {
      setError(err.message)
      toast({ title: "Failed to create admin", description: err.message, variant: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }, [newAdmin, createAdmin, toast])

  const handleDeleteClick = useCallback((admin) => {
    setAdminToDelete(admin)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!adminToDelete) return
    setIsDeleting(true)
    try {
      await deleteAdmin.mutateAsync(adminToDelete.id)
      toast({ title: "Admin deleted", variant: "success" })
    } catch (err) {
      toast({ title: "Failed to delete admin", description: err.message, variant: "error" })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setAdminToDelete(null)
    }
  }, [adminToDelete, deleteAdmin, toast])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage admin accounts for the awareness hub.
          </p>
        </div>

        {isSuperAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Add Admin
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Admin User</DialogTitle>
                <DialogDescription>
                  Add a new admin user. They will have full access except admin management.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., John Doe"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newAdmin.role}
                    onValueChange={(value) => setNewAdmin((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Admin: full access except user management. Super Admin: full access.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAdmin}
                  disabled={!newAdmin.name || !newAdmin.email || !newAdmin.password || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Admin"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading admins...</span>
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No admin users yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[130px]">Role</TableHead>
                <TableHead className="w-[120px]">Created</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleColors[admin.role]}>
                      {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isSuperAdmin && admin.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(admin)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{adminToDelete?.name}"? This action cannot be undone.
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
