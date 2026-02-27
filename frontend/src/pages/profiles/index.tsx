import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import {
  GetProfiles,
  SaveCurrentAsProfile,
  ApplyProfile,
  DeleteProfile,
  UpdateProfile,
} from "@wailsjs/go/services/ProfileService"
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
  Add01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  RefreshIcon,
  PlayIcon,
  Settings02Icon,
} from "hugeicons-react"

interface Profile {
  name: string
  description: string
  agentSkills: Record<string, string[]>
  createdAt: string
  updatedAt: string
}

interface ProfilesConfig {
  profiles: Profile[]
  active: string
}

const getProfiles = () => GetProfiles()
const saveCurrentAsProfile = (name: string, desc: string) => SaveCurrentAsProfile(name, desc)
const applyProfile = (name: string) => ApplyProfile(name)
const deleteProfile = (name: string) => DeleteProfile(name)
const updateProfile = (name: string) => UpdateProfile(name)

const ProfilesPage = () => {
  const { t } = useTranslation()
  const [config, setConfig] = useState<ProfilesConfig>({ profiles: [], active: "" })
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getProfiles()
      setConfig({
        profiles: data?.profiles || [],
        active: data?.active || "",
      })
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      setCreating(true)
      await saveCurrentAsProfile(newName.trim(), newDesc.trim())
      toast({ title: t("profile-created", { name: newName }), variant: "success" })
      setShowCreate(false)
      setNewName("")
      setNewDesc("")
      load()
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleApply = async (name: string) => {
    try {
      setApplying(name)
      await applyProfile(name)
      toast({ title: t("profile-applied", { name }), variant: "success" })
      load()
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    } finally {
      setApplying(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProfile(deleteTarget)
      toast({ title: t("profile-deleted", { name: deleteTarget }), variant: "success" })
      setDeleteTarget(null)
      load()
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    }
  }

  const handleUpdate = async (name: string) => {
    try {
      await updateProfile(name)
      toast({ title: t("profile-updated", { name }), variant: "success" })
      load()
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    }
  }

  const getTotalSkills = (p: Profile) => {
    const set = new Set<string>()
    Object.values(p.agentSkills || {}).forEach(skills => skills.forEach(s => set.add(s)))
    return set.size
  }

  const getTotalAgents = (p: Profile) => Object.keys(p.agentSkills || {}).length

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <Button size="sm" className="h-8 text-[12px]" onClick={() => setShowCreate(true)}>
            <Add01Icon size={14} className="mr-1.5" />
            {t("profile-create")}
          </Button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshIcon size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : config.profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Settings02Icon size={32} className="mb-3 opacity-30" />
            <p className="text-sm">{t("no-profiles")}</p>
            <p className="text-xs mt-1 opacity-60">{t("no-profiles-hint")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.profiles.map((profile) => (
              <div
                key={profile.name}
                className={`rounded-lg border p-4 transition-colors ${
                  config.active === profile.name
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold truncate">{profile.name}</h3>
                      {config.active === profile.name && (
                        <Badge variant="default" className="text-[10px] h-5 px-1.5">
                          <CheckmarkCircle02Icon size={10} className="mr-0.5" />
                          {t("profile-active")}
                        </Badge>
                      )}
                    </div>
                    {profile.description && (
                      <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{profile.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                  <span>{getTotalSkills(profile)} {t("skills")}</span>
                  <span>·</span>
                  <span>{getTotalAgents(profile)} {t("agents")}</span>
                  <span>·</span>
                  <span>{new Date(profile.updatedAt || profile.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/30">
                  <Button
                    size="sm"
                    variant={config.active === profile.name ? "secondary" : "default"}
                    className="h-7 text-[11px] flex-1"
                    onClick={() => handleApply(profile.name)}
                    disabled={applying === profile.name}
                  >
                    {applying === profile.name ? (
                      <RefreshIcon size={12} className="mr-1 animate-spin" />
                    ) : (
                      <PlayIcon size={12} className="mr-1" />
                    )}
                    {config.active === profile.name ? t("profile-reapply") : t("profile-apply")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => handleUpdate(profile.name)}
                  >
                    <RefreshIcon size={12} className="mr-1" />
                    {t("profile-snapshot")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(profile.name)}
                  >
                    <Delete02Icon size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("profile-create")}</DialogTitle>
            <DialogDescription>{t("profile-create-desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={t("profile-name-placeholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <Input
              placeholder={t("profile-desc-placeholder")}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("cancel")}</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}>
              {creating ? t("creating") : t("profile-create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile-delete-confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("profile-delete-confirm-desc", { name: deleteTarget })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ProfilesPage
