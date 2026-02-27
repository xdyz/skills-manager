import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  RefreshIcon,
  Add01Icon,
  Delete02Icon,
  Download04Icon,
  Upload04Icon,
  Settings02Icon,
  Clock01Icon,
  Folder01Icon,
  CheckmarkCircle02Icon,
} from "hugeicons-react"
import {
  CreateBackup,
  DeleteBackup,
  GetBackupConfig,
  GetBackupItems,
  GetBackups,
  RestoreBackup,
  SetBackupConfig,
} from "@wailsjs/go/services/BackupService"
import { services } from "@wailsjs/go/models"

const BackupPage = () => {
  const { t } = useTranslation()
  const [backups, setBackups] = useState<services.BackupInfo[]>([])
  const [backupItems, setBackupItems] = useState<services.BackupItem[]>([])
  const [config, setConfig] = useState<services.BackupConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null)
  const [backupToRestore, setBackupToRestore] = useState<services.BackupInfo | null>(null)
  const [newBackupName, setNewBackupName] = useState("")
  const [newBackupDesc, setNewBackupDesc] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [restoreOptions, setRestoreOptions] = useState({
    restoreSkills: true,
    restoreSettings: true,
    restoreProjects: false,
    restoreLogs: false,
    overwriteExisting: false,
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [b, items, cfg] = await Promise.all([
        GetBackups(),
        GetBackupItems(),
        GetBackupConfig(),
      ])
      setBackups(b || [])
      setBackupItems(items || [])
      setConfig(cfg)
      setSelectedItems((items || []).filter(i => i.required).map(i => i.name))
    } catch (error) {
      console.error("Failed to load backup data:", error)
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { loadData() }, [loadData])

  const handleCreateBackup = async () => {
    if (!newBackupName.trim()) return
    try {
      setCreating(true)
      await CreateBackup(newBackupName.trim(), newBackupDesc, selectedItems)
      toast({ title: t("backup-created-success") })
      setShowCreateDialog(false)
      setNewBackupName("")
      setNewBackupDesc("")
      loadData()
    } catch (error) {
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteBackup = async () => {
    if (!backupToDelete) return
    try {
      await DeleteBackup(backupToDelete)
      toast({ title: t("backup-deleted-success") })
      setBackupToDelete(null)
      loadData()
    } catch (error) {
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    }
  }

  const handleRestore = async () => {
    if (!backupToRestore) return
    try {
      const opts = new services.RestoreOptions({
        backupId: backupToRestore.id,
        restoreSkills: restoreOptions.restoreSkills,
        restoreSettings: restoreOptions.restoreSettings,
        restoreProjects: restoreOptions.restoreProjects,
        restoreLogs: restoreOptions.restoreLogs,
        overwriteExisting: restoreOptions.overwriteExisting,
        selectedItems: [],
      })
      await RestoreBackup(opts)
      toast({ title: t("backup-restored-success") })
      setShowRestoreDialog(false)
      setBackupToRestore(null)
    } catch (error) {
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return
    try {
      await SetBackupConfig(config)
      toast({ title: t("backup-config-saved") })
      setShowConfigDialog(false)
    } catch (error) {
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "-"
    try {
      return new Date(dateObj).toLocaleString()
    } catch {
      return "-"
    }
  }

  const toggleItem = (name: string) => {
    setSelectedItems(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowConfigDialog(true)}>
            <Settings02Icon className="h-4 w-4 mr-2" />{t("backup-settings")}
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Add01Icon className="h-4 w-4 mr-2" />{t("backup-create")}
          </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Download04Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{backups.length}</p>
            <p className="text-xs text-muted-foreground">{t("backup-total")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Folder01Icon className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{formatSize(backups.reduce((sum, b) => sum + (b.size || 0), 0))}</p>
            <p className="text-xs text-muted-foreground">{t("backup-total-size")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Clock01Icon className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-sm font-bold truncate">{backups.length > 0 ? formatDate(backups[0]?.createdAt) : "-"}</p>
            <p className="text-xs text-muted-foreground">{t("backup-last")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <CheckmarkCircle02Icon className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold">{config?.autoBackup ? "ON" : "OFF"}</p>
            <p className="text-xs text-muted-foreground">{t("backup-auto")}</p>
          </CardContent>
        </Card>
      </div>

      {backups.length === 0 ? (
        <div className="text-center py-16">
          <Download04Icon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{t("backup-no-backups")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("backup-no-backups-hint")}</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("backup-list")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backups.map(backup => (
                <div key={backup.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{backup.name}</p>
                      <Badge variant={backup.status === "completed" ? "secondary" : "outline"} className="text-xs">
                        {backup.type}
                      </Badge>
                    </div>
                    {backup.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{backup.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(backup.createdAt)}</span>
                      <span>{formatSize(backup.size || 0)}</span>
                      {(backup.items || []).length > 0 && (
                        <span>{backup.items.length} {t("backup-items-count")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-4">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                      setBackupToRestore(backup)
                      setShowRestoreDialog(true)
                    }}>
                      <Upload04Icon className="h-3.5 w-3.5 mr-1" />{t("backup-restore")}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setBackupToDelete(backup.id)}>
                      <Delete02Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Backup Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("backup-create")}</DialogTitle>
            <DialogDescription>{t("backup-create-desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("backup-name")}</Label>
              <Input value={newBackupName} onChange={e => setNewBackupName(e.target.value)} placeholder={t("backup-name-placeholder")} />
            </div>
            <div>
              <Label>{t("description")}</Label>
              <Input value={newBackupDesc} onChange={e => setNewBackupDesc(e.target.value)} placeholder={t("backup-desc-placeholder")} />
            </div>
            <div>
              <Label className="mb-2 block">{t("backup-select-items")}</Label>
              <div className="space-y-2">
                {backupItems.map(item => (
                  <div key={item.name} className="flex items-center gap-3 p-2 rounded border border-border/50">
                    <Checkbox
                      checked={selectedItems.includes(item.name)}
                      onCheckedChange={() => toggleItem(item.name)}
                      disabled={item.required}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatSize(item.size || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleCreateBackup} disabled={creating || !newBackupName.trim()}>
              {creating ? <RefreshIcon className="h-4 w-4 animate-spin mr-2" /> : <Add01Icon className="h-4 w-4 mr-2" />}
              {t("backup-create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={open => { setShowRestoreDialog(open); if (!open) setBackupToRestore(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("backup-restore")}</DialogTitle>
            <DialogDescription>{t("backup-restore-desc", { name: backupToRestore?.name || "" })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("backup-restore-skills")}</Label>
              <Switch checked={restoreOptions.restoreSkills} onCheckedChange={v => setRestoreOptions(prev => ({ ...prev, restoreSkills: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("backup-restore-settings")}</Label>
              <Switch checked={restoreOptions.restoreSettings} onCheckedChange={v => setRestoreOptions(prev => ({ ...prev, restoreSettings: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("backup-restore-projects")}</Label>
              <Switch checked={restoreOptions.restoreProjects} onCheckedChange={v => setRestoreOptions(prev => ({ ...prev, restoreProjects: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t("backup-overwrite")}</Label>
              <Switch checked={restoreOptions.overwriteExisting} onCheckedChange={v => setRestoreOptions(prev => ({ ...prev, overwriteExisting: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleRestore}>
              <Upload04Icon className="h-4 w-4 mr-2" />{t("backup-start-restore")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("backup-settings")}</DialogTitle>
            <DialogDescription>{t("backup-settings-desc")}</DialogDescription>
          </DialogHeader>
          {config && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t("backup-auto")}</Label>
                <Switch checked={config.autoBackup} onCheckedChange={v => setConfig(prev => prev ? new services.BackupConfig({ ...prev, autoBackup: v }) : prev)} />
              </div>
              <div>
                <Label>{t("backup-interval")}</Label>
                <Input type="number" value={config.backupInterval} onChange={e => setConfig(prev => prev ? new services.BackupConfig({ ...prev, backupInterval: parseInt(e.target.value) || 24 }) : prev)} />
              </div>
              <div>
                <Label>{t("backup-max-count")}</Label>
                <Input type="number" value={config.maxBackups} onChange={e => setConfig(prev => prev ? new services.BackupConfig({ ...prev, maxBackups: parseInt(e.target.value) || 10 }) : prev)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t("backup-include-skills")}</Label>
                <Switch checked={config.includeSkills} onCheckedChange={v => setConfig(prev => prev ? new services.BackupConfig({ ...prev, includeSkills: v }) : prev)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t("backup-include-settings")}</Label>
                <Switch checked={config.includeSettings} onCheckedChange={v => setConfig(prev => prev ? new services.BackupConfig({ ...prev, includeSettings: v }) : prev)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleSaveConfig}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!backupToDelete} onOpenChange={open => !open && setBackupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("backup-delete-confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("backup-delete-confirm-desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBackup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BackupPage
