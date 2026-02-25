import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowRight02Icon,
  CodeIcon,
  UserMultipleIcon,
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

interface AgentInfo {
  name: string
  localPath: string
  isCustom: boolean
}

interface SkillData {
  name: string
  desc: string
  path: string
  language: string
  framework: string
  agents: string[]
  source: string
}

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

  const loadData = async () => {
    setLoading(true)
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

  const statsCards = [
    { label: t("installed-skills"), value: skills.length, icon: CodeIcon, color: "primary", hoverBorder: "hover:border-primary/30", route: "/skills" },
    { label: t("linked-agents"), value: agents.length, icon: UserMultipleIcon, color: "blue-500", hoverBorder: "hover:border-blue-400/30", route: "/agents" },
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
                    <div className={`p-2.5 rounded-lg bg-${card.color}/10`}>
                      <Icon size={18} className={`text-${card.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5">{card.label}</p>
                    </div>
                  </div>
                  {card.route && (
                    <ArrowRight02Icon size={14} className={`text-muted-foreground/25 group-hover:text-${card.color} transition-colors`} />
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
                  <div className={`p-2 rounded-lg bg-${action.color}/8 w-fit mb-3`}>
                    <Icon size={16} className={`text-${action.color}`} />
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
