import { createHashRouter } from "react-router-dom"
import PageLayout from "../pages/layout"
import HomePage from "../pages/home"
import SkillsPage from "../pages/skills"
import AgentsPage from "../pages/agents"
import ProjectsPage from "../pages/projects"
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
        path: "skills",
        element: <SkillsPage />
      },
      {
        path: "agents",
        element: <AgentsPage />
      },
      {
        path: "projects",
        element: <ProjectsPage />
      }
    ]
  }
])

export default routes
