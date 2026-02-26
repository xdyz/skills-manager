import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CodeIcon,
  Delete02Icon,
  RefreshIcon,
  Settings02Icon,
  LinkSquare02Icon,
  ArrowUp02Icon,
  FavouriteIcon,
} from "hugeicons-react"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"
import TagManager from "@/components/TagManager"
import type { SkillData } from "@/types"

interface SkillCardProps {
  skill: SkillData
  onConfigAgentLink: (skillName: string) => void
  onDelete: (skill: SkillData) => void
  onUpdate?: (skillName: string) => void
  updatingSkill?: string | null
  deletingSkill?: string | null
  deleteTooltip?: string
  showPath?: boolean
  showBadges?: boolean
  /** 是否可以点击跳转到详情页 */
  linkToDetail?: boolean
  /** 选择模式 */
  selectable?: boolean
  selected?: boolean
  onSelect?: (skillName: string, selected: boolean) => void
  /** 是否有可用更新 */
  hasUpdate?: boolean
  /** 标签 */
  tags?: string[]
  onTagsChange?: (tags: string[]) => void
  /** 是否已收藏 */
  isFavorite?: boolean
  onToggleFavorite?: (skillName: string) => void
}

const SkillCard = ({
  skill,
  onConfigAgentLink,
  onDelete,
  onUpdate,
  updatingSkill,
  deletingSkill,
  deleteTooltip,
  showPath = true,
  showBadges = true,
  linkToDetail = false,
  selectable = false,
  selected = false,
  onSelect,
  hasUpdate = false,
  tags = [],
  onTagsChange,
  isFavorite = false,
  onToggleFavorite,
}: SkillCardProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isUpdating = updatingSkill === skill.name
  const isDeleting = deletingSkill === skill.name
  const busy = isUpdating || isDeleting

  const handleCardClick = () => {
    if (selectable && onSelect) {
      onSelect(skill.name, !selected)
      return
    }
    if (linkToDetail) {
      navigate(`/skills/detail?name=${encodeURIComponent(skill.name)}`)
    }
  }

  return (
    <Card className={`flex flex-col border-border/50 shadow-none hover:shadow-sm hover:border-border transition-all duration-200 ${linkToDetail || selectable ? "cursor-pointer" : ""} ${selected ? "border-primary bg-primary/5" : ""}`} onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {selectable && (
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelect?.(skill.name, !!checked)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 shrink-0"
              />
            )}
            <div className="p-2 rounded bg-primary/10 shrink-0">
              <CodeIcon size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-[13px] truncate">{skill.name}</CardTitle>
                {isFavorite && (
                  <FavouriteIcon size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                )}
                {hasUpdate && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/40 text-amber-500 bg-amber-500/10 shrink-0">
                    <ArrowUp02Icon size={10} className="mr-0.5" />
                    {t("update-available")}
                  </Badge>
                )}
              </div>
              {showPath && skill.path && (
                <CardDescription className="text-[11px] truncate mt-1">{skill.path}</CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="mb-3 text-[12px] text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {skill.desc || t("no-description")}
        </p>
        {showBadges && (
          <div className="flex flex-wrap gap-2 mb-3">
            {skill.language && <Badge variant="secondary" className="text-xs">{skill.language}</Badge>}
            {skill.framework && <Badge variant="outline" className="text-xs">{skill.framework}</Badge>}
          </div>
        )}
        {onTagsChange && (
          <div className="mb-3">
            <TagManager skillName={skill.name} tags={tags} onTagsChange={onTagsChange} compact />
          </div>
        )}
        {skill.agents && skill.agents.length > 0 && (
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left w-full" onClick={(e) => { e.stopPropagation(); onConfigAgentLink(skill.name) }}>
            <span className="font-medium">{t("linked-agents-count", { count: skill.agents.length })}</span>
            {skill.agents.length <= 3 ? skill.agents.join(", ") : (
              <>{skill.agents.slice(0, 3).join(", ")}<span className="ml-1">+{skill.agents.length - 3}</span></>
            )}
          </button>
        )}
        {(!skill.agents || skill.agents.length === 0) && (
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left" onClick={(e) => { e.stopPropagation(); onConfigAgentLink(skill.name) }}>
            <span className="font-medium text-amber-500">{t("no-agent-linked")}</span>
          </button>
        )}
      </CardContent>
      <CardFooter className={`flex justify-end gap-1 pt-4 ${selectable ? "hidden" : ""}`} onClick={(e) => e.stopPropagation()}>
        <TooltipProvider delayDuration={300}>
          {onToggleFavorite && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={`h-7 w-7 rounded ${isFavorite ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"}`} onClick={() => onToggleFavorite(skill.name)}>
                  <FavouriteIcon size={14} className={isFavorite ? "fill-amber-500" : ""} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFavorite ? t("remove-from-favorites") : t("add-to-favorites")}</TooltipContent>
            </Tooltip>
          )}
          {skill.source && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10" onClick={() => BrowserOpenURL(`https://github.com/${skill.source}`)}>
                  <LinkSquare02Icon size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("view-details")}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => onConfigAgentLink(skill.name)}>
                <Settings02Icon size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("config-agent-link")}</TooltipContent>
          </Tooltip>
          {onUpdate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => onUpdate(skill.name)} disabled={busy}>
                  <RefreshIcon size={14} className={isUpdating ? "animate-spin" : ""} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("update")}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(skill)} disabled={busy}>
                {isDeleting ? (
                  <RefreshIcon size={14} className="animate-spin" />
                ) : (
                  <Delete02Icon size={14} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{deleteTooltip || t("delete")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  )
}

export default SkillCard
