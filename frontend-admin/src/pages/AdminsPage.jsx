import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Trash2, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
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
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: admins = [], isLoading } = useAdminsQuery()
  const createAdmin = useCreateAdminMutation()
  const deleteAdmin = useDeleteAdminMutation()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role: "admin" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

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
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }, [newAdmin, createAdmin])

  const handleDeleteAdmin = useCallback(
    async (id) => {
      try {
        await deleteAdmin.mutateAsync(id)
      } catch (err) {
        console.error("Failed to delete admin:", err)
      }
    },
    [deleteAdmin]
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("admins.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("admins.subtitle")}
          </p>
        </div>

        {isSuperAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              {t("admins.addAdmin")}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("admins.createAdmin")}</DialogTitle>
                <DialogDescription>
                  {t("admins.createDesc")}
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("admins.nameLabel")}</Label>
                  <Input
                    id="name"
                    placeholder={t("admins.namePlaceholder")}
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("admins.emailLabel")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("admins.emailPlaceholder")}
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("admins.passwordLabel")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("admins.passwordPlaceholder")}
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">{t("admins.roleLabel")}</Label>
                  <Select
                    value={newAdmin.role}
                    onValueChange={(value) => setNewAdmin((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t("admins.admin")}</SelectItem>
                      <SelectItem value="super_admin">{t("admins.superAdmin")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {t("admins.roleDesc")}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("admins.cancel")}
                </Button>
                <Button
                  onClick={handleCreateAdmin}
                  disabled={!newAdmin.name || !newAdmin.email || !newAdmin.password || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("admins.creating")}
                    </>
                  ) : (
                    t("admins.create")
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
          <span className="ml-2 text-gray-500">{t("admins.loading")}</span>
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{t("admins.noAdmins")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admins.tableName")}</TableHead>
                <TableHead>{t("admins.tableEmail")}</TableHead>
                <TableHead className="w-[130px]">{t("admins.tableRole")}</TableHead>
                <TableHead className="w-[120px]">{t("admins.tableCreated")}</TableHead>
                <TableHead className="w-[80px] text-right">{t("admins.tableActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleColors[admin.role]}>
                      {admin.role === "super_admin" ? t("admins.superAdmin") : t("admins.admin")}
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
                        onClick={() => handleDeleteAdmin(admin.id)}
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
    </div>
  )
}
