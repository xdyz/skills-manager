import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Search01Icon,
  Home01Icon,
  ChartHistogramIcon,
  AiChat02Icon,
  Folder01Icon,
  Add01Icon,
  CodeIcon,
  Stethoscope02Icon,
  ArrowUp02Icon,
  Globe02Icon,
  Settings02Icon,
  Store01Icon,
  GitBranchIcon,
  KeyboardIcon,
} from "hugeicons-react"
import { GetAllAgentSkills } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import type { SkillData, AgentInfo } from "@/types"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction?: (action: string) => void
}

const CommandPalette = ({ open, onOpenChange, onAction }: CommandPaletteProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [skills, setSkills] = useState<SkillData[]>([])
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      Promise.all([GetAllAgentSkills(), GetSupportedAgents()]).then(([s, a]) => {
        setSkills(s || [])
        setAgents(a || [])
      }).catch(() => {})
    }
  }, [open])

  const actions = useMemo(() => [
    { id: "go-home", label: t("command-go-home"), icon: Home01Icon, group: t("command-actions"), action: () => navigate("/home") },
    { id: "go-skills", label: t("command-go-skills"), icon: ChartHistogramIcon, group: t("command-actions"), action: () => navigate("/skills") },
    { id: "go-agents", label: t("command-go-agents"), icon: AiChat02Icon, group: t("command-actions"), action: () => navigate("/agents") },
    { id: "go-projects", label: t("command-go-projects"), icon: Folder01Icon, group: t("command-actions"), action: () => navigate("/projects") },
    { id: "go-collections", label: t("collections"), icon: Folder01Icon, group: t("command-actions"), action: () => navigate("/collections") },
    { id: "go-discover", label: t("discover-title"), icon: Store01Icon, group: t("command-actions"), action: () => navigate("/discover") },
    { id: "go-analysis", label: t("analysis-title"), icon: GitBranchIcon, group: t("command-actions"), action: () => navigate("/analysis") },
    { id: "go-settings", label: t("shortcut-go-settings"), icon: Settings02Icon, group: t("command-actions"), action: () => navigate("/settings") },
    { id: "install-skill", label: t("command-install-skill"), icon: Add01Icon, group: t("command-actions"), action: () => { navigate("/skills?action=install"); } },
    { id: "create-skill", label: t("command-create-skill"), icon: Add01Icon, group: t("command-actions"), action: () => onAction?.("create-skill") },
    { id: "health-check", label: t("command-health-check"), icon: Stethoscope02Icon, group: t("command-actions"), action: () => onAction?.("health-check") },
    { id: "check-updates", label: t("command-check-updates"), icon: ArrowUp02Icon, group: t("command-actions"), action: () => onAction?.("check-updates") },
    { id: "custom-sources", label: t("custom-sources"), icon: Globe02Icon, group: t("command-actions"), action: () => onAction?.("custom-sources") },
    { id: "keyboard-shortcuts", label: t("keyboard-shortcuts"), icon: KeyboardIcon, group: t("command-actions"), action: () => onAction?.("keyboard-shortcuts") },
  ], [t, navigate, onAction])

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim()
    const items: Array<{ id: string; label: string; sublabel?: string; icon: React.ElementType; group: string; action: () => void }> = []

    // Skills
    const filteredSkills = skills.filter(s => !q || s.name?.toLowerCase().includes(q) || s.desc?.toLowerCase().includes(q))
    for (const skill of filteredSkills.slice(0, 5)) {
      items.push({
        id: `skill-${skill.name}`,
        label: skill.name,
        sublabel: skill.desc,
        icon: CodeIcon,
        group: t("command-skills"),
        action: () => navigate(`/skills/detail?name=${encodeURIComponent(skill.name)}`),
      })
    }

    // Agents
    const filteredAgents = agents.filter(a => !q || a.name?.toLowerCase().includes(q))
    for (const agent of filteredAgents.slice(0, 3)) {
      items.push({
        id: `agent-${agent.name}`,
        label: agent.name,
        icon: AiChat02Icon,
        group: t("command-agents"),
        action: () => navigate("/agents"),
      })
    }

    // Actions
    const filteredActions = actions.filter(a => !q || a.label.toLowerCase().includes(q))
    items.push(...filteredActions)

    return items
  }, [query, skills, agents, actions, t, navigate])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault()
      filteredItems[selectedIndex].action()
      onOpenChange(false)
    }
  }

  const handleSelect = (item: typeof filteredItems[0]) => {
    item.action()
    onOpenChange(false)
  }

  // Group items
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {}
    for (const item of filteredItems) {
      if (!groups[item.group]) groups[item.group] = []
      groups[item.group].push(item)
    }
    return groups
  }, [filteredItems])

  let globalIdx = -1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden" onKeyDown={handleKeyDown}>
        <div className="flex items-center gap-2 px-3 border-b border-border/50">
          <Search01Icon size={16} className="text-muted-foreground shrink-0" />
          <Input
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 px-0 text-[13px]"
            placeholder={t("command-search-placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="shrink-0 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-1.5">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-muted-foreground">{t("command-no-results")}</div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{group}</div>
                {items.map((item) => {
                  globalIdx++
                  const idx = globalIdx
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-colors ${idx === selectedIndex ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:bg-accent/50"}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <Icon size={15} className="text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] truncate">{item.label}</p>
                        {item.sublabel && <p className="text-[10.5px] text-muted-foreground truncate">{item.sublabel}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CommandPalette
