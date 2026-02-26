import { useState, useEffect, useMemo } from "react"
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
} from "hugeicons-react"
import Logo from "@/components/Logo"
import { GetAllAgentSkills } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import { GetFolders } from "@wailsjs/go/services/FolderService"
import type { AgentInfo, SkillData } from "@/types"

const HomePage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [skills, setSkills] = useState<SkillData[]>([])
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [projectCount, setProjectCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  // Refresh data on window focus
  useEffect(() => {
    const handleFocus = () => loadData(false)
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const [skillList, agentList, folders] = await Promise.all([
        GetAllAgentSkills(),
        GetSupportedAgents(),
        GetFolders(),
      ])
      setSkills(skillList || [])
      setAgents(agentList || [])
      setProjectCount(folders?.length || 0)
    } catch {}
    setLoading(false)
  }

  const totalLinks = useMemo(() => {
    let count = 0
    skills.forEach((s) => { count += s.agents?.length || 0 })
    return count
  }, [skills])

  if (loading) {
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
    { label: t("installed-skills"), value: skills.length, icon: CodeIcon, color: "primary", hoverBorder: "hover:border-primary/30", route: "/skills" },
    { label: t("linked-agents"), value: agents.length, icon: AiChat02Icon, color: "blue-500", hoverBorder: "hover:border-blue-400/30", route: "/agents" },
    { label: t("home-total-links"), value: totalLinks, icon: LinkSquare01Icon, color: "amber-500", hoverBorder: "hover:border-amber-400/30", route: undefined },
    { label: t("projects"), value: projectCount, icon: Folder01Icon, color: "violet-500", hoverBorder: "hover:border-violet-400/30", route: "/projects" },
  ]

  const quickActions = [
    { label: t("manage-local-skills"), desc: t("manage-local-skills-desc"), icon: ChartHistogramIcon, color: "primary", hoverBorder: "hover:border-primary/25", route: "/skills" },
    { label: t("search-remote-skills"), desc: t("search-remote-skills-desc"), icon: Globe02Icon, color: "blue-500", hoverBorder: "hover:border-blue-400/25", route: "/skills?action=install" },
    { label: t("agent-management"), desc: t("agent-management-desc"), icon: Settings02Icon, color: "amber-500", hoverBorder: "hover:border-amber-400/25", route: "/agents" },
  ]

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Logo size={44} showBackground />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground/90">Skills Manager</h1>
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
                      <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
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

      </div>
    </div>
  )
}

export default HomePage
