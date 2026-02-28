import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  Tick02Icon,
  FlashIcon,
  Download04Icon,
  Upload04Icon,
  RefreshIcon,
  Cancel01Icon,
  CommandLineIcon,
} from "hugeicons-react"
import { AppTypeIcon, ProviderBrandIcon } from "@/components/AppIcons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GetAllProviders,
  DeleteProvider,
  SwitchProvider,
  DeactivateProvider,
  DetectActiveProviders,
  TestProvider,
  ExportProviders,
  ImportProviders,
  GetCodeBuddyActiveModel,
  SwitchCodeBuddyBuiltinModel,
  OpenTerminalWithCLI,
} from "@wailsjs/go/services/ProviderService"
import { RefreshTray } from "@wailsjs/go/services/TrayService"
import { EventsOn, EventsOff } from "@wailsjs/runtime/runtime"

type AppType = "claude-code" | "codex" | "gemini-cli" | "codebuddy-cli" | "opencode"

interface ProviderConfig {
  id: string
  name: string
  appType: string
  apiKey: string
  baseUrl: string
  models: Record<string, string>
  note: string
  webUrl: string
  apiFormat: string
  authField: string
  presetId: string
  createdAt: string
  updatedAt: string
}

interface ProvidersData {
  providers: ProviderConfig[]
  activeMap: Record<string, string>
}

const APP_TYPES: { value: AppType; label: string; configPath: string }[] = [
  { value: "claude-code", label: "Claude Code", configPath: "~/.claude/settings.json" },
  { value: "codex", label: "Codex", configPath: "~/.codex/auth.json" },
  { value: "gemini-cli", label: "Gemini CLI", configPath: "~/.gemini/.env" },
  { value: "opencode", label: "OpenCode", configPath: "~/.config/opencode/opencode.json" },
  { value: "codebuddy-cli", label: "CodeBuddy CLI", configPath: "~/.codebuddy/settings.json" },
]

const maskApiKey = (key: string) => {
  if (!key) return ""
  if (key.length <= 12) return "••••••••"
  return key.slice(0, 6) + "••••••••" + key.slice(-4)
}

// CodeBuddy CLI built-in models (from /model command)
const CODEBUDDY_BUILTIN_MODELS = [
  "claude-sonnet-4.6",
  "claude-4.5",
  "claude-opus-4.6",
  "claude-opus-4.5",
  "claude-haiku-4.5",
  "gemini-3.0-pro",
  "gemini-3.0-flash",
  "gemini-2.5-pro",
  "gpt-5.2",
  "gpt-5.3-codex",
  "gpt-5.2-codex",
  "gpt-5.1",
  "gpt-5.1-codex",
  "gpt-5.1-codex-max",
  "gpt-5.1-codex-mini",
  "minimax-m2.5-ioa",
  "kimi-k2.5-ioa",
  "kimi-k2-thinking",
  "glm-5.0-ioa",
  "glm-4.7-ioa",
  "glm-4.6-ioa",
  "glm-4.6v-ioa",
  "deepseek-v3-2-volc-ioa",
]

const ProvidersPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ProvidersData>({ providers: [], activeMap: {} })
  const [activeTab, setActiveTab] = useState<AppType>("claude-code")
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null)
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; latency: number }>>({})
  const [switching, setSwitching] = useState<string | null>(null)
  const [cbActiveModel, setCbActiveModel] = useState("")
  const [cbSwitching, setCbSwitching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(async () => {
    try {
      const result = await GetAllProviders()
      setData({
        providers: result.providers || [],
        activeMap: result.activeMap || {},
      })
    } catch (error) {
      console.error("Failed to load providers:", error)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 10000)
    Promise.all([
      loadData(),
      DetectActiveProviders().then(activeMap => {
        setData(prev => ({ ...prev, activeMap: activeMap || {} }))
      }).catch(() => {}),
      GetCodeBuddyActiveModel().then(m => setCbActiveModel(m || "")).catch(() => {}),
    ]).finally(() => setLoading(false))
    return () => clearTimeout(timer)
  }, [loadData])

  // Listen for tray provider-switched events
  useEffect(() => {
    const handler = () => { loadData() }
    EventsOn("provider-switched", handler)
    return () => { EventsOff("provider-switched") }
  }, [loadData])

  const handleCbBuiltinSwitch = async (modelId: string) => {
    try {
      setCbSwitching(true)
      await SwitchCodeBuddyBuiltinModel(modelId)
      setCbActiveModel(modelId)
      toast({ title: t("prov-switched"), variant: "success" })
    } catch (error) {
      toast({ title: t("prov-switch-failed", { error: String(error) }), variant: "destructive" })
    } finally {
      setCbSwitching(false)
    }
  }

  const openCreate = () => navigate(`/providers/add?appType=${activeTab}`)
  const openEdit = (provider: ProviderConfig) => navigate(`/providers/edit?id=${provider.id}`)

  const handleDelete = async () => {
    if (!providerToDelete) return
    try {
      await DeleteProvider(providerToDelete)
      toast({ title: t("prov-deleted"), variant: "success" })
      setProviderToDelete(null)
      await loadData()
      RefreshTray().catch(() => {})
    } catch (error) {
      toast({ title: t("prov-delete-failed", { error: String(error) }), variant: "destructive" })
    }
  }

  const handleSwitch = async (id: string) => {
    try {
      setSwitching(id)
      await SwitchProvider(id)
      toast({ title: t("prov-switched"), variant: "success" })
      await loadData()
      RefreshTray().catch(() => {})
    } catch (error) {
      toast({ title: t("prov-switch-failed", { error: String(error) }), variant: "destructive" })
    } finally {
      setSwitching(null)
    }
  }

  const handleDeactivate = async (appType: string) => {
    try {
      await DeactivateProvider(appType)
      toast({ title: t("prov-deactivated"), variant: "success" })
      await loadData()
      RefreshTray().catch(() => {})
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    }
  }

  const handleTest = async (id: string) => {
    try {
      setTesting(prev => ({ ...prev, [id]: true }))
      const result = await TestProvider(id)
      setTestResults(prev => ({
        ...prev,
        [id]: { ok: result.ok, latency: result.latency },
      }))
      if (result.ok) {
        toast({ title: t("prov-test-ok", { ms: result.latency }), variant: "success" })
      } else {
        toast({ title: t("prov-test-fail", { error: result.error || "Server error" }), variant: "destructive" })
      }
    } catch (error) {
      toast({ title: t("prov-test-fail", { error: String(error) }), variant: "destructive" })
    } finally {
      setTesting(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleExport = async () => {
    try {
      const json = await ExportProviders()
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `providers-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: t("prov-exported"), variant: "success" })
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const count = await ImportProviders(text)
      toast({ title: t("prov-imported", { count }), variant: "success" })
      await loadData()
    } catch (error) {
      toast({ title: String(error), variant: "destructive" })
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const getFilteredProviders = (appType: AppType) =>
    data.providers.filter(p => p.appType === appType)

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground/90">{t("prov-title")}</h1>
            <p className="text-[13px] text-muted-foreground">{t("prov-desc")}</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload04Icon size={14} className="mr-1.5" />
              {t("prov-import")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download04Icon size={14} className="mr-1.5" />
              {t("prov-export")}
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Add01Icon size={14} className="mr-1.5" />
              {t("prov-add")}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <RefreshIcon className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as AppType)} className="h-full flex flex-col">
          <div className="px-6 pt-4">
            <TabsList className="h-9">
              {APP_TYPES.map(app => {
                const count = getFilteredProviders(app.value).length
                return (
                  <TabsTrigger key={app.value} value={app.value} className="text-[13px] gap-1.5">
                    <span className="w-5 h-5 rounded flex items-center justify-center">
                      <AppTypeIcon appType={app.value} size={16} />
                    </span>
                    {app.label}
                    {count > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-0.5">{count}</Badge>}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {APP_TYPES.map(app => (
            <TabsContent key={app.value} value={app.value} className="flex-1 px-6 pb-6 pt-3 mt-0">
              {/* CodeBuddy CLI: Built-in model card (always shown) */}
              {app.value === "codebuddy-cli" && (
                <div className="mb-4">
                  <div className="rounded-lg border border-primary/30 bg-primary/[0.03] shadow-sm">
                    <div className="flex items-center gap-4 p-4 pl-5">
                      <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                        <AppTypeIcon appType="codebuddy-cli" size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{t("prov-cb-builtin-title")}</p>
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] h-5 gap-1">
                            <Tick02Icon size={10} />
                            {t("prov-cb-builtin-badge")}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{t("prov-cb-builtin-desc")}</p>
                      </div>
                      <div className="shrink-0 w-52">
                        <Select value={cbActiveModel} onValueChange={handleCbBuiltinSwitch} disabled={cbSwitching}>
                          <SelectTrigger className="h-8 font-mono text-xs">
                            <SelectValue placeholder={t("prov-cb-builtin-placeholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {CODEBUDDY_BUILTIN_MODELS.map(m => (
                              <SelectItem key={m} value={m} className="font-mono text-xs">{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {getFilteredProviders(app.value).length === 0 && app.value !== "codebuddy-cli" ? (
                <div className="flex flex-col items-center justify-center min-h-[360px] text-center select-none">
                  <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
                    <AppTypeIcon appType={app.value} size={36} className="opacity-40" />
                  </div>
                  <p className="text-[15px] font-medium text-foreground/70 mb-1.5">{t("prov-empty")}</p>
                  <p className="text-[12px] text-muted-foreground/60 mb-4">{app.configPath}</p>
                  <Button size="sm" onClick={openCreate}>
                    <Add01Icon size={14} className="mr-1.5" />
                    {t("prov-add-first")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredProviders(app.value).map(provider => {
                    const isActive = data.activeMap[app.value] === provider.id
                    const isTestingThis = testing[provider.id]
                    const testResult = testResults[provider.id]
                    const isSwitchingThis = switching === provider.id

                    return (
                      <div
                        key={provider.id}
                        className={`relative rounded-lg border transition-all duration-150 ${
                          isActive
                            ? "border-primary/50 bg-primary/[0.03] shadow-sm"
                            : "border-border/50 hover:border-border hover:bg-accent/30"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-primary" />
                        )}
                        <div className="flex items-center gap-4 p-4 pl-5">
                          {/* Left: Icon + Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                              isActive ? "bg-primary/10" : "bg-muted"
                            }`}>
                              <ProviderBrandIcon presetId={provider.presetId} name={provider.name} size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{provider.name}</p>
                                {isActive && (
                                  <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] h-5 gap-1">
                                    <Tick02Icon size={10} />
                                    Active
                                  </Badge>
                                )}
                                {testResult && (
                                  <Badge variant={testResult.ok ? "outline" : "destructive"} className="text-[10px] h-5">
                                    {testResult.ok ? `${testResult.latency}ms` : "Failed"}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[11px] text-muted-foreground font-mono truncate">{maskApiKey(provider.apiKey)}</span>
                                {(provider.baseUrl || provider.models?.url) && (
                                  <span className="text-[11px] text-muted-foreground/60 truncate">{provider.baseUrl || provider.models?.url}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isActive ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[11px] text-muted-foreground"
                                  onClick={() => handleDeactivate(app.value)}
                                >
                                  <Cancel01Icon size={12} className="mr-1" />
                                  {t("prov-deactivate")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                                  title={t("terminal-open")}
                                  onClick={async () => {
                                    try {
                                      await OpenTerminalWithCLI(app.value)
                                    } catch (error) {
                                      toast({ title: t("terminal-open-failed", { error: String(error) }), variant: "destructive" })
                                    }
                                  }}
                                >
                                  <CommandLineIcon size={13} />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                className="h-7 text-[11px]"
                                onClick={() => handleSwitch(provider.id)}
                                disabled={!!isSwitchingThis}
                              >
                                {isSwitchingThis ? (
                                  <RefreshIcon size={12} className="mr-1 animate-spin" />
                                ) : (
                                  <Tick02Icon size={12} className="mr-1" />
                                )}
                                {t("prov-activate")}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleTest(provider.id)}
                              disabled={isTestingThis}
                            >
                              {isTestingThis ? (
                                <RefreshIcon size={13} className="animate-spin" />
                              ) : (
                                <FlashIcon size={13} />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => openEdit(provider)}
                            >
                              <Edit02Icon size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setProviderToDelete(provider.id)}
                            >
                              <Delete02Icon size={13} />
                            </Button>
                          </div>
                        </div>

                        {/* Model badges for all provider types */}
                        {Object.keys(provider.models || {}).some(k => provider.models[k]) && (
                          <div className="flex items-center gap-1.5 px-5 pb-3 -mt-1">
                            {Object.entries(provider.models).filter(([, v]) => v).map(([k, v]) => (
                              <Badge key={k} variant="outline" className="text-[10px] h-5 font-mono">
                                {k}: {v}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <p className="text-[11px] text-muted-foreground/40 pt-2 text-center">{app.configPath}</p>
                  {/* CodeBuddy: hint to add custom provider */}
                  {app.value === "codebuddy-cli" && getFilteredProviders(app.value).length === 0 && (
                    <div className="flex items-center justify-center pt-4">
                      <Button variant="outline" size="sm" className="text-xs text-muted-foreground" onClick={openCreate}>
                        <Add01Icon size={12} className="mr-1.5" />
                        {t("prov-cb-add-custom")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      )}

      {/* Delete Confirm */}
      <AlertDialog open={!!providerToDelete} onOpenChange={open => !open && setProviderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("prov-delete-confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("prov-delete-confirm-desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ProvidersPage
