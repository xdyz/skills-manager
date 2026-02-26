import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Notification03Icon, Cancel01Icon, CheckmarkCircle02Icon, AlertDiamondIcon, ArrowUp02Icon } from "hugeicons-react"

export interface Notification {
  id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message?: string
  timestamp: number
  read: boolean
}

interface NotificationCenterProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
  onClearAll: () => void
}

const NotificationCenter = ({ notifications, onDismiss, onClearAll }: NotificationCenterProps) => {
  const { t } = useTranslation()
  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <CheckmarkCircle02Icon size={14} className="text-emerald-500 shrink-0" />
      case "warning": return <AlertDiamondIcon size={14} className="text-amber-500 shrink-0" />
      case "error": return <AlertDiamondIcon size={14} className="text-destructive shrink-0" />
      default: return <ArrowUp02Icon size={14} className="text-primary shrink-0" />
    }
  }

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return t("just-now")
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return new Date(ts).toLocaleDateString()
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded text-muted-foreground hover:text-foreground relative">
          <Notification03Icon size={15} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] rounded-full bg-destructive text-[8px] text-white flex items-center justify-center px-0.5 font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <span className="text-[12px] font-medium">{t("notifications")}</span>
          {notifications.length > 0 && (
            <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors" onClick={onClearAll}>
              {t("clear-all")}
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-muted-foreground">{t("no-notifications")}</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-border/30 last:border-0 ${!n.read ? "bg-primary/5" : ""}`}>
                <div className="mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] font-medium truncate">{n.title}</p>
                  {n.message && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                  <p className="text-[9px] text-muted-foreground/50 mt-1">{formatTime(n.timestamp)}</p>
                </div>
                <button className="text-muted-foreground/30 hover:text-muted-foreground shrink-0 mt-0.5" onClick={() => onDismiss(n.id)}>
                  <Cancel01Icon size={10} />
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default NotificationCenter
