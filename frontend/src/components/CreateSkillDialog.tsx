import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RefreshIcon, CodeIcon } from "hugeicons-react"
import { CreateSkill, GetSkillTemplates } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import { toast } from "@/components/ui/use-toast"

interface CreateSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

interface Template {
  name: string
  description: string
  language: string
  framework: string
}

const CreateSkillDialog = ({ open, onOpenChange, onCreated }: CreateSkillDialogProps) => {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("blank")
  const [templates, setTemplates] = useState<Template[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
      setSelectedTemplate("blank")
      GetSkillTemplates().then(setTemplates).catch(() => {})
    }
  }, [open])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const agents = await GetSupportedAgents()
      const agentNames = (agents || []).map((a: any) => a.name)
      await CreateSkill(name.trim(), description.trim(), selectedTemplate, agentNames)
      toast({ title: t("toast-skill-created", { name: name.trim() }), variant: "success" })
      onOpenChange(false)
      onCreated?.()
    } catch (error) {
      toast({ title: t("toast-create-failed", { error }), variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const templateLabels: Record<string, string> = {
    blank: t("template-blank"),
    react: t("template-react"),
    python: t("template-python"),
    vue: t("template-vue"),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("create-skill")}</DialogTitle>
          <DialogDescription>{t("create-skill-desc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[12px]">{t("skill-name")}</Label>
            <Input
              placeholder={t("skill-name-placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[12px]">{t("skill-description")}</Label>
            <Input
              placeholder={t("skill-description-placeholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[12px]">{t("select-template")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {(templates.length > 0 ? templates : [{ name: "blank" }, { name: "react" }, { name: "python" }, { name: "vue" }]).map((tmpl) => (
                <div
                  key={tmpl.name}
                  className={`rounded-lg border p-3 cursor-pointer transition-all ${
                    selectedTemplate === tmpl.name
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border"
                  }`}
                  onClick={() => setSelectedTemplate(tmpl.name)}
                >
                  <div className="flex items-center gap-2">
                    <CodeIcon size={14} className={selectedTemplate === tmpl.name ? "text-primary" : "text-muted-foreground"} />
                    <span className="text-[12px] font-medium">{templateLabels[tmpl.name] || tmpl.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || creating}>
            {creating ? (
              <><RefreshIcon size={14} className="mr-1.5 animate-spin" />{t("creating")}</>
            ) : (
              t("create-skill")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateSkillDialog
