import { lazy, Suspense } from "react"
import { createHashRouter } from "react-router-dom"
import PageLayout from "../pages/layout"

const HomePage = lazy(() => import("../pages/home"))
const SkillsPage = lazy(() => import("../pages/skills"))
const SkillDetailPage = lazy(() => import("../pages/skills/detail"))
const SkillEditPage = lazy(() => import("../pages/skills/edit"))
const AgentsPage = lazy(() => import("../pages/agents"))
const ProjectsPage = lazy(() => import("../pages/projects"))
const SettingsPage = lazy(() => import("../pages/settings"))
const CollectionsPage = lazy(() => import("../pages/collections"))
const DiscoverPage = lazy(() => import("../pages/discover"))
const AnalysisPage = lazy(() => import("../pages/analysis"))

const PageFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
    </div>
  </div>
)

const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<PageFallback />}>
    <Component />
  </Suspense>
)

const routes = createHashRouter([
  {
    path: "/",
    element: <PageLayout />,
    children: [
      {
        index: true,
        element: withSuspense(HomePage)
      },
      {
        path: "home",
        element: withSuspense(HomePage)
      },
      {
        path: "skills",
        element: withSuspense(SkillsPage)
      },
      {
        path: "skills/detail",
        element: withSuspense(SkillDetailPage)
      },
      {
        path: "skills/edit",
        element: withSuspense(SkillEditPage)
      },
      {
        path: "agents",
        element: withSuspense(AgentsPage)
      },
      {
        path: "projects",
        element: withSuspense(ProjectsPage)
      },
      {
        path: "settings",
        element: withSuspense(SettingsPage)
      },
      {
        path: "collections",
        element: withSuspense(CollectionsPage)
      },
      {
        path: "discover",
        element: withSuspense(DiscoverPage)
      },
      {
        path: "analysis",
        element: withSuspense(AnalysisPage)
      }
    ]
  }
])

export default routes
