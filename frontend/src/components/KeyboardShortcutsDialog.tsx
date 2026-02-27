import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcuts = [
  { keys: ["⌘", "K"], i18nKey: "shortcut-command-palette" },
  { keys: ["⌘", "1"], i18nKey: "shortcut-go-home" },
  { keys: ["⌘", "2"], i18nKey: "shortcut-go-skills" },
  { keys: ["⌘", "3"], i18nKey: "shortcut-go-agents" },
  { keys: ["⌘", "4"], i18nKey: "shortcut-go-projects" },
  { keys: ["⌘", "5"], i18nKey: "shortcut-go-settings" },
  { keys: ["⌘", ","], i18nKey: "shortcut-go-settings" },
]

const KeyboardShortcutsDialog = ({ open, onOpenChange }: KeyboardShortcutsDialogProps) => {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{t("keyboard-shortcuts")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-1">
              <span className="text-[13px] text-foreground/80">{t(s.i18nKey)}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="min-w-[24px] h-6 flex items-center justify-center px-1.5 text-[11px] font-mono bg-muted border border-border/60 rounded text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default KeyboardShortcutsDialog
