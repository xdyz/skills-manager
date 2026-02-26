import { createHashRouter } from "react-router-dom"
import PageLayout from "../pages/layout"
import HomePage from "../pages/home"
import SkillsPage from "../pages/skills"
import SkillDetailPage from "../pages/skills/detail"
import SkillEditPage from "../pages/skills/edit"
import AgentsPage from "../pages/agents"
import ProjectsPage from "../pages/projects"
import SettingsPage from "../pages/settings"
import CollectionsPage from "../pages/collections"
const routes = createHashRouter([
  {
    path: "/",
    element: <PageLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: "home",
        element: <HomePage />
      },
      {
        path: "skills",
        element: <SkillsPage />
      },
      {
        path: "skills/detail",
        element: <SkillDetailPage />
      },
      {
        path: "skills/edit",
        element: <SkillEditPage />
      },
      {
        path: "agents",
        element: <AgentsPage />
      },
      {
        path: "projects",
        element: <ProjectsPage />
      },
      {
        path: "settings",
        element: <SettingsPage />
      },

      {
        path: "collections",
        element: <CollectionsPage />
      }
    ]
  }
])

export default routes
