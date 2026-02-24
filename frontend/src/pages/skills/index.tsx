import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
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
  CheckmarkCircle02Icon,
  Folder01Icon,
  Folder02Icon,
  Download01Icon,
  Globe02Icon,
  Delete02Icon,
  RefreshIcon,
  Settings02Icon,
  Add01Icon,
  UserMultipleIcon,
  LinkSquare02Icon,
} from "hugeicons-react"
import { GetAllAgentSkills, FindRemoteSkills, InstallRemoteSkill, DeleteSkill, UpdateSkill, GetSupportedAgents, GetSkillAgentLinks, UpdateSkillAgentLinks, AddCustomAgent, RemoveCustomAgent } from "@wailsjs/go/services/SkillsService"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"
import { useSearchParams } from "react-router-dom"

interface AgentInfo {
  name: string
  localPath: string
  isCustom: boolean
}

const SkillsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultTab = searchParams.get("tab") || "local"
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [localSkills, setLocalSkills] = useState<any[]>([])
  const [remoteSkills, setRemoteSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [remoteSearchQuery, setRemoteSearchQuery] = useState("")
  const [searchingRemote, setSearchingRemote] = useState(false)
  const [installingSkill, setInstallingSkill] = useState<string | null>(null)
  const [updatingSkill, setUpdatingSkill] = useState<string | null>(null)
  const [deletingSkill, setDeletingSkill] = useState<string | null>(null)
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null)
  // Agent 选择
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [showAgentSelectDialog, setShowAgentSelectDialog] = useState(false)
  const [pendingInstallSkill, setPendingInstallSkill] = useState<string | null>(null)
  const [agentSearchQuery, setAgentSearchQuery] = useState("")
  // 配置 Agent 链接
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [configSkillName, setConfigSkillName] = useState<string | null>(null)
  const [configSelectedAgents, setConfigSelectedAgents] = useState<string[]>([])
  const [configAgentSearch, setConfigAgentSearch] = useState("")
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)
  // 自定义 Agent
  const [showAddAgentDialog, setShowAddAgentDialog] = useState(false)
  const [newAgentName, setNewAgentName] = useState("")
  const [addingAgent, setAddingAgent] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null)
  const [agentListSearch, setAgentListSearch] = useState("")

  useEffect(() => {
    loadLocalSkills()
    loadAgents()
  }, [])

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["local", "remote", "agents"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchParams({ tab: value }, { replace: true })
  }

  const loadAgents = async () => {
    try {
      const result = await GetSupportedAgents()
      setAllAgents(result || [])
    } catch (error) {
      console.error("加载 agents 失败:", error)
    }
  }

  const loadLocalSkills = async () => {
    try {
      setLoading(true)
      const result = await GetAllAgentSkills()
      setLocalSkills(result || [])
    } catch (error) {
      console.error("加载本地 skills 失败:", error)
    } finally {
      setLoading(false)
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

  // 打开 agent 选择对话框
  const openAgentSelect = (fullName: string) => {
    setPendingInstallSkill(fullName)
    setSelectedAgents([])
    setAgentSearchQuery("")
    setShowAgentSelectDialog(true)
  }

  // 确认安装
  const handleConfirmInstall = async () => {
    if (!pendingInstallSkill || selectedAgents.length === 0) return
    setShowAgentSelectDialog(false)
    await doInstallSkill(pendingInstallSkill, selectedAgents)
    setPendingInstallSkill(null)
  }

  const doInstallSkill = async (fullName: string, agents: string[]) => {
    try {
      setInstallingSkill(fullName)
      await InstallRemoteSkill(fullName, agents)
      
      toast({ title: `Skill "${fullName.split('@')[1]}" 已安装并链接到 ${agents.length} 个 Agent`, variant: "success" })
      
      await loadLocalSkills()
      // 直接更新远程列表中对应项的安装状态，不重新搜索
      setRemoteSkills(prev => prev.map(s => 
        s.fullName === fullName ? { ...s, installed: true } : s
      ))
    } catch (error) {
      console.error("安装 skill 失败:", error)
      toast({ title: `安装失败: ${error}`, variant: "destructive" })
    } finally {
      setInstallingSkill(null)
    }
  }

  const handleUpdateSkill = async (skillName: string) => {
    try {
      setUpdatingSkill(skillName)
      await UpdateSkill(skillName)
      
      toast({ title: `Skill "${skillName}" 已成功更新到最新版本`, variant: "success" })
      
      await loadLocalSkills()
    } catch (error) {
      console.error("更新 skill 失败:", error)
      toast({ title: `更新失败: ${error}`, variant: "destructive" })
    } finally {
      setUpdatingSkill(null)
    }
  }

  const handleDeleteSkill = async () => {
    if (!skillToDelete) return
    
    try {
      setDeletingSkill(skillToDelete)
      await DeleteSkill(skillToDelete)
      
      toast({ title: `Skill "${skillToDelete}" 已成功删除`, variant: "success" })
      
      await loadLocalSkills()
      // 直接更新远程列表中对应项的安装状态，不重新搜索
      setRemoteSkills(prev => prev.map(s => 
        s.name === skillToDelete ? { ...s, installed: false } : s
      ))
    } catch (error) {
      console.error("删除 skill 失败:", error)
      toast({ title: `删除失败: ${error}`, variant: "destructive" })
    } finally {
      setDeletingSkill(null)
      setSkillToDelete(null)
    }
  }

  const toggleAgent = (agentName: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentName)
        ? prev.filter((a) => a !== agentName)
        : [...prev, agentName]
    )
  }

  const filteredAgents = allAgents.filter((agent) =>
    agent.name.toLowerCase().includes(agentSearchQuery.toLowerCase())
  )

  const toggleAllAgents = () => {
    const filtered = filteredAgents
    if (selectedAgents.length === filtered.length) {
      setSelectedAgents([])
    } else {
      setSelectedAgents(filtered.map((a) => a.name))
    }
  }

  const handleAddAgent = async () => {
    if (!newAgentName.trim()) return
    try {
      setAddingAgent(true)
      await AddCustomAgent(newAgentName.trim())
      toast({ title: `自定义 Agent "${newAgentName.trim()}" 已添加`, variant: "success" })
      setShowAddAgentDialog(false)
      await loadAgents()
    } catch (error) {
      console.error("添加 Agent 失败:", error)
      toast({ title: `添加 Agent 失败: ${error}`, variant: "destructive" })
    } finally {
      setAddingAgent(false)
    }
  }

  const handleRemoveAgent = async () => {
    if (!agentToDelete) return
    try {
      await RemoveCustomAgent(agentToDelete)
      toast({ title: `自定义 Agent "${agentToDelete}" 已删除`, variant: "success" })
      setAgentToDelete(null)
      await loadAgents()
    } catch (error) {
      console.error("删除 Agent 失败:", error)
      toast({ title: `删除 Agent 失败: ${error}`, variant: "destructive" })
    }
  }

  // 配置 Agent 链接
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
    const filtered = filteredConfigAgents
    if (configSelectedAgents.length === filtered.length) {
      setConfigSelectedAgents([])
    } else {
      setConfigSelectedAgents(filtered.map((a) => a.name))
    }
  }

  const handleSaveConfig = async () => {
    if (!configSkillName) return
    setSavingLinks(true)
    try {
      await UpdateSkillAgentLinks(configSkillName, configSelectedAgents)
      toast({ title: `Skill "${configSkillName}" 已更新链接到 ${configSelectedAgents.length} 个 Agent`, variant: "success" })
      setShowConfigDialog(false)
      await loadLocalSkills()
    } catch (error) {
      console.error("保存配置失败:", error)
      toast({ title: `更新 Agent 链接失败: ${error}`, variant: "destructive" })
    } finally {
      setSavingLinks(false)
    }
  }

  const filteredLocalSkills = localSkills.filter(skill => 
    skill.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.desc?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full w-full">
      {/* 固定头部区域 */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground/90">技能管理</h1>
            <p className="text-[13px] text-muted-foreground">
              管理本地技能和搜索远程技能
            </p>
          </div>
        </div>

        <TabsList className="h-8 mt-5 bg-muted/60">
          <TabsTrigger value="local" className="text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Folder01Icon size={13} className="mr-1.5" />
            本地技能 ({filteredLocalSkills.length})
          </TabsTrigger>
          <TabsTrigger value="remote" className="text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Globe02Icon size={13} className="mr-1.5" />
            远程搜索
          </TabsTrigger>
          <TabsTrigger value="agents" className="text-[12px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <UserMultipleIcon size={13} className="mr-1.5" />
            Agent 管理
          </TabsTrigger>
        </TabsList>

        {/* 搜索框 */}
        {activeTab === "local" && (
          <div className="relative mt-4">
            <Search01Icon 
              size={18} 
              className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" 
            />
            <Input 
              placeholder="搜索本地技能..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        {activeTab === "remote" && (
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search01Icon 
                size={18} 
                className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" 
              />
              <Input 
                placeholder="搜索远程技能 (例如: react, vue, typescript)..." 
                className="pl-10"
                value={remoteSearchQuery}
                onChange={(e) => setRemoteSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchRemoteSkills()
                  }
                }}
              />
            </div>
            <Button onClick={searchRemoteSkills} disabled={searchingRemote}>
              <Search01Icon size={16} className="mr-2" />
              搜索
            </Button>
          </div>
        )}
        {activeTab === "agents" && (
          <div className="flex items-center justify-between gap-2 mt-4">
            <div className="relative flex-1">
              <Search01Icon 
                size={18} 
                className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" 
              />
              <Input 
                placeholder="搜索 Agent..." 
                className="pl-10"
                value={agentListSearch}
                onChange={(e) => setAgentListSearch(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={() => {
              setNewAgentName("")
              setShowAddAgentDialog(true)
            }}>
              <Add01Icon size={14} className="mr-1.5" />
              添加 Agent
            </Button>
          </div>
        )}
      </div>

      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">

        {/* 本地技能 Tab */}
        <TabsContent value="local" className="mt-0 h-full">
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
                  <p className="text-[15px] font-medium text-foreground/70 mb-1.5">未找到匹配的技能</p>
                  <p className="text-[13px] text-muted-foreground/70">试试换个关键词，或在远程搜索中安装新技能</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 flex items-center justify-center mb-5">
                    <Folder01Icon size={28} className="text-primary/50" />
                  </div>
                  <p className="text-[15px] font-medium text-foreground/70 mb-1.5">还没有安装技能</p>
                  <p className="text-[13px] text-muted-foreground/70">切换到「远程搜索」发现并安装社区技能</p>
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
                          <CardDescription className="text-[11px] truncate mt-1">
                            {skill.path}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3">
                    <p className="mb-3 text-[12px] text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {skill.desc || "暂无描述"}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {skill.language && (
                        <Badge variant="secondary" className="text-xs">{skill.language}</Badge>
                      )}
                      {skill.framework && (
                        <Badge variant="outline" className="text-xs">{skill.framework}</Badge>
                      )}
                    </div>
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
                        <TooltipContent>配置 Agent 链接</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded text-muted-foreground hover:text-primary hover:bg-primary/8"
                            onClick={() => handleUpdateSkill(skill.name)}
                            disabled={updatingSkill === skill.name || deletingSkill === skill.name}
                          >
                            <RefreshIcon size={14} className={updatingSkill === skill.name ? "animate-spin" : ""} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>更新</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/8"
                            onClick={() => setSkillToDelete(skill.name)}
                            disabled={updatingSkill === skill.name || deletingSkill === skill.name}
                          >
                            <Delete02Icon size={14} className={deletingSkill === skill.name ? "animate-spin" : ""} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>删除</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 远程搜索 Tab */}
        <TabsContent value="remote" className="space-y-4 mt-0 h-full">
          {searchingRemote ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="text-center">
                <Globe02Icon className="mx-auto mb-4 animate-spin" size={32} />
                <p className="text-muted-foreground">正在搜索远程技能...</p>
              </div>
            </div>
          ) : remoteSkills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[360px] select-none">
              {remoteSearchQuery ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
                    <Search01Icon size={28} className="text-muted-foreground/50" />
                  </div>
                  <p className="text-[15px] font-medium text-foreground/70 mb-1.5">未找到匹配结果</p>
                  <p className="text-[13px] text-muted-foreground/70">试试换个关键词搜索，例如 react、vue、python</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center mb-5">
                    <Globe02Icon size={28} className="text-primary/50" />
                  </div>
                  <p className="text-[15px] font-medium text-foreground/70 mb-1.5">探索远程技能</p>
                  <p className="text-[13px] text-muted-foreground/70">在上方搜索框输入关键词，发现社区分享的技能</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {remoteSkills.map((skill, index) => (
                <Card key={index} className="flex flex-col border-border/50 shadow-none hover:shadow-sm hover:border-border transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded shrink-0 ${skill.installed ? 'bg-primary/8' : 'bg-blue-500/8'}`}>
                          {skill.installed ? (
                            <CheckmarkCircle02Icon size={18} className="text-primary" />
                          ) : (
                            <Globe02Icon size={18} className="text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-[13px] truncate">{skill.name}</CardTitle>
                          <CardDescription className="text-[11px] truncate mt-0.5">
                            {skill.owner}/{skill.repo}
                          </CardDescription>
                        </div>
                      </div>
                      {skill.installed && (
                        <Badge variant="secondary" className="text-xs shrink-0 whitespace-nowrap">已安装</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3">
                    {skill.description ? (
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-3">
                        {skill.description}
                      </p>
                    ) : (
                      <p className="mb-3 text-xs text-muted-foreground truncate">
                        {skill.fullName}
                      </p>
                    )}
                    {skill.url && (
                      <span 
                        onClick={() => BrowserOpenURL(skill.url)}
                        className="text-xs text-blue-500 hover:underline cursor-pointer"
                      >
                        查看详情 →
                      </span>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    {skill.installed ? (
                      <Button 
                        size="sm" 
                        className="w-full"
                        variant="outline"
                        onClick={() => openAgentSelect(skill.fullName)}
                        disabled={installingSkill === skill.fullName}
                      >
                        {installingSkill === skill.fullName ? (
                          <>
                            <RefreshIcon size={16} className="mr-2 animate-spin" />
                            重新安装中...
                          </>
                        ) : (
                          <>
                            <Download01Icon size={16} className="mr-2" />
                            重新安装
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => openAgentSelect(skill.fullName)}
                        disabled={installingSkill === skill.fullName}
                      >
                        {installingSkill === skill.fullName ? (
                          <>
                            <RefreshIcon size={16} className="mr-2 animate-spin" />
                            安装中...
                          </>
                        ) : (
                          <>
                            <Download01Icon size={16} className="mr-2" />
                            安装
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Agent 管理 Tab */}
        <TabsContent value="agents" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {allAgents
              .filter(a => a.name.toLowerCase().includes(agentListSearch.toLowerCase()))
              .map((agent) => (
              <div
                key={agent.name}
                className="flex items-center gap-3 p-3 rounded-md border border-border/50 hover:bg-accent/40 transition-all duration-150"
              >
                <div className={`p-2 rounded shrink-0 ${agent.isCustom ? 'bg-amber-500/8' : 'bg-primary/8'}`}>
                  <UserMultipleIcon size={15} className={agent.isCustom ? 'text-amber-500' : 'text-primary'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.localPath}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {agent.isCustom ? (
                    <>
                      <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">自定义</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setAgentToDelete(agent.name)}
                      >
                        <Delete02Icon size={14} />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-xs">内置</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          {allAgents.filter(a => a.name.toLowerCase().includes(agentListSearch.toLowerCase())).length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              {agentListSearch ? "未找到匹配的 Agent" : "暂无 Agent"}
            </div>
          )}
        </TabsContent>
      </div>

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

      {/* 删除确认对话框 */}
      <AlertDialog open={!!skillToDelete} onOpenChange={(open) => !open && setSkillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除技能</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除技能 <span className="font-semibold text-foreground">"{skillToDelete}"</span> 吗？
              <br />
              <br />
              此操作将：
              <ul className="mt-2 ml-4 space-y-1 list-disc">
                <li>删除中央目录中的技能文件</li>
                <li>删除所有 agent 目录中的软链接</li>
                <li>从 .skills-lock 文件中移除记录</li>
              </ul>
              <br />
              <span className="font-semibold text-destructive">此操作无法撤销！</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingSkill}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSkill}
              disabled={!!deletingSkill}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingSkill ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 配置 Agent 链接对话框 */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>配置 Agent 链接</DialogTitle>
            <DialogDescription>
              管理 Skill <span className="font-semibold text-foreground">"{configSkillName}"</span> 的 Agent 软链接。
              勾选的 Agent 将创建软链接，取消勾选的将删除软链接。
            </DialogDescription>
          </DialogHeader>

          {loadingLinks ? (
            <div className="flex items-center justify-center py-8">
              <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
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
                已链接 {configSelectedAgents.length} 个 Agent
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
              disabled={loadingLinks || savingLinks}
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

      {/* 添加自定义 Agent 对话框 */}
      <Dialog open={showAddAgentDialog} onOpenChange={setShowAddAgentDialog}>
        <DialogContent className="max-w-[340px] p-5">
          <DialogHeader className="space-y-1 pb-1">
            <DialogTitle className="text-base">添加自定义 Agent</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="agent-name" className="text-xs text-muted-foreground">名称（仅英文）</Label>
              <Input
                id="agent-name"
                placeholder="MyAgent"
                className="h-9 text-sm"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
              />
            </div>
            {newAgentName.trim() && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <Folder02Icon size={13} className="shrink-0" />
                <span className="truncate">~/.{newAgentName.trim().toLowerCase().replace(/\s+/g, '-')}/skills</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setShowAddAgentDialog(false)}>
              取消
            </Button>
            <Button
              size="sm"
              className="h-8"
              onClick={handleAddAgent}
              disabled={addingAgent || !newAgentName.trim()}
            >
              {addingAgent ? (
                <RefreshIcon size={13} className="animate-spin" />
              ) : (
                "添加"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除自定义 Agent 确认 */}
      <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除 Agent</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除自定义 Agent <span className="font-semibold text-foreground">"{agentToDelete}"</span> 吗？
              <br /><br />
              此操作只会从配置中移除该 Agent，不会删除已创建的软链接或目录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAgent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}

export default SkillsPage
