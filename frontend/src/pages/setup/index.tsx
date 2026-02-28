import { useState } from "react"
import { useTranslation } from "react-i18next"
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
import { InstallSkillsCLI, RefreshEnv } from "@wailsjs/go/services/EnvService"
import { BrowserOpenURL } from "@wailsjs/runtime/runtime"
import Logo from "@/components/Logo"

interface EnvStatus {
  npxInstalled: boolean
  skillsInstalled: boolean
  nodeVersion: string
  npxVersion: string
}

interface SetupPageProps {
  envStatus: EnvStatus
  onEnvReady: () => void
}

const SetupPage = ({ envStatus, onEnvReady }: SetupPageProps) => {
  const { t } = useTranslation()
  const [status, setStatus] = useState<EnvStatus>(envStatus)
  const [installingSkills, setInstallingSkills] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recheck = async () => {
    setChecking(true)
    setError(null)
    try {
      const result = await RefreshEnv()
      setStatus(result)
      if (result.npxInstalled && result.skillsInstalled) {
        onEnvReady()
      }
    } catch (e) {
      setError(t("check-failed", { error: e }))
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

  const allReady = status.npxInstalled && status.skillsInstalled

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-background">
      <div className="w-full max-w-lg px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4">
            <Logo size={56} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Hub</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("setup-deps-required")}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t("env-check")}</CardTitle>
            <CardDescription>{t("env-check-desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {status.npxInstalled ? (
                  <CheckmarkCircle02Icon size={20} className="text-green-500" />
                ) : (
                  <Cancel01Icon size={20} className="text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">Node.js & npx</p>
                  <p className="text-xs text-muted-foreground">{t("js-runtime")}</p>
                </div>
              </div>
              {status.npxInstalled ? (
                <Badge variant="secondary" className="text-xs">
                  {status.nodeVersion}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">{t("not-installed")}</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {status.skillsInstalled ? (
                  <CheckmarkCircle02Icon size={20} className="text-green-500" />
                ) : (
                  <Cancel01Icon size={20} className="text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">Skills CLI</p>
                  <p className="text-xs text-muted-foreground">{t("skills-cli-tool")}</p>
                </div>
              </div>
              {status.skillsInstalled ? (
                <Badge variant="secondary" className="text-xs">{t("installed")}</Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={handleInstallSkills}
                  disabled={!status.npxInstalled || installingSkills}
                >
                  {installingSkills ? (
                    <>
                      <RefreshIcon size={14} className="mr-1.5 animate-spin" />
                      {t("installing")}
                    </>
                  ) : (
                    <>
                      <Download01Icon size={14} className="mr-1.5" />
                      {t("install")}
                    </>
                  )}
                </Button>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 text-sm border rounded-lg border-destructive/50 bg-destructive/5 text-destructive">
                <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
                <p className="break-all">{error}</p>
              </div>
            )}

            {!status.npxInstalled && (
              <div className="flex items-start gap-2 p-3 text-sm border rounded-lg border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
                <p>
                  {t("install-node-hint")}{" "}
                  <span className="font-medium underline cursor-pointer" onClick={() => BrowserOpenURL("https://nodejs.org")}>
                    nodejs.org
                  </span>{" "}
                  {t("install-node-hint-suffix")}
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
                {t("checking")}
              </>
            ) : (
              <>
                <RefreshIcon size={16} className="mr-2" />
                {t("recheck")}
              </>
            )}
          </Button>
          {allReady && (
            <Button onClick={onEnvReady}>
              {t("enter-app")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SetupPage
