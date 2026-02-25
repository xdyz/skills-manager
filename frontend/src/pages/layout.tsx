import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
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
import Logo from "@/components/Logo"
import { 
  Home01Icon, 
  ChartHistogramIcon,
  UserMultipleIcon,
  Moon02Icon,
  Sun03Icon,
  Add01Icon,
  FolderOpenIcon,
  Folder02Icon,
  Cancel01Icon,
  Alert01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "hugeicons-react"
import { useState, useEffect } from "react"
import { SelectFolder, GetFolders, RemoveFolder } from "@wailsjs/go/services/FolderService"
import { 
  CheckAgentUpdates, 
  GetAgentUpdateCache, 
  DismissAgentUpdate, 
  ApplyAgentUpdates,
} from "@wailsjs/go/services/AgentService"

const PageLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [folderToRemove, setFolderToRemove] = useState<string | null>(null)

  // Agent update state
  const [agentUpdateInfo, setAgentUpdateInfo] = useState<{
    hasUpdate: boolean
    newAgentNames: string[]
  } | null>(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [applyingUpdate, setApplyingUpdate] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
    loadFolders()
    checkForAgentUpdates()
  }, [])

  // Sync selectedFolder with URL
  useEffect(() => {
    if (location.pathname === "/projects") {
      const params = new URLSearchParams(location.search)
      const path = params.get("path")
      setSelectedFolder(path)
    } else {
      setSelectedFolder(null)
    }
  }, [location])

  const loadFolders = async () => {
    try {
      const folderList = await GetFolders()
      setFolders(folderList || [])
    } catch (error) {
      console.error("Failed to load folders:", error)
    }
  }

  const handleAddFolder = async () => {
    try {
      const folder = await SelectFolder()
      if (folder) {
        await loadFolders()
        setSelectedFolder(folder)
        navigate(`/projects?path=${encodeURIComponent(folder)}`)
      }
    } catch (error) {
      console.error("Failed to select folder:", error)
    }
  }

  const handleSelectFolder = (folder: string) => {
    setSelectedFolder(folder)
    navigate(`/projects?path=${encodeURIComponent(folder)}`)
  }

  const handleRemoveFolder = (folder: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFolderToRemove(folder)
  }

  const confirmRemoveFolder = async () => {
    if (!folderToRemove) return
    try {
      await RemoveFolder(folderToRemove)
      await loadFolders()
      if (selectedFolder === folderToRemove) {
        setSelectedFolder(null)
        navigate("/home")
      }
    } catch (error) {
      console.error("Failed to remove folder:", error)
    } finally {
      setFolderToRemove(null)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const toggleLanguage = () => {
    const newLng = i18n.language === "zh" ? "en" : "zh"
    i18n.changeLanguage(newLng)
  }

  // Agent update functions
  const checkForAgentUpdates = async () => {
    try {
      const cache = await GetAgentUpdateCache()
      const now = Math.floor(Date.now() / 1000)
      const ONE_DAY = 24 * 60 * 60

      // 如果24小时内已忽略，不再提示
      if (cache.dismissedAt && now - cache.dismissedAt < ONE_DAY) {
        return
      }

      // 如果缓存中有新 Agent 且未忽略，直接显示
      if (cache.newAgentNames && cache.newAgentNames.length > 0) {
        setAgentUpdateInfo({
          hasUpdate: true,
          newAgentNames: cache.newAgentNames,
        })
        return
      }

      // 每次启动都检查
      const result = await CheckAgentUpdates()
      if (result.hasUpdate && result.newAgents && result.newAgents.length > 0) {
        setAgentUpdateInfo({
          hasUpdate: true,
          newAgentNames: result.newAgents.map((a: any) => a.Name),
        })
      }
    } catch (error) {
      console.error("Failed to check agent updates:", error)
    }
  }

  const handleDismissUpdate = async () => {
    try {
      await DismissAgentUpdate()
      setAgentUpdateInfo(null)
    } catch (error) {
      console.error("Failed to dismiss update:", error)
    }
  }

  const handleApplyUpdate = async () => {
    if (!agentUpdateInfo?.newAgentNames) return
    setApplyingUpdate(true)
    try {
      await ApplyAgentUpdates()
      const count = agentUpdateInfo.newAgentNames.length
      setAgentUpdateInfo(null)
      setShowUpdateDialog(false)
      toast({
        description: t("toast-agent-update-applied", { count }),
      })
    } catch (error) {
      toast({
        variant: "destructive",
        description: t("toast-agent-update-failed", { error: String(error) }),
      })
    } finally {
      setApplyingUpdate(false)
    }
  }

  const isActive = (path: string) => {
    return location.pathname === path || (path === "/home" && location.pathname === "/")
  }

  const getFolderName = (path: string) => {
    return path.split('/').filter(Boolean).pop() || path
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 h-12">
          <div className="flex items-center gap-2.5">
            <Logo size={24} />
            <span className="text-[13px] font-semibold tracking-tight text-foreground/85">Skills Manager</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded text-muted-foreground hover:text-foreground text-[11px] font-semibold"
              onClick={toggleLanguage}
            >
              {i18n.language === "zh" ? "EN" : "ZH"}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
              {theme === "light" ? <Moon02Icon size={15} /> : <Sun03Icon size={15} />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex flex-col w-52 border-r border-border/50 bg-muted/30">
          <nav className="flex flex-col gap-0.5 p-2.5 pt-3">
            <Button
              variant={isActive("/home") ? "secondary" : "ghost"}
              className={`justify-start gap-2.5 h-8 text-[13px] rounded ${isActive("/home") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => navigate("/home")}
            >
              <Home01Icon size={15} />
              {t("home")}
            </Button>
            <Button
              variant={isActive("/skills") ? "secondary" : "ghost"}
              className={`justify-start gap-2.5 h-8 text-[13px] rounded ${isActive("/skills") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => navigate("/skills")}
            >
              <ChartHistogramIcon size={15} />
              {t("skills")}
            </Button>
            <Button
              variant={isActive("/agents") ? "secondary" : "ghost"}
              className={`justify-start gap-2.5 h-8 text-[13px] rounded ${isActive("/agents") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => navigate("/agents")}
            >
              <UserMultipleIcon size={15} />
              {t("agents")}
            </Button>
          </nav>

          {/* Projects Section */}
          <div className={`flex flex-col mt-3 overflow-hidden ${folders.length > 0 ? 'flex-1' : ''}`}>
            <div className="flex items-center justify-between px-3.5 mb-2">
              <h3 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">{t("projects")}</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 rounded-md hover:bg-primary/10 hover:text-primary"
                onClick={handleAddFolder}
              >
                <Add01Icon size={12} className="text-muted-foreground" />
              </Button>
            </div>

            {folders.length === 0 ? (
              <div 
                className="mx-2.5 px-3 py-2.5 rounded border border-dashed border-border/60 cursor-pointer hover:border-primary/30 hover:bg-primary/4 transition-colors"
                onClick={handleAddFolder}
              >
                <p className="text-[11px] text-muted-foreground/50 text-center">{t("add-project")}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-1.5">
                <div className="space-y-0.5">
                  {folders.map((folder, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer group transition-all duration-150 ${
                        selectedFolder === folder 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      }`}
                      onClick={() => handleSelectFolder(folder)}
                    >
                      {selectedFolder === folder ? (
                        <FolderOpenIcon size={14} className="flex-shrink-0 text-primary" />
                      ) : (
                        <Folder02Icon size={14} className="flex-shrink-0" />
                      )}
                      <span className="flex-1 min-w-0 text-[12px] truncate">{getFolderName(folder)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 opacity-0 group-hover:opacity-100 shrink-0 rounded hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => handleRemoveFolder(folder, e)}
                      >
                        <Cancel01Icon size={9} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <Outlet />
        </main>
      </div>
      <AlertDialog open={!!folderToRemove} onOpenChange={(open) => !open && setFolderToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm-remove-project")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm-remove-project-desc", { name: folderToRemove ? getFolderName(folderToRemove) : "" })}
              <br /><br />
              {t("remove-project-note")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveFolder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("confirm-remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Agent 更新提示 - 左下角 */}
      {agentUpdateInfo?.hasUpdate && !showUpdateDialog && (
        <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg shadow-lg max-w-xs">
            <Alert01Icon size={18} className="text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {t("agent-update-available")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("new-agents-count", { count: agentUpdateInfo.newAgentNames.length })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setShowUpdateDialog(true)}
              >
                {t("view-details")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDismissUpdate}
              >
                <Cancel01Icon size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Agent 更新详情弹窗 */}
      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("agent-update-title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("agent-update-desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {agentUpdateInfo?.newAgentNames.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 px-3 py-2 rounded bg-muted/50"
                >
                  <CheckmarkCircle02Icon size={14} className="text-green-500" />
                  <span className="text-sm">{name}</span>
                </div>
              ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDismissUpdate}>
              {t("later")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApplyUpdate}
              disabled={applyingUpdate}
            >
              {applyingUpdate ? (
                <>
                  <Loading03Icon size={14} className="mr-2 animate-spin" />
                  {t("applying")}
                </>
              ) : (
                t("apply-update")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  )
}

export default PageLayout
