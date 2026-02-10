import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import Logo from "@/components/Logo"
import { 
  Home01Icon, 
  ChartHistogramIcon,
  Moon02Icon,
  Sun03Icon,
  Add01Icon,
  FolderOpenIcon,
  Folder02Icon,
  Cancel01Icon
} from "hugeicons-react"
import { useState, useEffect } from "react"
import { SelectFolder, GetFolders, RemoveFolder } from "@wailsjs/go/services/FolderService"

const PageLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

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

  const handleRemoveFolder = async (folder: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await RemoveFolder(folder)
      await loadFolders()
      if (selectedFolder === folder) {
        setSelectedFolder(null)
        navigate("/home")
      }
    } catch (error) {
      console.error("Failed to remove folder:", error)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const isActive = (path: string) => {
    return location.pathname === path || (path === "/home" && location.pathname === "/")
  }

  const getFolderName = (path: string) => {
    return path.split('/').filter(Boolean).pop() || path
  }

  return (
    <div className="flex flex-col w-screen h-screen">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <Logo size={26} />
            <span className="text-sm font-semibold tracking-tight text-foreground">Skills Manager</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {theme === "light" ? <Moon02Icon size={16} /> : <Sun03Icon size={16} />}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex flex-col w-52 border-r bg-card/50">
          <nav className="flex flex-col gap-0.5 p-2">
            <Button
              variant={isActive("/home") ? "secondary" : "ghost"}
              className="justify-start gap-2 h-9 text-sm"
              onClick={() => navigate("/home")}
            >
              <Home01Icon size={16} />
              首页
            </Button>
            <Button
              variant={isActive("/skills") ? "secondary" : "ghost"}
              className="justify-start gap-2 h-9 text-sm"
              onClick={() => navigate("/skills")}
            >
              <ChartHistogramIcon size={16} />
              Skills 技能
            </Button>
          </nav>

          {/* Projects Section */}
          <div className="flex flex-col flex-1 mt-2 overflow-hidden">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">项目</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 hover:bg-accent"
                onClick={handleAddFolder}
              >
                <Add01Icon size={14} className="text-muted-foreground" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {folders.length === 0 ? (
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground/50">暂无项目</p>
                </div>
              ) : (
                <div className="space-y-px px-1">
                  {folders.map((folder, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${
                        selectedFolder === folder 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-accent"
                      }`}
                      onClick={() => handleSelectFolder(folder)}
                    >
                      {selectedFolder === folder ? (
                        <FolderOpenIcon size={15} className="flex-shrink-0 text-primary" />
                      ) : (
                        <Folder02Icon size={15} className="flex-shrink-0 text-muted-foreground/60" />
                      )}
                      <span className="flex-1 min-w-0 text-xs truncate">{getFolderName(folder)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => handleRemoveFolder(folder, e)}
                      >
                        <Cancel01Icon size={10} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}

export default PageLayout
