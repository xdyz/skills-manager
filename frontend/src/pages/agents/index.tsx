import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { toast } from "@/components/ui/use-toast"
import {
  Search01Icon,
  AiChat02Icon,
  Add01Icon,
  Delete02Icon,
  Folder02Icon,
  RefreshIcon,
  MultiplicationSignIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CodeIcon,
} from "hugeicons-react"
import { GetSupportedAgents, AddCustomAgent, RemoveCustomAgent } from "@wailsjs/go/services/AgentService"
import { GetAllAgentSkills } from "@wailsjs/go/services/SkillsService"
import type { AgentInfo, SkillData } from "@/types"

const AgentsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])
  const [agentListSearch, setAgentListSearch] = useState("")
  const [showAddAgentDialog, setShowAddAgentDialog] = useState(false)
  const [newAgentName, setNewAgentName] = useState("")
  const [addingAgent, setAddingAgent] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null)

  // Agent details expansion
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [allSkills, setAllSkills] = useState<SkillData[]>([])

  // Build agent -> skills mapping
  const agentSkillsMap = useMemo(() => {
    const map: Record<string, SkillData[]> = {}
    for (const skill of allSkills) {
      if (skill.agents) {
        for (const agent of skill.agents) {
          if (!map[agent]) map[agent] = []
          map[agent].push(skill)
        }
      }
    }
    return map
  }, [allSkills])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 10000)
    Promise.all([
      loadAgents(),
      GetAllAgentSkills().then(s => setAllSkills(s || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
    return () => clearTimeout(timer)
  }, [])

  // Refresh data on window focus
  useEffect(() => {
    const handleFocus = () => loadAgents()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const loadAgents = async () => {
    try {
      const result = await GetSupportedAgents()
      setAllAgents(result || [])
    } catch (error) {
      console.error("Failed to load agents:", error)
    }
  }

  const handleAddAgent = async () => {
    if (!newAgentName.trim()) return
    try {
      setAddingAgent(true)
      await AddCustomAgent(newAgentName.trim())
      toast({ title: t("toast-agent-added", { name: newAgentName.trim() }), variant: "success" })
      setShowAddAgentDialog(false)
      await loadAgents()
    } catch (error) {
      console.error("Failed to add Agent:", error)
      toast({ title: t("toast-add-agent-failed", { error }), variant: "destructive" })
    } finally {
      setAddingAgent(false)
    }
  }

  const handleRemoveAgent = async () => {
    if (!agentToDelete) return
    try {
      await RemoveCustomAgent(agentToDelete)
      toast({ title: t("toast-agent-deleted", { name: agentToDelete }), variant: "success" })
      setAgentToDelete(null)
      await loadAgents()
    } catch (error) {
      console.error("Failed to delete Agent:", error)
      toast({ title: t("toast-delete-agent-failed", { error }), variant: "destructive" })
    }
  }

  const filteredAgents = allAgents.filter(a =>
    a.name.toLowerCase().includes(agentListSearch.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full">
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground/90">{t("agent-management")}</h1>
          <p className="text-[13px] text-muted-foreground">{t("agent-management-desc")}</p>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="relative flex-1">
            <Search01Icon size={18} className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
            <Input placeholder={t("search-agent")} className="pl-10 pr-8" value={agentListSearch} onChange={(e) => setAgentListSearch(e.target.value)} />
            {agentListSearch && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setAgentListSearch("")}
              >
                <MultiplicationSignIcon size={14} />
              </button>
            )}
          </div>
          <Button size="sm" onClick={() => { setNewAgentName(""); setShowAddAgentDialog(true) }}>
            <Add01Icon size={14} className="mr-1.5" />
            {t("add-agent")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-4">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <RefreshIcon className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[360px] text-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
              <Search01Icon size={28} className="text-muted-foreground/50" />
            </div>
            <p className="text-[15px] font-medium text-foreground/70 mb-1.5">
              {agentListSearch ? t("no-matching-agent") : t("no-agents")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => {
              const agentSkills = agentSkillsMap[agent.name] || []
              const isExpanded = expandedAgent === agent.name
              return (
                <div key={agent.name} className="rounded-md border border-border/50 transition-all duration-150 overflow-hidden">
                  <div
                    className="p-3 hover:bg-accent/40 cursor-pointer transition-colors"
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.name)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded shrink-0 ${agent.isCustom ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                        <AiChat02Icon size={15} className={agent.isCustom ? 'text-amber-500' : 'text-primary'} />
                      </div>
                      <p className="text-sm font-medium truncate flex-1 min-w-0">{agent.name}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          {agentSkills.length} skills
                        </Badge>
                        {agent.isCustom ? (
                          <>
                            <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">{t("custom")}</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); setAgentToDelete(agent.name) }}>
                              <Delete02Icon size={14} />
                            </Button>
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-xs">{t("builtin")}</Badge>
                        )}
                        {isExpanded ? <ArrowUp01Icon size={14} className="text-muted-foreground" /> : <ArrowDown01Icon size={14} className="text-muted-foreground" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono truncate mt-1.5 pl-[38px]">{agent.localPath}</p>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border/50 bg-muted/20 px-3 py-2.5 space-y-2">
                      {/* Skills paths */}
                      {(() => {
                        const paths = [...new Set([...(agent.globalPaths || []).map(p => `~/${p}`), agent.localPath])]
                        return paths.length > 1 ? (
                          <div className="space-y-1">
                            <p className="text-[11px] text-muted-foreground/70 font-medium">{t("skills-paths")}</p>
                            <div className="flex flex-wrap gap-1">
                              {paths.map((p, i) => (
                                <span key={i} className="text-[11px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">{p}</span>
                              ))}
                            </div>
                          </div>
                        ) : null
                      })()}
                      {/* Linked skills */}
                      {agentSkills.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 py-2 text-center">{t("no-skills")}</p>
                      ) : (
                        agentSkills.map(skill => (
                          <div
                            key={skill.name}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer transition-colors"
                            onClick={() => navigate(`/skills/detail?name=${encodeURIComponent(skill.name)}`)}
                          >
                            <CodeIcon size={12} className="text-primary/70 shrink-0" />
                            <span className="text-[12px] truncate flex-1">{skill.name}</span>
                            {skill.language && <Badge variant="outline" className="text-[9px] h-4">{skill.language}</Badge>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add custom agent dialog */}
      <Dialog open={showAddAgentDialog} onOpenChange={setShowAddAgentDialog}>
        <DialogContent className="max-w-[340px] p-5">
          <DialogHeader className="space-y-1 pb-1">
            <DialogTitle className="text-base">{t("add-custom-agent")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="agent-name" className="text-xs text-muted-foreground">{t("agent-name-label")}</Label>
              <Input id="agent-name" placeholder="MyAgent" className="h-9 text-sm" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newAgentName.trim()) handleAddAgent() }} />
            </div>
            {newAgentName.trim() && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <Folder02Icon size={13} className="shrink-0" />
                <span className="truncate">~/.{newAgentName.trim().toLowerCase().replace(/\s+/g, '-')}/skills</span>
              </div>
            )}
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setShowAddAgentDialog(false)}>{t("cancel")}</Button>
            <Button size="sm" className="h-8" onClick={handleAddAgent} disabled={addingAgent || !newAgentName.trim()}>
              {addingAgent ? <RefreshIcon size={13} className="animate-spin" /> : t("add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete agent dialog */}
      <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm-delete-agent")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm-delete-agent-desc", { name: agentToDelete || "" })}
              <br /><br />
              {t("delete-agent-note")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAgent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("confirm-delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AgentsPage
