import { createHashRouter } from "react-router-dom"
import PageLayout from "../pages/layout"
import HomePage from "../pages/home"
import SkillsPage from "../pages/skills"
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
        path: "home",
        element: <HomePage />
      },
      {
        path: "skills",
        element: <SkillsPage />
      },
      {
        path: "projects",
        element: <ProjectsPage />
      }
    ]
  }
])

export default routes
