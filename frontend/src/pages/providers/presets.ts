export type AppType = "claude-code" | "codex" | "gemini-cli" | "codebuddy-cli" | "opencode"

export interface PresetProvider {
  id: string
  name: string
  webUrl: string
  baseUrl: string
  icon?: string
  sponsored?: boolean
  appTypes: AppType[]
  defaultModel?: string
  defaultModels?: {
    haiku?: string
    sonnet?: string
    opus?: string
  }
}

export const CLAUDE_PRESETS: PresetProvider[] = [
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

export const CODEX_PRESETS: PresetProvider[] = [
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

export const GEMINI_PRESETS: PresetProvider[] = [
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

export const CODEBUDDY_PRESETS: PresetProvider[] = [
  { id: "custom", name: "自定义配置", webUrl: "", baseUrl: "", appTypes: ["codebuddy-cli"] },
  { id: "deepseek", name: "DeepSeek", webUrl: "https://platform.deepseek.com", baseUrl: "https://api.deepseek.com/v1/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "deepseek-chat" },
  { id: "openrouter", name: "OpenRouter", webUrl: "https://openrouter.ai", baseUrl: "https://openrouter.ai/api/v1/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "openai/gpt-4o" },
  { id: "ollama", name: "Ollama (Local)", webUrl: "https://ollama.com", baseUrl: "http://localhost:11434/v1/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "my-local-llm" },
  { id: "siliconflow", name: "SiliconFlow", webUrl: "https://siliconflow.cn", baseUrl: "https://api.siliconflow.cn/v1/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "deepseek-ai/DeepSeek-V3" },
  { id: "zhipu", name: "Zhipu GLM", webUrl: "https://open.bigmodel.cn", baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "glm-4-plus" },
  { id: "moonshot", name: "Moonshot", webUrl: "https://platform.moonshot.cn", baseUrl: "https://api.moonshot.cn/v1/chat/completions", appTypes: ["codebuddy-cli"], defaultModel: "moonshot-v1-auto" },
]

export const OPENCODE_PRESETS: PresetProvider[] = [
  { id: "custom", name: "自定义配置", webUrl: "", baseUrl: "", appTypes: ["opencode"] },
  { id: "anthropic", name: "Anthropic (Claude)", webUrl: "https://console.anthropic.com", baseUrl: "https://api.anthropic.com/v1", appTypes: ["opencode"], defaultModel: "claude-sonnet-4-6-20250514" },
  { id: "openai", name: "OpenAI (GPT)", webUrl: "https://platform.openai.com", baseUrl: "https://api.openai.com/v1", appTypes: ["opencode"], defaultModel: "gpt-4o" },
  { id: "google", name: "Google (Gemini)", webUrl: "https://ai.google.dev", baseUrl: "https://generativelanguage.googleapis.com/v1beta", appTypes: ["opencode"], defaultModel: "gemini-2.5-pro" },
  { id: "deepseek", name: "DeepSeek", webUrl: "https://platform.deepseek.com", baseUrl: "https://api.deepseek.com/v1", appTypes: ["opencode"], defaultModel: "deepseek-chat" },
  { id: "zhipu-glm", name: "Zhipu GLM", webUrl: "https://open.bigmodel.cn", baseUrl: "https://open.bigmodel.cn/api/paas/v4", appTypes: ["opencode"], defaultModel: "glm-4-plus" },
  { id: "zhipu-glm-en", name: "Z.AI (GLM)", webUrl: "https://z.ai", baseUrl: "https://api.z.ai/v1", appTypes: ["opencode"], defaultModel: "glm-4.7" },
  { id: "kimi", name: "Kimi / Moonshot", webUrl: "https://platform.moonshot.cn", baseUrl: "https://api.moonshot.cn/v1", appTypes: ["opencode"], defaultModel: "kimi-k2" },
  { id: "minimax", name: "MiniMax", webUrl: "https://platform.minimax.io", baseUrl: "https://api.minimax.io/v1", appTypes: ["opencode"], defaultModel: "MiniMax-M2.5" },
  { id: "doubao-seed", name: "DouBaoSeed", webUrl: "https://www.volcengine.com/product/doubao", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", appTypes: ["opencode"], defaultModel: "doubao-seed-2-0-code-preview-latest" },
  { id: "siliconflow", name: "SiliconFlow", webUrl: "https://siliconflow.cn", baseUrl: "https://api.siliconflow.cn/v1", appTypes: ["opencode"], defaultModel: "deepseek-ai/DeepSeek-V3" },
  { id: "groq", name: "Groq", webUrl: "https://console.groq.com", baseUrl: "https://api.groq.com/openai/v1", appTypes: ["opencode"], defaultModel: "llama-3.3-70b-versatile" },
  { id: "xai", name: "xAI (Grok)", webUrl: "https://console.x.ai", baseUrl: "https://api.x.ai/v1", appTypes: ["opencode"], defaultModel: "grok-beta" },
  { id: "ollama", name: "Ollama (Local)", webUrl: "https://ollama.com", baseUrl: "http://localhost:11434/v1", appTypes: ["opencode"], defaultModel: "llama3" },
  { id: "openrouter", name: "OpenRouter", webUrl: "https://openrouter.ai", baseUrl: "https://openrouter.ai/api/v1", appTypes: ["opencode"], defaultModel: "anthropic/claude-sonnet-4.6" },
  { id: "aihubmix", name: "AIHubMix", webUrl: "https://aihubmix.com", baseUrl: "https://aihubmix.com/v1", appTypes: ["opencode"] },
]

export const PRESETS_MAP: Record<AppType, PresetProvider[]> = {
  "claude-code": CLAUDE_PRESETS,
  "codex": CODEX_PRESETS,
  "gemini-cli": GEMINI_PRESETS,
  "codebuddy-cli": CODEBUDDY_PRESETS,
  "opencode": OPENCODE_PRESETS,
}
