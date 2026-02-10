import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="max-w-2xl mx-auto space-y-8 pt-8">
      {/* Welcome */}
      <div className="text-center space-y-3">
        <Logo size={48} className="mx-auto" />
        <h1 className="text-2xl font-semibold tracking-tight">Skills Manager</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          统一管理 Agent Skills，一键安装、链接到多个 AI Agent
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-dashed">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-semibold text-primary">{skillCount}</p>
            <p className="text-xs text-muted-foreground mt-1">已安装技能</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-3xl font-semibold text-primary">{agentCount}</p>
            <p className="text-xs text-muted-foreground mt-1">已链接 Agent</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-1">快捷操作</h2>
        <div className="space-y-1.5">
          <Card 
            className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/30 group"
            onClick={() => navigate("/skills")}
          >
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/8">
                    <ChartHistogramIcon size={18} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">管理本地技能</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">查看、更新或删除已安装的技能</p>
                  </div>
                </div>
                <ArrowRight02Icon size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/30 group"
            onClick={() => navigate("/skills?tab=remote")}
          >
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/8">
                    <Globe02Icon size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">搜索远程技能</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">从 skills.sh 搜索并安装新技能</p>
                  </div>
                </div>
                <ArrowRight02Icon size={16} className="text-muted-foreground/40 group-hover:text-blue-500 transition-colors" />
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/30 group"
            onClick={() => navigate("/skills?tab=agents")}
          >
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/8">
                    <LinkSquare01Icon size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">配置 Agent 链接</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">管理技能与 Agent 之间的软链接</p>
                  </div>
                </div>
                <ArrowRight02Icon size={16} className="text-muted-foreground/40 group-hover:text-amber-500 transition-colors" />
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default HomePage
