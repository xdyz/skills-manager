import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  Home01Icon, 
  ChartHistogramIcon,
  Notification01Icon,
  Settings01Icon,
  HelpCircleIcon,
  Moon02Icon,
  Sun03Icon,
  Add01Icon,
  FolderOpenIcon,
  FilterIcon
} from "hugeicons-react"
import { useState, useEffect } from "react"
import { SelectFolder, GetFolders } from "../../wailsjs/go/main/App"

const PageLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [folders, setFolders] = useState<string[]>([])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
    loadFolders()
  }, [])

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
      }
    } catch (error) {
      console.error("Failed to select folder:", error)
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
    <div className="flex flex-col h-screen w-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SM</span>
              </div>
              <span className="font-semibold text-foreground">Skills Manager</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="font-semibold cursor-pointer hover:text-foreground transition-colors">
                模版推荐
              </span>
              <span className="cursor-pointer hover:text-foreground transition-colors">
                所有模版
              </span>
              <span className="cursor-pointer hover:text-foreground transition-colors">
                我的模版
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Notification01Icon size={20} />
            </Button>
            <Button variant="ghost" size="icon">
              <HelpCircleIcon size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? <Moon02Icon size={20} /> : <Sun03Icon size={20} />}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings01Icon size={20} />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 border-r bg-card flex flex-col">
          <nav className="flex flex-col gap-1 p-2">
            <Button
              variant={isActive("/home") ? "secondary" : "ghost"}
              className="justify-start gap-2"
              onClick={() => navigate("/home")}
            >
              <Home01Icon size={20} />
              首页
            </Button>
            <Button
              variant={isActive("/skills") ? "secondary" : "ghost"}
              className="justify-start gap-2"
              onClick={() => navigate("/skills")}
            >
              <ChartHistogramIcon size={20} />
              Skills 技能
            </Button>
          </nav>

          {/* Threads Section */}
          <div className="flex-1 flex flex-col mt-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-4">
              <h3 className="text-base font-medium text-foreground">Threads</h3>
              <div className="flex items-center gap-0.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 hover:bg-accent"
                  onClick={handleAddFolder}
                >
                  <Add01Icon size={16} className="text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent">
                  <FilterIcon size={16} className="text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {folders.length === 0 ? (
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground/60">No threads</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {folders.map((folder, index) => (
                    <div key={index} className="px-2">
                      <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent cursor-pointer group">
                        <FolderOpenIcon size={18} className="text-muted-foreground/70 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-foreground truncate block">{getFolderName(folder)}</span>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">No threads</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default PageLayout
