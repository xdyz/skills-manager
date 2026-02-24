import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Download01Icon,
  RefreshIcon,
  AlertCircleIcon,
} from "hugeicons-react"
import { InstallSkillsCLI, InstallFindSkillsPlus, RefreshEnv } from "@wailsjs/go/services/EnvService"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"
import Logo from "@/components/Logo"

interface EnvStatus {
  npxInstalled: boolean
  skillsInstalled: boolean
  findSkillsPlusInstalled: boolean
  nodeVersion: string
  npxVersion: string
}

interface SetupPageProps {
  envStatus: EnvStatus
  onEnvReady: () => void
}

const SetupPage = ({ envStatus, onEnvReady }: SetupPageProps) => {
  const [status, setStatus] = useState<EnvStatus>(envStatus)
  const [installingSkills, setInstallingSkills] = useState(false)
  const [installingPlus, setInstallingPlus] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recheck = async () => {
    setChecking(true)
    setError(null)
    try {
      const result = await RefreshEnv()
      setStatus(result)
      if (result.npxInstalled && result.skillsInstalled && result.findSkillsPlusInstalled) {
        onEnvReady()
      }
    } catch (e) {
      setError(`检查失败: ${e}`)
    } finally {
      setChecking(false)
    }
  }

  const handleInstallSkills = async () => {
    setInstallingSkills(true)
    setError(null)
    try {
      await InstallSkillsCLI()
      await recheck()
    } catch (e) {
      setError(`${e}`)
    } finally {
      setInstallingSkills(false)
    }
  }

  const handleInstallPlus = async () => {
    setInstallingPlus(true)
    setError(null)
    try {
      await InstallFindSkillsPlus()
      await recheck()
    } catch (e) {
      setError(`${e}`)
    } finally {
      setInstallingPlus(false)
    }
  }

  const allReady = status.npxInstalled && status.skillsInstalled && status.findSkillsPlusInstalled

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-background">
      <div className="w-full max-w-lg px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4">
            <Logo size={56} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Skills Manager</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            应用需要以下依赖才能正常运行，请确保它们已安装
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">环境检查</CardTitle>
            <CardDescription>检测必要的运行依赖</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Node.js / npx */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {status.npxInstalled ? (
                  <CheckmarkCircle02Icon size={20} className="text-green-500" />
                ) : (
                  <Cancel01Icon size={20} className="text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">Node.js & npx</p>
                  <p className="text-xs text-muted-foreground">JavaScript 运行时环境</p>
                </div>
              </div>
              {status.npxInstalled ? (
                <Badge variant="secondary" className="text-xs">
                  {status.nodeVersion}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">未安装</Badge>
              )}
            </div>

            {/* Skills CLI */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {status.skillsInstalled ? (
                  <CheckmarkCircle02Icon size={20} className="text-green-500" />
                ) : (
                  <Cancel01Icon size={20} className="text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">Skills CLI</p>
                  <p className="text-xs text-muted-foreground">技能管理命令行工具</p>
                </div>
              </div>
              {status.skillsInstalled ? (
                <Badge variant="secondary" className="text-xs">已安装</Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={handleInstallSkills}
                  disabled={!status.npxInstalled || installingSkills}
                >
                  {installingSkills ? (
                    <>
                      <RefreshIcon size={14} className="mr-1.5 animate-spin" />
                      安装中...
                    </>
                  ) : (
                    <>
                      <Download01Icon size={14} className="mr-1.5" />
                      安装
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* find-skills-plus */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {status.findSkillsPlusInstalled ? (
                  <CheckmarkCircle02Icon size={20} className="text-green-500" />
                ) : (
                  <Cancel01Icon size={20} className="text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">find-skills-plus</p>
                  <p className="text-xs text-muted-foreground">增强版技能搜索（带描述）</p>
                </div>
              </div>
              {status.findSkillsPlusInstalled ? (
                <Badge variant="secondary" className="text-xs">已安装</Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={handleInstallPlus}
                  disabled={!status.skillsInstalled || installingPlus}
                >
                  {installingPlus ? (
                    <>
                      <RefreshIcon size={14} className="mr-1.5 animate-spin" />
                      安装中...
                    </>
                  ) : (
                    <>
                      <Download01Icon size={14} className="mr-1.5" />
                      安装
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="flex items-start gap-2 p-3 text-sm border rounded-lg border-destructive/50 bg-destructive/5 text-destructive">
                <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
                <p className="break-all">{error}</p>
              </div>
            )}

            {/* Node.js 未安装提示 */}
            {!status.npxInstalled && (
              <div className="flex items-start gap-2 p-3 text-sm border rounded-lg border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
                <p>
                  请先安装 Node.js：访问{" "}
                  <span className="font-medium underline cursor-pointer" onClick={() => BrowserOpenURL("https://nodejs.org")}>
                    nodejs.org
                  </span>{" "}
                  下载安装后，重新检查。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" onClick={recheck} disabled={checking}>
            {checking ? (
              <>
                <RefreshIcon size={16} className="mr-2 animate-spin" />
                检查中...
              </>
            ) : (
              <>
                <RefreshIcon size={16} className="mr-2" />
                重新检查
              </>
            )}
          </Button>
          {allReady && (
            <Button onClick={onEnvReady}>
              进入应用 →
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SetupPage
