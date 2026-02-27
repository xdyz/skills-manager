import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import {
  AiBrain01Icon,
  Stairs01Icon,
  Download04Icon,
  CodeIcon,
  Tag01Icon,
  RefreshIcon,
  Folder01Icon,
} from "hugeicons-react"
import { GetRecommendations, DetectProjectType } from "@wailsjs/go/services/RecommendationService"
import { GetFolders } from "@wailsjs/go/services/FolderService"
import { InstallRemoteSkill } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import { services } from "@wailsjs/go/models"

const typeLabels: Record<string, { label: string, color: string }> = {
  "project-based": { label: "project", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  "usage-based": { label: "usage", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  "related": { label: "related", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  "community": { label: "community", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
}

const RecommendationsPage = () => {
  const { t } = useTranslation()
  const [recommendations, setRecommendations] = useState<services.EnhancedRecommendation[]>([])
  const [projectDetection, setProjectDetection] = useState<services.ProjectTypeDetection | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [folders, setFolders] = useState<string[]>([])
  const [filterType, setFilterType] = useState<string>("all")

  // Install dialog state
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [installTarget, setInstallTarget] = useState<services.EnhancedRecommendation | null>(null)
  const [agents, setAgents] = useState<services.AgentInfo[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    GetFolders().then(f => setFolders(f || [])).catch(() => {})
    GetSupportedAgents().then(a => setAgents(a || [])).catch(() => {})
  }, [])

  const loadRecommendations = useCallback(async (projectPath: string) => {
    if (!projectPath) return
    try {
      setLoading(true)
      const [recs, detection] = await Promise.all([
        GetRecommendations(projectPath, 20),
        DetectProjectType(projectPath),
      ])
      setRecommendations(recs || [])
      setProjectDetection(detection)
    } catch (error) {
      console.error("Failed to load recommendations:", error)
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t])

  const handleProjectChange = (path: string) => {
    setSelectedProject(path)
    loadRecommendations(path)
  }

  const filteredRecs = filterType === "all"
    ? recommendations
    : recommendations.filter(r => r.type === filterType)

  const getFolderName = (path: string) => path.split("/").filter(Boolean).pop() || path

  const handleInstallClick = (rec: services.EnhancedRecommendation) => {
    setInstallTarget(rec)
    setSelectedAgents(agents.map(a => a.name))
    setShowInstallDialog(true)
  }

  const handleConfirmInstall = async () => {
    if (!installTarget?.fullName) return
    try {
      setInstalling(true)
      await InstallRemoteSkill(installTarget.fullName, selectedAgents)
      toast({
        title: t("success"),
        description: t("toast-skill-installed", { name: installTarget.skillName, count: selectedAgents.length }),
      })
      setShowInstallDialog(false)
      setInstallTarget(null)
      if (selectedProject) loadRecommendations(selectedProject)
    } catch (error) {
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    } finally {
      setInstalling(false)
    }
  }

  const toggleAgent = (name: string) => {
    setSelectedAgents(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-end">
        <Button size="sm" variant="outline" onClick={() => selectedProject && loadRecommendations(selectedProject)} disabled={loading || !selectedProject}>
          <RefreshIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />{t("home-refresh")}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedProject} onValueChange={handleProjectChange}>
          <SelectTrigger className="w-80">
            <Folder01Icon className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("rec-select-project")} />
          </SelectTrigger>
          <SelectContent>
            {folders.map(f => (
              <SelectItem key={f} value={f}>{getFolderName(f)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all-categories")}</SelectItem>
            <SelectItem value="project-based">{t("rec-type-project")}</SelectItem>
            <SelectItem value="usage-based">{t("rec-type-usage")}</SelectItem>
            <SelectItem value="related">{t("rec-type-related")}</SelectItem>
            <SelectItem value="community">{t("rec-type-community")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {projectDetection && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("rec-project-analysis")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              {(projectDetection.detectedTypes || []).length > 0 && (
                <div>
                  <span className="text-muted-foreground mr-2">{t("detected-types")}:</span>
                  {projectDetection.detectedTypes.map(dt => (
                    <Badge key={dt} variant="secondary" className="mr-1">{dt}</Badge>
                  ))}
                </div>
              )}
              {(projectDetection.frameworks || []).length > 0 && (
                <div>
                  <span className="text-muted-foreground mr-2">{t("framework")}:</span>
                  {projectDetection.frameworks.map(fw => (
                    <Badge key={fw} variant="outline" className="mr-1">{fw}</Badge>
                  ))}
                </div>
              )}
              {projectDetection.confidence > 0 && (
                <div>
                  <span className="text-muted-foreground mr-2">{t("rec-confidence")}:</span>
                  <Badge variant={projectDetection.confidence > 0.7 ? "default" : "secondary"}>
                    {Math.round(projectDetection.confidence * 100)}%
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedProject && !loading && (
        <div className="text-center py-16">
          <AiBrain01Icon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{t("rec-select-project-hint")}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">{t("rec-analyzing")}</p>
          </div>
        </div>
      )}

      {!loading && selectedProject && filteredRecs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">{t("no-recommendations")}</p>
        </div>
      )}

      {!loading && filteredRecs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecs.map((rec, i) => {
            const typeInfo = typeLabels[rec.type] || typeLabels["community"]
            return (
              <Card key={`${rec.skillName}-${i}`} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{rec.fullName || rec.skillName}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">{rec.description}</CardDescription>
                    </div>
                    <Badge className={`text-xs ml-2 shrink-0 ${typeInfo.color}`}>
                      {t(`rec-type-${rec.type === "project-based" ? "project" : rec.type === "usage-based" ? "usage" : rec.type}`)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <AiBrain01Icon className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{rec.reason}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(rec.tags || []).slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag01Icon className="h-3 w-3 mr-0.5" />{tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      {rec.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Stairs01Icon className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {rec.rating.toFixed(1)}
                        </span>
                      )}
                      {rec.language && (
                        <span className="flex items-center gap-1">
                          <CodeIcon className="h-3.5 w-3.5" />{rec.language}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-primary">
                      {Math.round(rec.score * 100)}%
                    </span>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => handleInstallClick(rec)}>
                    <Download04Icon className="h-4 w-4 mr-2" />{t("install")}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Install Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("select-target-agent")}</DialogTitle>
            <DialogDescription>
              {t("select-agent-desc")}
            </DialogDescription>
          </DialogHeader>
          {installTarget && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{installTarget.fullName || installTarget.skillName}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{installTarget.description}</p>
              </div>
              <div>
                <ScrollArea className="h-40 border rounded-md p-2">
                  {agents.map(agent => (
                    <div key={agent.name} className="flex items-center gap-2 py-1.5">
                      <Checkbox
                        checked={selectedAgents.includes(agent.name)}
                        onCheckedChange={() => toggleAgent(agent.name)}
                      />
                      <span className="text-sm">{agent.name}</span>
                    </div>
                  ))}
                </ScrollArea>
                <p className="text-xs text-muted-foreground mt-1">{t("selected-agents-count", { count: selectedAgents.length })}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInstallDialog(false)}>{t("cancel")}</Button>
                <Button onClick={handleConfirmInstall} disabled={installing || selectedAgents.length === 0}>
                  {installing ? t("installing") : t("install-to-agents", { count: selectedAgents.length })}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RecommendationsPage
