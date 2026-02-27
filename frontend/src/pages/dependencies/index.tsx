import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import {
  RefreshIcon,
  AlertDiamondIcon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  Settings02Icon,
} from "hugeicons-react"
import { GetDependencyGraph, AnalyzeDependencies } from "@wailsjs/go/services/DependencyService"
import { services } from "@wailsjs/go/models"

const DependenciesPage = () => {
  const { t } = useTranslation()
  const [graph, setGraph] = useState<services.DependencyGraph | null>(null)
  const [analysis, setAnalysis] = useState<services.DependencyAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [g, a] = await Promise.all([GetDependencyGraph(), AnalyzeDependencies()])
      setGraph(g)
      setAnalysis(a)
    } catch (error) {
      console.error("Failed to load dependency data:", error)
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!graph || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const nodes = graph.nodes || []
    const edges = graph.edges || []
    if (nodes.length === 0) return

    const nodePositions: Record<string, { x: number; y: number }> = {}
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(rect.width, rect.height) / 2.5

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
      nodePositions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      }
    })

    const isDark = document.documentElement.classList.contains("dark")

    edges.forEach(edge => {
      const from = nodePositions[edge.source]
      const to = nodePositions[edge.target]
      if (!from || !to) return
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.strokeStyle = edge.type === "conflict"
        ? "#ef4444"
        : isDark ? "rgba(148,163,184,0.3)" : "rgba(100,116,139,0.3)"
      ctx.lineWidth = edge.type === "conflict" ? 2 : 1
      ctx.stroke()

      const dx = to.x - from.x
      const dy = to.y - from.y
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len > 0) {
        const arrowLen = 8
        const arrowX = to.x - (dx / len) * 20
        const arrowY = to.y - (dy / len) * 20
        const nx = -dy / len
        const ny = dx / len
        ctx.beginPath()
        ctx.moveTo(arrowX + (dx / len) * arrowLen, arrowY + (dy / len) * arrowLen)
        ctx.lineTo(arrowX + nx * arrowLen * 0.5, arrowY + ny * arrowLen * 0.5)
        ctx.lineTo(arrowX - nx * arrowLen * 0.5, arrowY - ny * arrowLen * 0.5)
        ctx.closePath()
        ctx.fillStyle = edge.type === "conflict" ? "#ef4444" : isDark ? "rgba(148,163,184,0.5)" : "rgba(100,116,139,0.5)"
        ctx.fill()
      }
    })

    nodes.forEach(node => {
      const pos = nodePositions[node.id]
      if (!pos) return
      const r = 16
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, r, 0, 2 * Math.PI)
      ctx.fillStyle = node.installed
        ? (isDark ? "#22c55e" : "#16a34a")
        : (isDark ? "#f97316" : "#ea580c")
      ctx.fill()
      ctx.strokeStyle = isDark ? "#1e293b" : "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.font = "11px system-ui, sans-serif"
      ctx.textAlign = "center"
      ctx.fillStyle = isDark ? "#e2e8f0" : "#334155"
      const label = node.name.length > 16 ? node.name.slice(0, 14) + "…" : node.name
      ctx.fillText(label, pos.x, pos.y + r + 14)
    })
  }, [graph])

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

  const healthColor = (analysis?.healthScore || 0) >= 80
    ? "text-green-600" : (analysis?.healthScore || 0) >= 50
    ? "text-yellow-600" : "text-red-600"

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-end">
        <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
          <RefreshIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />{t("home-refresh")}
        </Button>
      </div>

      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{analysis.totalSkills}</p>
              <p className="text-xs text-muted-foreground">{t("dep-total-skills")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{analysis.totalDeps}</p>
              <p className="text-xs text-muted-foreground">{t("dep-total-deps")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={`text-2xl font-bold ${healthColor}`}>{analysis.healthScore}</p>
              <p className="text-xs text-muted-foreground">{t("dep-health-score")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{analysis.maxDepthLevel}</p>
              <p className="text-xs text-muted-foreground">{t("dep-max-depth")}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("dep-graph")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full" style={{ height: 400 }}>
            {(!graph || (graph.nodes || []).length === 0) ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">{t("dep-no-deps")}</p>
              </div>
            ) : (
              <canvas ref={canvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-600" />{t("installed")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-600" />{t("dep-missing")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-0.5 bg-red-500" />{t("dep-conflict")}
            </span>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(analysis.circularDeps || []).length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertDiamondIcon className="h-4 w-4" />{t("dep-circular")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.circularDeps.map((cycle, i) => (
                    <div key={i} className="flex items-center gap-1 text-sm">
                      {cycle.map((name, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <Badge variant="destructive" className="text-xs">{name}</Badge>
                          {j < cycle.length - 1 && <ArrowRight01Icon className="h-3 w-3 text-muted-foreground" />}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(analysis.conflicts || []).length > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                  <AlertDiamondIcon className="h-4 w-4" />{t("dep-conflicts")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.conflicts.map((c, i) => (
                    <div key={i} className="text-sm p-2 bg-muted/50 rounded">
                      <div className="font-medium">{c.skillA} ↔ {c.skillB}</div>
                      <p className="text-muted-foreground text-xs mt-1">{c.description}</p>
                      {(c.solutions || []).length > 0 && (
                        <div className="mt-1">
                          {c.solutions.map((s, j) => (
                            <Badge key={j} variant="outline" className="text-xs mr-1">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(analysis.missingDeps || []).length > 0 && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-orange-600">
                  <Settings02Icon className="h-4 w-4" />{t("dep-missing-deps")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {analysis.missingDeps.map(dep => (
                    <Badge key={dep} variant="outline" className="text-xs">{dep}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(analysis.recommendations || []).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckmarkCircle02Icon className="h-4 w-4 text-green-600" />{t("dep-recommendations")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {analysis.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>{r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default DependenciesPage
