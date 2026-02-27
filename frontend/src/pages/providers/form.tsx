import { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import {
  ArrowLeft02Icon,
  Add01Icon,
  RefreshIcon,
  ViewIcon,
  ViewOffIcon,
} from "hugeicons-react"
import {
  AddProvider,
  UpdateProvider,
  GetAllProviders,
  SwitchProvider,
} from "@wailsjs/go/services/ProviderService"

type AppType = "claude-code" | "codex" | "gemini-cli" | "codebuddy-cli"

// ===== Preset Provider Definitions =====

interface PresetProvider {
  id: string
  name: string
  webUrl: string
  baseUrl: string
  icon?: string
  sponsored?: boolean
  appTypes: AppType[]
  // Default models for auto-fill
  defaultModel?: string       // Claude Code: main model; Codex/Gemini: model
  defaultModels?: {           // Claude Code only: haiku/sonnet/opus defaults
    haiku?: string
    sonnet?: string
    opus?: string
  }
}

const CLAUDE_PRESETS: PresetProvider[] = [
  { id: "custom", name: "自定义配置", webUrl: "", baseUrl: "", appTypes: ["claude-code"] },
  { id: "claude-official", name: "Claude Official", webUrl: "https://www.anthropic.com/claude-code", baseUrl: "", appTypes: ["claude-code"] },
  { id: "deepseek", name: "DeepSeek", webUrl: "https://platform.deepseek.com", baseUrl: "https://api.deepseek.com/anthropic", appTypes: ["claude-code"], defaultModel: "DeepSeek-V3.2", defaultModels: { haiku: "DeepSeek-V3.2", sonnet: "DeepSeek-V3.2", opus: "DeepSeek-V3.2" } },
  { id: "zhipu-glm", name: "Zhipu GLM", webUrl: "https://open.bigmodel.cn", baseUrl: "https://open.bigmodel.cn/api/anthropic", appTypes: ["claude-code"], defaultModel: "glm-5", defaultModels: { haiku: "glm-5", sonnet: "glm-5", opus: "glm-5" } },
  { id: "zhipu-glm-en", name: "Zhipu GLM en", webUrl: "https://z.ai", baseUrl: "https://api.z.ai/api/anthropic", appTypes: ["claude-code"], defaultModel: "glm-5", defaultModels: { haiku: "glm-5", sonnet: "glm-5", opus: "glm-5" } },
  { id: "bailian", name: "Bailian", webUrl: "https://bailian.console.aliyun.com", baseUrl: "https://dashscope.aliyuncs.com/apps/anthropic", appTypes: ["claude-code"] },
  { id: "kimi", name: "Kimi", webUrl: "https://platform.moonshot.cn/console", baseUrl: "https://api.moonshot.cn/anthropic", appTypes: ["claude-code"], defaultModel: "kimi-k2.5", defaultModels: { haiku: "kimi-k2.5", sonnet: "kimi-k2.5", opus: "kimi-k2.5" } },
  { id: "kimi-coding", name: "Kimi For Coding", webUrl: "https://www.kimi.com/coding/docs/", baseUrl: "https://api.kimi.com/coding/", appTypes: ["claude-code"] },
  { id: "modelscope", name: "ModelScope", webUrl: "https://modelscope.cn", baseUrl: "https://api-inference.modelscope.cn", appTypes: ["claude-code"], defaultModel: "ZhipuAI/GLM-5", defaultModels: { haiku: "ZhipuAI/GLM-5", sonnet: "ZhipuAI/GLM-5", opus: "ZhipuAI/GLM-5" } },
  { id: "kat-coder", name: "KAT-Coder", webUrl: "https://console.streamlake.ai", baseUrl: "", appTypes: ["claude-code"], defaultModel: "KAT-Coder-Pro V1", defaultModels: { haiku: "KAT-Coder-Air V1", sonnet: "KAT-Coder-Pro V1", opus: "KAT-Coder-Pro V1" } },
  { id: "longcat", name: "Longcat", webUrl: "https://longcat.chat/platform", baseUrl: "https://api.longcat.chat/anthropic", appTypes: ["claude-code"], defaultModel: "LongCat-Flash-Chat", defaultModels: { haiku: "LongCat-Flash-Chat", sonnet: "LongCat-Flash-Chat", opus: "LongCat-Flash-Chat" } },
  { id: "minimax", name: "MiniMax", webUrl: "https://platform.minimaxi.com", baseUrl: "https://api.minimaxi.com/anthropic", sponsored: true, appTypes: ["claude-code"], defaultModel: "MiniMax-M2.5", defaultModels: { haiku: "MiniMax-M2.5", sonnet: "MiniMax-M2.5", opus: "MiniMax-M2.5" } },
  { id: "minimax-en", name: "MiniMax en", webUrl: "https://platform.minimax.io", baseUrl: "https://api.minimax.io/anthropic", sponsored: true, appTypes: ["claude-code"], defaultModel: "MiniMax-M2.5", defaultModels: { haiku: "MiniMax-M2.5", sonnet: "MiniMax-M2.5", opus: "MiniMax-M2.5" } },
  { id: "doubao-seed", name: "DouBaoSeed", webUrl: "https://www.volcengine.com/product/doubao", baseUrl: "https://ark.cn-beijing.volces.com/api/coding", appTypes: ["claude-code"], defaultModel: "doubao-seed-2-0-code-preview-latest", defaultModels: { haiku: "doubao-seed-2-0-code-preview-latest", sonnet: "doubao-seed-2-0-code-preview-latest", opus: "doubao-seed-2-0-code-preview-latest" } },
  { id: "bailing", name: "BaiLing", webUrl: "https://alipaytbox.yuque.com/sxs0ba/ling/get_started", baseUrl: "https://api.tbox.cn/api/anthropic", appTypes: ["claude-code"], defaultModel: "Ling-2.5-1T", defaultModels: { haiku: "Ling-2.5-1T", sonnet: "Ling-2.5-1T", opus: "Ling-2.5-1T" } },
  { id: "xiaomi-mimo", name: "Xiaomi MiMo", webUrl: "https://platform.xiaomimimo.com", baseUrl: "https://api.xiaomimimo.com/anthropic", appTypes: ["claude-code"], defaultModel: "mimo-v2-flash", defaultModels: { haiku: "mimo-v2-flash", sonnet: "mimo-v2-flash", opus: "mimo-v2-flash" } },
  { id: "aihubmix", name: "AIHubMix", webUrl: "https://aihubmix.com", baseUrl: "https://aihubmix.com", appTypes: ["claude-code"] },
  { id: "siliconflow", name: "SiliconFlow", webUrl: "https://siliconflow.cn", baseUrl: "https://api.siliconflow.cn", appTypes: ["claude-code"], defaultModel: "Pro/MiniMaxAI/MiniMax-M2.5", defaultModels: { haiku: "Pro/MiniMaxAI/MiniMax-M2.5", sonnet: "Pro/MiniMaxAI/MiniMax-M2.5", opus: "Pro/MiniMaxAI/MiniMax-M2.5" } },
  { id: "siliconflow-en", name: "SiliconFlow en", webUrl: "https://siliconflow.com", baseUrl: "https://api.siliconflow.com", appTypes: ["claude-code"], defaultModel: "MiniMaxAI/MiniMax-M2.5", defaultModels: { haiku: "MiniMaxAI/MiniMax-M2.5", sonnet: "MiniMaxAI/MiniMax-M2.5", opus: "MiniMaxAI/MiniMax-M2.5" } },
  { id: "dmxapi", name: "DMXAPI", webUrl: "https://www.dmxapi.cn", baseUrl: "https://www.dmxapi.cn", sponsored: true, appTypes: ["claude-code"] },
  { id: "packycode", name: "PackyCode", webUrl: "https://www.packyapi.com", baseUrl: "https://www.packyapi.com", sponsored: true, appTypes: ["claude-code"] },
  { id: "cubence", name: "Cubence", webUrl: "https://cubence.com", baseUrl: "https://api.cubence.com", sponsored: true, appTypes: ["claude-code"] },
  { id: "aigocode", name: "AIGoCode", webUrl: "https://aigocode.com", baseUrl: "https://api.aigocode.com", sponsored: true, appTypes: ["claude-code"] },
  { id: "rightcode", name: "RightCode", webUrl: "https://www.right.codes", baseUrl: "https://www.right.codes/claude", sponsored: true, appTypes: ["claude-code"] },
  { id: "aicodemirror", name: "AICodeMirror", webUrl: "https://www.aicodemirror.com", baseUrl: "https://api.aicodemirror.com/api/claudecode", sponsored: true, appTypes: ["claude-code"] },
  { id: "aicoding", name: "AICoding", webUrl: "https://www.aicoding.sh", baseUrl: "https://api.aicoding.sh", sponsored: true, appTypes: ["claude-code"] },
  { id: "crazyrouter", name: "CrazyRouter", webUrl: "https://www.crazyrouter.com", baseUrl: "https://crazyrouter.com", sponsored: true, appTypes: ["claude-code"] },
  { id: "sssaicode", name: "SSSAiCode", webUrl: "https://www.sssaicode.com", baseUrl: "https://node-hk.sssaicode.com/api", sponsored: true, appTypes: ["claude-code"] },
  { id: "openrouter", name: "OpenRouter", webUrl: "https://openrouter.ai", baseUrl: "https://openrouter.ai/api", appTypes: ["claude-code"], defaultModel: "anthropic/claude-sonnet-4.6", defaultModels: { haiku: "anthropic/claude-haiku-4.5", sonnet: "anthropic/claude-sonnet-4.6", opus: "anthropic/claude-opus-4.6" } },
  { id: "nvidia", name: "Nvidia", webUrl: "https://build.nvidia.com", baseUrl: "https://integrate.api.nvidia.com", appTypes: ["claude-code"], defaultModel: "moonshotai/kimi-k2.5", defaultModels: { haiku: "moonshotai/kimi-k2.5", sonnet: "moonshotai/kimi-k2.5", opus: "moonshotai/kimi-k2.5" } },
  { id: "aws-bedrock-aksk", name: "AWS Bedrock (AKSK)", webUrl: "https://aws.amazon.com/bedrock/", baseUrl: "", appTypes: ["claude-code"], defaultModel: "global.anthropic.claude-opus-4-6-v1", defaultModels: { haiku: "global.anthropic.claude-haiku-4-5-20251001-v1:0", sonnet: "global.anthropic.claude-sonnet-4-6", opus: "global.anthropic.claude-opus-4-6-v1" } },
  { id: "aws-bedrock-apikey", name: "AWS Bedrock (API Key)", webUrl: "https://aws.amazon.com/bedrock/", baseUrl: "", appTypes: ["claude-code"], defaultModel: "global.anthropic.claude-opus-4-6-v1", defaultModels: { haiku: "global.anthropic.claude-haiku-4-5-20251001-v1:0", sonnet: "global.anthropic.claude-sonnet-4-6", opus: "global.anthropic.claude-opus-4-6-v1" } },
]

const CODEX_PRESETS: PresetProvider[] = [
  { id: "custom", name: "自定义配置", webUrl: "", baseUrl: "", appTypes: ["codex"] },
  { id: "openai-official", name: "OpenAI Official", webUrl: "https://chatgpt.com/codex", baseUrl: "", appTypes: ["codex"] },
  { id: "azure-openai", name: "Azure OpenAI", webUrl: "https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/codex", baseUrl: "", appTypes: ["codex"], defaultModel: "gpt-5.2" },
  { id: "aihubmix", name: "AIHubMix", webUrl: "https://aihubmix.com", baseUrl: "https://aihubmix.com/v1", appTypes: ["codex"], defaultModel: "gpt-5.2" },
  { id: "dmxapi", name: "DMXAPI", webUrl: "https://www.dmxapi.cn", baseUrl: "https://www.dmxapi.cn/v1", sponsored: true, appTypes: ["codex"], defaultModel: "gpt-5.2" },
  { id: "packycode", name: "PackyCode", webUrl: "https://www.packyapi.com", baseUrl: "https://www.packyapi.com/v1", sponsored: true, appTypes: ["codex"], defaultModel: "gpt-5.2" },
  { id: "cubence", name: "Cubence", webUrl: "https://cubence.com", baseUrl: "https://api.cubence.com/v1", sponsored: true, appTypes: ["codex"], defaultModel: "gpt-5.2" },
  { id: "aigocode", name: "AIGoCode", webUrl: "https://aigocode.com", baseUrl: "https://api.aigocode.com", sponsored: true, appTypes: ["codex"], defaultModel: "gpt-5.2" },
  { id: "rightcode", name: "RightCode", webUrl: "https://www.right.codes", baseUrl: "https://right.codes/codex/v1", sponsored: true, appTypes: ["codex"], defaultModel: "gpt-5.2" },
  { id: "aicodemirror", name: "AICodeMirror", webUrl: "https://www.aicodemirror.com", baseUrl: "https://api.aicodemirror.com/api/codex/backend-api/codex", sponsored: true, appTypes: ["codex"], defaultModel: "gpt-5.2" },
  { id: "aicoding", name: "AICoding", webUrl: "https://www.aicoding.sh", baseUrl: "https://api.aicoding.sh", sponsored: true, appTypes: ["codex"], defaultModel: "gpt-5.3-codex" },
  { id: "crazyrouter", name: "CrazyRouter", webUrl: "https://www.crazyrouter.com", baseUrl: "https://crazyrouter.com/v1", sponsored: true, appTypes: ["codex"], defaultModel: "gpt-5.3-codex" },
  { id: "sssaicode", name: "SSSAiCode", webUrl: "https://www.sssaicode.com", baseUrl: "https://node-hk.sssaicode.com/api", sponsored: true, appTypes: ["codex"], defaultModel: "gpt-5.3-codex" },
  { id: "openrouter", name: "OpenRouter", webUrl: "https://openrouter.ai", baseUrl: "https://openrouter.ai/api/v1", appTypes: ["codex"], defaultModel: "gpt-5.2" },
]

const GEMINI_PRESETS: PresetProvider[] = [
  { id: "custom", name: "自定义配置", webUrl: "", baseUrl: "", appTypes: ["gemini-cli"] },
  { id: "google-official", name: "Google Official", webUrl: "https://ai.google.dev/", baseUrl: "", appTypes: ["gemini-cli"], defaultModel: "gemini-3-pro" },
  { id: "packycode", name: "PackyCode", webUrl: "https://www.packyapi.com", baseUrl: "https://www.packyapi.com", sponsored: true, appTypes: ["gemini-cli"], defaultModel: "gemini-3-pro" },
  { id: "cubence", name: "Cubence", webUrl: "https://cubence.com", baseUrl: "https://api.cubence.com", sponsored: true, appTypes: ["gemini-cli"], defaultModel: "gemini-3-pro" },
  { id: "aigocode", name: "AIGoCode", webUrl: "https://aigocode.com", baseUrl: "https://api.aigocode.com", sponsored: true, appTypes: ["gemini-cli"], defaultModel: "gemini-3-pro" },
  { id: "aicodemirror", name: "AICodeMirror", webUrl: "https://www.aicodemirror.com", baseUrl: "https://api.aicodemirror.com/api/gemini", sponsored: true, appTypes: ["gemini-cli"], defaultModel: "gemini-3-pro" },
  { id: "aicoding", name: "AICoding", webUrl: "https://www.aicoding.sh", baseUrl: "https://api.aicoding.sh", sponsored: true, appTypes: ["gemini-cli"], defaultModel: "gemini-3-pro" },
  { id: "crazyrouter", name: "CrazyRouter", webUrl: "https://www.crazyrouter.com", baseUrl: "https://crazyrouter.com", sponsored: true, appTypes: ["gemini-cli"], defaultModel: "gemini-3-pro" },
  { id: "sssaicode", name: "SSSAiCode", webUrl: "https://www.sssaicode.com", baseUrl: "https://node-hk.sssaicode.com/api", sponsored: true, appTypes: ["gemini-cli"], defaultModel: "gemini-3-pro" },
  { id: "openrouter", name: "OpenRouter", webUrl: "https://openrouter.ai", baseUrl: "https://openrouter.ai/api", appTypes: ["gemini-cli"], defaultModel: "gemini-3-pro" },
]

const CODEBUDDY_PRESETS: PresetProvider[] = [
  { id: "custom", name: "自定义配置", webUrl: "", baseUrl: "", appTypes: ["codebuddy-cli"] },
  { id: "deepseek", name: "DeepSeek", webUrl: "https://platform.deepseek.com", baseUrl: "https://api.deepseek.com/v1/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "deepseek-chat" },
  { id: "openrouter", name: "OpenRouter", webUrl: "https://openrouter.ai", baseUrl: "https://openrouter.ai/api/v1/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "openai/gpt-4o" },
  { id: "ollama", name: "Ollama (Local)", webUrl: "https://ollama.com", baseUrl: "http://localhost:11434/v1/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "my-local-llm" },
  { id: "siliconflow", name: "SiliconFlow", webUrl: "https://siliconflow.cn", baseUrl: "https://api.siliconflow.cn/v1/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "deepseek-ai/DeepSeek-V3" },
  { id: "zhipu", name: "Zhipu GLM", webUrl: "https://open.bigmodel.cn", baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "glm-4-plus" },
  { id: "moonshot", name: "Moonshot", webUrl: "https://platform.moonshot.cn", baseUrl: "https://api.moonshot.cn/v1/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "moonshot-v1-auto" },
]

const PRESETS_MAP: Record<AppType, PresetProvider[]> = {
  "claude-code": CLAUDE_PRESETS,
  "codex": CODEX_PRESETS,
  "gemini-cli": GEMINI_PRESETS,
  "codebuddy-cli": CODEBUDDY_PRESETS,
}

interface ProviderConfig {
  id: string
  name: string
  appType: string
  apiKey: string
  baseUrl: string
  models: Record<string, string>
  note: string
  webUrl: string
  apiFormat: string
  authField: string
  presetId: string
  createdAt: string
  updatedAt: string
}

const ProviderFormPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get("id")
  const initialAppType = (searchParams.get("appType") as AppType) || "claude-code"

  // Tab: which agent's provider
  const [appType, setAppType] = useState<AppType>(initialAppType)
  const [selectedPreset, setSelectedPreset] = useState<string>("custom")

  // Form fields
  const [name, setName] = useState("")
  const [note, setNote] = useState("")
  const [webUrl, setWebUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)

  // Claude Code specific
  const [apiFormat, setApiFormat] = useState("anthropic") // "anthropic" | "openai"
  const [authField, setAuthField] = useState("auth_token") // "auth_token" | "api_key"
  const [mainModel, setMainModel] = useState("")
  const [thinkingModel, setThinkingModel] = useState("")
  const [haikuModel, setHaikuModel] = useState("")
  const [sonnetModel, setSonnetModel] = useState("")
  const [opusModel, setOpusModel] = useState("")

  // Codex specific
  const [codexModel, setCodexModel] = useState("")

  // Gemini specific
  const [geminiModel, setGeminiModel] = useState("")

  // CodeBuddy CLI specific
  const [cbModelId, setCbModelId] = useState("")
  const [cbVendor, setCbVendor] = useState("")
  const [cbUrl, setCbUrl] = useState("")
  const [cbMaxInput, setCbMaxInput] = useState("")
  const [cbMaxOutput, setCbMaxOutput] = useState("")
  const [cbSupportsToolCall, setCbSupportsToolCall] = useState(true)
  const [cbSupportsImages, setCbSupportsImages] = useState(false)
  const [cbSupportsReasoning, setCbSupportsReasoning] = useState(false)
  const [cbTemperature, setCbTemperature] = useState("")

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!editId)

  // Load existing provider for edit mode
  useEffect(() => {
    if (!editId) return
    let ignore = false
    async function load() {
      try {
        const data = await GetAllProviders()
        const provider = (data.providers || []).find((p: ProviderConfig) => p.id === editId)
        if (ignore || !provider) return
        setAppType(provider.appType as AppType)
        setSelectedPreset(provider.presetId || "custom")
        setName(provider.name)
        setNote(provider.note || "")
        setWebUrl(provider.webUrl || "")
        setApiKey(provider.apiKey)
        setBaseUrl(provider.baseUrl)
        setApiFormat(provider.apiFormat || "anthropic")
        setAuthField(provider.authField || "auth_token")
        setMainModel(provider.models?.main || "")
        setThinkingModel(provider.models?.thinking || "")
        setHaikuModel(provider.models?.haiku || "")
        setSonnetModel(provider.models?.sonnet || "")
        setOpusModel(provider.models?.opus || "")
        setCodexModel(provider.models?.model || "")
        setGeminiModel(provider.models?.model || "")
        setCbModelId(provider.models?.modelId || "")
        setCbVendor(provider.models?.vendor || "")
        setCbUrl(provider.models?.url || "")
        setCbMaxInput(provider.models?.maxInputTokens || "")
        setCbMaxOutput(provider.models?.maxOutputTokens || "")
        setCbSupportsToolCall(provider.models?.supportsToolCall === "true")
        setCbSupportsImages(provider.models?.supportsImages === "true")
        setCbSupportsReasoning(provider.models?.supportsReasoning === "true")
        setCbTemperature(provider.models?.temperature || "")
      } catch (error) {
        console.error("Failed to load provider:", error)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [editId])

  const presets = PRESETS_MAP[appType]

  const handlePresetSelect = useCallback((presetId: string) => {
    setSelectedPreset(presetId)
    if (presetId === "custom") {
      if (!editId) {
        setName("")
        setWebUrl("")
        setBaseUrl("")
        setMainModel("")
        setThinkingModel("")
        setHaikuModel("")
        setSonnetModel("")
        setOpusModel("")
        setCodexModel("")
        setGeminiModel("")
        setCbModelId("")
        setCbVendor("")
        setCbUrl("")
        setCbMaxInput("")
        setCbMaxOutput("")
        setCbTemperature("")
      }
      return
    }
    const preset = PRESETS_MAP[appType].find(p => p.id === presetId)
    if (!preset) return
    setName(preset.name)
    setWebUrl(preset.webUrl)
    setBaseUrl(preset.baseUrl)
    // Auto-fill default models
    if (appType === "claude-code") {
      setMainModel(preset.defaultModel || "")
      setHaikuModel(preset.defaultModels?.haiku || "")
      setSonnetModel(preset.defaultModels?.sonnet || "")
      setOpusModel(preset.defaultModels?.opus || "")
    } else if (appType === "codex") {
      setCodexModel(preset.defaultModel || "")
    } else if (appType === "gemini-cli") {
      setGeminiModel(preset.defaultModel || "")
    } else if (appType === "codebuddy-cli") {
      setCbModelId(preset.defaultModel || "")
      setCbVendor(preset.name)
      setCbUrl(preset.baseUrl)
    }
  }, [appType, editId])

  // Build the JSON config preview (Claude Code only)
  const configPreview = useMemo(() => {
    if (appType !== "claude-code") return null
    const env: Record<string, string> = {}
    if (apiFormat === "openai") {
      // OpenAI compatible mode
      if (apiKey) env["OPENAI_API_KEY"] = apiKey
      if (baseUrl) env["OPENAI_BASE_URL"] = baseUrl
    } else {
      // Native Anthropic mode
      if (authField === "auth_token") {
        env["ANTHROPIC_AUTH_TOKEN"] = apiKey || ""
      } else {
        env["ANTHROPIC_API_KEY"] = apiKey || ""
      }
      if (baseUrl) env["ANTHROPIC_BASE_URL"] = baseUrl
    }
    if (mainModel) env["ANTHROPIC_MODEL"] = mainModel
    if (thinkingModel) env["ANTHROPIC_SMALL_FAST_MODEL"] = thinkingModel
    if (haikuModel) env["ANTHROPIC_DEFAULT_HAIKU_MODEL"] = haikuModel
    if (sonnetModel) env["ANTHROPIC_DEFAULT_SONNET_MODEL"] = sonnetModel
    if (opusModel) env["ANTHROPIC_DEFAULT_OPUS_MODEL"] = opusModel
    return JSON.stringify({ env }, null, 2)
  }, [appType, apiFormat, baseUrl, authField, apiKey, mainModel, thinkingModel, haikuModel, sonnetModel, opusModel])

  const codexConfigPreview = useMemo(() => {
    if (appType !== "codex") return null
    const lines: string[] = []
    lines.push("# ~/.codex/config.toml")
    if (codexModel) lines.push(`model = "${codexModel}"`)
    if (baseUrl) {
      lines.push(`model_provider = "openai"`)
      lines.push(`base_url = "${baseUrl}"`)
    }
    lines.push("")
    lines.push("# ~/.codex/auth.json")
    if (apiKey) lines.push(`OPENAI_API_KEY = ${apiKey.slice(0, 6)}...`)
    return lines.join("\n")
  }, [appType, apiKey, baseUrl, codexModel])

  const geminiConfigPreview = useMemo(() => {
    if (appType !== "gemini-cli") return null
    const lines: string[] = []
    if (apiKey) lines.push(`GEMINI_API_KEY=${apiKey}`)
    if (baseUrl) lines.push(`GOOGLE_GEMINI_BASE_URL=${baseUrl}`)
    if (geminiModel) lines.push(`GEMINI_MODEL=${geminiModel}`)
    return lines.join("\n")
  }, [appType, apiKey, baseUrl, geminiModel])

  const codebuddyConfigPreview = useMemo(() => {
    if (appType !== "codebuddy-cli") return null
    const model: Record<string, unknown> = {}
    if (cbModelId) model.id = cbModelId
    if (name) model.name = name
    if (cbVendor) model.vendor = cbVendor
    if (apiKey) model.apiKey = apiKey.slice(0, 6) + "..."
    if (cbUrl) model.url = cbUrl
    if (cbMaxInput) model.maxInputTokens = Number(cbMaxInput)
    if (cbMaxOutput) model.maxOutputTokens = Number(cbMaxOutput)
    if (cbTemperature) model.temperature = Number(cbTemperature)
    if (cbSupportsToolCall) model.supportsToolCall = true
    if (cbSupportsImages) model.supportsImages = true
    if (cbSupportsReasoning) model.supportsReasoning = true
    const parts = [
      "// ~/.codebuddy/models.json",
      JSON.stringify({ models: [model] }, null, 2),
      "",
      "// ~/.codebuddy/settings.json",
      JSON.stringify({ model: cbModelId || "<model-id>" }, null, 2),
    ]
    return parts.join("\n")
  }, [appType, name, apiKey, cbModelId, cbVendor, cbUrl, cbMaxInput, cbMaxOutput, cbTemperature, cbSupportsToolCall, cbSupportsImages, cbSupportsReasoning])

  const handleSave = async () => {
    if (!name.trim() || !apiKey.trim()) return

    setSaving(true)
    try {
      const models: Record<string, string> = {}
      if (appType === "claude-code") {
        if (mainModel) models.main = mainModel
        if (thinkingModel) models.thinking = thinkingModel
        if (haikuModel) models.haiku = haikuModel
        if (sonnetModel) models.sonnet = sonnetModel
        if (opusModel) models.opus = opusModel
      } else if (appType === "codex") {
        if (codexModel) models.model = codexModel
      } else if (appType === "gemini-cli") {
        if (geminiModel) models.model = geminiModel
      } else if (appType === "codebuddy-cli") {
        if (cbModelId) models.modelId = cbModelId
        if (cbVendor) models.vendor = cbVendor
        if (cbUrl) models.url = cbUrl
        if (cbMaxInput) models.maxInputTokens = cbMaxInput
        if (cbMaxOutput) models.maxOutputTokens = cbMaxOutput
        if (cbTemperature) models.temperature = cbTemperature
        models.supportsToolCall = cbSupportsToolCall ? "true" : "false"
        models.supportsImages = cbSupportsImages ? "true" : "false"
        models.supportsReasoning = cbSupportsReasoning ? "true" : "false"
      }

      const cfg = {
        id: editId || "",
        name: name.trim(),
        appType,
        apiKey: apiKey.trim(),
        baseUrl: baseUrl.trim(),
        models,
        note: note.trim(),
        webUrl: webUrl.trim(),
        apiFormat: appType === "claude-code" ? apiFormat : "",
        authField: appType === "claude-code" ? authField : "",
        presetId: selectedPreset,
      }

      if (editId) {
        await UpdateProvider(JSON.stringify(cfg))
        // If this provider is currently active, re-switch to apply changes
        const data = await GetAllProviders()
        if (data.activeMap?.[appType] === editId) {
          await SwitchProvider(editId)
        }
        toast({ title: t("prov-updated", { name: cfg.name }), variant: "success" })
      } else {
        await AddProvider(JSON.stringify(cfg))
        toast({ title: t("prov-added", { name: cfg.name }), variant: "success" })
      }
      navigate("/providers")
    } catch (error) {
      toast({ title: t("prov-save-failed", { error: String(error) }), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshIcon size={20} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/providers")}>
            <ArrowLeft02Icon size={16} />
          </Button>
          <h1 className="text-base font-semibold tracking-tight">
            {editId ? t("prov-edit") : t("prov-add-new")}
          </h1>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

          {/* Agent type tab (only for new) */}
          {!editId && (
            <Tabs value={appType} onValueChange={v => { setAppType(v as AppType); setSelectedPreset("custom") }}>
              <TabsList className="w-full grid grid-cols-4 h-10">
                <TabsTrigger value="claude-code" className="text-[13px] font-medium">
                  Claude Code
                </TabsTrigger>
                <TabsTrigger value="codex" className="text-[13px] font-medium">
                  Codex
                </TabsTrigger>
                <TabsTrigger value="gemini-cli" className="text-[13px] font-medium">
                  Gemini CLI
                </TabsTrigger>
                <TabsTrigger value="codebuddy-cli" className="text-[13px] font-medium">
                  CodeBuddy CLI
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Preset provider selection */}
          <div className="space-y-2.5">
            <Label className="text-xs text-muted-foreground">{t("prov-preset")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[12px] font-medium border transition-all duration-100 ${
                    selectedPreset === preset.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border/60 text-foreground/80 hover:bg-accent/50 hover:border-border"
                  }`}
                >
                  {preset.sponsored && <span className="text-amber-500 text-[10px]">●</span>}
                  {preset.name}
                </button>
              ))}
            </div>
            {selectedPreset !== "custom" && (
              <p className="text-[11px] text-muted-foreground/60">
                {t("prov-preset-hint")}
              </p>
            )}
          </div>

          {/* Provider Name & Note */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("prov-name")}</Label>
              <Input
                placeholder={t("prov-name-placeholder")}
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("prov-note")}</Label>
              <Input
                placeholder={t("prov-note-placeholder")}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Website URL */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("prov-web-url")}</Label>
            <Input
              placeholder="https://platform.example.com"
              value={webUrl}
              onChange={e => setWebUrl(e.target.value)}
              className="h-9 font-mono text-xs"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <Label className="text-xs">API Key</Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="h-9 pr-9 font-mono text-xs"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <ViewOffIcon size={14} /> : <ViewIcon size={14} />}
              </button>
            </div>
          </div>

          {/* Base URL / Request URL */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("prov-request-url")}</Label>
            <Input
              placeholder="https://api.example.com"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              className="h-9 font-mono text-xs"
            />
            {appType === "claude-code" && baseUrl && (
              <p className="text-[11px] text-amber-500/80 flex items-center gap-1">
                ⚠ {t("prov-cc-url-hint")}
              </p>
            )}
          </div>

          {/* ===== Claude Code specific fields ===== */}
          {appType === "claude-code" && (
            <>
              {/* API Format */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t("prov-api-format")}</Label>
                <Select value={apiFormat} onValueChange={setApiFormat}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic Messages ({t("prov-native")})</SelectItem>
                    <SelectItem value="openai">OpenAI Compatible</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground/60">{t("prov-api-format-hint")}</p>
              </div>

              {/* Auth Field */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t("prov-auth-field")}</Label>
                <Select value={authField} onValueChange={setAuthField}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auth_token">Auth Token ({t("prov-default")})</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground/60">{t("prov-auth-field-hint")}</p>
              </div>

              {/* Model fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("prov-main-model")}</Label>
                  <Input
                    placeholder="e.g. DeepSeek-V3.2"
                    value={mainModel}
                    onChange={e => setMainModel(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("prov-thinking-model")}</Label>
                  <Input
                    placeholder={t("prov-optional")}
                    value={thinkingModel}
                    onChange={e => setThinkingModel(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Haiku {t("prov-default-model")}</Label>
                  <Input
                    placeholder="e.g. DeepSeek-V3.2"
                    value={haikuModel}
                    onChange={e => setHaikuModel(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sonnet {t("prov-default-model")}</Label>
                  <Input
                    placeholder="e.g. DeepSeek-V3.2"
                    value={sonnetModel}
                    onChange={e => setSonnetModel(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Opus {t("prov-default-model")}</Label>
                <Input
                  placeholder="e.g. DeepSeek-V3.2"
                  value={opusModel}
                  onChange={e => setOpusModel(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground/60">{t("prov-model-hint")}</p>
              </div>
            </>
          )}

          {/* ===== Codex specific fields ===== */}
          {appType === "codex" && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t("prov-model")}</Label>
              <Input
                placeholder="e.g. gpt-4o"
                value={codexModel}
                onChange={e => setCodexModel(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>
          )}

          {/* ===== Gemini CLI specific fields ===== */}
          {appType === "gemini-cli" && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t("prov-model")}</Label>
              <Input
                placeholder="e.g. gemini-2.5-pro"
                value={geminiModel}
                onChange={e => setGeminiModel(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>
          )}

          {/* ===== CodeBuddy CLI specific fields ===== */}
          {appType === "codebuddy-cli" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("prov-cb-model-id")}</Label>
                  <Input
                    placeholder="e.g. deepseek-chat"
                    value={cbModelId}
                    onChange={e => setCbModelId(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("prov-cb-vendor")}</Label>
                  <Input
                    placeholder="e.g. DeepSeek"
                    value={cbVendor}
                    onChange={e => setCbVendor(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t("prov-cb-url")}</Label>
                <Input
                  placeholder="https://api.example.com/v1/chat/completions"
                  value={cbUrl}
                  onChange={e => setCbUrl(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
                {cbUrl && !cbUrl.endsWith("/chat/completions") && (
                  <p className="text-[11px] text-amber-500/80 flex items-center gap-1">
                    ⚠ {t("prov-cb-url-hint")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("prov-cb-max-input")}</Label>
                  <Input
                    type="number"
                    placeholder="200000"
                    value={cbMaxInput}
                    onChange={e => setCbMaxInput(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("prov-cb-max-output")}</Label>
                  <Input
                    type="number"
                    placeholder="8192"
                    value={cbMaxOutput}
                    onChange={e => setCbMaxOutput(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t("prov-cb-temperature")}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.7"
                  value={cbTemperature}
                  onChange={e => setCbTemperature(e.target.value)}
                  className="h-9 font-mono text-xs w-32"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs">{t("prov-cb-capabilities")}</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cbSupportsToolCall}
                      onChange={e => setCbSupportsToolCall(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-xs">Tool Call</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cbSupportsImages}
                      onChange={e => setCbSupportsImages(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-xs">Images</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cbSupportsReasoning}
                      onChange={e => setCbSupportsReasoning(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-xs">Reasoning</span>
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground/60">{t("prov-cb-capabilities-hint")}</p>
              </div>
            </>
          )}

          {/* ===== Config Preview ===== */}
          {appType === "claude-code" && configPreview && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("prov-config-preview")}</Label>
              <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/30 text-[11px] text-muted-foreground font-medium">
                  Claude Code {t("prov-config-json")} *
                </div>
                <pre className="p-3 text-[11px] font-mono text-foreground/80 overflow-x-auto leading-relaxed whitespace-pre">
                  {configPreview}
                </pre>
              </div>
              <p className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                <span>☞</span> {t("prov-config-preview-hint")}
              </p>
            </div>
          )}

          {appType === "codex" && codexConfigPreview && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("prov-config-preview")}</Label>
              <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/30 text-[11px] text-muted-foreground font-medium">
                  Codex config.toml + auth.json *
                </div>
                <pre className="p-3 text-[11px] font-mono text-foreground/80 overflow-x-auto leading-relaxed whitespace-pre">
                  {codexConfigPreview}
                </pre>
              </div>
            </div>
          )}

          {appType === "gemini-cli" && geminiConfigPreview && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("prov-config-preview")}</Label>
              <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/30 text-[11px] text-muted-foreground font-medium">
                  Gemini CLI .env *
                </div>
                <pre className="p-3 text-[11px] font-mono text-foreground/80 overflow-x-auto leading-relaxed whitespace-pre">
                  {geminiConfigPreview}
                </pre>
              </div>
            </div>
          )}

          {appType === "codebuddy-cli" && codebuddyConfigPreview && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("prov-config-preview")}</Label>
              <div className="rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/30 text-[11px] text-muted-foreground font-medium">
                  CodeBuddy CLI models.json + settings.json *
                </div>
                <pre className="p-3 text-[11px] font-mono text-foreground/80 overflow-x-auto leading-relaxed whitespace-pre">
                  {codebuddyConfigPreview}
                </pre>
              </div>
              <p className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                <span>☞</span> {t("prov-cb-preview-hint")}
              </p>
            </div>
          )}

          {/* Bottom spacer for fixed footer */}
          <div className="h-4" />
        </div>
      </ScrollArea>

      {/* Fixed footer */}
      <div className="shrink-0 px-6 py-4 border-t border-border/50 flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/providers")}>
          {t("cancel")}
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !name.trim() || !apiKey.trim()}
        >
          {saving && <RefreshIcon size={13} className="mr-1.5 animate-spin" />}
          <Add01Icon size={13} className="mr-1" />
          {editId ? t("save") : t("prov-add-btn")}
        </Button>
      </div>
    </div>
  )
}

export default ProviderFormPage
