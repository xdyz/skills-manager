import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
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
import {
  FolderOpenIcon,
  CodeIcon,
  Add01Icon,
  Search01Icon,
  AiChat02Icon,
  Folder01Icon,
  RefreshIcon,
  MultiplicationSignIcon,
} from "hugeicons-react"
import {
  GetProjectSkills,
  InstallRemoteSkillToProject,
  RemoveSkillFromProject,
  GetProjectSkillAgentLinks,
  UpdateProjectSkillAgentLinks,
} from "@wailsjs/go/services/SkillsService"
import {
  GetProjectAgents,
  GetSupportedAgents,
  EnableProjectAgent,
  DisableProjectAgent,
  GetProjectAgentSkillCount,
} from "@wailsjs/go/services/AgentService"
import { useSearchParams } from "react-router-dom"
import RemoteSkillSearch, { type RemoteSkill } from "@/components/RemoteSkillSearch"
import SkillCard from "@/components/SkillCard"
import ConfigAgentLinkDialog from "@/components/ConfigAgentLinkDialog"
import AgentSelectDialog from "@/components/AgentSelectDialog"
import type { AgentInfo, SkillData } from "@/types"

const ProjectsPage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const folderPath = searchParams.get("path")
  const [activeTab, setActiveTab] = useState("skills")
  const [projectSkills, setProjectSkills] = useState<SkillData[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [installingSkill, setInstallingSkill] = useState<string | null>(null)
  const [removingSkill, setRemovingSkill] = useState<string | null>(null)
  const [skillToRemove, setSkillToRemove] = useState<SkillData | null>(null)
  const [remoteSkills, setRemoteSkills] = useState<RemoteSkill[]>([])
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])
  const [showAgentSelectDialog, setShowAgentSelectDialog] = useState(false)
  const [pendingInstall, setPendingInstall] = useState<{ name: string } | null>(null)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [configSkillName, setConfigSkillName] = useState<string | null>(null)
  const [projectAgents, setProjectAgents] = useState<AgentInfo[]>([])
  const [togglingAgent, setTogglingAgent] = useState<string | null>(null)
  const [agentFilterQuery, setAgentFilterQuery] = useState("")
  const [disableAgentConfirm, setDisableAgentConfirm] = useState<{ name: string; skillCount: number } | null>(null)
  const [skillFilterQuery, setSkillFilterQuery] = useState("")

  useEffect(() => {
    if (folderPath) {
      loadProjectSkills(folderPath)
      loadProjectAgents(folderPath)
    } else {
      setProjectSkills([])
      setProjectAgents([])
    }
  }, [folderPath])

  useEffect(() => {
    const handleFocus = () => {
      if (folderPath) {
        loadProjectSkills(folderPath)
        loadProjectAgents(folderPath)
      }
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [folderPath])

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const result = await GetSupportedAgents()
      setAllAgents(result || [])
    } catch (error) {
      console.error("Failed to load agents:", error)
    }
  }

  const loadProjectSkills = async (folder: string) => {
    try {
      setLoadingSkills(true)
      const result = await GetProjectSkills(folder)
      setProjectSkills(result || [])
    } catch (error) {
      console.error("Failed to load project skills:", error)
      setProjectSkills([])
    } finally {
      setLoadingSkills(false)
    }
  }

  const loadProjectAgents = async (folder: string) => {
    try {
      const result = await GetProjectAgents(folder)
      setProjectAgents(result || [])
    } catch (error) {
      console.error("Failed to load project agents:", error)
      setProjectAgents([])
    }
  }

  const isAgentEnabled = (agentName: string) => {
    return projectAgents.some((a) => a.name === agentName)
  }

  const handleToggleAgent = async (agentName: string, enabled: boolean) => {
    if (!folderPath) return
    if (!enabled) {
      try {
        const count = await GetProjectAgentSkillCount(folderPath, agentName)
        if (count > 0) {
          setDisableAgentConfirm({ name: agentName, skillCount: count })
          return
        }
      } catch {}
    }
    await doToggleAgent(agentName, enabled, false)
  }

  const doToggleAgent = async (agentName: string, enabled: boolean, force: boolean) => {
    if (!folderPath) return
    setTogglingAgent(agentName)
    try {
      if (enabled) {
        await EnableProjectAgent(folderPath, agentName)
        toast({ title: t("toast-agent-enabled", { name: agentName }), variant: "success" })
      } else {
        await DisableProjectAgent(folderPath, agentName, force)
        toast({ title: t("toast-agent-disabled", { name: agentName }), variant: "success" })
      }
      await loadProjectAgents(folderPath)
      if (!enabled) {
        await loadProjectSkills(folderPath)
      }
    } catch (error: any) {
      const errMsg = String(error)
      if (errMsg.includes("not empty")) {
        toast({ title: t("agent-not-empty-hint"), variant: "destructive" })
      } else {
        toast({ title: t("toast-agent-toggle-failed", { error: errMsg }), variant: "destructive" })
      }
    } finally {
      setTogglingAgent(null)
    }
  }

  const handleForceDisableAgent = async () => {
    if (!disableAgentConfirm) return
    setDisableAgentConfirm(null)
    await doToggleAgent(disableAgentConfirm.name, false, true)
  }

  const filteredProjectSkills = projectSkills.filter(skill =>
    skill.name?.toLowerCase().includes(skillFilterQuery.toLowerCase()) ||
    skill.desc?.toLowerCase().includes(skillFilterQuery.toLowerCase())
  )

  const filteredAllAgents = allAgents.filter((agent) =>
    agent.name.toLowerCase().includes(agentFilterQuery.toLowerCase())
  )

  const openAgentSelect = (name: string) => {
    setPendingInstall({ name })
    setShowAgentSelectDialog(true)
  }

  const handleConfirmInstall = async (selectedAgents: string[]) => {
    if (!folderPath || !pendingInstall || selectedAgents.length === 0) return
    setShowAgentSelectDialog(false)
    await doInstallRemoteToProject(pendingInstall.name, selectedAgents)
    setPendingInstall(null)
  }

  const doInstallRemoteToProject = async (fullName: string, agents: string[]) => {
    if (!folderPath) return
    try {
      setInstallingSkill(fullName)
      const skillName = fullName.split("@")[1] || fullName
      await InstallRemoteSkillToProject(folderPath, fullName, agents)
      toast({ title: t("toast-project-skill-installed", { name: skillName, count: agents.length }), variant: "success" })
      await loadProjectSkills(folderPath)
    } catch (error) {
      console.error("Install failed:", error)
      toast({ title: `${error}`, variant: "destructive" })
    } finally {
      setInstallingSkill(null)
    }
  }

  const handleRemoveFromProject = async () => {
    if (!folderPath || !skillToRemove) return
    try {
      setRemovingSkill(skillToRemove.name)
      await RemoveSkillFromProject(folderPath, skillToRemove.name)
      toast({ title: t("toast-project-skill-removed", { name: skillToRemove.name }), variant: "success" })
      await loadProjectSkills(folderPath)
    } catch (error) {
      console.error("Remove failed:", error)
      toast({ title: `${error}`, variant: "destructive" })
    } finally {
      setRemovingSkill(null)
      setSkillToRemove(null)
    }
  }

  const isInstalledInProject = (skillName: string) => {
    return projectSkills.some((s) => s.name === skillName)
  }

  const getFolderName = (path: string) => {
    return path.split("/").filter(Boolean).pop() || path
  }

  const openConfigDialog = (skillName: string) => {
    setConfigSkillName(skillName)
    setConfigDialogOpen(true)
  }

  const handleLoadLinks = async (skillName: string) => {
    if (!folderPath) return []
    const links = await GetProjectSkillAgentLinks(folderPath, skillName)
    return links || []
  }

  const handleSaveLinks = async (skillName: string, agents: string[]) => {
    if (!folderPath) return
    await UpdateProjectSkillAgentLinks(folderPath, skillName, agents)
    toast({ title: t("toast-links-updated", { name: skillName, count: agents.length }), variant: "success" })
  }

  if (!folderPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FolderOpenIcon size={48} className="mb-4 text-muted-foreground/20" />
        <h3 className="text-lg font-medium text-muted-foreground">{t("select-project")}</h3>
        <p className="mt-1 text-sm text-muted-foreground/60">{t("select-project-desc")}</p>
      </div>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground/90">{getFolderName(folderPath)}</h2>
          <p className="text-[12px] text-muted-foreground truncate max-w-lg">{folderPath}</p>
        </div>

        <TabsList className="h-8 mt-5 bg-muted/60">
          <TabsTrigger value="skills" className="text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Folder01Icon size={13} className="mr-1.5" />
            {t("project-skills-tab")} ({skillFilterQuery ? `${filteredProjectSkills.length}/${projectSkills.length}` : projectSkills.length})
          </TabsTrigger>
          <TabsTrigger value="agents" className="text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <AiChat02Icon size={13} className="mr-1.5" />
            {t("project-agents-tab")} ({projectAgents.length}/{allAgents.length})
          </TabsTrigger>
        </TabsList>

        {activeTab === "skills" && (
          <div className="flex items-center justify-between gap-2 mt-4">
            <div className="relative flex-1">
              <Search01Icon size={16} className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
              <Input placeholder={t("search-local-skills")} className="pl-9 pr-8" value={skillFilterQuery} onChange={(e) => setSkillFilterQuery(e.target.value)} />
              {skillFilterQuery && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setSkillFilterQuery("")}
                >
                  <MultiplicationSignIcon size={14} />
                </button>
              )}
            </div>
            <Button size="sm" onClick={() => setShowInstallDialog(true)}>
              <Add01Icon size={14} className="mr-1.5" />
              {t("install-skill")}
            </Button>
          </div>
        )}
        {activeTab === "agents" && (
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search01Icon size={16} className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
              <Input placeholder={t("search-agent")} className="pl-9 pr-8" value={agentFilterQuery} onChange={(e) => setAgentFilterQuery(e.target.value)} />
              {agentFilterQuery && (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setAgentFilterQuery("")}
                >
                  <MultiplicationSignIcon size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-4">
        {/* Skills Tab */}
        <TabsContent value="skills" className="mt-0 h-full">
          {loadingSkills ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <RefreshIcon className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : filteredProjectSkills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center select-none">
              {skillFilterQuery ? (
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
                    <CodeIcon size={28} className="text-primary/50" />
                  </div>
                  <p className="text-[15px] font-medium text-foreground/70 mb-1.5">{t("no-skills")}</p>
                  <p className="text-[13px] text-muted-foreground/70">{t("no-skills-in-project")}</p>
                  <Button className="mt-4" onClick={() => setShowInstallDialog(true)}>
                    <Add01Icon size={16} className="mr-1.5" />
                    {t("install-skill")}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjectSkills.map((skill) => (
                <SkillCard
                  key={skill.name}
                  skill={skill}
                  onConfigAgentLink={openConfigDialog}
                  onDelete={(s) => setSkillToRemove(s)}
                  deletingSkill={removingSkill}
                  deleteTooltip={t("remove-from-project")}
                  showPath={false}
                  showBadges={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="mt-0">
          {filteredAllAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[360px] text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
                <Search01Icon size={28} className="text-muted-foreground/50" />
              </div>
              <p className="text-[15px] font-medium text-foreground/70 mb-1.5">
                {agentFilterQuery ? t("no-matching-agent") : t("no-agents")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {filteredAllAgents.map((agent) => {
                const enabled = isAgentEnabled(agent.name)
                const isToggling = togglingAgent === agent.name
                return (
                  <Card
                    key={agent.name}
                    className={`flex flex-col border-border/50 shadow-none transition-all duration-200 ${
                      enabled
                        ? "border-primary/30 bg-primary/5 hover:border-primary/50"
                        : "hover:shadow-sm hover:border-border"
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded shrink-0 ${enabled ? "bg-primary/10" : "bg-muted/60"}`}>
                            <AiChat02Icon size={16} className={enabled ? "text-primary" : "text-muted-foreground"} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-[13px] truncate">{agent.name}</CardTitle>
                          </div>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => handleToggleAgent(agent.name, checked)}
                          disabled={isToggling}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 pt-0">
                      <p className="text-[11px] text-muted-foreground truncate">{agent.localPath}</p>
                      <Badge
                        variant={enabled ? "default" : "secondary"}
                        className={`mt-2 text-[10px] ${enabled ? "bg-primary/15 text-primary hover:bg-primary/20" : ""}`}
                      >
                        {enabled ? t("agent-enabled") : t("agent-disabled")}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </div>

      {/* Install Skill dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("install-skill-to-project")}</DialogTitle>
            <DialogDescription>{t("install-skill-to-project-desc")}</DialogDescription>
          </DialogHeader>
          <RemoteSkillSearch
            mode="project"
            isInstalled={isInstalledInProject}
            onInstall={(fullName) => openAgentSelect(fullName)}
            installingSkill={installingSkill}
            skills={remoteSkills}
            onSkillsChange={setRemoteSkills}
            compact
          />
        </DialogContent>
      </Dialog>

      {/* Agent select dialog */}
      <AgentSelectDialog
        open={showAgentSelectDialog}
        onOpenChange={setShowAgentSelectDialog}
        agents={projectAgents}
        onConfirm={handleConfirmInstall}
      />

      {/* Remove confirmation dialog */}
      <AlertDialog open={!!skillToRemove} onOpenChange={(open) => !open && setSkillToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm-remove-title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm-remove-skill-desc", { name: skillToRemove?.name || "" })}
              <br /><br />
              {skillToRemove?.isGlobal
                ? t("remove-skill-global-note")
                : t("remove-skill-local-note")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!removingSkill}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromProject}
              disabled={!!removingSkill}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingSkill ? t("removing") : t("confirm-remove-btn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Config project Skill Agent links */}
      <ConfigAgentLinkDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        skillName={configSkillName}
        agents={projectAgents}
        loadLinks={handleLoadLinks}
        saveLinks={handleSaveLinks}
        onSaved={() => folderPath && loadProjectSkills(folderPath)}
        description={configSkillName ? t("config-project-agent-link-desc", { name: configSkillName }) : undefined}
      />

      {/* Disable agent confirmation dialog */}
      <AlertDialog open={!!disableAgentConfirm} onOpenChange={(open) => !open && setDisableAgentConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm-disable-agent-title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm-disable-agent-desc", { name: disableAgentConfirm?.name || "", count: disableAgentConfirm?.skillCount || 0 })}
              <br /><br />
              {t("confirm-disable-agent-note")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDisableAgent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("force-disable")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}

export default ProjectsPage
