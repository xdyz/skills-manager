import { useState, useEffect } from "react"
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
import {
  Settings02Icon,
  RefreshIcon,
  LinkSquare02Icon,
} from "hugeicons-react"
import { useSearchParams } from "react-router-dom"

interface AgentInfo {
  name: string
  localPath: string
}

const ProjectsPage = () => {
  const [searchParams] = useSearchParams()
  const folderPath = searchParams.get("path")
  const [projectSkills, setProjectSkills] = useState<any[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [installingSkill, setInstallingSkill] = useState<string | null>(null)
  const [removingSkill, setRemovingSkill] = useState<string | null>(null)
  const [skillToRemove, setSkillToRemove] = useState<any | null>(null)
  // 远程搜索
  const [remoteSearchQuery, setRemoteSearchQuery] = useState("")
  const [remoteSkills, setRemoteSkills] = useState<any[]>([])
  const [searchingRemote, setSearchingRemote] = useState(false)
  // Agent 选择
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [showAgentSelectDialog, setShowAgentSelectDialog] = useState(false)
  const [pendingInstall, setPendingInstall] = useState<{ name: string } | null>(null)
  const [agentSearchQuery, setAgentSearchQuery] = useState("")
  // 配置 Agent 链接
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
      console.error("加载 agents 失败:", error)
    }
  }

  const loadProjectSkills = async (folder: string) => {
    try {
      setLoadingSkills(true)
      const result = await GetProjectSkills(folder)
      setProjectSkills(result || [])
    } catch (error) {
      console.error("加载项目 skills 失败:", error)
      setProjectSkills([])
    } finally {
      setLoadingSkills(false)
    }
  }

  const handleOpenInstallDialog = () => {
    setShowInstallDialog(true)
  }

  // 打开 agent 选择对话框
  const openAgentSelect = (name: string) => {
    setPendingInstall({ name })
    setSelectedAgents([])
    setAgentSearchQuery("")
    setShowAgentSelectDialog(true)
  }

  // 确认安装（带 agent 选择）
  const handleConfirmInstall = async () => {
    if (!folderPath || !pendingInstall || selectedAgents.length === 0) return
    setShowAgentSelectDialog(false)
    await doInstallRemoteToProject(pendingInstall.name, selectedAgents)
    setPendingInstall(null)
  }

  // 从远程直接安装到项目
  const doInstallRemoteToProject = async (fullName: string, agents: string[]) => {
    if (!folderPath) return
    try {
      setInstallingSkill(fullName)
      const skillName = fullName.split("@")[1] || fullName
      await InstallRemoteSkillToProject(folderPath, fullName, agents)
      toast({ title: `Skill "${skillName}" 已安装到 ${agents.length} 个 Agent（仅项目可用）`, variant: "success" })
      await loadProjectSkills(folderPath)
    } catch (error) {
      console.error("安装失败:", error)
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
      console.error("搜索远程 skills 失败:", error)
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
      toast({ title: `Skill "${skillToRemove.name}" 已从项目中移除`, variant: "success" })
      await loadProjectSkills(folderPath)
    } catch (error) {
      console.error("移除失败:", error)
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

  // 配置 Agent 链接
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
      console.error("加载 agent 链接失败:", error)
      toast({ title: `获取 Agent 链接信息失败: ${error}`, variant: "destructive" })
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
      toast({ title: `Skill "${configSkillName}" 已更新链接到 ${configSelectedAgents.length} 个 Agent`, variant: "success" })
      setShowConfigDialog(false)
      await loadProjectSkills(folderPath)
    } catch (error) {
      console.error("保存配置失败:", error)
      toast({ title: `更新 Agent 链接失败: ${error}`, variant: "destructive" })
    } finally {
      setSavingLinks(false)
    }
  }

  if (!folderPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FolderOpenIcon size={48} className="mb-4 text-muted-foreground/20" />
        <h3 className="text-lg font-medium text-muted-foreground">选择一个项目</h3>
        <p className="mt-1 text-sm text-muted-foreground/60">
          从左侧选择一个项目文件夹，查看其中的 Skills
        </p>
      </div>
    )
  }

  if (loadingSkills) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FolderOpenIcon className="mx-auto mb-4 animate-spin" size={32} />
          <p className="text-muted-foreground">加载中...</p>
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
            {projectSkills.length} 个 Skills
          </Badge>
          <Button size="sm" onClick={handleOpenInstallDialog}>
            <Add01Icon size={16} className="mr-1.5" />
            安装 Skill
          </Button>
        </div>
      </div>

      {projectSkills.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-200px)] text-center">
          <CodeIcon size={48} className="mb-4 text-muted-foreground/20" />
          <h3 className="text-lg font-medium text-muted-foreground">暂无 Skills</h3>
          <p className="mt-1 text-sm text-muted-foreground/60">
            该项目下还没有安装任何 Skills
          </p>
          <Button className="mt-4" onClick={handleOpenInstallDialog}>
            <Add01Icon size={16} className="mr-1.5" />
            安装 Skill
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
                  {skill.desc || "暂无描述"}
                </p>
                {skill.agents && skill.agents.length > 0 && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left w-full"
                    onClick={() => openConfigDialog(skill.name)}
                  >
                    <span className="font-medium">已链接 {skill.agents.length} 个 Agent: </span>
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
                    <span className="font-medium text-amber-500">未链接任何 Agent，点击配置</span>
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
                      <TooltipContent>查看详情</TooltipContent>
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
                    <TooltipContent>配置 Agent</TooltipContent>
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
                    <TooltipContent>从项目移除</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 安装 Skill 对话框 */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>安装 Skill 到项目</DialogTitle>
            <DialogDescription>
              从远程搜索技能并安装到项目本地
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
                    placeholder="搜索远程技能 (例如: react, vue)..."
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
                  搜索
                </Button>
              </div>

              {searchingRemote ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Globe02Icon className="mx-auto mb-3 animate-spin" size={28} />
                    <p className="text-sm text-muted-foreground">正在搜索...</p>
                  </div>
                </div>
              ) : remoteSkills.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  {remoteSearchQuery ? "未找到匹配的远程技能" : "输入关键词搜索远程技能"}
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
                          <p className="text-xs text-muted-foreground truncate">
                            {skill.owner}/{skill.repo}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {installed ? (
                            <Badge variant="outline" className="text-xs gap-1">
                              <CheckmarkCircle02Icon size={12} />
                              已安装
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
                                  安装中...
                                </>
                              ) : (
                                <>
                                  <Download01Icon size={14} className="mr-1.5" />
                                  安装到项目
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

      {/* Agent 选择对话框 */}
      <Dialog open={showAgentSelectDialog} onOpenChange={setShowAgentSelectDialog}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>选择目标 Agent</DialogTitle>
            <DialogDescription>
              选择要将 Skill 安装到哪些 Agent 目录下
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
                  placeholder="搜索 Agent..."
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
                {selectedAgents.length === filteredAgents.length ? "取消全选" : "全选"}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              已选择 {selectedAgents.length} 个 Agent
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
              取消
            </Button>
            <Button
              onClick={handleConfirmInstall}
              disabled={selectedAgents.length === 0}
            >
              <Download01Icon size={14} className="mr-1.5" />
              安装到 {selectedAgents.length} 个 Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 移除确认对话框 */}
      <AlertDialog open={!!skillToRemove} onOpenChange={(open) => !open && setSkillToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要从项目中移除 Skill <span className="font-semibold text-foreground">"{skillToRemove?.name}"</span> 吗？
              <br /><br />
              {skillToRemove?.isGlobal
                ? "此操作将删除项目内的软链接，不会影响全局安装。"
                : "此操作将删除项目内的 Skill 文件，此 Skill 仅在项目本地存在，删除后无法恢复。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!removingSkill}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromProject}
              disabled={!!removingSkill}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingSkill ? "移除中..." : "确认移除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 配置项目 Skill 的 Agent 链接 */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>配置 Agent 链接</DialogTitle>
            <DialogDescription>
              选择要将 Skill <span className="font-semibold text-foreground">"{configSkillName}"</span> 复制到哪些 Agent 目录
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
                    placeholder="搜索 Agent..."
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
                  {configSelectedAgents.length === filteredConfigAgents.length ? "取消全选" : "全选"}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                已选择 {configSelectedAgents.length} 个 Agent
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
              取消
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={savingLinks || configSelectedAgents.length === 0}
            >
              {savingLinks ? (
                <>
                  <RefreshIcon size={14} className="mr-1.5 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Settings02Icon size={14} className="mr-1.5" />
                  保存配置
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
