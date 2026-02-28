import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import {
  Moon02Icon,
  Sun03Icon,
  RefreshIcon,
  Folder01Icon,
  ComputerIcon,
  Download04Icon,
  CommandLineIcon,
} from "hugeicons-react"
import { GetSettings, SaveSettings } from "@wailsjs/go/services/SkillsService"
import { GetAvailableTerminals } from "@wailsjs/go/services/ProviderService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import type { AgentInfo } from "@/types"
import BackupPage from "../backup"

interface TerminalOption {
  id: string
  name: string
  available: boolean
}

const SettingsPage = () => {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<"settings" | "backup">("settings")
  const [loading, setLoading] = useState(true)
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])
  const [availableTerminals, setAvailableTerminals] = useState<TerminalOption[]>([])

  const [theme, setTheme] = useState("light")
  const [language, setLanguage] = useState("zh")
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [updateInterval, setUpdateInterval] = useState(24)
  const [defaultAgents, setDefaultAgents] = useState<string[]>([])
  const [showPath, setShowPath] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [terminal, setTerminal] = useState("terminal")

  const initialLoadDone = useRef(false)

  useEffect(() => {
    loadSettings()
    loadAgents()
    loadTerminals()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const s = await GetSettings()
      if (s) {
        setTheme(s.theme || "light")
        setLanguage(s.language || "zh")
        setAutoUpdate(s.autoUpdate || false)
        setUpdateInterval(s.updateInterval || 24)
        setDefaultAgents(s.defaultAgents || [])
        setShowPath(s.showPath !== false)
        setCompactMode(s.compactMode || false)
        setTerminal(s.terminal || "terminal")
      }
    } catch {}
    setLoading(false)
    // 标记初始加载完成（下一轮 useEffect 才开始自动保存）
    setTimeout(() => { initialLoadDone.current = true }, 100)
  }

  const loadAgents = async () => {
    try {
      const result = await GetSupportedAgents()
      setAllAgents(result || [])
    } catch {}
  }

  const loadTerminals = async () => {
    try {
      const result = await GetAvailableTerminals()
      setAvailableTerminals(result || [])
    } catch {}
  }

  // 自动保存 & 即时应用
  const saveSettings = useCallback(async (settings: {
    theme: string; language: string; autoUpdate: boolean;
    updateInterval: number; defaultAgents: string[];
    showPath: boolean; compactMode: boolean; terminal: string;
  }) => {
    try {
      await SaveSettings(JSON.stringify(settings))
    } catch (error) {
      toast({ title: t("toast-settings-failed", { error }), variant: "destructive" })
    }
  }, [t])

  // 当设置变化时，即时应用 + 自动保存
  useEffect(() => {
    if (!initialLoadDone.current) return

    // 即时应用主题
    const isDark = theme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : theme === "dark"
    document.documentElement.classList.toggle("dark", isDark)
    localStorage.setItem("theme", theme)

    // 即时应用语言
    if (i18n.language !== language) {
      i18n.changeLanguage(language)
    }

    // 自动保存到后端
    saveSettings({ theme, language, autoUpdate, updateInterval, defaultAgents, showPath, compactMode, terminal })
  }, [theme, language, autoUpdate, updateInterval, defaultAgents, showPath, compactMode, terminal])

  const toggleDefaultAgent = (name: string) => {
    setDefaultAgents(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshIcon size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="shrink-0 px-6 pt-6 pb-0 border-b border-border/50">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground/90">{t("settings")}</h1>
          <p className="text-[13px] text-muted-foreground">{t("settings-desc")}</p>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "settings" | "backup")} className="mt-3">
          <TabsList className="h-9">
            <TabsTrigger value="settings" className="text-[12px] gap-1.5">
              {t("settings")}
            </TabsTrigger>
            <TabsTrigger value="backup" className="text-[12px] gap-1.5">
              <Download04Icon size={13} />
              {t("backup-nav")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "backup" ? (
        <BackupPage />
      ) : (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Appearance */}
          <section className="space-y-4">
            <h2 className="text-[14px] font-semibold text-foreground/80">{t("appearance")}</h2>

            <div className="rounded-lg border border-border/50 divide-y divide-border/50">
              {/* Theme */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {theme === "system" ? <ComputerIcon size={16} className="text-muted-foreground" /> : theme === "dark" ? <Moon02Icon size={16} className="text-muted-foreground" /> : <Sun03Icon size={16} className="text-muted-foreground" />}
                  <span className="text-[13px]">{t("theme-setting")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-3 py-1.5 rounded text-[12px] transition-colors ${theme === "light" ? "bg-primary/10 text-primary font-medium" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setTheme("light")}
                  >
                    {t("theme-light")}
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-[12px] transition-colors ${theme === "dark" ? "bg-primary/10 text-primary font-medium" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setTheme("dark")}
                  >
                    {t("theme-dark")}
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-[12px] transition-colors ${theme === "system" ? "bg-primary/10 text-primary font-medium" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setTheme("system")}
                  >
                    {t("theme-system")}
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between p-4">
                <span className="text-[13px]">{t("language-setting")}</span>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-3 py-1.5 rounded text-[12px] transition-colors ${language === "zh" ? "bg-primary/10 text-primary font-medium" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setLanguage("zh")}
                  >
                    中文
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-[12px] transition-colors ${language === "en" ? "bg-primary/10 text-primary font-medium" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setLanguage("en")}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Terminal */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <CommandLineIcon size={16} className="text-muted-foreground" />
                  <div>
                    <span className="text-[13px]">{t("terminal-setting")}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t("terminal-setting-desc")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {availableTerminals.map((term) => (
                    <button
                      key={term.id}
                      disabled={!term.available}
                      className={`px-3 py-1.5 rounded text-[12px] transition-colors ${
                        !term.available
                          ? "bg-muted/30 text-muted-foreground/40 cursor-not-allowed"
                          : terminal === term.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => term.available && setTerminal(term.id)}
                    >
                      {term.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Skill Display */}
          <section className="space-y-4">
            <h2 className="text-[14px] font-semibold text-foreground/80">{t("skill-display")}</h2>

            <div className="rounded-lg border border-border/50 divide-y divide-border/50">
              <div className="flex items-center justify-between p-4">
                <span className="text-[13px]">{t("show-path-in-card")}</span>
                <Switch checked={showPath} onCheckedChange={setShowPath} />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-[13px]">{t("compact-mode")}</span>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </div>
            </div>
          </section>

          {/* Auto Update */}
          <section className="space-y-4">
            <h2 className="text-[14px] font-semibold text-foreground/80">{t("auto-update")}</h2>

            <div className="rounded-lg border border-border/50 divide-y divide-border/50">
              <div className="flex items-center justify-between p-4">
                <div>
                  <span className="text-[13px]">{t("auto-update")}</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t("auto-update-desc")}</p>
                </div>
                <Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />
              </div>
              {autoUpdate && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-[13px]">{t("update-interval")}</span>
                  <select
                    className="bg-muted/60 border border-border/50 rounded px-2 py-1 text-[12px]"
                    value={updateInterval}
                    onChange={(e) => setUpdateInterval(Number(e.target.value))}
                  >
                    <option value={6}>6h</option>
                    <option value={12}>12h</option>
                    <option value={24}>24h</option>
                    <option value={48}>48h</option>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Default Agents */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground/80">{t("default-install-agents")}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t("default-install-agents-desc")}</p>
              </div>
              <button
                className="text-[11px] text-primary hover:text-primary/80 transition-colors"
                onClick={() => {
                  if (defaultAgents.length === allAgents.length) {
                    setDefaultAgents([])
                  } else {
                    setDefaultAgents(allAgents.map(a => a.name))
                  }
                }}
              >
                {defaultAgents.length === allAgents.length ? t("deselect-all") : t("select-all")}
              </button>
            </div>

            <div className="rounded-lg border border-border/50 p-4">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {allAgents.map((agent) => (
                  <label key={agent.name} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 transition-colors">
                    <Checkbox
                      checked={defaultAgents.includes(agent.name)}
                      onCheckedChange={() => toggleDefaultAgent(agent.name)}
                    />
                    <span className="text-[12px] truncate">{agent.name}</span>
                    {agent.isCustom && <Badge variant="outline" className="text-[9px]">{t("custom")}</Badge>}
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="space-y-4">
            <h2 className="text-[14px] font-semibold text-foreground/80">{t("data-management")}</h2>

            <div className="rounded-lg border border-border/50 divide-y divide-border/50">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Folder01Icon size={14} className="text-muted-foreground" />
                  <span className="text-[13px]">{t("config-directory")}</span>
                </div>
                <code className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-1 rounded font-mono">~/.skills-manager/</code>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Folder01Icon size={14} className="text-muted-foreground" />
                  <span className="text-[13px]">{t("skills-directory")}</span>
                </div>
                <code className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-1 rounded font-mono">~/.agents/skills/</code>
              </div>
            </div>
          </section>
        </div>
      </div>
      )}
    </div>
  )
}

export default SettingsPage
