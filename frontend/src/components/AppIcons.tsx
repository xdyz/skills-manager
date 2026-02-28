import React from "react"

interface IconProps {
  size?: number
  className?: string
}

// Claude Code / Anthropic — sparkle logo (official favicon)
export const ClaudeCodeIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 248 248" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M52.4285 162.873L98.7844 136.879L99.5485 134.602L98.7844 133.334H96.4921L88.7237 132.862L62.2346 132.153L39.3113 131.207L17.0249 130.026L11.4214 128.844L6.2 121.873L6.7094 118.447L11.4214 115.257L18.171 115.847L33.0711 116.911L55.485 118.447L71.6586 119.392L95.728 121.873H99.5485L100.058 120.337L98.7844 119.392L97.7656 118.447L74.5877 102.732L49.4995 86.1905L36.3823 76.62L29.3779 71.7757L25.8121 67.2858L24.2839 57.3608L30.6515 50.2716L39.3113 50.8623L41.4763 51.4531L50.2636 58.1879L68.9842 72.7209L93.4357 90.6804L97.0015 93.6343L98.4374 92.6652L98.6571 91.9801L97.0015 89.2625L83.757 65.2772L69.621 40.8192L63.2534 30.6579L61.5978 24.632C60.9565 22.1032 60.579 20.0111 60.579 17.4246L67.8381 7.49965L71.9133 6.19995L81.7193 7.49965L85.7946 11.0443L91.9074 24.9865L101.714 46.8451L116.996 76.62L121.453 85.4816L123.873 93.6343L124.764 96.1155H126.292V94.6976L127.566 77.9197L129.858 57.3608L132.15 30.8942L132.915 23.4505L136.608 14.4708L143.994 9.62643L149.725 12.344L154.437 19.0788L153.8 23.4505L150.998 41.6463L145.522 70.1215L141.957 89.2625H143.994L146.414 86.7813L156.093 74.0206L172.266 53.698L179.398 45.6635L187.803 36.802L193.152 32.5484H203.34L210.726 43.6549L207.415 55.1159L196.972 68.3492L188.312 79.5739L175.896 96.2095L168.191 109.585L168.882 110.689L170.738 110.53L198.755 104.504L213.91 101.787L231.994 98.7149L240.144 102.496L241.036 106.395L237.852 114.311L218.495 119.037L195.826 123.645L162.07 131.592L161.696 131.893L162.137 132.547L177.36 133.925L183.855 134.279H199.774L229.447 136.524L237.215 141.605L241.8 147.867L241.036 152.711L229.065 158.737L213.019 154.956L175.45 145.977L162.587 142.787H160.805V143.85L171.502 154.366L191.242 172.089L215.82 195.011L217.094 200.682L213.91 205.172L210.599 204.699L188.949 188.394L180.544 181.069L161.696 165.118H160.422V166.772L164.752 173.152L187.803 207.771L188.949 218.405L187.294 221.832L181.308 223.959L174.813 222.777L161.187 203.754L147.305 182.486L136.098 163.345L134.745 164.2L128.075 235.42L125.019 239.082L117.887 241.8L111.902 237.31L108.718 229.984L111.902 215.452L115.722 196.547L118.779 181.541L121.58 162.873L123.291 156.636L123.14 156.219L121.773 156.449L107.699 175.752L86.304 204.699L69.3663 222.777L65.291 224.431L58.2867 220.768L58.9235 214.27L62.8713 208.48L86.304 178.705L100.44 160.155L109.551 149.507L109.462 147.967L108.959 147.924L46.6977 188.512L35.6182 189.93L30.7788 185.44L31.4156 178.115L33.7079 175.752L52.4285 162.873Z" fill="#D97757"/>
  </svg>
)

// OpenAI — hexagonal flower logo (for Codex, GPT)
export const OpenAIIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill="currentColor"/>
  </svg>
)

// Alias for backward compat
export const CodexIcon = OpenAIIcon

// Google Gemini — four-pointed star logo
export const GeminiIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="gemini-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4"/>
        <stop offset="0.5" stopColor="#9B72CB"/>
        <stop offset="1" stopColor="#D96570"/>
      </linearGradient>
    </defs>
    <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" fill="url(#gemini-grad)"/>
  </svg>
)

// OpenCode — terminal cursor
export const OpenCodeIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="oc-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00DC82"/>
        <stop offset="1" stopColor="#36E4DA"/>
      </linearGradient>
    </defs>
    <rect x="2" y="3" width="20" height="18" rx="3" stroke="url(#oc-grad)" strokeWidth="1.5" fill="none"/>
    <path d="M7 9l3.5 3L7 15" stroke="url(#oc-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 15h4" stroke="url(#oc-grad)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// CodeBuddy CLI — Official logo (simplified)
export const CodeBuddyIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="40" height="40" rx="20" fill="url(#cb-bg)"/>
    <path d="M27.69 3.34c.37-.33.39-.34.66-.36.44-.03.84.18 1.52.8 1.59 1.45 3.8 4.42 5.18 6.95l.53.98.75.37c.73.37 1.92 1.12 2.41 1.52.23.19.26.19.49.1 1.06-.41 2.57.13 3.9 1.41 1.2 1.15 2.35 3.11 2.79 4.75.06.26.15.83.18 1.25.1 1.48-.37 2.67-1.29 3.2-.19.11-.2.14-.19.6.04 2.22-.56 4.44-1.76 6.6-1.36 2.43-3.78 4.94-7.05 7.31-1.76 1.28-5.92 3.7-7.8 4.55-4.5 2.03-8.11 2.81-11.25 2.42-1.87-.23-3.99-.96-5.24-1.8-.33-.23-.38-.24-.63-.17-1.34.39-3.1-.4-4.59-2.06-.6-.66-1.56-2.29-1.87-3.16-.72-2.04-.58-3.87.38-4.97.25-.28.26-.29.2-.77-.09-.78-.13-1.93-.09-2.67l.03-.69-1.04-1.84c-1.61-2.87-2.64-5.28-3.03-7.12-.21-1.01-.2-1.46.06-1.79.16-.2.67-.41 1.29-.52 1.55-.27 4.94-.03 8.71.64l.39.07.86-.76c1.43-1.26 2.38-1.97 4.13-3.06 1.82-1.14 3.88-2.08 6.19-2.82l.74-.24.41-1.07c1.46-3.86 2.96-6.71 4.03-7.65zM15.44 23.13c-1.65.95-2.48 1.43-3.09 1.97-2.46 2.17-3.38 5.6-2.33 8.7.26.77.74 1.6 1.69 3.25.95 1.65 1.43 2.48 1.97 3.09 2.17 2.46 5.6 3.38 8.7 2.33.77-.26 1.6-.74 3.25-1.69l9.51-5.49c1.65-.95 2.48-1.43 3.09-1.97 2.46-2.17 3.38-5.6 2.33-8.7-.26-.77-.74-1.6-1.69-3.25-.95-1.65-1.43-2.48-1.97-3.09-2.17-2.46-5.6-3.38-8.7-2.33-.77.26-1.6.74-3.25 1.69l-9.51 5.49z" fill="white" fillOpacity="0.9"/>
    <rect x="15.88" y="30.03" width="4.01" height="8.33" rx="2" transform="rotate(-30 15.88 30.03)" fill="white"/>
    <rect x="26.7" y="23.78" width="4.01" height="8.33" rx="2" transform="rotate(-30 26.7 23.78)" fill="white"/>
    <defs>
      <linearGradient id="cb-bg" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6C4DFF"/>
        <stop offset="1" stopColor="#583ED3"/>
      </linearGradient>
    </defs>
  </svg>
)

// ===== Model Provider Brand Icons =====

// DeepSeek — blue whale/deep sea icon
export const DeepSeekIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="11" fill="#4D6BFE"/>
    <path d="M7 10.5c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5c0 1.5-.7 2.8-1.8 3.7L16 17.5H8l.8-3.3C7.7 13.3 7 12 7 10.5z" fill="white"/>
    <circle cx="10" cy="10.5" r="1" fill="#4D6BFE"/>
    <circle cx="14" cy="10.5" r="1" fill="#4D6BFE"/>
  </svg>
)

// Zhipu GLM — red gradient square
export const ZhipuIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#E23C39"/>
    <path d="M7 8h10M7 12h7M7 16h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Kimi / Moonshot — dark circle with crescent moon
export const KimiIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="11" fill="#1A1A2E"/>
    <path d="M14 6a7 7 0 0 0 0 12 8 8 0 1 1 0-12z" fill="#E0E0FF"/>
    <circle cx="9" cy="12" r="1.5" fill="#6C63FF"/>
  </svg>
)

// SiliconFlow — purple gradient flow
export const SiliconFlowIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="sf-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="1" stopColor="#2563EB"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#sf-grad)"/>
    <path d="M8 16c2-4 4-4 4 0s2-4 4 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="8" cy="9" r="1.5" fill="white"/>
    <circle cx="16" cy="9" r="1.5" fill="white"/>
  </svg>
)

// Ollama — local llama icon
export const OllamaIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="11" fill="#1A1A1A"/>
    <ellipse cx="12" cy="13" rx="5" ry="6" fill="white"/>
    <ellipse cx="12" cy="11" rx="4" ry="4.5" fill="white"/>
    <circle cx="10.5" cy="10.5" r="1" fill="#1A1A1A"/>
    <circle cx="13.5" cy="10.5" r="1" fill="#1A1A1A"/>
    <ellipse cx="12" cy="13" rx="1.5" ry="1" fill="#F5F5F5"/>
  </svg>
)

// OpenRouter — arrow/routing icon
export const OpenRouterIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#6366F1"/>
    <path d="M7 12h6m0 0l-2.5-2.5M13 12l-2.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="17" cy="8" r="1.5" fill="white"/>
    <circle cx="17" cy="16" r="1.5" fill="white"/>
    <path d="M13 12h2l2-4M15 12l2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// AIHubMix — hub/mix icon
export const AIHubMixIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="ahm-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B"/>
        <stop offset="1" stopColor="#EF4444"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ahm-grad)"/>
    <circle cx="12" cy="12" r="3" fill="white"/>
    <circle cx="12" cy="6" r="1.5" fill="white"/>
    <circle cx="12" cy="18" r="1.5" fill="white"/>
    <circle cx="6" cy="12" r="1.5" fill="white"/>
    <circle cx="18" cy="12" r="1.5" fill="white"/>
    <path d="M12 8.5v-1M12 16.5v-1M9.5 12h-1M15.5 12h-1" stroke="white" strokeWidth="1" strokeLinecap="round"/>
  </svg>
)

// Google — Google "G" colors
export const GoogleIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.969 10.969 0 0 0 1 12c0 1.78.42 3.46 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

// MiniMax — gradient M
export const MiniMaxIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#FF6B35"/>
    <path d="M6 17V9l3 4 3-4v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M15 17V9l3 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

// Bailian / Alibaba — orange cloud
export const BailianIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#FF6A00"/>
    <path d="M8 15a3 3 0 0 1-.5-5.96 4.5 4.5 0 0 1 8.72-.54A3.5 3.5 0 0 1 16 15H8z" fill="white"/>
  </svg>
)

// xAI / Grok
export const XAIIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#000000"/>
    <path d="M7 7l4.5 5L7 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M12.5 7H17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M12.5 17H17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

// Groq — lightning fast
export const GroqIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#F55036"/>
    <path d="M13 4l-5 9h4l-1 7 5-9h-4l1-7z" fill="white"/>
  </svg>
)

// DouBao/Volcengine — volcano
export const DouBaoIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#3370FF"/>
    <path d="M12 6l-5 10h10L12 6z" fill="white" fillOpacity="0.9"/>
    <circle cx="12" cy="10" r="1.5" fill="#3370FF"/>
  </svg>
)

// AWS — orange smile/arrow
export const AWSIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#232F3E"/>
    <path d="M6 14c2 2 5 3 8 2s4-2 4-2" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M17 12l1 2.5L15.5 15" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

// Nvidia — green eye
export const NvidiaIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#76B900"/>
    <path d="M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M9 12c0-1.65 1.35-3 3-3s3 1.35 3 3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M6 12h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Generic/Default provider icon
export const DefaultProviderIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#94A3B8" fillOpacity="0.2" stroke="#94A3B8" strokeWidth="1"/>
    <circle cx="12" cy="10" r="3" stroke="#94A3B8" strokeWidth="1.5" fill="none"/>
    <path d="M7 18c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
)

// Map app type to icon component
export const AppTypeIcon: React.FC<{ appType: string } & IconProps> = ({ appType, ...props }) => {
  switch (appType) {
    case "claude-code": return <ClaudeCodeIcon {...props} />
    case "codex": return <OpenAIIcon {...props} />
    case "gemini-cli": return <GeminiIcon {...props} />
    case "opencode": return <OpenCodeIcon {...props} />
    case "codebuddy-cli": return <CodeBuddyIcon {...props} />
    default: return null
  }
}

// Map provider presetId/name to the appropriate brand icon
const PROVIDER_ICON_MAP: Record<string, React.FC<IconProps>> = {
  // Preset IDs
  "claude-official": ClaudeCodeIcon,
  "deepseek": DeepSeekIcon,
  "zhipu-glm": ZhipuIcon,
  "zhipu-glm-en": ZhipuIcon,
  "zhipu": ZhipuIcon,
  "kimi": KimiIcon,
  "kimi-coding": KimiIcon,
  "moonshot": KimiIcon,
  "siliconflow": SiliconFlowIcon,
  "siliconflow-en": SiliconFlowIcon,
  "ollama": OllamaIcon,
  "openrouter": OpenRouterIcon,
  "aihubmix": AIHubMixIcon,
  "openai-official": OpenAIIcon,
  "openai": OpenAIIcon,
  "azure-openai": OpenAIIcon,
  "google-official": GoogleIcon,
  "google": GoogleIcon,
  "anthropic": ClaudeCodeIcon,
  "anthropic-official": ClaudeCodeIcon,
  "minimax": MiniMaxIcon,
  "minimax-en": MiniMaxIcon,
  "bailian": BailianIcon,
  "modelscope": BailianIcon,
  "doubao-seed": DouBaoIcon,
  "nvidia": NvidiaIcon,
  "aws-bedrock-aksk": AWSIcon,
  "aws-bedrock-apikey": AWSIcon,
  "xai": XAIIcon,
  "groq": GroqIcon,
}

// Name-based fallback mapping (lowercase matching)
const PROVIDER_NAME_PATTERNS: [RegExp, React.FC<IconProps>][] = [
  [/deepseek/i, DeepSeekIcon],
  [/zhipu|glm|bigmodel|z\.ai/i, ZhipuIcon],
  [/kimi|moonshot/i, KimiIcon],
  [/silicon\s*flow/i, SiliconFlowIcon],
  [/ollama/i, OllamaIcon],
  [/openrouter/i, OpenRouterIcon],
  [/aihubmix/i, AIHubMixIcon],
  [/openai|gpt|codex|chatgpt/i, OpenAIIcon],
  [/claude|anthropic/i, ClaudeCodeIcon],
  [/gemini|google/i, GoogleIcon],
  [/minimax/i, MiniMaxIcon],
  [/bailian|aliyun|alibaba|dashscope/i, BailianIcon],
  [/doubao|volcengine|volces|bytedance/i, DouBaoIcon],
  [/nvidia/i, NvidiaIcon],
  [/aws|bedrock|amazon/i, AWSIcon],
  [/xai|grok/i, XAIIcon],
  [/groq/i, GroqIcon],
]

export const ProviderBrandIcon: React.FC<{ presetId?: string; name?: string } & IconProps> = ({
  presetId,
  name,
  ...props
}) => {
  // 1. Try exact presetId match
  if (presetId && PROVIDER_ICON_MAP[presetId]) {
    const Icon = PROVIDER_ICON_MAP[presetId]
    return <Icon {...props} />
  }
  // 2. Try name pattern match
  if (name) {
    for (const [pattern, Icon] of PROVIDER_NAME_PATTERNS) {
      if (pattern.test(name)) {
        return <Icon {...props} />
      }
    }
  }
  // 3. Default icon
  return <DefaultProviderIcon {...props} />
}
