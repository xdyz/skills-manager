import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search01Icon, RefreshIcon, Settings02Icon } from "hugeicons-react"
import type { AgentInfo } from "@/types"

interface ConfigAgentLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skillName: string | null
  agents: AgentInfo[]
  loadLinks: (skillName: string) => Promise<string[]>
  saveLinks: (skillName: string, agents: string[]) => Promise<void>
  onSaved?: () => void
  title?: string
  description?: string
}

const ConfigAgentLinkDialog = ({
  open,
  onOpenChange,
  skillName,
  agents,
  loadLinks,
  saveLinks,
  onSaved,
  title,
  description,
}: ConfigAgentLinkDialogProps) => {
  const { t } = useTranslation()
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [agentSearch, setAgentSearch] = useState("")
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)

  useEffect(() => {
    if (open && skillName) {
      setSelectedAgents([])
      setAgentSearch("")
      setLoadingLinks(true)
      loadLinks(skillName)
        .then((links) => setSelectedAgents(links || []))
        .catch((error) => {
          console.error("Failed to load agent links:", error)
        })
        .finally(() => setLoadingLinks(false))
    }
  }, [open, skillName])

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(agentSearch.toLowerCase())
  )

  const toggleAgent = (agentName: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentName) ? prev.filter((a) => a !== agentName) : [...prev, agentName]
    )
  }

  const toggleAll = () => {
    if (selectedAgents.length === filteredAgents.length) {
      setSelectedAgents([])
    } else {
      setSelectedAgents(filteredAgents.map((a) => a.name))
    }
  }

  const handleSave = async () => {
    if (!skillName) return
    setSavingLinks(true)
    try {
      await saveLinks(skillName, selectedAgents)
      onOpenChange(false)
      onSaved?.()
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setSavingLinks(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title || t("config-agent-link-title")}</DialogTitle>
          <DialogDescription>
            {description || t("config-agent-link-desc", { name: skillName || "" })}
          </DialogDescription>
        </DialogHeader>
        {loadingLinks ? (
          <div className="flex items-center justify-center py-8">
            <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">{t("loading")}</span>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search01Icon size={14} className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
                <Input placeholder={t("search-agent")} className="pl-8 h-8 text-sm" value={agentSearch} onChange={(e) => setAgentSearch(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={toggleAll}>
                {selectedAgents.length === filteredAgents.length ? t("deselect-all") : t("select-all")}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">{t("linked-count", { count: selectedAgents.length })}</div>
            <div className="flex-1 overflow-y-auto border rounded-md">
              {filteredAgents.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  {agentSearch ? t("no-matching-agent") : t("no-agents")}
                </div>
              ) : (
              <div className="divide-y">
                {filteredAgents.map((agent) => (
                  <label key={agent.name} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors">
                    <Checkbox checked={selectedAgents.includes(agent.name)} onCheckedChange={() => toggleAgent(agent.name)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{agent.name}</p>
                    </div>
                  </label>
                ))}
              </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={handleSave} disabled={loadingLinks || savingLinks}>
            {savingLinks ? (
              <><RefreshIcon size={14} className="mr-1.5 animate-spin" />{t("saving")}</>
            ) : (
              <><Settings02Icon size={14} className="mr-1.5" />{t("save-config")}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfigAgentLinkDialog
