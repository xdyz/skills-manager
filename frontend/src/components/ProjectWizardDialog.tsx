import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RefreshIcon, CodeIcon, AiChat02Icon, Folder01Icon } from "hugeicons-react"
import { DetectProjectType, InstallRemoteSkill } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import { toast } from "@/components/ui/use-toast"

interface ProjectWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectPath: string
  onComplete?: () => void
}

interface ProjectInfo {
  projectPath: string
  detectedTypes: string[]
  suggestedSkills: string[]
  existingAgents: string[]
}

const ProjectWizardDialog = ({ open, onOpenChange, projectPath, onComplete }: ProjectWizardDialogProps) => {
  const { t } = useTranslation()
  const [detecting, setDetecting] = useState(false)
  const [info, setInfo] = useState<ProjectInfo | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (open && projectPath) {
      detect()
    } else {
      setInfo(null)
    }
  }, [open, projectPath])

  const detect = async () => {
    setDetecting(true)
    try {
      const result = await DetectProjectType(projectPath)
      setInfo(result)
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    } finally {
      setDetecting(false)
    }
  }

  const handleSetup = async () => {
    if (!info || !info.suggestedSkills?.length) return
    setInstalling(true)
    try {
      const agents = await GetSupportedAgents()
      const agentNames = (agents || []).map((a: any) => a.name)
      let installed = 0
      for (const skill of info.suggestedSkills) {
        try {
          await InstallRemoteSkill(skill, agentNames)
          installed++
        } catch {}
      }
      toast({ title: t("toast-skill-installed", { name: `${installed} skills`, count: agentNames.length }), variant: "success" })
      onOpenChange(false)
      onComplete?.()
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("project-wizard")}</DialogTitle>
          <DialogDescription>{t("project-wizard-desc")}</DialogDescription>
        </DialogHeader>

        {detecting ? (
          <div className="flex items-center justify-center py-12">
            <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">{t("detecting")}</span>
          </div>
        ) : info ? (
          <div className="space-y-4">
            {/* Detected types */}
            {info.detectedTypes && info.detectedTypes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CodeIcon size={14} />
                  <span className="text-[11px] font-medium uppercase tracking-wide">{t("detected-types")}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {info.detectedTypes.map(type => (
                    <Badge key={type} variant="secondary" className="text-[11px]">{type}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested skills */}
            {info.suggestedSkills && info.suggestedSkills.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Folder01Icon size={14} />
                  <span className="text-[11px] font-medium uppercase tracking-wide">{t("suggested-skills")}</span>
                </div>
                <div className="space-y-1.5">
                  {info.suggestedSkills.map(skill => (
                    <div key={skill} className="rounded border border-border/50 px-3 py-2 text-[12px] font-mono">{skill}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing agents */}
            {info.existingAgents && info.existingAgents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AiChat02Icon size={14} />
                  <span className="text-[11px] font-medium uppercase tracking-wide">{t("existing-agents")}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {info.existingAgents.map(agent => (
                    <Badge key={agent} variant="outline" className="text-[11px]">{agent}</Badge>
                  ))}
                </div>
              </div>
            )}

            {info.suggestedSkills && info.suggestedSkills.length > 0 && (
              <Button className="w-full" onClick={handleSetup} disabled={installing}>
                {installing ? (
                  <><RefreshIcon size={14} className="mr-1.5 animate-spin" />{t("installing")}</>
                ) : (
                  t("start-wizard")
                )}
              </Button>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default ProjectWizardDialog
