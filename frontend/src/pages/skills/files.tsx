import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft02Icon,
  Edit02Icon,
  SidebarLeft01Icon,
  RefreshIcon,
} from "hugeicons-react"
import Markdown from "react-markdown"
import FileTree, { buildFileTree } from "@/components/FileTree"
import { GetSkillFiles } from "@wailsjs/go/services/SkillsService"

const SkillFilesPage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const skillName = searchParams.get("name")

  const [skillFiles, setSkillFiles] = useState<{ name: string; isDir: boolean; size: number; content: string }[]>([])
  const [activeFile, setActiveFile] = useState<string>("SKILL.md")
  const [showFileTree, setShowFileTree] = useState(true)
  const [loading, setLoading] = useState(true)
  const [treeWidth, setTreeWidth] = useState(220)

  useEffect(() => {
    if (skillName) {
      setLoading(true)
      GetSkillFiles(skillName)
        .then((files) => {
          const allFiles = files || []
          setSkillFiles(allFiles)
          const firstFile = allFiles.find((f) => !f.isDir)
          if (firstFile) {
            setActiveFile(firstFile.name)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [skillName])

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(`/skills/detail?name=${encodeURIComponent(skillName || "")}`)
    }
  }

  const handleOpenEditor = () => {
    navigate(`/skills/edit?name=${encodeURIComponent(skillName || "")}`)
  }

  const renderMarkdownContent = (content: string) => {
    const parts = content.split("---")
    let body = content
    if (parts.length >= 3) {
      body = parts.slice(2).join("---").trim()
    }
    return body
  }

  // Drag resize handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = treeWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const newWidth = Math.max(160, Math.min(400, startWidth + delta))
      setTreeWidth(newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  if (!skillName) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground">{t("skill-not-found")}</p>
        <Button variant="outline" className="mt-4" onClick={goBack}>
          <ArrowLeft02Icon size={14} className="mr-1.5" />
          {t("back-to-skills")}
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  const fileTree = buildFileTree(skillFiles)
  const onlyFiles = skillFiles.filter((f) => !f.isDir)
  const hasMultipleFiles = onlyFiles.length > 1

  const activeFileData = skillFiles.find((f) => f.name === activeFile && !f.isDir)
  const activeContent = activeFileData?.content || ""
  const ext = activeFile.split(".").pop()?.toLowerCase()
  const isMarkdown = ext === "md" || ext === "mdx"

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={goBack}>
            <ArrowLeft02Icon size={15} className="mr-1" />
            {t("back")}
          </Button>
          <span className="text-[13px] font-medium text-foreground/80">{skillName}</span>
          <span className="text-[12px] text-muted-foreground">—</span>
          <span className="text-[12px] text-muted-foreground">{t("files")}</span>
        </div>
      </div>

      {/* File browser content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File tree */}
        {hasMultipleFiles && showFileTree && (
          <>
            <div
              className="h-full flex flex-col border-r border-border/50 bg-muted/20 shrink-0"
              style={{ width: treeWidth }}
            >
              <div className="px-3 py-2 border-b border-border/50 shrink-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap">
                  {t("files")}
                </span>
              </div>
              <FileTree tree={fileTree} activeFile={activeFile} onFileSelect={setActiveFile} />
            </div>
            {/* Resize handle */}
            <div
              className="w-[3px] shrink-0 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors"
              onMouseDown={handleMouseDown}
            />
          </>
        )}

        {/* Right: File content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* File header bar */}
          <div className="px-3 py-2 bg-muted/30 border-b border-border/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {hasMultipleFiles && (
                <button
                  className="p-0.5 rounded hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => setShowFileTree((prev) => !prev)}
                  title={t("toggle-file-tree")}
                >
                  <SidebarLeft01Icon size={14} />
                </button>
              )}
              <span className="text-[12px] font-medium text-muted-foreground truncate">{activeFile}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground shrink-0"
              onClick={handleOpenEditor}
            >
              <Edit02Icon size={12} className="mr-1" />
              {t("edit-skill")}
            </Button>
          </div>
          {/* File content */}
          <div className="flex-1 overflow-y-auto">
            {isMarkdown ? (
              <div className="p-4 prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground/90 prose-p:text-foreground/75 prose-li:text-foreground/75 prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[12px] prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                <Markdown>{renderMarkdownContent(activeContent) || t("no-description")}</Markdown>
              </div>
            ) : (
              <pre className="p-4 text-[12px] font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all bg-muted/20">
                <code>{activeContent || t("no-description")}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkillFilesPage
