import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import {
  Search01Icon,
  Add01Icon,
  Download04Icon,
  Stairs01Icon,
  Grid02Icon,
  Xls02Icon,
  Tag01Icon,
  CodeIcon,
  FrameworksIcon,
  ViewIcon,
} from "hugeicons-react"
import { GetEnhancedTemplates, GetTemplateCategories, CreateCustomTemplate } from "@wailsjs/go/services/TemplateService"
import { CreateSkill } from "@wailsjs/go/services/SkillsService"
import { GetSupportedAgents } from "@wailsjs/go/services/AgentService"
import { services } from "@wailsjs/go/models"

const TemplateMarketPage = () => {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<services.EnhancedSkillTemplate[]>([])
  const [categories, setCategories] = useState<services.TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("rating")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "",
    language: "",
    framework: "",
    content: "",
    tags: ""
  })

  // Use template dialog state
  const [showUseDialog, setShowUseDialog] = useState(false)
  const [useTarget, setUseTarget] = useState<services.EnhancedSkillTemplate | null>(null)
  const [useSkillName, setUseSkillName] = useState("")
  const [useSkillDesc, setUseSkillDesc] = useState("")
  const [agents, setAgents] = useState<services.AgentInfo[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  // Preview dialog state
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<services.EnhancedSkillTemplate | null>(null)

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const result = await GetEnhancedTemplates()
      setTemplates(result || [])
    } catch (error) {
      console.error("Failed to load templates:", error)
      toast({
        title: t("error"),
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadCategories = useCallback(async () => {
    try {
      const result = await GetTemplateCategories()
      setCategories(result || [])
    } catch (error) {
      console.error("Failed to load categories:", error)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
    loadCategories()
    GetSupportedAgents().then(a => setAgents(a || [])).catch(() => {})
  }, [loadTemplates, loadCategories])

  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
      const matchesLanguage = selectedLanguage === "all" || template.language === selectedLanguage
      return matchesSearch && matchesCategory && matchesLanguage
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name)
        case "downloads": return (b.downloads || 0) - (a.downloads || 0)
        case "date": return 0
        case "rating":
        default: return (b.rating || 0) - (a.rating || 0)
      }
    })

  const languages = Array.from(new Set(templates.map(t => t.language).filter(Boolean)))

  const handleCreateTemplate = async () => {
    try {
      const tpl = new services.EnhancedSkillTemplate({
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        language: newTemplate.language,
        framework: newTemplate.framework,
        content: newTemplate.content,
        tags: newTemplate.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        isBuiltIn: false,
        author: "Custom",
        rating: 0,
        downloads: 0,
        version: "1.0.0",
        repository: "",
      })
      await CreateCustomTemplate(tpl)
      toast({ title: t("success"), description: t("template-created-successfully") })
      setShowCreateDialog(false)
      setNewTemplate({ name: "", description: "", category: "", language: "", framework: "", content: "", tags: "" })
      loadTemplates()
    } catch (error) {
      console.error("Failed to create template:", error)
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    }
  }

  const handleUseTemplate = async (template: services.EnhancedSkillTemplate) => {
    setUseTarget(template)
    setUseSkillName(template.name)
    setUseSkillDesc(template.description)
    setSelectedAgents(agents.map(a => a.name))
    setShowUseDialog(true)
  }

  const handleConfirmUseTemplate = async () => {
    if (!useTarget || !useSkillName.trim()) return
    try {
      setCreating(true)
      await CreateSkill(useSkillName.trim(), useSkillDesc, useTarget.name, selectedAgents)
      toast({ title: t("success"), description: t("toast-skill-created", { name: useSkillName.trim() }) })
      setShowUseDialog(false)
      setUseTarget(null)
    } catch (error) {
      toast({ title: t("error"), description: String(error), variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handlePreview = (template: services.EnhancedSkillTemplate) => {
    setPreviewTemplate(template)
    setShowPreviewDialog(true)
  }

  const toggleAgent = (name: string) => {
    setSelectedAgents(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    )
  }

  const renderTemplateCard = (template: services.EnhancedSkillTemplate) => (
    <Card key={template.name} className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {template.name}
              {template.isBuiltIn && (
                <Badge variant="secondary" className="text-xs">{t("built-in")}</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{template.description}</CardDescription>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Stairs01Icon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{(template.rating || 0).toFixed(1)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            {template.language && (
              <Badge variant="outline" className="text-xs">
                <CodeIcon className="h-3 w-3 mr-1" />{template.language}
              </Badge>
            )}
            {template.framework && (
              <Badge variant="outline" className="text-xs">
                <FrameworksIcon className="h-3 w-3 mr-1" />{template.framework}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {(template.tags || []).slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag01Icon className="h-3 w-3 mr-1" />{tag}
              </Badge>
            ))}
            {(template.tags || []).length > 3 && (
              <Badge variant="secondary" className="text-xs">+{template.tags.length - 3}</Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Download04Icon className="h-4 w-4" />{(template.downloads || 0).toLocaleString()}
              </span>
              <span>{template.author}</span>
            </div>
            <span className="text-xs">v{template.version}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={() => handleUseTemplate(template)}>
              {t("use-template")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handlePreview(template)}>
              <ViewIcon className="h-4 w-4 mr-1" />{t("preview")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderTemplateList = (template: services.EnhancedSkillTemplate) => (
    <Card key={template.name} className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {template.name}
                  {template.isBuiltIn && (
                    <Badge variant="secondary" className="text-xs">{t("built-in")}</Badge>
                  )}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{template.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Stairs01Icon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {(template.rating || 0).toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download04Icon className="h-4 w-4" />{(template.downloads || 0).toLocaleString()}
                  </span>
                  <span>{template.author}</span>
                  <span>v{template.version}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {template.language && <Badge variant="outline" className="text-xs">{template.language}</Badge>}
                {template.framework && <Badge variant="outline" className="text-xs">{template.framework}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button size="sm" variant="outline" onClick={() => handlePreview(template)}>
              <ViewIcon className="h-4 w-4 mr-1" />{t("preview")}
            </Button>
            <Button size="sm" onClick={() => handleUseTemplate(template)}>{t("use-template")}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Add01Icon className="h-4 w-4 mr-2" />{t("create-template")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("create-custom-template")}</DialogTitle>
              <DialogDescription>{t("create-template-desc")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("template-name")}</Label>
                  <Input value={newTemplate.name} onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))} placeholder={t("template-name-placeholder")} />
                </div>
                <div>
                  <Label>{t("category")}</Label>
                  <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger><SelectValue placeholder={t("select-category")} /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.name} value={c.name}>{c.icon} {c.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{t("description")}</Label>
                <Input value={newTemplate.description} onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))} placeholder={t("template-description-placeholder")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("language")}</Label>
                  <Input value={newTemplate.language} onChange={(e) => setNewTemplate(prev => ({ ...prev, language: e.target.value }))} placeholder="TypeScript" />
                </div>
                <div>
                  <Label>{t("framework")}</Label>
                  <Input value={newTemplate.framework} onChange={(e) => setNewTemplate(prev => ({ ...prev, framework: e.target.value }))} placeholder="React" />
                </div>
              </div>
              <div>
                <Label>{t("tags")}</Label>
                <Input value={newTemplate.tags} onChange={(e) => setNewTemplate(prev => ({ ...prev, tags: e.target.value }))} placeholder={t("tags-placeholder")} />
              </div>
              <div>
                <Label>{t("template-content")}</Label>
                <Textarea value={newTemplate.content} onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))} placeholder={t("template-content-placeholder")} rows={8} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{t("cancel")}</Button>
                <Button onClick={handleCreateTemplate}>{t("create-template")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">{t("all-categories")}</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category.name} value={category.name}>
              {category.icon} {t(category.name)} ({category.count})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search01Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("search-templates-placeholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t("all-languages")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all-languages")}</SelectItem>
            {languages.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">{t("sort-by-rating")}</SelectItem>
            <SelectItem value="downloads">{t("sort-by-downloads")}</SelectItem>
            <SelectItem value="date">{t("sort-by-date")}</SelectItem>
            <SelectItem value="name">{t("sort-by-name")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center border rounded-md">
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-r-none">
            <Grid02Icon className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-l-none">
            <Xls02Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("no-templates-found")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("try-different-search")}</p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {filteredTemplates.map(template => viewMode === "grid" ? renderTemplateCard(template) : renderTemplateList(template))}
        </div>
      )}

      {/* Use Template Dialog */}
      <Dialog open={showUseDialog} onOpenChange={setShowUseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tpl-use-title")}</DialogTitle>
            <DialogDescription>{t("tpl-use-desc", { name: useTarget?.name || "" })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("skill-name")}</Label>
              <Input
                value={useSkillName}
                onChange={(e) => setUseSkillName(e.target.value)}
                placeholder={t("skill-name-placeholder")}
              />
            </div>
            <div>
              <Label>{t("skill-description")}</Label>
              <Input
                value={useSkillDesc}
                onChange={(e) => setUseSkillDesc(e.target.value)}
                placeholder={t("skill-description-placeholder")}
              />
            </div>
            <div>
              <Label>{t("select-target-agent")}</Label>
              <ScrollArea className="h-36 border rounded-md p-2 mt-1">
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
              <Button variant="outline" onClick={() => setShowUseDialog(false)}>{t("cancel")}</Button>
              <Button onClick={handleConfirmUseTemplate} disabled={creating || !useSkillName.trim()}>
                {creating ? t("creating") : t("tpl-confirm-create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ViewIcon className="h-5 w-5" />
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {previewTemplate.language && <Badge variant="outline"><CodeIcon className="h-3 w-3 mr-1" />{previewTemplate.language}</Badge>}
                {previewTemplate.framework && <Badge variant="outline"><FrameworksIcon className="h-3 w-3 mr-1" />{previewTemplate.framework}</Badge>}
                {(previewTemplate.tags || []).map(tag => (
                  <Badge key={tag} variant="secondary"><Tag01Icon className="h-3 w-3 mr-1" />{tag}</Badge>
                ))}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-4">
                <span>{previewTemplate.author}</span>
                <span>v{previewTemplate.version}</span>
                <span className="flex items-center gap-1">
                  <Stairs01Icon className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {(previewTemplate.rating || 0).toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Download04Icon className="h-3.5 w-3.5" />
                  {(previewTemplate.downloads || 0).toLocaleString()}
                </span>
              </div>
              <ScrollArea className="h-[400px] border rounded-md">
                <pre className="p-4 text-sm whitespace-pre-wrap font-mono">{previewTemplate.content}</pre>
              </ScrollArea>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>{t("cancel")}</Button>
                <Button onClick={() => { setShowPreviewDialog(false); handleUseTemplate(previewTemplate) }}>
                  {t("use-template")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TemplateMarketPage
