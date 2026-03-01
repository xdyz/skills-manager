import { lazy, Suspense } from "react"
import { createHashRouter } from "react-router-dom"
import PageLayout from "../pages/layout"

const HomePage = lazy(() => import("../pages/home"))
const SkillsPage = lazy(() => import("../pages/skills"))
const SkillDetailPage = lazy(() => import("../pages/skills/detail"))
const SkillEditPage = lazy(() => import("../pages/skills/edit"))
const SkillFilesPage = lazy(() => import("../pages/skills/files"))
const AgentsPage = lazy(() => import("../pages/agents"))
const ProjectsPage = lazy(() => import("../pages/projects"))
const SettingsPage = lazy(() => import("../pages/settings"))

const DiscoverPage = lazy(() => import("../pages/discover"))

const ProvidersPage = lazy(() => import("../pages/providers"))
const ProviderFormPage = lazy(() => import("../pages/providers/form"))

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
        path: "skills/files",
        element: withSuspense(SkillFilesPage)
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
        path: "discover",
        element: withSuspense(DiscoverPage)
      },

      {
        path: "providers",
        element: withSuspense(ProvidersPage)
      },
      {
        path: "providers/add",
        element: withSuspense(ProviderFormPage)
      },
      {
        path: "providers/edit",
        element: withSuspense(ProviderFormPage)
      }
    ]
  }
])

export default routes
