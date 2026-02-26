import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  RefreshIcon,
  AlertDiamondIcon,
  CheckmarkCircle02Icon,
  Link04Icon,
  Folder01Icon,
  File01Icon,
  RepairIcon,
} from "hugeicons-react"
import { HealthCheck, RepairBrokenLinks } from "@wailsjs/go/services/SkillsService"
import { toast } from "@/components/ui/use-toast"

interface HealthCheckDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface HealthResult {
  brokenLinks: Array<{ agentName: string; skillName: string; linkPath: string; target: string; error: string }>
  orphanSkills: string[]
  unknownFiles: Array<{ agentName: string; fileName: string; filePath: string }>
  totalLinks: number
  healthyLinks: number
}

const HealthCheckDialog = ({ open, onOpenChange }: HealthCheckDialogProps) => {
  const { t } = useTranslation()
  const [checking, setChecking] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const [result, setResult] = useState<HealthResult | null>(null)

  useEffect(() => {
    if (open) {
      runCheck()
    } else {
      setResult(null)
    }
  }, [open])

  const runCheck = async () => {
    setChecking(true)
    try {
      const res = await HealthCheck()
      setResult(res)
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    } finally {
      setChecking(false)
    }
  }

  const handleRepair = async () => {
    setRepairing(true)
    try {
      const count = await RepairBrokenLinks()
      toast({ title: t("toast-repair-success", { count }), variant: "success" })
      await runCheck()
    } catch (error) {
      toast({ title: t("toast-repair-failed", { error }), variant: "destructive" })
    } finally {
      setRepairing(false)
    }
  }

  const hasIssues = result && ((result.brokenLinks?.length || 0) > 0 || (result.orphanSkills?.length || 0) > 0 || (result.unknownFiles?.length || 0) > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("health-check")}</DialogTitle>
          <DialogDescription>{t("health-check-desc")}</DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="flex items-center justify-center py-12">
            <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">{t("checking-health")}</span>
          </div>
        ) : result ? (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/50 p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckmarkCircle02Icon size={16} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">{result.healthyLinks}</p>
                  <p className="text-[11px] text-muted-foreground">{t("healthy-links")}</p>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Link04Icon size={16} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">{result.brokenLinks?.length || 0}</p>
                  <p className="text-[11px] text-muted-foreground">{t("broken-links")}</p>
                </div>
              </div>
            </div>

            {!hasIssues ? (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                <CheckmarkCircle02Icon size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t("no-issues")}</p>
              </div>
            ) : (
              <>
                {/* Broken Links */}
                {result.brokenLinks && result.brokenLinks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertDiamondIcon size={14} className="text-destructive" />
                        <h4 className="text-[12px] font-medium">{t("broken-links")}</h4>
                        <Badge variant="destructive" className="text-[10px]">{result.brokenLinks.length}</Badge>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleRepair} disabled={repairing}>
                        {repairing ? (
                          <><RefreshIcon size={12} className="mr-1 animate-spin" />{t("repairing")}</>
                        ) : (
                          <><RepairIcon size={12} className="mr-1" />{t("repair-broken-links")}</>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {result.brokenLinks.map((link, i) => (
                        <div key={i} className="rounded border border-destructive/20 bg-destructive/5 p-2.5 text-xs">
                          <span className="font-medium">[{link.agentName}]</span>{" "}
                          <span className="font-mono">{link.skillName}</span>
                          <p className="text-muted-foreground mt-0.5 truncate">{link.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orphan Skills */}
                {result.orphanSkills && result.orphanSkills.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Folder01Icon size={14} className="text-amber-500" />
                      <h4 className="text-[12px] font-medium">{t("orphan-skills")}</h4>
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500">{result.orphanSkills.length}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.orphanSkills.map((name) => (
                        <Badge key={name} variant="secondary" className="text-[11px] font-mono">{name}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unknown Files */}
                {result.unknownFiles && result.unknownFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <File01Icon size={14} className="text-muted-foreground" />
                      <h4 className="text-[12px] font-medium">{t("unknown-files")}</h4>
                      <Badge variant="outline" className="text-[10px]">{result.unknownFiles.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {result.unknownFiles.map((file, i) => (
                        <div key={i} className="text-xs text-muted-foreground">
                          <span className="font-medium">[{file.agentName}]</span> {file.fileName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default HealthCheckDialog
