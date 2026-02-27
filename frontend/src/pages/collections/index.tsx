import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  Download04Icon,
  RefreshIcon,
  Folder01Icon,
  CodeIcon,
  Configuration01Icon,
} from "hugeicons-react"
import {
  GetCollections,
  CreateCollection,
  DeleteCollection,
  UpdateCollection,
  InstallCollection,
  GetAllAgentSkills,
} from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import type { AgentInfo } from "@/types"
import ProfilesPage from "../profiles"

interface SkillCollection {
  name: string
  description: string
  skills: string[]
  createdAt: string
}

const CollectionsPage = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"collections" | "profiles">("collections")
  const [collections, setCollections] = useState<SkillCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCollection, setEditingCollection] = useState<SkillCollection | null>(null)
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null)
  const [installingCollection, setInstallingCollection] = useState<string | null>(null)

  // Form
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formSkills, setFormSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")

  // Installed skills for selection
  const [installedSkills, setInstalledSkills] = useState<string[]>([])
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])

  useEffect(() => {
    loadCollections()
    loadInstalledSkills()
    loadAgents()
  }, [])

  const loadCollections = async () => {
    try {
      setLoading(true)
      const result = await GetCollections()
      setCollections(result || [])
    } catch {}
    setLoading(false)
  }

  const loadInstalledSkills = async () => {
    try {
      const skills = await GetAllAgentSkills()
      setInstalledSkills((skills || []).map(s => s.name))
    } catch {}
  }

  const loadAgents = async () => {
    try {
      const result = await GetSupportedAgents()
      setAllAgents(result || [])
    } catch {}
  }

  const openCreate = () => {
    setFormName("")
    setFormDesc("")
    setFormSkills([])
    setSkillInput("")
    setEditingCollection(null)
    setShowCreateDialog(true)
  }

  const openEdit = (col: SkillCollection) => {
    setFormName(col.name)
    setFormDesc(col.description)
    setFormSkills([...col.skills])
    setSkillInput("")
    setEditingCollection(col)
    setShowCreateDialog(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    try {
      if (editingCollection) {
        await UpdateCollection(formName, formDesc, formSkills)
      } else {
        await CreateCollection(formName, formDesc, formSkills)
      }
      toast({ title: t("toast-collection-created", { name: formName }), variant: "success" })
      setShowCreateDialog(false)
      await loadCollections()
    } catch (error) {
      toast({ title: t("toast-collection-failed", { error }), variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!collectionToDelete) return
    try {
      await DeleteCollection(collectionToDelete)
      toast({ title: t("toast-collection-deleted", { name: collectionToDelete }), variant: "success" })
      await loadCollections()
    } catch (error) {
      toast({ title: t("toast-collection-failed", { error }), variant: "destructive" })
    }
    setCollectionToDelete(null)
  }

  const handleInstall = async (name: string) => {
    try {
      setInstallingCollection(name)
      const agents = allAgents.map(a => a.name)
      const count = await InstallCollection(name, agents)
      toast({ title: t("toast-collection-installed", { count }), variant: "success" })
    } catch (error) {
      toast({ title: t("toast-collection-failed", { error }), variant: "destructive" })
    } finally {
      setInstallingCollection(null)
    }
  }

  const toggleSkill = (name: string) => {
    setFormSkills(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    )
  }

  const addCustomSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !formSkills.includes(trimmed)) {
      setFormSkills(prev => [...prev, trimmed])
      setSkillInput("")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="shrink-0 px-6 pt-5 pb-0 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground/90">{t("collections")}</h1>
            <p className="text-[13px] text-muted-foreground">{t("collections-desc")}</p>
          </div>
          {activeTab === "collections" && (
            <Button size="sm" onClick={openCreate}>
              <Add01Icon size={14} className="mr-1.5" />
              {t("create-collection")}
            </Button>
          )}
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "collections" | "profiles")} className="mt-3">
          <TabsList className="h-9">
            <TabsTrigger value="collections" className="text-[12px] gap-1.5">
              <Folder01Icon size={13} />
              {t("collections")}
            </TabsTrigger>
            <TabsTrigger value="profiles" className="text-[12px] gap-1.5">
              <Configuration01Icon size={13} />
              {t("profiles-nav")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "profiles" ? (
        <ProfilesPage />
      ) : (<>
      <div className="flex-1 overflow-y-auto p-6">
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[360px] select-none">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
              <Folder01Icon size={28} className="text-muted-foreground/50" />
            </div>
            <p className="text-[15px] font-medium text-foreground/70 mb-1.5">{t("no-collections")}</p>
            <Button className="mt-4" onClick={openCreate}>
              <Add01Icon size={16} className="mr-1.5" />
              {t("create-collection")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {collections.map((col) => (
              <Card key={col.name} className="flex flex-col border-border/50 shadow-none hover:shadow-sm transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-[14px] truncate">{col.name}</CardTitle>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{col.skills?.length || 0} skills</Badge>
                  </div>
                  {col.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{col.description}</p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(col.skills || []).slice(0, 5).map(s => (
                      <Badge key={s} variant="outline" className="text-[10px]">
                        <CodeIcon size={10} className="mr-0.5" />
                        {s}
                      </Badge>
                    ))}
                    {(col.skills || []).length > 5 && (
                      <Badge variant="outline" className="text-[10px]">+{col.skills.length - 5}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="default" className="h-7 text-[11px] flex-1" onClick={() => handleInstall(col.name)} disabled={installingCollection === col.name}>
                      {installingCollection === col.name ? (
                        <><RefreshIcon size={12} className="mr-1 animate-spin" />{t("installing-collection")}</>
                      ) : (
                        <><Download04Icon size={12} className="mr-1" />{t("install-collection")}</>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEdit(col)}>
                      <Edit02Icon size={12} />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setCollectionToDelete(col.name)}>
                      <Delete02Icon size={12} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingCollection ? t("edit-collection") : t("create-collection")}</DialogTitle>
            <DialogDescription>{t("collections-desc")}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-2">
              <label className="text-[12px] font-medium">{t("collection-name")}</label>
              <Input
                placeholder={t("collection-name-placeholder")}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={!!editingCollection}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-medium">{t("collection-description")}</label>
              <Input
                placeholder={t("collection-description-placeholder")}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-medium">{t("collection-skills")}</label>
              <p className="text-[10px] text-muted-foreground">{t("collection-skills-hint")}</p>

              {/* Add custom skill input */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="owner/repo@skill-name"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                  className="text-[12px]"
                />
                <Button size="sm" variant="outline" onClick={addCustomSkill} disabled={!skillInput.trim()}>
                  <Add01Icon size={14} />
                </Button>
              </div>

              {/* Selected skills */}
              {formSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded border border-border/50 bg-muted/30">
                  {formSkills.map(s => (
                    <Badge key={s} variant="secondary" className="text-[10px] cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => toggleSkill(s)}>
                      {s} ×
                    </Badge>
                  ))}
                </div>
              )}

              {/* Installed skills checkboxes */}
              {installedSkills.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-border/50 rounded p-2 space-y-1">
                  {installedSkills.map(name => (
                    <label key={name} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1 transition-colors">
                      <Checkbox
                        checked={formSkills.includes(name)}
                        onCheckedChange={() => toggleSkill(name)}
                      />
                      <span className="text-[11px] truncate">{name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!collectionToDelete} onOpenChange={(open) => !open && setCollectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm-delete-collection")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm-delete-collection-desc", { name: collectionToDelete || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>)}

    </div>
  )
}

export default CollectionsPage
