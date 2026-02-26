import { useState, useEffect } from "react"
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
  ArrowLeft02Icon,
  CodeIcon,
  RefreshIcon,
  Delete02Icon,
  Settings02Icon,
  LinkSquare02Icon,
  Calendar03Icon,
  Folder01Icon,
  AiChat02Icon,
} from "hugeicons-react"
import { GetSkillDetail, DeleteSkill, UpdateSkill, GetSkillAgentLinks, UpdateSkillAgentLinks } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"
import Markdown from "react-markdown"
import ConfigAgentLinkDialog from "@/components/ConfigAgentLinkDialog"
import type { AgentInfo } from "@/types"

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
    await UpdateSkillAgentLinks(name, agents)
    toast({ title: t("toast-links-updated", { name, count: agents.length }), variant: "success" })
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

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
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
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="h-8" onClick={() => setConfigDialogOpen(true)}>
              <Settings02Icon size={14} className="mr-1.5" />
              {t("config-agent-link")}
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={handleUpdate} disabled={updating}>
              <RefreshIcon size={14} className={`mr-1.5 ${updating ? "animate-spin" : ""}`} />
              {t("update")}
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteDialog(true)}>
              <Delete02Icon size={14} className="mr-1.5" />
              {t("delete")}
            </Button>
          </div>
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

          {/* SKILL.md content */}
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border/50">
              <span className="text-[12px] font-medium text-muted-foreground">SKILL.md</span>
            </div>
            <div className="p-4 prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground/90 prose-p:text-foreground/75 prose-li:text-foreground/75 prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[12px] prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
              <Markdown>{markdownBody || t("no-description")}</Markdown>
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
    </div>
  )
}

export default SkillDetailPage
