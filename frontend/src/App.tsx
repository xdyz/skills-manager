import { useState, useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import routes from "./routes"
import SetupPage from "./pages/setup"
import Logo from "./components/Logo"
import { RefreshEnv } from "@wailsjs/go/services/EnvService"

interface EnvStatus {
  npxInstalled: boolean
  skillsInstalled: boolean
  nodeVersion: string
  npxVersion: string
}

const App = () => {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [envReady, setEnvReady] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkEnvironment()
  }, [])

  const checkEnvironment = async () => {
    setLoading(true)
    try {
      const [status] = await Promise.all([
        RefreshEnv(),
        new Promise(resolve => setTimeout(resolve, 500)), // 最少显示 500ms loading
      ])
      setEnvStatus(status as EnvStatus)
      const s = status as EnvStatus
      if (s.npxInstalled && s.skillsInstalled) {
        setEnvReady(true)
      }
    } catch (e) {
      console.error("环境检查失败:", e)
      setEnvStatus({
        npxInstalled: false,
        skillsInstalled: false,
        nodeVersion: "",
        npxVersion: "",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-background">
        <div className="text-center">
          <div className="flex justify-center mb-4 animate-pulse">
            <Logo size={56} />
          </div>
          <p className="text-sm text-muted-foreground">正在检查运行环境...</p>
        </div>
      </div>
    )
  }

  if (!envReady && envStatus) {
    return <SetupPage envStatus={envStatus} onEnvReady={() => setEnvReady(true)} />
  }

  return <RouterProvider router={routes} />
}

export default App
