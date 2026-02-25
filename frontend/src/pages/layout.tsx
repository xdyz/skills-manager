import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
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
  Moon02Icon,
  Sun03Icon,
  Add01Icon,
  FolderOpenIcon,
  Folder02Icon,
  Cancel01Icon,
} from "hugeicons-react"
import { useState, useEffect } from "react"
import { SelectFolder, GetFolders, RemoveFolder } from "@wailsjs/go/services/FolderService"

const PageLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [folderToRemove, setFolderToRemove] = useState<string | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
    loadFolders()
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
      <Toaster />
    </div>
  )
}

export default PageLayout
