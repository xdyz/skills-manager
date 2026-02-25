import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Search01Icon,
  CodeIcon,
  Folder01Icon,
  Delete02Icon,
  RefreshIcon,
  Settings02Icon,
  Add01Icon,
  LinkSquare02Icon,
} from "hugeicons-react"
import { GetAllAgentSkills, InstallRemoteSkill, DeleteSkill, UpdateSkill, GetSkillAgentLinks, UpdateSkillAgentLinks } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"
import { useSearchParams } from "react-router-dom"
import RemoteSkillSearch, { type RemoteSkill } from "@/components/RemoteSkillSearch"

interface AgentInfo {
  name: string
  localPath: string
  isCustom: boolean
}

const SkillsPage = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [localSkills, setLocalSkills] = useState<any[]>([])
  const [remoteSkills, setRemoteSkills] = useState<RemoteSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [installingSkill, setInstallingSkill] = useState<string | null>(null)
  const [updatingSkill, setUpdatingSkill] = useState<string | null>(null)
  const [deletingSkill, setDeletingSkill] = useState<string | null>(null)
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null)
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [configSkillName, setConfigSkillName] = useState<string | null>(null)
  const [configSelectedAgents, setConfigSelectedAgents] = useState<string[]>([])
  const [configAgentSearch, setConfigAgentSearch] = useState("")
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)

  useEffect(() => {
    loadLocalSkills()
    loadAgents()
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
    }
  }

  const loadLocalSkills = async () => {
    try {
      setLoading(true)
      const result = await GetAllAgentSkills()
      setLocalSkills(result || [])
    } catch (error) {
      console.error("Failed to load local skills:", error)
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

  const openConfigDialog = async (skillName: string) => {
    setConfigSkillName(skillName)
    setConfigSelectedAgents([])
    setConfigAgentSearch("")
    setShowConfigDialog(true)
    setLoadingLinks(true)
    try {
      const links = await GetSkillAgentLinks(skillName)
      setConfigSelectedAgents(links || [])
    } catch (error) {
      console.error("Failed to load agent links:", error)
      toast({ title: t("toast-get-links-failed", { error }), variant: "destructive" })
    } finally {
      setLoadingLinks(false)
    }
  }

  const toggleConfigAgent = (agentName: string) => {
    setConfigSelectedAgents((prev) =>
      prev.includes(agentName) ? prev.filter((a) => a !== agentName) : [...prev, agentName]
    )
  }

  const filteredConfigAgents = allAgents.filter((agent) =>
    agent.name.toLowerCase().includes(configAgentSearch.toLowerCase())
  )

  const toggleAllConfigAgents = () => {
    if (configSelectedAgents.length === filteredConfigAgents.length) {
      setConfigSelectedAgents([])
    } else {
      setConfigSelectedAgents(filteredConfigAgents.map((a) => a.name))
    }
  }

  const handleSaveConfig = async () => {
    if (!configSkillName) return
    setSavingLinks(true)
    try {
      await UpdateSkillAgentLinks(configSkillName, configSelectedAgents)
      toast({ title: t("toast-links-updated", { name: configSkillName, count: configSelectedAgents.length }), variant: "success" })
      setShowConfigDialog(false)
      await loadLocalSkills()
    } catch (error) {
      console.error("Failed to save config:", error)
      toast({ title: t("toast-update-links-failed", { error }), variant: "destructive" })
    } finally {
      setSavingLinks(false)
    }
  }

  const filteredLocalSkills = localSkills.filter(skill => 
    skill.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.desc?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <Input placeholder={t("search-local-skills")} className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => setShowInstallDialog(true)}>
            <Add01Icon size={14} className="mr-1.5" />
            {t("install-skill")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-4">
        {loading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Folder01Icon className="animate-spin" size={32} />
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
              {filteredLocalSkills.map((skill, index) => (
                <Card key={index} className="flex flex-col border-border/50 shadow-none hover:shadow-sm hover:border-border transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded bg-primary/8 shrink-0">
                          <CodeIcon size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-[13px] truncate">{skill.name}</CardTitle>
                          <CardDescription className="text-[11px] truncate mt-1">{skill.path}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3">
                    <p className="mb-3 text-[12px] text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {skill.desc || t("no-description")}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {skill.language && <Badge variant="secondary" className="text-xs">{skill.language}</Badge>}
                      {skill.framework && <Badge variant="outline" className="text-xs">{skill.framework}</Badge>}
                    </div>
                    {skill.agents && skill.agents.length > 0 && (
                      <button className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left w-full" onClick={() => openConfigDialog(skill.name)}>
                        <span className="font-medium">{t("linked-agents-count", { count: skill.agents.length })}</span>
                        {skill.agents.length <= 3 ? skill.agents.join(", ") : (
                          <>{skill.agents.slice(0, 3).join(", ")}<span className="ml-1">+{skill.agents.length - 3} more</span></>
                        )}
                      </button>
                    )}
                    {(!skill.agents || skill.agents.length === 0) && (
                      <button className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left" onClick={() => openConfigDialog(skill.name)}>
                        <span className="font-medium text-amber-500">{t("no-agent-linked")}</span>
                      </button>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-1 pt-4">
                    <TooltipProvider delayDuration={300}>
                      {skill.source && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-500/8" onClick={() => BrowserOpenURL(`https://github.com/${skill.source}`)}>
                              <LinkSquare02Icon size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("view-details")}</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-primary hover:bg-primary/8" onClick={() => openConfigDialog(skill.name)}>
                            <Settings02Icon size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("config-agent-link")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-primary hover:bg-primary/8" onClick={() => handleUpdateSkill(skill.name)} disabled={updatingSkill === skill.name || deletingSkill === skill.name}>
                            <RefreshIcon size={14} className={updatingSkill === skill.name ? "animate-spin" : ""} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("update")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/8" onClick={() => setSkillToDelete(skill.name)} disabled={updatingSkill === skill.name || deletingSkill === skill.name}>
                            <Delete02Icon size={14} className={deletingSkill === skill.name ? "animate-spin" : ""} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("delete")}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
      </div>

      {/* Install Skill dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t("search-remote-skills")}</DialogTitle>
            <DialogDescription>
              {t("search-remote-skills-desc")}
            </DialogDescription>
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

      {/* Config agent link dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("config-agent-link-title")}</DialogTitle>
            <DialogDescription>{t("config-agent-link-desc", { name: configSkillName || "" })}</DialogDescription>
          </DialogHeader>
          {loadingLinks ? (
            <div className="flex items-center justify-center py-8">
              <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">{t("loading")}</span>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search01Icon size={14} className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
                  <Input placeholder={t("search-agent")} className="pl-8 h-8 text-sm" value={configAgentSearch} onChange={(e) => setConfigAgentSearch(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={toggleAllConfigAgents}>
                  {configSelectedAgents.length === filteredConfigAgents.length ? t("deselect-all") : t("select-all")}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">{t("linked-count", { count: configSelectedAgents.length })}</div>
              <div className="flex-1 overflow-y-auto border rounded-md">
                <div className="divide-y">
                  {filteredConfigAgents.map((agent) => (
                    <label key={agent.name} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors">
                      <Checkbox checked={configSelectedAgents.includes(agent.name)} onCheckedChange={() => toggleConfigAgent(agent.name)} />
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium">{agent.name}</p></div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleSaveConfig} disabled={loadingLinks || savingLinks}>
              {savingLinks ? (
                <><RefreshIcon size={14} className="mr-1.5 animate-spin" />{t("saving")}</>
              ) : (
                <><Settings02Icon size={14} className="mr-1.5" />{t("save-config")}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default SkillsPage
