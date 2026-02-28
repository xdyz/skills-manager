import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Logo from "@/components/Logo"
import CommandPalette from "@/components/CommandPalette"
import CreateSkillDialog from "@/components/CreateSkillDialog"
import HealthCheckDialog from "@/components/HealthCheckDialog"
import CustomSourcesDialog from "@/components/CustomSourcesDialog"
import KeyboardShortcutsDialog from "@/components/KeyboardShortcutsDialog"

import {
  Home01Icon, 
  ChartHistogramIcon,
  AiChat02Icon,
  Moon02Icon,
  Sun03Icon,
  Add01Icon,
  FolderOpenIcon,
  Folder02Icon,
  Cancel01Icon,
  MoreVerticalIcon,
  Download04Icon,
  Upload04Icon,
  RefreshIcon,
  Search01Icon,
  Globe02Icon,
  Settings02Icon,
  Github01Icon,
  ComputerIcon,
  ArrowDataTransferHorizontalIcon,
} from "hugeicons-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { SelectFolder, GetFolders, RemoveFolder } from "@wailsjs/go/services/FolderService"
import { ExportConfigToFile, ImportConfig, CheckSkillUpdates, GetAutoUpdateConfig, SetAutoUpdateConfig, RunAutoUpdate, GetSettings, SaveSettings } from "@wailsjs/go/services/SkillsService"
import { EventsOn, EventsOff } from "@wailsjs/runtime/runtime"

const PageLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light")
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [folderToRemove, setFolderToRemove] = useState<string | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [createSkillOpen, setCreateSkillOpen] = useState(false)
  const [healthCheckOpen, setHealthCheckOpen] = useState(false)
  const [customSourcesOpen, setCustomSourcesOpen] = useState(false)
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false)

  useEffect(() => {
    // 从后端加载设置并应用主题/语言
    GetSettings().then(s => {
      if (s) {
        const t = s.theme || "light"
        setTheme(t as "light" | "dark" | "system")
        const isDark = t === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : t === "dark"
        document.documentElement.classList.toggle("dark", isDark)
        localStorage.setItem("theme", t)
        if (s.language && i18n.language !== s.language) {
          i18n.changeLanguage(s.language)
        }
      }
    }).catch(() => {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null
      if (savedTheme) {
        setTheme(savedTheme)
        const isDark = savedTheme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : savedTheme === "dark"
        document.documentElement.classList.toggle("dark", isDark)
      }
    })
    loadFolders()
  }, [])

  // Load auto-update config & run auto-update if needed
  useEffect(() => {
    GetAutoUpdateConfig().then(config => {
      setAutoUpdateEnabled(config?.enabled || false)
      if (config?.enabled) {
        const lastCheck = config.lastCheck ? new Date(config.lastCheck).getTime() : 0
        const intervalMs = (config.intervalHours || 24) * 3600000
        if (Date.now() - lastCheck > intervalMs) {
          RunAutoUpdate().then(count => {
            if (count > 0) {
              toast({ title: t("toast-auto-update-result", { count }), variant: "success" })
            }
          }).catch(() => {})
        }
      }
    }).catch(() => {})
  }, [t])

  // Listen for child page events to open global dialogs
  useEffect(() => {
    const handleOpenCreateSkill = () => setCreateSkillOpen(true)
    const handleOpenHealthCheck = () => setHealthCheckOpen(true)
    window.addEventListener("open-create-skill-dialog", handleOpenCreateSkill)
    window.addEventListener("open-health-check-dialog", handleOpenHealthCheck)
    return () => {
      window.removeEventListener("open-create-skill-dialog", handleOpenCreateSkill)
      window.removeEventListener("open-health-check-dialog", handleOpenHealthCheck)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "1") { e.preventDefault(); navigate("/home") }
      if ((e.metaKey || e.ctrlKey) && e.key === "2") { e.preventDefault(); navigate("/skills") }
      if ((e.metaKey || e.ctrlKey) && e.key === "3") { e.preventDefault(); navigate("/agents") }
      if ((e.metaKey || e.ctrlKey) && e.key === "4") { e.preventDefault(); navigate("/projects") }
      if ((e.metaKey || e.ctrlKey) && e.key === "5") { e.preventDefault(); navigate("/settings") }
      if ((e.metaKey || e.ctrlKey) && e.key === "6") { e.preventDefault(); navigate("/providers") }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") { e.preventDefault(); navigate("/settings") }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate])

  // Listen for tray "navigate" event from backend
  useEffect(() => {
    const cancel = EventsOn("navigate", (path: string) => {
      if (path) navigate(path)
    })
    return () => { cancel(); EventsOff("navigate") }
  }, [navigate])

  // Refresh folders on window focus
  useEffect(() => {
    const handleFocus = () => loadFolders()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
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

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const toggleTheme = async () => {
    const cycle: Array<"light" | "dark" | "system"> = ["light", "dark", "system"]
    const nextIdx = (cycle.indexOf(theme) + 1) % cycle.length
    const newTheme = cycle[nextIdx]
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    const isDark = newTheme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : newTheme === "dark"
    document.documentElement.classList.toggle("dark", isDark)
    try {
      const s = await GetSettings()
      if (s) await SaveSettings(JSON.stringify({ ...s, theme: newTheme }))
    } catch {}
  }

  const toggleLanguage = async () => {
    const newLng = i18n.language === "zh" ? "en" : "zh"
    i18n.changeLanguage(newLng)
    // 同步保存到后端设置
    try {
      const s = await GetSettings()
      if (s) await SaveSettings(JSON.stringify({ ...s, language: newLng }))
    } catch {}
  }

  const toggleAutoUpdate = useCallback(async () => {
    const newEnabled = !autoUpdateEnabled
    try {
      await SetAutoUpdateConfig(newEnabled, 24)
      setAutoUpdateEnabled(newEnabled)
      toast({ title: t(newEnabled ? "auto-update-enabled" : "auto-update-disabled"), variant: "success" })
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    }
  }, [autoUpdateEnabled, t])

  const handleExport = useCallback(async () => {
    try {
      setExporting(true)
      const savedPath = await ExportConfigToFile()
      if (savedPath) {
        toast({ title: t("toast-export-success-path", { path: savedPath }), variant: "success" })
      }
    } catch (error) {
      toast({ title: t("toast-export-failed", { error }), variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }, [t])

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!importFile) return
    try {
      setImporting(true)
      const text = await importFile.text()
      const result = await ImportConfig(text)
      toast({
        title: t("toast-import-success", {
          installed: result.installedCount,
          skipped: result.skippedCount,
        }),
        variant: "success",
      })
      setShowImportDialog(false)
      setImportFile(null)
    } catch (error) {
      toast({ title: t("toast-import-failed", { error }), variant: "destructive" })
    } finally {
      setImporting(false)
    }
  }, [importFile, t])

  const handleCommandAction = useCallback((action: string) => {
    switch (action) {
      case "create-skill":
        setCreateSkillOpen(true)
        break
      case "health-check":
        setHealthCheckOpen(true)
        break
      case "check-updates":
        CheckSkillUpdates().then((results) => {
          const count = (results || []).filter(r => r.hasUpdate).length
          if (count > 0) {
            toast({ title: t("updates-available", { count }) })
          } else {
            toast({ title: t("all-up-to-date"), variant: "success" })
          }
        }).catch((error: any) => {
          toast({ title: t("toast-check-updates-failed", { error }), variant: "destructive" })
        })
        break
      case "custom-sources":
        setCustomSourcesOpen(true)
        break
      case "keyboard-shortcuts":
        setKeyboardShortcutsOpen(true)
        break
    }
  }, [t])

  const isActive = (path: string) => {
    if (path === "/skills") return location.pathname === "/skills" || location.pathname.startsWith("/skills/")
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
            <button
              className="flex items-center gap-1.5 h-7 px-2.5 rounded border border-border/50 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-[11px]"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Search01Icon size={12} />
              <span className="hidden sm:inline">{t("search")}...</span>
              <kbd className="text-[9px] bg-background/80 border border-border/50 px-1 py-0.5 rounded font-mono">⌘K</kbd>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-foreground">
                  <MoreVerticalIcon size={15} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport} disabled={exporting}>
                  <Download04Icon size={14} className="mr-2" />
                  {exporting ? t("exporting") : t("export-config")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                  <Upload04Icon size={14} className="mr-2" />
                  {t("import-config")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCustomSourcesOpen(true)}>
                  <Globe02Icon size={14} className="mr-2" />
                  {t("custom-sources")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleAutoUpdate}>
                  <RefreshIcon size={14} className="mr-2" />
                  {t("auto-update")}: {autoUpdateEnabled ? "ON" : "OFF"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded text-muted-foreground hover:text-foreground text-[11px] font-semibold"
              onClick={toggleLanguage}
            >
              {i18n.language === "zh" ? "EN" : "ZH"}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-foreground" onClick={toggleTheme} title={theme === "system" ? t("theme-system") : theme === "dark" ? t("theme-dark") : t("theme-light")}>
              {theme === "system" ? <ComputerIcon size={15} /> : theme === "light" ? <Moon02Icon size={15} /> : <Sun03Icon size={15} />}
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
              <AiChat02Icon size={15} />
              {t("agents")}
            </Button>

            <div className="h-px bg-border/50 my-1.5" />

            <Button
              variant={isActive("/discover") ? "secondary" : "ghost"}
              className={`justify-start gap-2.5 h-8 text-[13px] rounded ${isActive("/discover") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => navigate("/discover")}
            >
              <Github01Icon size={15} />
              {t("repo-nav")}
            </Button>
            <Button
              variant={isActive("/providers") ? "secondary" : "ghost"}
              className={`justify-start gap-2.5 h-8 text-[13px] rounded ${isActive("/providers") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => navigate("/providers")}
            >
              <ArrowDataTransferHorizontalIcon size={15} />
              {t("prov-nav")}
            </Button>

          </nav>

          {/* Projects Section */}
          <div className="flex flex-col mt-3 overflow-hidden flex-1">
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
                className="mx-2.5 px-3 py-2.5 rounded border border-dashed border-border/60 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors"
                onClick={handleAddFolder}
              >
                <p className="text-[11px] text-muted-foreground/50 text-center">{t("add-project")}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-1.5">
                <div className="space-y-0.5">
                  {folders.map((folder) => (
                    <div
                      key={folder}
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

          {/* Settings at bottom */}
          <div className="p-2.5 border-t border-border/50">
            <Button
              variant={isActive("/settings") ? "secondary" : "ghost"}
              className={`w-full justify-start gap-2.5 h-8 text-[13px] rounded ${isActive("/settings") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => navigate("/settings")}
            >
              <Settings02Icon size={15} />
              {t("settings")}
            </Button>
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

      {/* Import Config Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) { setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = "" } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("import-config-title")}</DialogTitle>
            <DialogDescription>{t("import-config-desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <div
              className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const file = e.dataTransfer.files?.[0]
                if (file && file.name.endsWith(".json")) {
                  setImportFile(file)
                }
              }}
            >
              {importFile ? (
                <div className="flex items-center justify-center gap-2">
                  <Upload04Icon size={18} className="text-primary" />
                  <span className="text-sm text-foreground">{t("import-file-selected", { name: importFile.name })}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload04Icon size={28} className="mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t("import-file-hint")}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleImport} disabled={!importFile || importing}>
              {importing ? (
                <><RefreshIcon size={14} className="mr-1.5 animate-spin" />{t("importing")}</>
              ) : (
                <><Upload04Icon size={14} className="mr-1.5" />{t("start-import")}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} onAction={handleCommandAction} />
      <CreateSkillDialog open={createSkillOpen} onOpenChange={setCreateSkillOpen} onCreated={() => window.dispatchEvent(new CustomEvent("skill-created"))} />
      <HealthCheckDialog open={healthCheckOpen} onOpenChange={setHealthCheckOpen} />
      <CustomSourcesDialog open={customSourcesOpen} onOpenChange={setCustomSourcesOpen} />
      <KeyboardShortcutsDialog open={keyboardShortcutsOpen} onOpenChange={setKeyboardShortcutsOpen} />
      <Toaster />
    </div>
  )
}

export default PageLayout
