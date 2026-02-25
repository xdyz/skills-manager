import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { 
  ChartHistogramIcon,
  LinkSquare01Icon,
  Globe02Icon,
  ArrowRight02Icon,
} from "hugeicons-react"
import Logo from "@/components/Logo"
import { GetAllAgentSkills } from "@wailsjs/go/services/SkillsService"

const HomePage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [skillCount, setSkillCount] = useState(0)
  const [agentCount, setAgentCount] = useState(0)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const skills = await GetAllAgentSkills()
      if (skills) {
        setSkillCount(skills.length)
        const agents = new Set<string>()
        skills.forEach((s: any) => s.agents?.forEach((a: string) => agents.add(a)))
        setAgentCount(agents.size)
      }
    } catch {}
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-12 p-6 overflow-y-auto h-full">
      {/* Welcome */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 rounded-md bg-primary/8">
          <Logo size={40} className="mx-auto" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground/90">Skills Manager</h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {t("home-subtitle")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-primary/6 border border-primary/10 p-4 text-center">
          <p className="text-2xl font-semibold text-primary">{skillCount}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{t("installed-skills")}</p>
        </div>
        <div className="rounded-md bg-primary/6 border border-primary/10 p-4 text-center">
          <p className="text-2xl font-semibold text-primary">{agentCount}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{t("linked-agents")}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60 px-1">{t("quick-actions")}</h2>
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between p-3.5 rounded-md border border-border/60 bg-card cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-primary/25 group"
            onClick={() => navigate("/skills")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-primary/8">
                <ChartHistogramIcon size={17} className="text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground/90 whitespace-nowrap">{t("manage-local-skills")}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">{t("manage-local-skills-desc")}</p>
              </div>
            </div>
            <ArrowRight02Icon size={15} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </div>

          <div 
            className="flex items-center justify-between p-3.5 rounded-md border border-border/60 bg-card cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-blue-400/25 group"
            onClick={() => navigate("/skills?action=install")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-blue-500/8">
                <Globe02Icon size={17} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground/90 whitespace-nowrap">{t("search-remote-skills")}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">{t("search-remote-skills-desc")}</p>
              </div>
            </div>
            <ArrowRight02Icon size={15} className="text-muted-foreground/30 group-hover:text-blue-500 transition-colors" />
          </div>

          <div 
            className="flex items-center justify-between p-3.5 rounded-md border border-border/60 bg-card cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-amber-400/25 group"
            onClick={() => navigate("/skills?tab=agents")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-amber-500/8">
                <LinkSquare01Icon size={17} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground/90 whitespace-nowrap">{t("config-agent-links")}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">{t("config-agent-links-desc")}</p>
              </div>
            </div>
            <ArrowRight02Icon size={15} className="text-muted-foreground/30 group-hover:text-amber-500 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
