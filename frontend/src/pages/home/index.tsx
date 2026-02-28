import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowRight02Icon,
  CodeIcon,
  AiChat02Icon,
  LinkSquare01Icon,
  Folder01Icon,
  RefreshIcon,
  ChartHistogramIcon,
  Globe02Icon,
  Settings02Icon,
  ArrowUp02Icon,
  AlertDiamondIcon,
  Tag01Icon,
  Add01Icon,
} from "hugeicons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { GetDashboardStats, CheckSkillUpdates, GetRecommendations, InstallRemoteSkill } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import { toast } from "@/components/ui/use-toast"

interface SkillStat {
  name: string
  agentCount: number
  source: string
  installedAt: string
}

interface AgentLinkStat {
  name: string
  count: number
}

interface DashboardData {
  totalSkills: number
  totalAgents: number
  totalLinks: number
  totalProjects: number
  orphanSkills: number
  mostLinkedSkills: SkillStat[]
  recentSkills: SkillStat[]
  topAgents: AgentLinkStat[]
  tagDistribution: Record<string, number>
}

const HomePage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatableCount, setUpdatableCount] = useState(0)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [recommendations, setRecommendations] = useState<Array<{ name: string; reason: string }>>([])
  const [installingRec, setInstallingRec] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(_prev => {
        return false
      })
    }, 10000)
    loadData()
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleFocus = () => loadData(false)
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const data = await GetDashboardStats()
      setStats(data)

      if (data && data.totalSkills > 0) {
        setCheckingUpdates(true)
        CheckSkillUpdates()
          .then((results) => {
            const count = (results || []).filter(r => r.hasUpdate).length
            setUpdatableCount(count)
          })
          .catch(() => {})
          .finally(() => setCheckingUpdates(false))

        // Load recommendations in background
        GetRecommendations()
          .then(recs => setRecommendations(recs || []))
          .catch(() => {})
      }
    } catch {}
    setLoading(false)
  }

  const handleInstallRecommended = async (fullName: string) => {
    try {
      setInstallingRec(fullName)
      const agents = await GetSupportedAgents()
      const agentNames = (agents || []).map((a) => a.name)
      await InstallRemoteSkill(fullName, agentNames)
      toast({ title: t("toast-skill-installed", { name: fullName.split("@")[1] || fullName, count: agentNames.length }), variant: "success" })
      setRecommendations(prev => prev.filter(r => r.name !== fullName))
      await loadData(false)
    } catch (error) {
      toast({ title: t("toast-install-failed", { error }), variant: "destructive" })
    } finally {
      setInstallingRec(null)
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  const colorMap: Record<string, { bg: string; text: string; bgLight: string; hoverText: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", bgLight: "bg-primary/5", hoverText: "group-hover:text-primary" },
    "blue-500": { bg: "bg-blue-500/10", text: "text-blue-500", bgLight: "bg-blue-500/5", hoverText: "group-hover:text-blue-500" },
    "amber-500": { bg: "bg-amber-500/10", text: "text-amber-500", bgLight: "bg-amber-500/5", hoverText: "group-hover:text-amber-500" },
    "violet-500": { bg: "bg-violet-500/10", text: "text-violet-500", bgLight: "bg-violet-500/5", hoverText: "group-hover:text-violet-500" },
  }

  const statsCards = [
    { label: t("installed-skills"), value: stats.totalSkills, icon: CodeIcon, color: "primary", hoverBorder: "hover:border-primary/30", route: "/skills" },
    { label: t("linked-agents"), value: stats.totalAgents, icon: AiChat02Icon, color: "blue-500", hoverBorder: "hover:border-blue-400/30", route: "/agents" },
    { label: t("home-total-links"), value: stats.totalLinks, icon: LinkSquare01Icon, color: "amber-500", hoverBorder: "hover:border-amber-400/30", route: undefined },
    { label: t("projects"), value: stats.totalProjects, icon: Folder01Icon, color: "violet-500", hoverBorder: "hover:border-violet-400/30", route: "/projects" },
  ]

  const quickActions = [
    { label: t("manage-local-skills"), desc: t("manage-local-skills-desc"), icon: ChartHistogramIcon, color: "primary", hoverBorder: "hover:border-primary/25", route: "/skills" },
    { label: t("search-remote-skills"), desc: t("search-remote-skills-desc"), icon: Globe02Icon, color: "blue-500", hoverBorder: "hover:border-blue-400/25", route: "/skills?action=install" },
    { label: t("agent-management"), desc: t("agent-management-desc"), icon: Settings02Icon, color: "amber-500", hoverBorder: "hover:border-amber-400/25", route: "/agents" },
  ]

  const tagEntries = Object.entries(stats.tagDistribution || {}).sort((a, b) => b[1] - a[1])

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="w-full max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Logo size={44} showBackground />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground/90">Agent Hub</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">{t("home-subtitle")}</p>
          </div>
        </div>

        {/* Stats Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {statsCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className={`relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 transition-all duration-200 hover:shadow-md ${card.hoverBorder} ${card.route ? "cursor-pointer group" : ""}`}
                onClick={() => card.route && navigate(card.route)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${colorMap[card.color]?.bg}`}>
                      <Icon size={18} className={colorMap[card.color]?.text} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
                        {card.label === t("installed-skills") && updatableCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-medium">
                            <ArrowUp02Icon size={10} />
                            {t("updates-available", { count: updatableCount })}
                          </span>
                        )}
                        {card.label === t("installed-skills") && checkingUpdates && (
                          <RefreshIcon size={12} className="animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5">{card.label}</p>
                    </div>
                  </div>
                  {card.route && (
                    <ArrowRight02Icon size={14} className={`text-muted-foreground/25 ${colorMap[card.color]?.hoverText} transition-colors`} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional stats row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Most Linked Skills */}
          {stats.mostLinkedSkills && stats.mostLinkedSkills.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="text-[12px] font-medium text-muted-foreground/70 mb-3">{t("most-linked-skills")}</h3>
              <div className="space-y-2">
                {stats.mostLinkedSkills.slice(0, 5).map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between text-[11.5px] cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/skills/detail?name=${encodeURIComponent(s.name)}`)}
                  >
                    <span className="truncate flex-1 min-w-0">{s.name}</span>
                    <Badge variant="secondary" className="text-[9px] ml-2 shrink-0">{s.agentCount}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Agents */}
          {stats.topAgents && stats.topAgents.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="text-[12px] font-medium text-muted-foreground/70 mb-3">{t("home-top-agents")}</h3>
              <div className="space-y-2">
                {stats.topAgents.slice(0, 5).map((a) => (
                  <div key={a.name} className="flex items-center justify-between text-[11.5px]">
                    <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                      <AiChat02Icon size={12} className="text-blue-500 shrink-0" />
                      <span className="truncate">{a.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] ml-2 shrink-0">{a.count} skills</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tag Distribution / Recent Skills / Orphan warning */}
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
            {tagEntries.length > 0 ? (
              <div>
                <h3 className="text-[12px] font-medium text-muted-foreground/70 mb-3">{t("home-skill-tags")}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {tagEntries.slice(0, 8).map(([tag, count]) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      <Tag01Icon size={10} className="mr-0.5" />{tag} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-[12px] font-medium text-muted-foreground/70 mb-3">{t("recent-skills")}</h3>
                <div className="space-y-2">
                  {(stats.recentSkills || []).slice(0, 4).map((s) => (
                    <div
                      key={s.name}
                      className="text-[11.5px] truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/skills/detail?name=${encodeURIComponent(s.name)}`)}
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.orphanSkills > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5">
                <AlertDiamondIcon size={14} className="text-amber-500 shrink-0" />
                <span className="text-[10.5px] text-amber-600 dark:text-amber-400">{t("orphan-skills-count", { count: stats.orphanSkills })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-[13px] font-medium text-muted-foreground/70 px-0.5">{t("quick-actions")}</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <div
                  key={action.label}
                  className={`rounded-xl border border-border/60 bg-card p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${action.hoverBorder} group`}
                  onClick={() => navigate(action.route)}
                >
                  <div className={`p-2 rounded-lg ${colorMap[action.color]?.bgLight} w-fit mb-3`}>
                    <Icon size={16} className={colorMap[action.color]?.text} />
                  </div>
                  <p className="text-[12.5px] font-medium text-foreground/85">{action.label}</p>
                  <p className="text-[10.5px] text-muted-foreground/55 mt-1 line-clamp-2 leading-relaxed">{action.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[13px] font-medium text-muted-foreground/70 px-0.5">{t("recommendations")}</h3>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-[11px] text-muted-foreground mb-3">{t("recommendations-desc")}</p>
              <div className="space-y-2">
                {recommendations.map((rec) => (
                  <div key={rec.name} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate">{rec.name}</p>
                      <p className="text-[10px] text-muted-foreground">{rec.reason}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-[11px] shrink-0 ml-2" onClick={() => handleInstallRecommended(rec.name)} disabled={installingRec === rec.name}>
                      {installingRec === rec.name ? (
                        <RefreshIcon size={12} className="mr-1 animate-spin" />
                      ) : (
                        <Add01Icon size={12} className="mr-1" />
                      )}
                      {t("install")}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default HomePage
