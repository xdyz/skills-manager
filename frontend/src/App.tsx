import { useState, useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [envReady, setEnvReady] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkEnvironment()
  }, [])

  const checkEnvironment = async () => {
    setLoading(true)
    try {
      // 用 Promise.race 加超时保护，最多等 8 秒
      const timeout = new Promise<EnvStatus>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000)
      )
      const status = await Promise.race([RefreshEnv(), timeout]) as EnvStatus
      setEnvStatus(status)
      if (status.npxInstalled && status.skillsInstalled) {
        setEnvReady(true)
      }
    } catch (e) {
      console.error("环境检查失败:", e)
      // 超时或失败时，尝试用缓存的 CheckEnv 结果
      try {
        const { CheckEnv } = await import("@wailsjs/go/services/EnvService")
        const cached = await CheckEnv() as EnvStatus
        setEnvStatus(cached)
        if (cached.npxInstalled && cached.skillsInstalled) {
          setEnvReady(true)
          return
        }
      } catch {}
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
          <p className="text-sm text-muted-foreground">{t("checking-env")}</p>
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
