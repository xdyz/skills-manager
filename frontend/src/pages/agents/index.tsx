import { useState, useEffect } from "react"
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
  UserMultipleIcon,
  Add01Icon,
  Delete02Icon,
  Folder02Icon,
  RefreshIcon,
} from "hugeicons-react"
import { GetSupportedAgents, AddCustomAgent, RemoveCustomAgent } from "@wailsjs/go/services/AgentService"

interface AgentInfo {
  name: string
  localPath: string
  isCustom: boolean
}

const AgentsPage = () => {
  const { t } = useTranslation()
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])
  const [agentListSearch, setAgentListSearch] = useState("")
  const [showAddAgentDialog, setShowAddAgentDialog] = useState(false)
  const [newAgentName, setNewAgentName] = useState("")
  const [addingAgent, setAddingAgent] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadAgents()
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
            <Input placeholder={t("search-agent")} className="pl-10" value={agentListSearch} onChange={(e) => setAgentListSearch(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => { setNewAgentName(""); setShowAddAgentDialog(true) }}>
            <Add01Icon size={14} className="mr-1.5" />
            {t("add-agent")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-4">
        {filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[360px] text-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
              <Search01Icon size={28} className="text-muted-foreground/50" />
            </div>
            <p className="text-[15px] font-medium text-foreground/70 mb-1.5">
              {agentListSearch ? t("no-matching-agent") : t("no-agents")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <div key={agent.name} className="flex items-center gap-3 p-3 rounded-md border border-border/50 hover:bg-accent/40 transition-all duration-150">
                <div className={`p-2 rounded shrink-0 ${agent.isCustom ? 'bg-amber-500/8' : 'bg-primary/8'}`}>
                  <UserMultipleIcon size={15} className={agent.isCustom ? 'text-amber-500' : 'text-primary'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.localPath}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {agent.isCustom ? (
                    <>
                      <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">{t("custom")}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setAgentToDelete(agent.name)}>
                        <Delete02Icon size={14} />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-xs">{t("builtin")}</Badge>
                  )}
                </div>
              </div>
            ))}
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
              <Input id="agent-name" placeholder="MyAgent" className="h-9 text-sm" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} />
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
