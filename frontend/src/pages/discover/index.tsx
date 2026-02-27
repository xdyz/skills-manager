import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store01Icon, AiBrain01Icon, Github01Icon } from "hugeicons-react"

// Lazy-loaded sub-pages as inline components
import TemplateMarketPage from "../templates"
import RecommendationsPage from "../recommendations"
import ImportRepoPage from "../import-repo"

const DiscoverPage = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("templates")

  return (
    <div className="flex flex-col h-full w-full">
      <div className="shrink-0 px-6 pt-5 pb-0 border-b border-border/50">
        <h1 className="text-lg font-semibold tracking-tight text-foreground/90">{t("discover-title")}</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5 mb-3">{t("discover-desc")}</p>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9">
            <TabsTrigger value="templates" className="text-[12px] gap-1.5">
              <Store01Icon size={13} />
              {t("template-market")}
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-[12px] gap-1.5">
              <AiBrain01Icon size={13} />
              {t("rec-nav")}
            </TabsTrigger>
            <TabsTrigger value="import-repo" className="text-[12px] gap-1.5">
              <Github01Icon size={13} />
              {t("repo-nav")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "templates" && <TemplateMarketPage />}
        {activeTab === "recommendations" && <RecommendationsPage />}
        {activeTab === "import-repo" && <ImportRepoPage />}
      </div>
    </div>
  )
}

export default DiscoverPage
