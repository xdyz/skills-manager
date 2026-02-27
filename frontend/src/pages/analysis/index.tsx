import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitBranchIcon, ChartLineData01Icon } from "hugeicons-react"

import DependenciesPage from "../dependencies"
import MonitoringPage from "../monitoring"

const AnalysisPage = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("dependencies")

  return (
    <div className="flex flex-col h-full w-full">
      <div className="shrink-0 px-6 pt-5 pb-0 border-b border-border/50">
        <h1 className="text-lg font-semibold tracking-tight text-foreground/90">{t("analysis-title")}</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5 mb-3">{t("analysis-desc")}</p>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9">
            <TabsTrigger value="dependencies" className="text-[12px] gap-1.5">
              <GitBranchIcon size={13} />
              {t("dep-nav")}
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="text-[12px] gap-1.5">
              <ChartLineData01Icon size={13} />
              {t("mon-nav")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "dependencies" && <DependenciesPage />}
        {activeTab === "monitoring" && <MonitoringPage />}
      </div>
    </div>
  )
}

export default AnalysisPage
