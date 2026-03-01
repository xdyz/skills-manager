import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Search01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  Globe02Icon,
  RefreshIcon,
  InformationCircleIcon,
} from "hugeicons-react"
import { FindRemoteSkills } from "@wailsjs/go/services/SkillsService"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"

export interface RemoteSkill {
  fullName: string
  owner: string
  repo: string
  name: string
  url: string
  description: string
  installed: boolean
  installs: number
  supportedAgents: string[]
}

interface RemoteSkillSearchProps {
  /** "global" = 全局安装 (Skills 页面), "project" = 项目内安装 */
  mode: "global" | "project"
  /** 判断某个 skill 是否已安装（项目模式下由外部提供） */
  isInstalled?: (skillName: string) => boolean
  /** 安装按钮回调 */
  onInstall: (fullName: string) => void
  /** 当前正在安装的 skill fullName */
  installingSkill: string | null
  /** 搜索结果变化时通知外部（用于 skills 页面同步 installed 状态） */
  onSkillsChange?: (skills: RemoteSkill[]) => void
  /** 外部传入的 skills 列表（用于外部更新 installed 状态） */
  skills?: RemoteSkill[]
  /** 是否紧凑模式（在 Dialog 中使用时） */
  compact?: boolean
}

const RemoteSkillSearch = ({
  mode,
  isInstalled,
  onInstall,
  installingSkill,
  onSkillsChange,
  skills: externalSkills,
  compact = false,
}: RemoteSkillSearchProps) => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [internalSkills, setInternalSkills] = useState<RemoteSkill[]>([])
  const [searching, setSearching] = useState(false)

  const skills = externalSkills ?? internalSkills

  const updateSkills = (newSkills: RemoteSkill[]) => {
    setInternalSkills(newSkills)
    onSkillsChange?.(newSkills)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      updateSkills([])
      return
    }
    try {
      setSearching(true)
      const result = await FindRemoteSkills(searchQuery)
      updateSkills(result || [])
    } catch (error) {
      console.error("Failed to search remote skills:", error)
      updateSkills([])
    } finally {
      setSearching(false)
    }
  }

  const checkInstalled = (skill: RemoteSkill) => {
    if (isInstalled) return isInstalled(skill.name)
    return skill.installed
  }

  return (
    <div className={`flex flex-col ${compact ? "min-h-0 flex-1" : "h-full"}`}>
      {/* Search bar */}
      <div className={`flex gap-2 shrink-0 ${compact ? "pb-3" : "mb-4"}`}>
        <div className="relative flex-1">
          <Search01Icon size={compact ? 16 : 18} className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search-remote-skills-placeholder")}
            className={compact ? "pl-9 h-9" : "pl-10"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
          />
        </div>
        <Button onClick={handleSearch} disabled={searching} size={compact ? "sm" : "default"} className={compact ? "h-9" : ""}>
          <Search01Icon size={compact ? 14 : 16} className="mr-1.5" />
          {t("search")}
        </Button>
      </div>

      {/* Results */}
      <div className={`flex-1 min-h-0 ${compact ? "overflow-y-auto pr-1" : ""}`}>
        {searching ? (
          <div className={`flex items-center justify-center ${compact ? "py-12" : "h-full min-h-[300px]"}`}>
            <div className="text-center">
              <Globe02Icon className="mx-auto mb-3 animate-spin" size={compact ? 28 : 32} />
              <p className="text-sm text-muted-foreground">{t("searching-remote")}</p>
            </div>
          </div>
        ) : skills.length === 0 ? (
          <div className={`flex flex-col items-center justify-center select-none ${compact ? "py-12" : "h-full min-h-[360px]"}`}>
            {searchQuery ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
                  <Search01Icon size={28} className="text-muted-foreground/50" />
                </div>
                <p className="text-[15px] font-medium text-foreground/70 mb-1.5">{t("no-matching-results")}</p>
                <p className="text-[13px] text-muted-foreground/70">{t("try-other-keywords")}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center mb-5">
                  <Globe02Icon size={28} className="text-primary/50" />
                </div>
                <p className="text-[15px] font-medium text-foreground/70 mb-1.5">{t("explore-remote")}</p>
                <p className="text-[13px] text-muted-foreground/70">{t("explore-remote-desc")}</p>
              </>
            )}
          </div>
        ) : compact ? (
          /* Compact list mode for Dialog */
          <div className="space-y-2">
            {skills.map((skill) => {
              const installed = checkInstalled(skill)
              return (
                <div
                  key={skill.fullName}
                  className={`flex items-center gap-3 p-3 rounded-md border border-border/50 transition-all duration-150 ${
                    installed ? "bg-muted/40" : "hover:bg-accent/40"
                  }`}
                >
                  <div className="p-2 rounded shrink-0 bg-blue-500/10">
                    <Globe02Icon size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{skill.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {skill.owner}/{skill.repo}
                      </p>
                      {skill.installs > 0 && (
                        <span className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5 shrink-0">
                          <Download01Icon size={10} />
                          {skill.installs.toLocaleString()}
                        </span>
                      )}
                      {skill.supportedAgents?.length > 0 && !skill.supportedAgents.includes("All Agents") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 cursor-help shrink-0">
                                <InformationCircleIcon size={11} />
                                {t("partial-support")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("supported-agents")}: {skill.supportedAgents.join(", ")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {installed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-2.5 py-1 rounded-md border border-border/60 bg-muted/40">
                        <CheckmarkCircle02Icon size={13} className="text-primary" />
                        {t("installed")}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onInstall(skill.fullName)}
                        disabled={installingSkill === skill.fullName}
                      >
                        {installingSkill === skill.fullName ? (
                          <><RefreshIcon size={14} className="mr-1.5 animate-spin" />{t("installing")}</>
                        ) : (
                          <><Download01Icon size={14} className="mr-1.5" />{mode === "project" ? t("install-to-project") : t("install")}</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Card grid mode for full page */
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => {
              const installed = checkInstalled(skill)
              return (
                <Card key={skill.fullName} className="flex flex-col border-border/50 shadow-none hover:shadow-sm hover:border-border transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded shrink-0 bg-blue-500/10">
                          <Globe02Icon size={18} className="text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-[13px] truncate">{skill.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-0.5">
                            <CardDescription className="text-[11px] truncate">{skill.owner}/{skill.repo}</CardDescription>
                            {skill.installs > 0 && (
                              <span className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5 shrink-0">
                                <Download01Icon size={10} />
                                {skill.installs.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {skill.supportedAgents?.length > 0 && !skill.supportedAgents.includes("All Agents") && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {skill.supportedAgents.map((agent) => (
                                <Badge key={agent} variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600">
                                  {agent}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {installed && <Badge variant="secondary" className="text-xs shrink-0 whitespace-nowrap">{t("installed")}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3">
                    {skill.description ? (
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-3">{skill.description}</p>
                    ) : (
                      <p className="mb-3 text-xs text-muted-foreground truncate">{skill.fullName}</p>
                    )}
                    {skill.url && (
                      <span onClick={() => BrowserOpenURL(skill.url)} className="text-xs text-blue-500 hover:underline cursor-pointer">
                        {t("view-details")} →
                      </span>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    {installed ? (
                      <Button size="sm" className="w-full" variant="outline" onClick={() => onInstall(skill.fullName)} disabled={installingSkill === skill.fullName}>
                        {installingSkill === skill.fullName ? (
                          <><RefreshIcon size={16} className="mr-2 animate-spin" />{t("reinstalling")}</>
                        ) : (
                          <><Download01Icon size={16} className="mr-2" />{t("reinstall")}</>
                        )}
                      </Button>
                    ) : (
                      <Button size="sm" className="w-full" onClick={() => onInstall(skill.fullName)} disabled={installingSkill === skill.fullName}>
                        {installingSkill === skill.fullName ? (
                          <><RefreshIcon size={16} className="mr-2 animate-spin" />{t("installing")}</>
                        ) : (
                          <><Download01Icon size={16} className="mr-2" />{mode === "project" ? t("install-to-project") : t("install")}</>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(RemoteSkillSearch)
