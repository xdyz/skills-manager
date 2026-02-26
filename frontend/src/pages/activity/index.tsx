import { useState, useEffect } from "react"
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
  RefreshIcon,
  Delete02Icon,
  Download04Icon,
  Upload04Icon,
  Add01Icon,
  Cancel01Icon,
  LinkSquare02Icon,
  Edit02Icon,
} from "hugeicons-react"
import { GetActivityLogs, ClearActivityLogs } from "@wailsjs/go/services/SkillsService"

interface ActivityLogEntry {
  id: string
  action: string
  skillName: string
  detail: string
  timestamp: string
}

const actionIconMap: Record<string, any> = {
  install: Download04Icon,
  delete: Delete02Icon,
  update: RefreshIcon,
  create: Add01Icon,
  link: LinkSquare02Icon,
  unlink: Cancel01Icon,
  import: Upload04Icon,
  export: Download04Icon,
}

const actionColorMap: Record<string, string> = {
  install: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  delete: "bg-red-500/10 text-red-600 dark:text-red-400",
  update: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  create: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  link: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  unlink: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  import: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  export: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
}

const ActivityPage = () => {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showClearDialog, setShowClearDialog] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const result = await GetActivityLogs(200)
      setLogs(result || [])
    } catch {}
    setLoading(false)
  }

  const handleClearLogs = async () => {
    try {
      await ClearActivityLogs()
      setLogs([])
      toast({ title: t("toast-logs-cleared"), variant: "success" })
    } catch {}
    setShowClearDialog(false)
  }

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts)
      const now = new Date()
      const diff = now.getTime() - d.getTime()
      if (diff < 60000) return t("just-now")
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ts
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground/90">{t("activity-log")}</h1>
            <p className="text-[13px] text-muted-foreground">{t("activity-log-desc")}</p>
          </div>
          {logs.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowClearDialog(true)}>
              <Delete02Icon size={14} className="mr-1.5" />
              {t("clear-logs")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[360px] select-none">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
              <Edit02Icon size={28} className="text-muted-foreground/50" />
            </div>
            <p className="text-[15px] font-medium text-foreground/70 mb-1.5">{t("no-activity")}</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border/50" />
              <div className="space-y-1">
                {logs.map((log) => {
                  const Icon = actionIconMap[log.action] || Edit02Icon
                  const color = actionColorMap[log.action] || "bg-muted text-muted-foreground"
                  return (
                    <div key={log.id} className="flex items-start gap-3 relative pl-0">
                      <div className={`relative z-10 p-1.5 rounded-full ${color} shrink-0`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] capitalize">{t(`action-${log.action}`) || log.action}</Badge>
                          <span className="text-[12px] font-medium truncate">{log.skillName}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{formatTime(log.timestamp)}</span>
                        </div>
                        {log.detail && (
                          <p className="text-[11px] text-muted-foreground mt-1 truncate">{log.detail}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clear-logs")}</AlertDialogTitle>
            <AlertDialogDescription>{t("clear-logs")}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearLogs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ActivityPage
