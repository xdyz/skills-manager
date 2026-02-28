import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GetRating, SetRating } from "@wailsjs/go/services/RatingService"
import {
  ArrowLeft02Icon,
  CodeIcon,
  RefreshIcon,
  Delete02Icon,
  Settings02Icon,
  LinkSquare02Icon,
  Calendar03Icon,
  Folder01Icon,
  AiChat02Icon,
  Edit02Icon,
  GitCompareIcon,
  FavouriteIcon,
  SourceCodeIcon,
  ArrowDown01Icon,
  StarIcon,
} from "hugeicons-react"
import { GetSkillDetail, DeleteSkill, UpdateSkill, GetSkillAgentLinks, UpdateSkillAgentLinks, GetSkillDiff, GetSkillTags, GetFavorites, ToggleFavorite, GetAvailableEditors, OpenSkillInEditor, GetSkillFiles } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"
import Markdown from "react-markdown"
import { diffLines } from "diff"
import ConfigAgentLinkDialog from "@/components/ConfigAgentLinkDialog"
import TagManager from "@/components/TagManager"
import type { AgentInfo } from "@/types"
import { Input } from "@/components/ui/input"

interface SkillDetailData {
  name: string
  desc: string
  path: string
  language: string
  framework: string
  agents: string[]
  source: string
  content: string
  installedAt: string
  updatedAt: string
}

const SkillDetailPage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const skillName = searchParams.get("name")

  const [detail, setDetail] = useState<SkillDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])

  // Editor removed - now uses dedicated edit page

  // Tags
  const [tags, setTags] = useState<string[]>([])

  // Diff preview
  const [showDiffDialog, setShowDiffDialog] = useState(false)
  const [diffData, setDiffData] = useState<{ localContent: string; remoteContent: string; hasChanges: boolean } | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)

  // Favorites
  const [isFavorite, setIsFavorite] = useState(false)

  // Available editors
  const [editors, setEditors] = useState<{ id: string; name: string; icon: string; iconBase64: string }[]>([])

  // Skill files (multi-file view)
  const [skillFiles, setSkillFiles] = useState<{ name: string; isDir: boolean; size: number; content: string }[]>([])
  const [activeFile, setActiveFile] = useState<string>("SKILL.md")

  // Rating
  const [rating, setRating] = useState(0)
  const [ratingNote, setRatingNote] = useState("")
  const [ratingHover, setRatingHover] = useState(0)

  // Rating service bindings
  const getRatingFn = (name: string) => GetRating(name).catch(() => ({ rating: 0, note: "" }))
  const setRatingFn = (name: string, r: number, note: string) => SetRating(name, r, note)

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate("/skills")
    }
  }

  useEffect(() => {
    if (skillName) {
      loadDetail(skillName)
      loadAgents()
      GetSkillTags(skillName).then(t => setTags(t || [])).catch(() => {})
      GetFavorites().then(favs => setIsFavorite((favs || []).includes(skillName))).catch(() => {})
      GetSkillFiles(skillName).then(files => {
        const fileList = (files || []).filter(f => !f.isDir)
        setSkillFiles(fileList)
        if (fileList.length > 0) {
          setActiveFile(fileList[0].name)
        }
      }).catch(() => {})
    }
    GetAvailableEditors().then(e => setEditors(e || [])).catch(() => {})
    if (skillName) {
      getRatingFn(skillName).then((r: any) => {
        setRating(r?.rating || 0)
        setRatingNote(r?.note || "")
      }).catch(() => {})
    }
  }, [skillName])

  // Refresh data silently on window focus
  useEffect(() => {
    const handleFocus = async () => {
      if (!skillName) return
      try {
        const result = await GetSkillDetail(skillName)
        setDetail(result)
      } catch {}
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [skillName])

  const loadDetail = async (name: string) => {
    try {
      setLoading(true)
      const result = await GetSkillDetail(name)
      setDetail(result)
    } catch (error) {
      console.error("Failed to load skill detail:", error)
      toast({ title: t("toast-load-detail-failed", { error }), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadAgents = async () => {
    try {
      const result = await GetSupportedAgents()
      setAllAgents(result || [])
    } catch {}
  }

  const handleUpdate = async () => {
    if (!skillName) return
    try {
      setUpdating(true)
      await UpdateSkill(skillName)
      toast({ title: t("toast-skill-updated", { name: skillName }), variant: "success" })
      await loadDetail(skillName)
    } catch (error) {
      toast({ title: t("toast-update-failed", { error }), variant: "destructive" })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!skillName) return
    try {
      setDeleting(true)
      await DeleteSkill(skillName)
      toast({ title: t("toast-skill-deleted", { name: skillName }), variant: "success" })
      navigate("/skills")
    } catch (error) {
      toast({ title: t("toast-delete-failed", { error }), variant: "destructive" })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleLoadLinks = async (name: string) => {
    const links = await GetSkillAgentLinks(name)
    return links || []
  }

  const handleSaveLinks = async (name: string, agents: string[]) => {
    const linkedCount = await UpdateSkillAgentLinks(name, agents)
    toast({ title: t("toast-links-updated", { name, count: linkedCount }), variant: "success" })
    await loadDetail(name)
  }

  const handleOpenEditor = () => {
    navigate(`/skills/edit?name=${encodeURIComponent(skillName || "")}`)
  }

  const handleOpenInSystemEditor = async (editorID: string) => {
    if (!skillName) return
    try {
      await OpenSkillInEditor(skillName, editorID)
    } catch (error) {
      toast({ title: t("toast-open-editor-failed", { error }), variant: "destructive" })
    }
  }

  const handleLoadDiff = async () => {
    if (!skillName) return
    setShowDiffDialog(true)
    setLoadingDiff(true)
    try {
      const diff = await GetSkillDiff(skillName)
      setDiffData(diff)
    } catch (error) {
      toast({ title: t("diff-load-failed", { error }), variant: "destructive" })
      setShowDiffDialog(false)
    } finally {
      setLoadingDiff(false)
    }
  }

  const handleSaveRating = async (newRating: number) => {
    if (!skillName) return
    setRating(newRating)
    try {
      await setRatingFn(skillName, newRating, ratingNote)
      toast({ title: t("rating-saved"), variant: "success" })
    } catch (error) {
      toast({ title: t("rating-save-failed", { error }), variant: "destructive" })
    }
  }

  const handleSaveNote = async () => {
    if (!skillName) return
    try {
      await setRatingFn(skillName, rating, ratingNote)
      toast({ title: t("rating-saved"), variant: "success" })
    } catch (error) {
      toast({ title: t("rating-save-failed", { error }), variant: "destructive" })
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  const renderMarkdownContent = (content: string) => {
    // 去掉 frontmatter
    const parts = content.split("---")
    let body = content
    if (parts.length >= 3) {
      body = parts.slice(2).join("---").trim()
    }
    return body
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

  if (!detail) {
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

  const markdownBody = renderMarkdownContent(detail.content)

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={goBack}>
            <ArrowLeft02Icon size={15} className="mr-1" />
            {t("back-to-skills")}
          </Button>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
            <CodeIcon size={22} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground/90 truncate">{detail.name}</h1>
            {detail.desc && (
              <p className="text-[13px] text-muted-foreground mt-0.5">{detail.desc}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {detail.language && <Badge variant="secondary" className="text-xs">{detail.language}</Badge>}
              {detail.framework && <Badge variant="outline" className="text-xs">{detail.framework}</Badge>}
              {detail.source && (
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent" onClick={() => BrowserOpenURL(`https://github.com/${detail.source}`)}>
                  <LinkSquare02Icon size={11} className="mr-1" />
                  {detail.source}
                </Badge>
              )}
            </div>
            <div className="mt-2">
              <TagManager skillName={detail.name} tags={tags} onTagsChange={setTags} compact />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 justify-end">
          <Button variant="outline" size="sm" className={`h-7 text-[12px] ${isFavorite ? "text-amber-500 border-amber-500/40" : ""}`} onClick={async () => {
            if (!skillName) return
            const result = await ToggleFavorite(skillName)
            setIsFavorite(result)
          }}>
            <FavouriteIcon size={13} className={`mr-1 ${isFavorite ? "fill-amber-500" : ""}`} />
            {isFavorite ? t("remove-from-favorites") : t("add-to-favorites")}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={handleOpenEditor}>
            <Edit02Icon size={13} className="mr-1" />{t("edit-skill")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-[12px]">
                <SourceCodeIcon size={13} className="mr-1" />{t("open-in-editor")}
                <ArrowDown01Icon size={11} className="ml-0.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {editors.map((editor) => (
                <DropdownMenuItem key={editor.id} onClick={() => handleOpenInSystemEditor(editor.id)} className="text-[12px] gap-2">
                  <EditorIcon icon={editor.icon} iconBase64={editor.iconBase64} />
                  {editor.name}
                </DropdownMenuItem>
              ))}
              {editors.length === 0 && (
                <DropdownMenuItem disabled className="text-[12px] text-muted-foreground">
                  {t("no-editor-found")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {detail.source && (
            <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={handleLoadDiff}>
              <GitCompareIcon size={13} className="mr-1" />
              {t("diff-preview")}
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => setConfigDialogOpen(true)}>
            <Settings02Icon size={13} className="mr-1" />
            {t("config-agent-link")}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={handleUpdate} disabled={updating}>
            <RefreshIcon size={13} className={`mr-1 ${updating ? "animate-spin" : ""}`} />
            {t("update")}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[12px] text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteDialog(true)}>
            <Delete02Icon size={13} className="mr-1" />
            {t("delete")}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-5 space-y-5">
          {/* Info cards */}
          <div className="space-y-3">
            {/* Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/50 p-3.5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                  <Calendar03Icon size={14} />
                  <span className="text-[11px] font-medium uppercase tracking-wide">{t("detail-installed-at")}</span>
                </div>
                <p className="text-xs text-foreground/80">{formatDate(detail.installedAt)}</p>
              </div>

              <div className="rounded-lg border border-border/50 p-3.5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                  <Folder01Icon size={14} />
                  <span className="text-[11px] font-medium uppercase tracking-wide">{t("detail-updated-at")}</span>
                </div>
                <p className="text-xs text-foreground/80">{formatDate(detail.updatedAt)}</p>
              </div>
            </div>

            {/* Linked agents */}
            <div className="rounded-lg border border-border/50 p-3.5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AiChat02Icon size={14} />
                <span className="text-[11px] font-medium uppercase tracking-wide">{t("detail-linked-agents")}</span>
                {detail.agents && detail.agents.length > 0 && (
                  <Badge variant="outline" className="text-[10px] ml-auto">{detail.agents.length}</Badge>
                )}
              </div>
              {detail.agents && detail.agents.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {detail.agents.map((agent) => (
                    <Badge key={agent} variant="secondary" className="text-[11px]">{agent}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-500">{t("no-agent-linked")}</p>
              )}
            </div>
          </div>

          {/* Path */}
          <div className="rounded-lg border border-border/50 p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
              <Folder01Icon size={14} />
              <span className="text-[11px] font-medium uppercase tracking-wide">{t("detail-path")}</span>
            </div>
            <p className="text-xs text-foreground/70 font-mono break-all">{detail.path}</p>
          </div>

          {/* Rating & Note */}
          <div className="rounded-lg border border-border/50 p-3.5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <StarIcon size={14} />
              <span className="text-[11px] font-medium uppercase tracking-wide">{t("rating")}</span>
            </div>
            <div className="flex items-center gap-1 mb-2.5">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  className="p-0.5 transition-transform hover:scale-110"
                  onMouseEnter={() => setRatingHover(i)}
                  onMouseLeave={() => setRatingHover(0)}
                  onClick={() => handleSaveRating(i === rating ? 0 : i)}
                >
                  <StarIcon
                    size={18}
                    className={`transition-colors ${
                      i <= (ratingHover || rating)
                        ? "text-amber-500 fill-amber-500"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && <span className="text-[11px] text-muted-foreground ml-1">{rating}/5</span>}
            </div>
            <div className="flex gap-2">
              <Input
                className="h-8 text-[12px] flex-1"
                placeholder={t("rating-note-placeholder")}
                value={ratingNote}
                onChange={(e) => setRatingNote(e.target.value)}
                onBlur={handleSaveNote}
                onKeyDown={(e) => e.key === "Enter" && handleSaveNote()}
              />
            </div>
          </div>

          {/* Skill files content with tabs */}
          <div className="rounded-lg border border-border/50 overflow-hidden">
            {skillFiles.length > 1 && (
              <div className="flex items-center gap-0 bg-muted/30 border-b border-border/50 overflow-x-auto">
                {skillFiles.map((file) => (
                  <button
                    key={file.name}
                    className={`px-4 py-2 text-[12px] font-medium transition-colors whitespace-nowrap border-b-2 ${
                      activeFile === file.name
                        ? "border-primary text-primary bg-background"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => setActiveFile(file.name)}
                  >
                    {file.name}
                    <span className="ml-1.5 text-[10px] text-muted-foreground/50">
                      {file.size > 1024 ? `${(file.size / 1024).toFixed(1)}KB` : `${file.size}B`}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border/50 flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground">{activeFile}</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground" onClick={handleOpenEditor}>
                <Edit02Icon size={12} className="mr-1" />
                {t("edit-skill")}
              </Button>
            </div>
            <div className="p-4 prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground/90 prose-p:text-foreground/75 prose-li:text-foreground/75 prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[12px] prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
              <Markdown>{
                (() => {
                  const file = skillFiles.find(f => f.name === activeFile)
                  if (file) {
                    return renderMarkdownContent(file.content) || t("no-description")
                  }
                  return markdownBody || t("no-description")
                })()
              }</Markdown>
            </div>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm-delete-skill")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm-delete-skill-desc", { name: skillName })}
              <br /><br />
              {t("delete-skill-warn")}
              <ul className="mt-2 ml-4 space-y-1 list-disc">
                <li>{t("delete-skill-item1")}</li>
                <li>{t("delete-skill-item2")}</li>
                <li>{t("delete-skill-item3")}</li>
              </ul>
              <br />
              <span className="font-semibold text-destructive">{t("delete-skill-irreversible")}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? t("deleting") : t("confirm-delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Config agent link dialog */}
      <ConfigAgentLinkDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        skillName={skillName}
        agents={allAgents}
        loadLinks={handleLoadLinks}
        saveLinks={handleSaveLinks}
        onSaved={() => skillName && loadDetail(skillName)}
      />

      {/* Diff Preview dialog */}
      <Dialog open={showDiffDialog} onOpenChange={(open) => { setShowDiffDialog(open); if (!open) setDiffData(null) }}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t("diff-preview")}</DialogTitle>
            <DialogDescription>{t("diff-preview-desc")}</DialogDescription>
          </DialogHeader>
          {loadingDiff ? (
            <div className="flex items-center justify-center py-12">
              <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">{t("loading-diff")}</span>
            </div>
          ) : diffData ? (
            diffData.hasChanges ? (
              <DiffView localContent={diffData.localContent} remoteContent={diffData.remoteContent} />
            ) : (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t("no-changes")}</p>
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Side-by-side diff view with line-level highlighting
type DiffLine = { lineNum: number; text: string; type: "equal" | "removed" | "added" }

function DiffView({ localContent, remoteContent }: { localContent: string; remoteContent: string }) {
  const { leftLines, rightLines } = useMemo(() => {
    const changes = diffLines(localContent, remoteContent)
    const left: DiffLine[] = []
    const right: DiffLine[] = []
    let oldNum = 1
    let newNum = 1

    for (const change of changes) {
      const texts = change.value.replace(/\n$/, "").split("\n")
      if (change.removed) {
        for (const t of texts) {
          left.push({ lineNum: oldNum++, text: t, type: "removed" })
          right.push({ lineNum: -1, text: "", type: "removed" })
        }
      } else if (change.added) {
        for (const t of texts) {
          left.push({ lineNum: -1, text: "", type: "added" })
          right.push({ lineNum: newNum++, text: t, type: "added" })
        }
      } else {
        for (const t of texts) {
          left.push({ lineNum: oldNum++, text: t, type: "equal" })
          right.push({ lineNum: newNum++, text: t, type: "equal" })
        }
      }
    }
    return { leftLines: left, rightLines: right }
  }, [localContent, remoteContent])

  const DiffPanel = ({ lines, side }: { lines: DiffLine[]; side: "left" | "right" }) => (
    <div className="flex-1 min-w-0 overflow-x-auto">
      <table className="w-full text-[11px] font-mono border-collapse">
        <tbody>
          {lines.map((line, i) => {
            const isEmpty = line.lineNum === -1
            const isChanged = side === "left" ? line.type === "removed" : line.type === "added"
            return (
              <tr
                key={i}
                className={
                  isChanged
                    ? side === "left" ? "bg-red-500/10" : "bg-emerald-500/10"
                    : isEmpty ? "bg-muted/30" : ""
                }
              >
                <td className="select-none text-right px-1.5 py-0 text-muted-foreground/40 w-[1%] whitespace-nowrap text-[10px]">
                  {isEmpty ? "" : line.lineNum}
                </td>
                <td className="px-2 py-0 whitespace-pre-wrap break-all">
                  {isEmpty ? "" : line.text}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 gap-0 border border-border/50 rounded overflow-hidden">
        <div className="flex flex-col min-w-0">
          <div className="px-3 py-1.5 bg-red-500/10 border-b border-border/50 text-[11px] font-medium text-red-600 dark:text-red-400 sticky top-0 z-10">
            Local
          </div>
          <DiffPanel lines={leftLines} side="left" />
        </div>
        <div className="flex flex-col min-w-0 border-l border-border/50">
          <div className="px-3 py-1.5 bg-emerald-500/10 border-b border-border/50 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 sticky top-0 z-10">
            Remote
          </div>
          <DiffPanel lines={rightLines} side="right" />
        </div>
      </div>
    </div>
  )
}

const editorIcons: Record<string, { color: string; label: string }> = {
  vscode: { color: "#007ACC", label: "VS" },
  cursor: { color: "#000000", label: "Cu" },
  codebuddy: { color: "#00D4AA", label: "CB" },
  windsurf: { color: "#00C4B4", label: "Wi" },
  zed: { color: "#F5A623", label: "Ze" },
  sublime: { color: "#FF9800", label: "ST" },
  idea: { color: "#E44332", label: "IJ" },
  webstorm: { color: "#00CDD7", label: "WS" },
  fleet: { color: "#7B61FF", label: "Fl" },
  nova: { color: "#6A50D3", label: "No" },
}

const EditorIcon = ({ icon, iconBase64 }: { icon: string; iconBase64?: string }) => {
  if (iconBase64) {
    return <img src={iconBase64} alt={icon} className="w-5 h-5 rounded-[3px] shrink-0" />
  }
  const info = editorIcons[icon]
  if (!info) return <SourceCodeIcon size={14} />
  return (
    <div
      className="w-5 h-5 rounded-[3px] flex items-center justify-center text-white font-bold shrink-0"
      style={{ backgroundColor: info.color, fontSize: "9px", lineHeight: 1 }}
    >
      {info.label}
    </div>
  )
}

export default SkillDetailPage
