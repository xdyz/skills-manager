import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Search01Icon, Folder01Icon, Add01Icon, CheckListIcon, Cancel01Icon, Delete02Icon, Settings02Icon, MultiplicationSignIcon, RefreshIcon } from "hugeicons-react"
import { GetAllAgentSkills, InstallRemoteSkill, DeleteSkill, UpdateSkill, GetSkillAgentLinks, UpdateSkillAgentLinks, BatchDeleteSkills, BatchUpdateSkillAgentLinks } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import { useSearchParams } from "react-router-dom"
import RemoteSkillSearch, { type RemoteSkill } from "@/components/RemoteSkillSearch"
import SkillCard from "@/components/SkillCard"
import ConfigAgentLinkDialog from "@/components/ConfigAgentLinkDialog"
import type { AgentInfo, SkillData } from "@/types"

const SkillsPage = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [localSkills, setLocalSkills] = useState<SkillData[]>([])
  const [remoteSkills, setRemoteSkills] = useState<RemoteSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [installingSkill, setInstallingSkill] = useState<string | null>(null)
  const [updatingSkill, setUpdatingSkill] = useState<string | null>(null)
  const [deletingSkill, setDeletingSkill] = useState<string | null>(null)
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null)
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [configSkillName, setConfigSkillName] = useState<string | null>(null)

  // Batch mode
  const [batchMode, setBatchMode] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false)
  const [batchConfigOpen, setBatchConfigOpen] = useState(false)

  useEffect(() => {
    loadLocalSkills()
    loadAgents()
  }, [])

  // Refresh data on window focus
  useEffect(() => {
    const handleFocus = () => {
      loadLocalSkills(false)
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  useEffect(() => {
    if (searchParams.get("action") === "install") {
      setShowInstallDialog(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  const loadAgents = async () => {
    try {
      const result = await GetSupportedAgents()
      setAllAgents(result || [])
    } catch (error) {
      console.error("Failed to load agents:", error)
      toast({ title: t("toast-get-links-failed", { error }), variant: "destructive" })
    }
  }

  const loadLocalSkills = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const result = await GetAllAgentSkills()
      setLocalSkills(result || [])
    } catch (error) {
      console.error("Failed to load local skills:", error)
      toast({ title: t("toast-install-failed", { error }), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleGlobalInstall = async (fullName: string) => {
    let agents = allAgents
    if (agents.length === 0) {
      try {
        const result = await GetSupportedAgents()
        agents = result || []
        setAllAgents(agents)
      } catch {
        toast({ title: t("toast-install-failed", { error: "Failed to load agents" }), variant: "destructive" })
        return
      }
    }
    if (agents.length === 0) {
      toast({ title: t("toast-install-failed", { error: "No agents configured" }), variant: "destructive" })
      return
    }
    await doInstallSkill(fullName, agents.map(a => a.name))
  }

  const doInstallSkill = async (fullName: string, agents: string[]) => {
    try {
      setInstallingSkill(fullName)
      await InstallRemoteSkill(fullName, agents)
      toast({ title: t("toast-skill-installed", { name: fullName.split('@')[1], count: agents.length }), variant: "success" })
      await loadLocalSkills()
      setRemoteSkills(prev => prev.map(s =>
        s.fullName === fullName ? { ...s, installed: true } : s
      ))
    } catch (error) {
      console.error("Failed to install skill:", error)
      toast({ title: t("toast-install-failed", { error }), variant: "destructive" })
    } finally {
      setInstallingSkill(null)
    }
  }

  const handleUpdateSkill = async (skillName: string) => {
    try {
      setUpdatingSkill(skillName)
      await UpdateSkill(skillName)
      toast({ title: t("toast-skill-updated", { name: skillName }), variant: "success" })
      await loadLocalSkills()
    } catch (error) {
      console.error("Failed to update skill:", error)
      toast({ title: t("toast-update-failed", { error }), variant: "destructive" })
    } finally {
      setUpdatingSkill(null)
    }
  }

  const handleDeleteSkill = async () => {
    if (!skillToDelete) return
    try {
      setDeletingSkill(skillToDelete)
      await DeleteSkill(skillToDelete)
      toast({ title: t("toast-skill-deleted", { name: skillToDelete }), variant: "success" })
      await loadLocalSkills()
      setRemoteSkills(prev => prev.map(s =>
        s.name === skillToDelete ? { ...s, installed: false } : s
      ))
    } catch (error) {
      console.error("Failed to delete skill:", error)
      toast({ title: t("toast-delete-failed", { error }), variant: "destructive" })
    } finally {
      setDeletingSkill(null)
      setSkillToDelete(null)
    }
  }

  const openConfigDialog = (skillName: string) => {
    setConfigSkillName(skillName)
    setConfigDialogOpen(true)
  }

  const handleLoadLinks = async (skillName: string) => {
    const links = await GetSkillAgentLinks(skillName)
    return links || []
  }

  const handleSaveLinks = async (skillName: string, agents: string[]) => {
    await UpdateSkillAgentLinks(skillName, agents)
    toast({ title: t("toast-links-updated", { name: skillName, count: agents.length }), variant: "success" })
  }

  // Batch operations
  const toggleBatchMode = () => {
    if (batchMode) {
      setBatchMode(false)
      setSelectedSkills(new Set())
    } else {
      setBatchMode(true)
    }
  }

  const handleSelectSkill = (name: string, checked: boolean) => {
    setSelectedSkills(prev => {
      const next = new Set(prev)
      if (checked) next.add(name)
      else next.delete(name)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedSkills.size === filteredLocalSkills.length) {
      setSelectedSkills(new Set())
    } else {
      setSelectedSkills(new Set(filteredLocalSkills.map(s => s.name)))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedSkills.size === 0) return
    try {
      setBatchDeleting(true)
      const names = Array.from(selectedSkills)
      const count = await BatchDeleteSkills(names)
      toast({ title: t("toast-batch-delete-success", { count }), variant: "success" })
      setSelectedSkills(new Set())
      setBatchMode(false)
      await loadLocalSkills()
      setRemoteSkills(prev => prev.map(s =>
        names.includes(s.name) ? { ...s, installed: false } : s
      ))
    } catch (error) {
      toast({ title: t("toast-batch-delete-failed", { error }), variant: "destructive" })
    } finally {
      setBatchDeleting(false)
      setShowBatchDeleteDialog(false)
    }
  }

  const handleBatchSaveLinks = async (_skillName: string, agents: string[]) => {
    const names = Array.from(selectedSkills)
    const count = await BatchUpdateSkillAgentLinks(names, agents)
    toast({ title: t("toast-batch-links-updated", { count }), variant: "success" })
    setSelectedSkills(new Set())
    setBatchMode(false)
    await loadLocalSkills()
  }

  // ESC to exit batch mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && batchMode) {
        setBatchMode(false)
        setSelectedSkills(new Set())
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [batchMode])

  const filteredLocalSkills = useMemo(() => {
    const filtered = localSkills.filter(skill =>
      skill.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.desc?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  }, [localSkills, searchQuery])

  return (
    <div className="flex flex-col h-full w-full">
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground/90">{t("skills-management")}</h1>
          <p className="text-[13px] text-muted-foreground">{t("skills-management-desc")}</p>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="relative flex-1">
            <Search01Icon size={18} className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
            <Input placeholder={t("search-local-skills")} className="pl-10 pr-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setSearchQuery("")}
              >
                <MultiplicationSignIcon size={14} />
              </button>
            )}
          </div>
          {localSkills.length > 0 && (
            <Button size="sm" variant={batchMode ? "secondary" : "outline"} onClick={toggleBatchMode}>
              {batchMode ? (
                <><Cancel01Icon size={14} className="mr-1.5" />{t("exit-batch")}</>
              ) : (
                <><CheckListIcon size={14} className="mr-1.5" />{t("batch-mode")}</>
              )}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowInstallDialog(true)}>
            <Add01Icon size={14} className="mr-1.5" />
            {t("install-skill")}
          </Button>
        </div>
      </div>

      {/* Batch action bar */}
      {batchMode && (
        <div className="shrink-0 px-6 py-3 border-b border-border/50 bg-muted/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedSkills.size === filteredLocalSkills.length && filteredLocalSkills.length > 0 ? true : selectedSkills.size > 0 ? "indeterminate" : false}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedSkills.size > 0
                ? t("batch-selected", { count: selectedSkills.size })
                : t("select-all")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setBatchConfigOpen(true)} disabled={selectedSkills.size === 0}>
              <Settings02Icon size={14} className="mr-1.5" />
              {t("batch-config-links")}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setShowBatchDeleteDialog(true)} disabled={selectedSkills.size === 0}>
              <Delete02Icon size={14} className="mr-1.5" />
              {t("batch-delete")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 pt-4">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <RefreshIcon className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : filteredLocalSkills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[360px] select-none">
            {searchQuery ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
                  <Search01Icon size={28} className="text-muted-foreground/50" />
                </div>
                <p className="text-[15px] font-medium text-foreground/70 mb-1.5">{t("no-matching-skills")}</p>
                <p className="text-[13px] text-muted-foreground/70">{t("try-another-keyword")}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 flex items-center justify-center mb-5">
                  <Folder01Icon size={28} className="text-primary/50" />
                </div>
                <p className="text-[15px] font-medium text-foreground/70 mb-1.5">{t("no-skills-installed")}</p>
                <p className="text-[13px] text-muted-foreground/70">{t("go-to-remote-search")}</p>
                <Button className="mt-4" onClick={() => setShowInstallDialog(true)}>
                  <Add01Icon size={16} className="mr-1.5" />
                  {t("install-skill")}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocalSkills.map((skill) => (
              <SkillCard
                key={skill.name}
                skill={skill}
                onConfigAgentLink={openConfigDialog}
                onDelete={(s) => setSkillToDelete(s.name)}
                onUpdate={handleUpdateSkill}
                updatingSkill={updatingSkill}
                deletingSkill={deletingSkill}
                linkToDetail={!batchMode}
                selectable={batchMode}
                selected={selectedSkills.has(skill.name)}
                onSelect={handleSelectSkill}
              />
            ))}
          </div>
        )}
      </div>

      {/* Install Skill dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t("search-remote-skills")}</DialogTitle>
            <DialogDescription>{t("search-remote-skills-desc")}</DialogDescription>
          </DialogHeader>
          <RemoteSkillSearch
            mode="global"
            onInstall={handleGlobalInstall}
            installingSkill={installingSkill}
            skills={remoteSkills}
            onSkillsChange={setRemoteSkills}
            compact
          />
        </DialogContent>
      </Dialog>

      {/* Delete skill dialog */}
      <AlertDialog open={!!skillToDelete} onOpenChange={(open) => !open && setSkillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm-delete-skill")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm-delete-skill-desc", { name: skillToDelete || "" })}
              <br /><br />
              {t("delete-skill-warn")}
              <ul className="mt-2 ml-4 space-y-1 list-disc">
                <li>{t("delete-skill-item1")}</li>
                <li>{t("delete-skill-item2")}</li>
                <li>{t("delete-skill-item3")}</li>
              </ul>
              <br />
              <span className="font-semibold text-destructive">{t("delete-skill-irreversible")}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingSkill}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSkill} disabled={!!deletingSkill} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingSkill ? t("deleting") : t("confirm-delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch delete dialog */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm-batch-delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm-batch-delete-desc", { count: selectedSkills.size })}
              <ul className="mt-3 ml-4 space-y-1 list-disc text-foreground/80">
                {Array.from(selectedSkills).map(name => (
                  <li key={name} className="font-mono text-xs">{name}</li>
                ))}
              </ul>
              <br />
              <span className="font-semibold text-destructive">{t("batch-delete-warn")}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchDeleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} disabled={batchDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {batchDeleting ? t("deleting") : t("batch-delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Config agent link dialog (single) */}
      <ConfigAgentLinkDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        skillName={configSkillName}
        agents={allAgents}
        loadLinks={handleLoadLinks}
        saveLinks={handleSaveLinks}
        onSaved={loadLocalSkills}
      />

      {/* Batch config agent link dialog */}
      <ConfigAgentLinkDialog
        open={batchConfigOpen}
        onOpenChange={setBatchConfigOpen}
        skillName={`${selectedSkills.size} skills`}
        agents={allAgents}
        loadLinks={async () => []}
        saveLinks={handleBatchSaveLinks}
        onSaved={loadLocalSkills}
        title={t("batch-config-link-title")}
        description={t("batch-config-link-desc", { count: selectedSkills.size })}
      />
    </div>
  )
}

export default SkillsPage
