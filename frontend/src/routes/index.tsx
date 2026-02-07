import React from "react";
import { createHashRouter } from "react-router-dom";
import PageLayout from "../pages/layout";
import HomePage from "../pages/home";
import SkillsPage from "../pages/skills";


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
      }
    ]
  }
])

export default routes