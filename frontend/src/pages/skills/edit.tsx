import { useState, useEffect, useRef, useCallback, useMemo, type RefObject } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft02Icon,
  SaveEnergy01Icon,
  Edit02Icon,
  EyeIcon,
  CodeIcon,
  TextBoldIcon,
  TextItalicIcon,
  SourceCodeIcon,
  ListViewIcon,
  Link01Icon,
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  TextIcon,
  UndoIcon,
  RedoIcon,
  MoreHorizontalIcon,
  SidebarLeft01Icon,
  TextAlignLeftIcon,
} from "hugeicons-react"
import { Panel, Group as PanelGroup, Separator as ResizeHandle } from "react-resizable-panels"
import { GetSkillDetail, SaveSkillContent } from "@wailsjs/go/services/SkillsService"
import Markdown from "react-markdown"

// Frontmatter parser
const parseFrontmatter = (content: string) => {
  const meta: Record<string, string> = {}
  let body = content

  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (match) {
    const frontmatter = match[1]
    body = match[2]
    frontmatter.split("\n").forEach(line => {
      const idx = line.indexOf(":")
      if (idx > 0) {
        const key = line.slice(0, idx).trim()
        const value = line.slice(idx + 1).trim()
        meta[key] = value
      }
    })
  }

  return { meta, body }
}

const buildContent = (meta: Record<string, string>, body: string) => {
  const keys = ["name", "description", "language", "framework"]
  const lines = keys
    .filter(k => meta[k] !== undefined && meta[k] !== "")
    .map(k => `${k}: ${meta[k]}`)
  // include any extra keys not in standard set
  Object.keys(meta).forEach(k => {
    if (!keys.includes(k) && meta[k]) {
      lines.push(`${k}: ${meta[k]}`)
    }
  })
  if (lines.length === 0) return body
  return `---\n${lines.join("\n")}\n---\n\n${body}`
}

// Undo/redo history with debounced push
const useHistory = (initial: string) => {
  const historyRef = useRef<string[]>([initial])
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [, forceUpdate] = useState(0)

  const push = useCallback((value: string, immediate = false) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const doPush = () => {
      const hist = historyRef.current
      // Don't push if identical to current
      if (hist[indexRef.current] === value) return
      const next = hist.slice(0, indexRef.current + 1)
      next.push(value)
      if (next.length > 100) next.shift()
      historyRef.current = next
      indexRef.current = Math.min(next.length - 1, 99)
      forceUpdate(n => n + 1)
    }

    if (immediate) {
      doPush()
    } else {
      timerRef.current = setTimeout(doPush, 400)
    }
  }, [])

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current -= 1
      forceUpdate(n => n + 1)
      return historyRef.current[indexRef.current]
    }
    return null
  }, [])

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1
      forceUpdate(n => n + 1)
      return historyRef.current[indexRef.current]
    }
    return null
  }, [])

  const canUndo = indexRef.current > 0
  const canRedo = indexRef.current < historyRef.current.length - 1

  const reset = useCallback((value: string) => {
    historyRef.current = [value]
    indexRef.current = 0
    forceUpdate(n => n + 1)
  }, [])

  return { push, undo, redo, canUndo, canRedo, reset }
}

const SkillEditPage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const skillName = searchParams.get("name")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Frontmatter fields
  const [meta, setMeta] = useState<Record<string, string>>({})
  // Body content (markdown below frontmatter)
  const [body, setBody] = useState("")

  // View mode
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split")
  const [showMetaPanel, setShowMetaPanel] = useState(true)

  // Editor ref
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const lineNumberRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const syncScrollSource = useRef<"editor" | "preview" | null>(null)

  const bodyHistory = useHistory("")

  // Use refs for save handler to avoid stale closures
  const savingRef = useRef(false)
  const metaRef = useRef(meta)
  const bodyRef = useRef(body)
  metaRef.current = meta
  bodyRef.current = body

  // Line count
  const lineCount = useMemo(() => body.split("\n").length, [body])

  // Cursor position
  const [cursorLine, setCursorLine] = useState(1)
  const [cursorCol, setCursorCol] = useState(1)

  const handleSave = useCallback(async () => {
    if (!skillName || savingRef.current) return
    try {
      savingRef.current = true
      setSaving(true)
      const content = buildContent(metaRef.current, bodyRef.current)
      await SaveSkillContent(skillName, content)
      setHasChanges(false)
      toast({ title: t("toast-skill-saved"), variant: "success" })
    } catch (error) {
      toast({ title: t("toast-save-failed", { error }), variant: "destructive" })
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [skillName, t])

  const bodyHistoryRef = useRef(bodyHistory)
  bodyHistoryRef.current = bodyHistory

  useEffect(() => {
    if (!skillName) return
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const detail = await GetSkillDetail(skillName)
        if (cancelled) return
        const { meta: parsedMeta, body: parsedBody } = parseFrontmatter(detail.content)
        setMeta(parsedMeta)
        setBody(parsedBody)
        bodyHistoryRef.current.reset(parsedBody)
      } catch (error) {
        if (!cancelled) {
          toast({ title: t("toast-load-detail-failed", { error }), variant: "destructive" })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [skillName])

  // ⌘S to save, ⌘Z undo, ⌘⇧Z redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        const val = bodyHistory.undo()
        if (val !== null) {
          setBody(val)
          setHasChanges(true)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault()
        const val = bodyHistory.redo()
        if (val !== null) {
          setBody(val)
          setHasChanges(true)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave, bodyHistory])

  // Sync scroll between editor, line numbers, and preview
  const handleEditorScroll = () => {
    const editor = editorRef.current
    if (!editor) return
    // sync line numbers
    if (lineNumberRef.current) {
      lineNumberRef.current.scrollTop = editor.scrollTop
    }
    // sync preview (proportional)
    if (syncScrollSource.current === "preview") return
    syncScrollSource.current = "editor"
    const preview = previewRef.current
    if (preview) {
      const editorRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1)
      preview.scrollTop = editorRatio * (preview.scrollHeight - preview.clientHeight)
    }
    requestAnimationFrame(() => { syncScrollSource.current = null })
  }

  const handlePreviewScroll = () => {
    if (syncScrollSource.current === "editor") return
    syncScrollSource.current = "preview"
    const preview = previewRef.current
    const editor = editorRef.current
    if (preview && editor) {
      const previewRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1)
      editor.scrollTop = previewRatio * (editor.scrollHeight - editor.clientHeight)
      if (lineNumberRef.current) {
        lineNumberRef.current.scrollTop = editor.scrollTop
      }
    }
    requestAnimationFrame(() => { syncScrollSource.current = null })
  }

  const handleBodyChange = (value: string) => {
    setBody(value)
    setHasChanges(true)
    bodyHistory.push(value)
  }

  const handleMetaChange = (key: string, value: string) => {
    setMeta(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const updateCursorPosition = () => {
    if (!editorRef.current) return
    const { selectionStart, value } = editorRef.current
    const textBefore = value.slice(0, selectionStart)
    const lines = textBefore.split("\n")
    setCursorLine(lines.length)
    setCursorCol(lines[lines.length - 1].length + 1)
  }

  // Toolbar insertions
  const insertAtCursor = (before: string, after: string = "") => {
    const el = editorRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = body.slice(start, end)
    const newText = body.slice(0, start) + before + selected + after + body.slice(end)
    setBody(newText)
    setHasChanges(true)
    bodyHistory.push(newText, true)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + before.length + selected.length
      el.selectionStart = pos
      el.selectionEnd = pos
    })
  }

  const insertSnippet = (type: string) => {
    switch (type) {
      case "bold": insertAtCursor("**", "**"); break
      case "italic": insertAtCursor("_", "_"); break
      case "code": insertAtCursor("`", "`"); break
      case "codeblock": insertAtCursor("\n```\n", "\n```\n"); break
      case "link": insertAtCursor("[", "](url)"); break
      case "h1": insertAtCursor("\n# "); break
      case "h2": insertAtCursor("\n## "); break
      case "h3": insertAtCursor("\n### "); break
      case "list": insertAtCursor("\n- "); break
      case "rule-template": {
        const template = `\n## Rules\n\n- Follow these coding patterns:\n  - Use descriptive variable names\n  - Add error handling for all async operations\n  - Write tests for new functionality\n\n## Examples\n\n\`\`\`typescript\n// Example code here\n\`\`\`\n`
        insertAtCursor(template)
        break
      }
      case "context-template": {
        const template = `\n## Context\n\nThis skill provides guidance for working with [technology/framework].\n\n## Guidelines\n\n1. **First guideline** - Description\n2. **Second guideline** - Description\n3. **Third guideline** - Description\n\n## Anti-patterns\n\n- Avoid doing X because...\n- Don't use Y when...\n`
        insertAtCursor(template)
        break
      }
    }
  }

  const goBack = () => {
    if (hasChanges) {
      if (!window.confirm(t("editor-unsaved-changes"))) return
    }
    navigate(-1)
  }

  if (!skillName) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("skill-not-found")}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Top toolbar */}
      <div className="shrink-0 flex items-center justify-between px-3 h-11 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={goBack}>
            <ArrowLeft02Icon size={14} className="mr-1" />
            {t("back-to-skills")}
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <CodeIcon size={14} className="text-primary" />
            <span className="text-[13px] font-medium">{skillName}</span>
            {hasChanges && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                {t("editor-modified")}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Format toolbar */}
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-0.5 mr-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertSnippet("bold")}>
                    <TextBoldIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor-bold")} (⌘B)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertSnippet("italic")}>
                    <TextItalicIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor-italic")} (⌘I)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertSnippet("code")}>
                    <SourceCodeIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor-inline-code")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertSnippet("link")}>
                    <Link01Icon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor-link")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => insertSnippet("list")}>
                    <ListViewIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor-list")}</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-4 mx-0.5" />

              {/* Headings dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <TextIcon size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => insertSnippet("h1")}>
                    <Heading01Icon size={14} className="mr-2" /> {t("editor-heading")} 1
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertSnippet("h2")}>
                    <Heading02Icon size={14} className="mr-2" /> {t("editor-heading")} 2
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertSnippet("h3")}>
                    <Heading03Icon size={14} className="mr-2" /> {t("editor-heading")} 3
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => insertSnippet("codeblock")}>
                    <SourceCodeIcon size={14} className="mr-2" /> {t("editor-code-block")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Insert templates */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
                    <MoreHorizontalIcon size={14} className="mr-1" />
                    {t("editor-snippets")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => insertSnippet("rule-template")}>
                    <TextAlignLeftIcon size={14} className="mr-2" /> {t("editor-rules-template")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertSnippet("context-template")}>
                    <TextAlignLeftIcon size={14} className="mr-2" /> {t("editor-context-template")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator orientation="vertical" className="h-4" />

            {/* View mode */}
            <div className="flex items-center gap-0.5 ml-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "editor" ? "secondary" : "ghost"}
                    size="icon" className="h-7 w-7"
                    onClick={() => setViewMode("editor")}
                  >
                    <Edit02Icon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "split" ? "secondary" : "ghost"}
                    size="icon" className="h-7 w-7"
                    onClick={() => setViewMode("split")}
                  >
                    <SidebarLeft01Icon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor-split-view")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "preview" ? "secondary" : "ghost"}
                    size="icon" className="h-7 w-7"
                    onClick={() => setViewMode("preview")}
                  >
                    <EyeIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("preview")}</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-4 ml-1" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-0.5 ml-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!bodyHistory.canUndo} onClick={() => {
                    const val = bodyHistory.undo()
                    if (val !== null) { setBody(val); setHasChanges(true) }
                  }}>
                    <UndoIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor-undo")} (⌘Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!bodyHistory.canRedo} onClick={() => {
                    const val = bodyHistory.redo()
                    if (val !== null) { setBody(val); setHasChanges(true) }
                  }}>
                    <RedoIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("editor-redo")} (⌘⇧Z)</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-4 ml-1" />

          <Button size="sm" className="h-7 ml-1.5" onClick={handleSave} disabled={saving || !hasChanges}>
            <SaveEnergy01Icon size={14} className={`mr-1.5 ${saving ? "animate-pulse" : ""}`} />
            {saving ? t("saving") : t("save")}
            <kbd className="ml-2 pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
              ⌘S
            </kbd>
          </Button>
        </div>
      </div>

      {/* Frontmatter panel */}
      {showMetaPanel && (
        <div className="shrink-0 border-b border-border/60 bg-muted/10 px-4 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("editor-frontmatter")}</span>
            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-muted-foreground" onClick={() => setShowMetaPanel(false)}>
              {t("editor-collapse")}
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t("skill-name")}</Label>
              <Input
                className="h-7 text-[12px]"
                value={meta.name || ""}
                onChange={(e) => handleMetaChange("name", e.target.value)}
                placeholder={t("skill-name-placeholder")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t("skill-description")}</Label>
              <Input
                className="h-7 text-[12px]"
                value={meta.description || ""}
                onChange={(e) => handleMetaChange("description", e.target.value)}
                placeholder={t("skill-description-placeholder")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t("editor-language")}</Label>
              <Input
                className="h-7 text-[12px]"
                value={meta.language || ""}
                onChange={(e) => handleMetaChange("language", e.target.value)}
                placeholder="typescript, python..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t("editor-framework")}</Label>
              <Input
                className="h-7 text-[12px]"
                value={meta.framework || ""}
                onChange={(e) => handleMetaChange("framework", e.target.value)}
                placeholder="react, vue, django..."
              />
            </div>
          </div>
        </div>
      )}

      {!showMetaPanel && (
        <div className="shrink-0 border-b border-border/60 bg-muted/10 px-4 py-1 flex items-center">
          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-muted-foreground" onClick={() => setShowMetaPanel(true)}>
            {t("editor-expand-frontmatter")}
          </Button>
          {meta.name && <Badge variant="secondary" className="ml-2 text-[10px] h-4">{meta.name}</Badge>}
          {meta.language && <Badge variant="outline" className="ml-1 text-[10px] h-4">{meta.language}</Badge>}
          {meta.framework && <Badge variant="outline" className="ml-1 text-[10px] h-4">{meta.framework}</Badge>}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "split" ? (
          <PanelGroup orientation="horizontal">
            <Panel defaultSize={50} minSize={30}>
              <EditorPanel
                body={body}
                onChange={handleBodyChange}
                editorRef={editorRef}
                lineNumberRef={lineNumberRef}
                lineCount={lineCount}
                onScroll={handleEditorScroll}
                onCursorChange={updateCursorPosition}
              />
            </Panel>
            <ResizeHandle className="w-[1px] bg-border/60 hover:bg-primary/30 transition-colors data-[resize-handle-active]:bg-primary/50" />
            <Panel defaultSize={50} minSize={25}>
              <PreviewPanel markdownBody={body} scrollRef={previewRef} onScroll={handlePreviewScroll} />
            </Panel>
          </PanelGroup>
        ) : viewMode === "editor" ? (
          <EditorPanel
            body={body}
            onChange={handleBodyChange}
            editorRef={editorRef}
            lineNumberRef={lineNumberRef}
            lineCount={lineCount}
            onScroll={handleEditorScroll}
            onCursorChange={updateCursorPosition}
          />
        ) : (
          <PreviewPanel markdownBody={body} />
        )}
      </div>

      {/* Status bar */}
      <div className="shrink-0 h-6 border-t border-border/60 bg-muted/20 flex items-center justify-between px-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{t("editor-lines", { count: lineCount })}</span>
          <span>{t("editor-cursor", { line: cursorLine, col: cursorCol })}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>SKILL.md</span>
          <span>UTF-8</span>
          <span>Markdown</span>
        </div>
      </div>
    </div>
  )
}

// Editor panel component
const EditorPanel = ({
  body,
  onChange,
  editorRef,
  lineNumberRef,
  lineCount,
  onScroll,
  onCursorChange,
}: {
  body: string
  onChange: (value: string) => void
  editorRef: RefObject<HTMLTextAreaElement | null>
  lineNumberRef: RefObject<HTMLDivElement | null>
  lineCount: number
  onScroll: () => void
  onCursorChange: () => void
}) => {
  // Tab key handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const el = e.currentTarget
      const start = el.selectionStart
      const end = el.selectionEnd
      const newValue = body.slice(0, start) + "  " + body.slice(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2
      })
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Line numbers */}
      <div
        ref={lineNumberRef}
        className="shrink-0 w-10 bg-muted/30 border-r border-border/40 overflow-hidden select-none pt-3 pb-3"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i}
            className="h-[20px] text-[11px] font-mono text-muted-foreground/50 text-right pr-2 leading-[20px]"
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Editor */}
      <textarea
        ref={editorRef}
        className="flex-1 p-3 font-mono text-[12.5px] leading-[20px] bg-transparent text-foreground/90 resize-none focus:outline-none overflow-auto"
        value={body}
        onChange={(e) => onChange(e.target.value)}
        onScroll={onScroll}
        onClick={onCursorChange}
        onKeyUp={onCursorChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
    </div>
  )
}

// Preview panel component
const PreviewPanel = ({ markdownBody, scrollRef, onScroll }: { markdownBody: string; scrollRef?: RefObject<HTMLDivElement | null>; onScroll?: () => void }) => {
  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-background" onScroll={onScroll}>
      <div className="px-3 py-1.5 bg-background border-b border-border/40 sticky top-0 z-10">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Preview</span>
      </div>
      <div className="p-5 prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground/90 prose-p:text-foreground/75 prose-li:text-foreground/75 prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[12px] prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
        <Markdown>{markdownBody || "*No content*"}</Markdown>
      </div>
    </div>
  )
}

export default SkillEditPage
