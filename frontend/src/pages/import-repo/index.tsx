import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search01Icon,
  RefreshIcon,
  Download04Icon,
  CodeIcon,
  GitBranchIcon,
} from "hugeicons-react"
import { ScanGitHubRepo, BatchInstallFromRepo } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import type { AgentInfo } from "@/types"

interface RepoSkill {
  name: string
  fullName: string
  desc: string
}

const ImportRepoPage = () => {
  const { t } = useTranslation()
  const [repoURL, setRepoURL] = useState("")
  const [scanning, setScanning] = useState(false)
  const [skills, setSkills] = useState<RepoSkill[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showAgentDialog, setShowAgentDialog] = useState(false)
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
  const [installing, setInstalling] = useState(false)
  const [scanned, setScanned] = useState(false)

  const handleScan = async () => {
    if (!repoURL.trim()) return
    try {
      setScanning(true)
      setScanned(false)
      setSkills([])
      setSelected(new Set())
      const result = await ScanGitHubRepo(repoURL.trim())
      setSkills(result || [])
      setScanned(true)
      if ((result || []).length > 0) {
        setSelected(new Set((result || []).map(s => s.fullName)))
      }
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    } finally {
      setScanning(false)
    }
  }

  const handleSelectAll = () => {
    if (selected.size === skills.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(skills.map(s => s.fullName)))
    }
  }

  const toggleSelect = (fullName: string) => {
    const next = new Set(selected)
    if (next.has(fullName)) next.delete(fullName)
    else next.add(fullName)
    setSelected(next)
  }

  const handleInstallClick = async () => {
    if (selected.size === 0) return
    try {
      const agentList = await GetSupportedAgents()
      setAgents(agentList || [])
      setSelectedAgents(new Set((agentList || []).map(a => a.name)))
      setShowAgentDialog(true)
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    }
  }

  const handleInstall = async () => {
    try {
      setInstalling(true)
      const fullNames = Array.from(selected)
      const agentNames = Array.from(selectedAgents)
      const count = await BatchInstallFromRepo(fullNames, agentNames)
      toast({ title: t("repo-install-success", { count }), variant: "success" })
      setShowAgentDialog(false)
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    } finally {
      setInstalling(false)
    }
  }

  const toggleAgent = (name: string) => {
    const next = new Set(selectedAgents)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setSelectedAgents(next)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 space-y-5">
        {/* URL Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <GitBranchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 h-9 text-[13px]"
              placeholder={t("repo-url-placeholder")}
              value={repoURL}
              onChange={(e) => setRepoURL(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
            />
          </div>
          <Button
            size="sm"
            className="h-9 text-[12px] px-4"
            onClick={handleScan}
            disabled={!repoURL.trim() || scanning}
          >
            {scanning ? <RefreshIcon size={14} className="mr-1 animate-spin" /> : <Search01Icon size={14} className="mr-1" />}
            {scanning ? t("repo-scanning") : t("repo-scan")}
          </Button>
        </div>

        {/* Results */}
        {skills.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">
                {t("repo-found", { count: skills.length })}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={handleSelectAll}>
                  {selected.size === skills.length ? t("deselect-all") : t("select-all")}
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={handleInstallClick}
                  disabled={selected.size === 0}
                >
                  <Download04Icon size={13} className="mr-1" />
                  {t("repo-install-selected", { count: selected.size })}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              {skills.map((skill) => (
                <div
                  key={skill.fullName}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selected.has(skill.fullName)
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/50 hover:border-border"
                  }`}
                  onClick={() => toggleSelect(skill.fullName)}
                >
                  <Checkbox
                    checked={selected.has(skill.fullName)}
                    onCheckedChange={() => toggleSelect(skill.fullName)}
                  />
                  <CodeIcon size={16} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{skill.name}</p>
                    {skill.desc && <p className="text-[11px] text-muted-foreground truncate">{skill.desc}</p>}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{skill.fullName.split("@")[0]}</Badge>
                </div>
              ))}
            </div>
          </>
        )}

        {scanned && skills.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p className="text-sm">{t("repo-no-skills")}</p>
          </div>
        )}

        {!scanned && !scanning && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <GitBranchIcon size={32} className="mb-3 opacity-30" />
            <p className="text-sm">{t("repo-hint")}</p>
            <p className="text-xs mt-1 opacity-60">{t("repo-hint-example")}</p>
          </div>
        )}
      </div>

      {/* Agent Select Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("select-target-agent")}</DialogTitle>
            <DialogDescription>{t("select-agent-desc")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {agents.map(agent => (
              <div
                key={agent.name}
                className="flex items-center gap-2.5 p-2 rounded hover:bg-accent/50 cursor-pointer"
                onClick={() => toggleAgent(agent.name)}
              >
                <Checkbox checked={selectedAgents.has(agent.name)} onCheckedChange={() => toggleAgent(agent.name)} />
                <span className="text-[13px]">{agent.name}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAgentDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleInstall} disabled={selectedAgents.size === 0 || installing}>
              {installing ? <RefreshIcon size={14} className="mr-1 animate-spin" /> : <Download04Icon size={14} className="mr-1" />}
              {installing ? t("installing") : t("install-to-agents", { count: selectedAgents.size })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ImportRepoPage
