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
import { Search01Icon, Download01Icon } from "hugeicons-react"
import type { AgentInfo } from "@/types"

interface AgentSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agents: AgentInfo[]
  onConfirm: (selectedAgents: string[]) => void
  title?: string
  description?: string
  confirmLabel?: string
  showPath?: boolean
}

const AgentSelectDialog = ({
  open,
  onOpenChange,
  agents,
  onConfirm,
  title,
  description,
  confirmLabel,
  showPath = true,
}: AgentSelectDialogProps) => {
  const { t } = useTranslation()
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (open) {
      setSelectedAgents([])
      setSearchQuery("")
    }
  }, [open])

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleConfirm = () => {
    onConfirm(selectedAgents)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title || t("select-target-agent")}</DialogTitle>
          <DialogDescription>{description || t("select-agent-desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search01Icon size={14} className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
              <Input placeholder={t("search-agent")} className="pl-8 h-8 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={toggleAll}>
              {selectedAgents.length === filteredAgents.length ? t("deselect-all") : t("select-all")}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {t("selected-agents-count", { count: selectedAgents.length })}
          </div>

          <div className="flex-1 overflow-y-auto border rounded-md">
            {filteredAgents.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                {searchQuery ? t("no-matching-agent") : t("no-agents")}
              </div>
            ) : (
            <div className="divide-y">
              {filteredAgents.map((agent) => (
                <label key={agent.name} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors">
                  <Checkbox checked={selectedAgents.includes(agent.name)} onCheckedChange={() => toggleAgent(agent.name)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{agent.name}</p>
                    {showPath && <p className="text-xs text-muted-foreground truncate">{agent.localPath}</p>}
                  </div>
                </label>
              ))}
            </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={handleConfirm} disabled={selectedAgents.length === 0}>
            <Download01Icon size={14} className="mr-1.5" />
            {confirmLabel || t("install-to-agents", { count: selectedAgents.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AgentSelectDialog
