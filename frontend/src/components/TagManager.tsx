import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Cancel01Icon, Add01Icon, Tag01Icon } from "hugeicons-react"
import { SetSkillTags } from "@wailsjs/go/services/SkillsService"
import { toast } from "@/components/ui/use-toast"

interface TagManagerProps {
  skillName: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  compact?: boolean
}

const TagManager = ({ skillName, tags, onTagsChange, compact = false }: TagManagerProps) => {
  const { t } = useTranslation()
  const [newTag, setNewTag] = useState("")
  const [open, setOpen] = useState(false)

  const handleAddTag = async () => {
    const tag = newTag.trim().toLowerCase()
    if (!tag || tags.includes(tag)) return
    const updated = [...tags, tag]
    try {
      await SetSkillTags(skillName, updated)
      onTagsChange(updated)
      setNewTag("")
      toast({ title: t("toast-tags-updated"), variant: "success" })
    } catch (error) {
      toast({ title: t("toast-tags-failed", { error }), variant: "destructive" })
    }
  }

  const handleRemoveTag = async (tag: string) => {
    const updated = tags.filter((t: string) => t !== tag)
    try {
      await SetSkillTags(skillName, updated)
      onTagsChange(updated)
    } catch (error) {
      toast({ title: t("toast-tags-failed", { error }), variant: "destructive" })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => e.stopPropagation()}>
            <Tag01Icon size={12} />
            {tags.length > 0 ? (
              <span className="flex items-center gap-1">
                {tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0">{tag}</Badge>
                ))}
                {tags.length > 2 && <span className="text-[10px]">+{tags.length - 2}</span>}
              </span>
            ) : (
              <span className="text-[10px]">{t("add-tag")}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Input
                className="h-7 text-xs"
                placeholder={t("add-tag-placeholder")}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleAddTag} disabled={!newTag.trim()}>
                <Add01Icon size={12} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] gap-1 pr-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                      <Cancel01Icon size={10} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Input
          className="h-8 text-xs flex-1"
          placeholder={t("add-tag-placeholder")}
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button size="sm" onClick={handleAddTag} disabled={!newTag.trim()}>
          <Add01Icon size={12} className="mr-1" />
          {t("add-tag")}
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-[11px] gap-1.5 pr-1.5">
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive transition-colors">
                <Cancel01Icon size={11} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default TagManager
