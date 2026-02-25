import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Globe02Icon,
  Add01Icon,
  Download01Icon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  Search01Icon,
  Settings02Icon,
  RefreshIcon,
  LinkSquare02Icon,
} from "hugeicons-react"
import {
  GetProjectSkills,
  GetSupportedAgents,
  InstallRemoteSkillToProject,
  RemoveSkillFromProject,
  FindRemoteSkills,
  GetProjectSkillAgentLinks,
  UpdateProjectSkillAgentLinks,
} from "@wailsjs/go/services/SkillsService"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"
import { useSearchParams } from "react-router-dom"

interface AgentInfo {
  name: string
  localPath: string
}

const ProjectsPage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const folderPath = searchParams.get("path")
  const [projectSkills, setProjectSkills] = useState<any[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [installingSkill, setInstallingSkill] = useState<string | null>(null)
  const [removingSkill, setRemovingSkill] = useState<string | null>(null)
  const [skillToRemove, setSkillToRemove] = useState<any | null>(null)
  const [remoteSearchQuery, setRemoteSearchQuery] = useState("")
  const [remoteSkills, setRemoteSkills] = useState<any[]>([])
  const [searchingRemote, setSearchingRemote] = useState(false)
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [showAgentSelectDialog, setShowAgentSelectDialog] = useState(false)
  const [pendingInstall, setPendingInstall] = useState<{ name: string } | null>(null)
  const [agentSearchQuery, setAgentSearchQuery] = useState("")
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [configSkillName, setConfigSkillName] = useState<string | null>(null)
  const [configSelectedAgents, setConfigSelectedAgents] = useState<string[]>([])
  const [configAgentSearch, setConfigAgentSearch] = useState("")
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)

  useEffect(() => {
    if (folderPath) {
      loadProjectSkills(folderPath)
    } else {
      setProjectSkills([])
    }
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

  const handleOpenInstallDialog = () => {
    setShowInstallDialog(true)
  }

  const openAgentSelect = (name: string) => {
    setPendingInstall({ name })
    setSelectedAgents([])
    setAgentSearchQuery("")
    setShowAgentSelectDialog(true)
  }

  const handleConfirmInstall = async () => {
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

  const searchRemoteSkills = async () => {
    if (!remoteSearchQuery.trim()) {
      setRemoteSkills([])
      return
    }
    try {
      setSearchingRemote(true)
      const result = await FindRemoteSkills(remoteSearchQuery)
      setRemoteSkills(result || [])
    } catch (error) {
      console.error("Failed to search remote skills:", error)
      setRemoteSkills([])
    } finally {
      setSearchingRemote(false)
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

  const getFolderName = (path: string) => {
    return path.split("/").filter(Boolean).pop() || path
  }

  const isInstalledInProject = (skillName: string) => {
    return projectSkills.some((s) => s.name === skillName)
  }

  const toggleAgent = (agentName: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentName)
        ? prev.filter((a) => a !== agentName)
        : [...prev, agentName]
    )
  }

  const toggleAllAgents = () => {
    const filtered = filteredAgents
    if (selectedAgents.length === filtered.length) {
      setSelectedAgents([])
    } else {
      setSelectedAgents(filtered.map((a) => a.name))
    }
  }

  const filteredAgents = allAgents.filter((agent) =>
    agent.name.toLowerCase().includes(agentSearchQuery.toLowerCase())
  )

  const openConfigDialog = async (skillName: string) => {
    if (!folderPath) return
    setConfigSkillName(skillName)
    setConfigSelectedAgents([])
    setConfigAgentSearch("")
    setShowConfigDialog(true)
    setLoadingLinks(true)
    try {
      const links = await GetProjectSkillAgentLinks(folderPath, skillName)
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
      prev.includes(agentName)
        ? prev.filter((a) => a !== agentName)
        : [...prev, agentName]
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
    if (!folderPath || !configSkillName) return
    setSavingLinks(true)
    try {
      await UpdateProjectSkillAgentLinks(folderPath, configSkillName, configSelectedAgents)
      toast({ title: t("toast-links-updated", { name: configSkillName, count: configSelectedAgents.length }), variant: "success" })
      setShowConfigDialog(false)
      await loadProjectSkills(folderPath)
    } catch (error) {
      console.error("Failed to save config:", error)
      toast({ title: t("toast-update-links-failed", { error }), variant: "destructive" })
    } finally {
      setSavingLinks(false)
    }
  }

  if (!folderPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FolderOpenIcon size={48} className="mb-4 text-muted-foreground/20" />
        <h3 className="text-lg font-medium text-muted-foreground">{t("select-project")}</h3>
        <p className="mt-1 text-sm text-muted-foreground/60">
          {t("select-project-desc")}
        </p>
      </div>
    )
  }

  if (loadingSkills) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FolderOpenIcon className="mx-auto mb-4 animate-spin" size={32} />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground/90">{getFolderName(folderPath)}</h2>
          <p className="text-[12px] text-muted-foreground truncate max-w-lg">{folderPath}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {t("skills-count", { count: projectSkills.length })}
          </Badge>
          <Button size="sm" onClick={handleOpenInstallDialog}>
            <Add01Icon size={16} className="mr-1.5" />
            {t("install-skill")}
          </Button>
        </div>
      </div>

      {projectSkills.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-200px)] text-center">
          <CodeIcon size={48} className="mb-4 text-muted-foreground/20" />
          <h3 className="text-lg font-medium text-muted-foreground">{t("no-skills")}</h3>
          <p className="mt-1 text-sm text-muted-foreground/60">
            {t("no-skills-in-project")}
          </p>
          <Button className="mt-4" onClick={handleOpenInstallDialog}>
            <Add01Icon size={16} className="mr-1.5" />
            {t("install-skill")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {projectSkills.map((skill, index) => (
            <Card key={index} className="flex flex-col border-border/50 shadow-none hover:shadow-sm hover:border-border transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded bg-primary/8 shrink-0">
                      <CodeIcon size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-[13px] truncate">{skill.name}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                <p className="mb-3 text-[12px] text-muted-foreground line-clamp-3 min-h-[3.5rem]">
                  {skill.desc || t("no-description")}
                </p>
                {skill.agents && skill.agents.length > 0 && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left w-full"
                    onClick={() => openConfigDialog(skill.name)}
                  >
                    <span className="font-medium">{t("linked-agents-count", { count: skill.agents.length })}</span>
                    {skill.agents.length <= 3 ? (
                      skill.agents.join(", ")
                    ) : (
                      <>
                        {skill.agents.slice(0, 3).join(", ")}
                        <span className="ml-1">+{skill.agents.length - 3} more</span>
                      </>
                    )}
                  </button>
                )}
                {(!skill.agents || skill.agents.length === 0) && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
                    onClick={() => openConfigDialog(skill.name)}
                  >
                    <span className="font-medium text-amber-500">{t("no-agent-linked")}</span>
                  </button>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-1 pt-4">
                <TooltipProvider delayDuration={300}>
                  {skill.source && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-500/8"
                          onClick={() => BrowserOpenURL(`https://github.com/${skill.source}`)}
                        >
                          <LinkSquare02Icon size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("view-details")}</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded text-muted-foreground hover:text-primary hover:bg-primary/8"
                        onClick={() => openConfigDialog(skill.name)}
                      >
                        <Settings02Icon size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("config-agent")}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/8"
                        onClick={() => setSkillToRemove(skill)}
                        disabled={removingSkill === skill.name}
                      >
                        {removingSkill === skill.name ? (
                          <RefreshIcon size={14} className="animate-spin" />
                        ) : (
                          <Delete02Icon size={14} />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("remove-from-project")}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Install Skill dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("install-skill-to-project")}</DialogTitle>
            <DialogDescription>
              {t("install-skill-to-project-desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search01Icon
                    size={16}
                    className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder={t("search-remote-skills-short")}
                    className="pl-9 h-9"
                    value={remoteSearchQuery}
                    onChange={(e) => setRemoteSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") searchRemoteSkills()
                    }}
                  />
                </div>
                <Button size="sm" onClick={searchRemoteSkills} disabled={searchingRemote} className="h-9">
                  <Search01Icon size={14} className="mr-1.5" />
                  {t("search")}
                </Button>
              </div>

              {searchingRemote ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Globe02Icon className="mx-auto mb-3 animate-spin" size={28} />
                    <p className="text-sm text-muted-foreground">{t("searching")}</p>
                  </div>
                </div>
              ) : remoteSkills.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  {remoteSearchQuery ? t("no-matching-remote-skills") : t("enter-keyword-to-search")}
                </div>
              ) : (
                <div className="space-y-2">
                  {remoteSkills.map((skill, index) => {
                    const installed = isInstalledInProject(skill.name)
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-md border border-border/50 transition-all duration-150 ${
                          installed ? "bg-muted/40" : "hover:bg-accent/40"
                        }`}
                      >
                        <div className={`p-2 rounded shrink-0 ${installed ? "bg-primary/8" : "bg-blue-500/8"}`}>
                          {installed ? (
                            <CheckmarkCircle02Icon size={18} className="text-primary" />
                          ) : (
                            <Globe02Icon size={18} className="text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{skill.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {skill.owner}/{skill.repo}
                            </p>
                            {skill.installs > 0 && (
                              <span className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5 shrink-0">
                                <Download01Icon size={10} />
                                {skill.installs.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {installed ? (
                            <Badge variant="outline" className="text-xs gap-1">
                              <CheckmarkCircle02Icon size={12} />
                              {t("installed")}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => openAgentSelect(skill.fullName)}
                              disabled={installingSkill === skill.fullName}
                            >
                              {installingSkill === skill.fullName ? (
                                <>
                                  <RefreshIcon size={14} className="mr-1.5 animate-spin" />
                                  {t("installing")}
                                </>
                              ) : (
                                <>
                                  <Download01Icon size={14} className="mr-1.5" />
                                  {t("install-to-project")}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent select dialog */}
      <Dialog open={showAgentSelectDialog} onOpenChange={setShowAgentSelectDialog}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("select-target-agent")}</DialogTitle>
            <DialogDescription>
              {t("select-agent-desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search01Icon
                  size={14}
                  className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground"
                />
                <Input
                  placeholder={t("search-agent")}
                  className="pl-8 h-8 text-sm"
                  value={agentSearchQuery}
                  onChange={(e) => setAgentSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={toggleAllAgents}
              >
                {selectedAgents.length === filteredAgents.length ? t("deselect-all") : t("select-all")}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {t("selected-agents-count", { count: selectedAgents.length })}
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md">
              <div className="divide-y">
                {filteredAgents.map((agent) => (
                  <label
                    key={agent.name}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      checked={selectedAgents.includes(agent.name)}
                      onCheckedChange={() => toggleAgent(agent.name)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.localPath}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAgentSelectDialog(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirmInstall}
              disabled={selectedAgents.length === 0}
            >
              <Download01Icon size={14} className="mr-1.5" />
              {t("install-to-agents", { count: selectedAgents.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("config-agent-link-title")}</DialogTitle>
            <DialogDescription>
              {t("config-project-agent-link-desc", { name: configSkillName || "" })}
            </DialogDescription>
          </DialogHeader>

          {loadingLinks ? (
            <div className="flex items-center justify-center py-12">
              <RefreshIcon className="animate-spin" size={28} />
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search01Icon
                    size={14}
                    className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder={t("search-agent")}
                    className="pl-8 h-8 text-sm"
                    value={configAgentSearch}
                    onChange={(e) => setConfigAgentSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs shrink-0"
                  onClick={toggleAllConfigAgents}
                >
                  {configSelectedAgents.length === filteredConfigAgents.length ? t("deselect-all") : t("select-all")}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                {t("selected-agents-count", { count: configSelectedAgents.length })}
              </div>

              <div className="flex-1 overflow-y-auto border rounded-md">
                <div className="divide-y">
                  {filteredConfigAgents.map((agent) => (
                    <label
                      key={agent.name}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={configSelectedAgents.includes(agent.name)}
                        onCheckedChange={() => toggleConfigAgent(agent.name)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{agent.localPath}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={savingLinks || configSelectedAgents.length === 0}
            >
              {savingLinks ? (
                <>
                  <RefreshIcon size={14} className="mr-1.5 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                <>
                  <Settings02Icon size={14} className="mr-1.5" />
                  {t("save-config")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProjectsPage
