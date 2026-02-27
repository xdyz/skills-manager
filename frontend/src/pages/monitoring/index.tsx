import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import {
  RefreshIcon,
  ChartHistogramIcon,
  Clock01Icon,
  AlertDiamondIcon,
  Delete02Icon,
} from "hugeicons-react"
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
import { GetPerformanceMetrics, GetSystemMetrics, ClearMetrics } from "@wailsjs/go/services/MonitoringService"
import { services } from "@wailsjs/go/models"

const MonitoringPage = () => {
  const { t } = useTranslation()
  const [metrics, setMetrics] = useState<services.PerformanceMetric[]>([])
  const [systemMetric, setSystemMetric] = useState<services.SystemMetric | null>(null)
  const [loading, setLoading] = useState(true)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const chartRef = useRef<HTMLCanvasElement>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [m, s] = await Promise.all([GetPerformanceMetrics(), GetSystemMetrics()])
      setMetrics(m || [])
      setSystemMetric(s)
    } catch (error) {
      console.error("Failed to load monitoring data:", error)
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!chartRef.current || metrics.length === 0) return
    const canvas = chartRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const isDark = document.documentElement.classList.contains("dark")
    const sorted = [...metrics].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, 10)
    if (sorted.length === 0) return

    const maxUsage = Math.max(...sorted.map(m => m.usageCount || 0), 1)
    const barWidth = Math.min(40, (rect.width - 60) / sorted.length - 8)
    const chartH = rect.height - 50
    const startX = 40

    ctx.font = "10px system-ui"
    ctx.fillStyle = isDark ? "#94a3b8" : "#64748b"
    ctx.textAlign = "right"
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (chartH / 4) * i
      const val = Math.round(maxUsage * (1 - i / 4))
      ctx.fillText(String(val), startX - 6, y + 4)
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(rect.width - 10, y)
      ctx.strokeStyle = isDark ? "rgba(148,163,184,0.1)" : "rgba(100,116,139,0.1)"
      ctx.stroke()
    }

    sorted.forEach((m, i) => {
      const barH = ((m.usageCount || 0) / maxUsage) * chartH
      const x = startX + 10 + i * (barWidth + 8)
      const y = 10 + chartH - barH

      const gradient = ctx.createLinearGradient(x, y, x, 10 + chartH)
      if (isDark) {
        gradient.addColorStop(0, "rgba(99,102,241,0.8)")
        gradient.addColorStop(1, "rgba(99,102,241,0.3)")
      } else {
        gradient.addColorStop(0, "rgba(79,70,229,0.8)")
        gradient.addColorStop(1, "rgba(79,70,229,0.3)")
      }

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0])
      ctx.fill()

      ctx.save()
      ctx.translate(x + barWidth / 2, 10 + chartH + 8)
      ctx.rotate(-Math.PI / 6)
      ctx.font = "9px system-ui"
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b"
      ctx.textAlign = "right"
      const label = m.skillName.length > 12 ? m.skillName.slice(0, 10) + "…" : m.skillName
      ctx.fillText(label, 0, 0)
      ctx.restore()
    })
  }, [metrics])

  const handleClearMetrics = async () => {
    try {
      await ClearMetrics()
      setMetrics([])
      toast({ title: t("success"), description: t("mon-metrics-cleared") })
    } catch (error) {
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    } finally {
      setShowClearDialog(false)
    }
  }

  const totalUsage = metrics.reduce((sum, m) => sum + (m.usageCount || 0), 0)
  const totalErrors = metrics.reduce((sum, m) => sum + (m.errorCount || 0), 0)
  const avgErrorRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + (m.errorRate || 0), 0) / metrics.length
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowClearDialog(true)}>
          <Delete02Icon className="h-4 w-4 mr-2" />{t("mon-clear")}
        </Button>
        <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
          <RefreshIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />{t("home-refresh")}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <ChartHistogramIcon className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalUsage}</p>
            <p className="text-xs text-muted-foreground">{t("mon-total-usage")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Clock01Icon className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{metrics.length}</p>
            <p className="text-xs text-muted-foreground">{t("mon-tracked-skills")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <AlertDiamondIcon className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-bold">{totalErrors}</p>
            <p className="text-xs text-muted-foreground">{t("mon-total-errors")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <AlertDiamondIcon className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{avgErrorRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{t("mon-avg-error-rate")}</p>
          </CardContent>
        </Card>
      </div>

      {systemMetric && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("mon-system")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("mon-total-skills")}</p>
                <p className="font-semibold">{systemMetric.totalSkills}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("mon-active-agents")}</p>
                <p className="font-semibold">{systemMetric.activeAgents}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("mon-memory")}</p>
                <p className="font-semibold">{(systemMetric.memoryUsage / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("mon-disk")}</p>
                <p className="font-semibold">{(systemMetric.diskUsage / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("mon-usage-chart")}</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">{t("mon-no-data")}</p>
            </div>
          ) : (
            <canvas ref={chartRef} className="w-full" style={{ width: "100%", height: 250 }} />
          )}
        </CardContent>
      </Card>

      {metrics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("mon-skill-details")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">{t("skills")}</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">{t("mon-usage-count")}</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">{t("mon-avg-time")}</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">{t("mon-error-rate")}</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">{t("mon-errors")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...metrics].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).map(m => (
                    <tr key={m.skillName} className="border-b border-border/50">
                      <td className="py-2 font-medium">{m.skillName}</td>
                      <td className="py-2 text-right">{m.usageCount}</td>
                      <td className="py-2 text-right">{((m.avgExecTime || 0) / 1e6).toFixed(1)} ms</td>
                      <td className="py-2 text-right">
                        <Badge variant={(m.errorRate || 0) > 10 ? "destructive" : "secondary"} className="text-xs">
                          {(m.errorRate || 0).toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-2 text-right">{m.errorCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mon-clear-confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("mon-clear-confirm-desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearMetrics} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default MonitoringPage
