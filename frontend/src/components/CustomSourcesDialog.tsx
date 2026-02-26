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
import { Badge } from "@/components/ui/badge"
import { RefreshIcon, Add01Icon, Delete02Icon, Globe02Icon } from "hugeicons-react"
import { GetCustomSources, AddCustomSource, RemoveCustomSource } from "@wailsjs/go/services/SkillsService"
import { toast } from "@/components/ui/use-toast"

interface CustomSourcesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CustomSource {
  name: string
  url: string
  token: string
}

const CustomSourcesDialog = ({ open, onOpenChange }: CustomSourcesDialogProps) => {
  const { t } = useTranslation()
  const [sources, setSources] = useState<CustomSource[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [token, setToken] = useState("")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (open) loadSources()
  }, [open])

  const loadSources = async () => {
    setLoading(true)
    try {
      const result = await GetCustomSources()
      setSources(result || [])
    } catch {}
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return
    setAdding(true)
    try {
      await AddCustomSource(name.trim(), url.trim(), token.trim())
      toast({ title: t("toast-source-added", { name: name.trim() }), variant: "success" })
      setName("")
      setUrl("")
      setToken("")
      setShowAdd(false)
      await loadSources()
    } catch (error) {
      toast({ title: t("toast-source-add-failed", { error }), variant: "destructive" })
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (sourceName: string) => {
    try {
      await RemoveCustomSource(sourceName)
      toast({ title: t("toast-source-removed", { name: sourceName }), variant: "success" })
      await loadSources()
    } catch (error) {
      toast({ title: t("toast-source-remove-failed", { error }), variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("custom-sources")}</DialogTitle>
          <DialogDescription>{t("custom-sources-desc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshIcon size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : sources.length === 0 && !showAdd ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">{t("no-custom-sources")}</div>
          ) : (
            sources.map((source) => (
              <div key={source.name} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Globe02Icon size={16} className="text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium truncate">{source.name}</p>
                    <p className="text-[10.5px] text-muted-foreground truncate">{source.url}</p>
                  </div>
                  {source.token && <Badge variant="outline" className="text-[9px] shrink-0">Token</Badge>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleRemove(source.name)}>
                  <Delete02Icon size={14} />
                </Button>
              </div>
            ))
          )}

          {showAdd && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">{t("source-name")}</Label>
                <Input className="h-8 text-xs" placeholder={t("source-name-placeholder")} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">{t("source-url")}</Label>
                <Input className="h-8 text-xs" placeholder={t("source-url-placeholder")} value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">{t("source-token")}</Label>
                <Input className="h-8 text-xs" type="password" placeholder={t("source-token-placeholder")} value={token} onChange={(e) => setToken(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>{t("cancel")}</Button>
                <Button size="sm" onClick={handleAdd} disabled={!name.trim() || !url.trim() || adding}>
                  {adding ? <RefreshIcon size={12} className="mr-1 animate-spin" /> : null}
                  {t("add-source")}
                </Button>
              </div>
            </div>
          )}
        </div>
        {!showAdd && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(true)}>
              <Add01Icon size={14} className="mr-1.5" />
              {t("add-source")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CustomSourcesDialog
