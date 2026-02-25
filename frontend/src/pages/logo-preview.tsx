import { useState } from "react"

const LogoOption = ({ name, desc, children, selected, onClick }: { name: string; desc: string; children: React.ReactNode; selected: boolean; onClick: () => void }) => (
  <div
    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
      selected ? "border-primary bg-primary/5 shadow-lg" : "border-border/60 bg-card hover:border-primary/30 hover:shadow-md"
    }`}
    onClick={onClick}
  >
    <div className="w-full flex items-center justify-center gap-5">
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-[100px] h-[100px] rounded-2xl bg-white border border-border/40 flex items-center justify-center shadow-sm">
          {children}
        </div>
        <span className="text-[10px] text-muted-foreground">Light</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-[100px] h-[100px] rounded-2xl bg-[#0f172a] flex items-center justify-center shadow-sm">
          {children}
        </div>
        <span className="text-[10px] text-muted-foreground">Dark</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-11 h-11 rounded-lg bg-white border border-border/40 flex items-center justify-center shadow-sm">
          <div className="scale-[0.36] origin-center">{children}</div>
        </div>
        <span className="text-[10px] text-muted-foreground">Small</span>
      </div>
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-foreground/85">{name}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </div>
)

const LogoPreview = () => {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Skills Manager Logo 设计</h1>
          <p className="text-sm text-muted-foreground mt-1">抽象气球树 — 光感 × 阴影 × 渐变 × 半透明</p>
        </div>

        <div className="grid grid-cols-2 gap-5">

          {/* 1: 光感气球树 - 发光球体+渐变树干 */}
          <LogoOption name="1：光感气球树" desc="发光球体悬浮在优雅渐变枝干上方" selected={selected === 1} onClick={() => setSelected(1)}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="a1_trunk" x1="36" y1="30" x2="36" y2="68" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6B7280" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#374151" stopOpacity="0.6" />
                </linearGradient>
                <radialGradient id="a1_b1" cx="0.4" cy="0.35" r="0.6">
                  <stop stopColor="#6ee7b7" />
                  <stop offset="0.6" stopColor="#10b981" />
                  <stop offset="1" stopColor="#059669" />
                </radialGradient>
                <radialGradient id="a1_b2" cx="0.4" cy="0.35" r="0.6">
                  <stop stopColor="#a3e635" />
                  <stop offset="0.6" stopColor="#65a30d" />
                  <stop offset="1" stopColor="#4d7c0f" />
                </radialGradient>
                <radialGradient id="a1_b3" cx="0.4" cy="0.35" r="0.6">
                  <stop stopColor="#5eead4" />
                  <stop offset="0.6" stopColor="#14b8a6" />
                  <stop offset="1" stopColor="#0d9488" />
                </radialGradient>
                <radialGradient id="a1_b4" cx="0.4" cy="0.35" r="0.6">
                  <stop stopColor="#86efac" />
                  <stop offset="0.6" stopColor="#22c55e" />
                  <stop offset="1" stopColor="#16a34a" />
                </radialGradient>
                <radialGradient id="a1_b5" cx="0.4" cy="0.35" r="0.55">
                  <stop stopColor="#a7f3d0" />
                  <stop offset="0.6" stopColor="#34d399" />
                  <stop offset="1" stopColor="#10b981" />
                </radialGradient>
                <filter id="a1_glow">
                  <feGaussianBlur stdDeviation="2.5" />
                </filter>
                <filter id="a1_shadow">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#047857" floodOpacity="0.25" />
                </filter>
                <filter id="a1_trunk_shadow">
                  <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#1f2937" floodOpacity="0.2" />
                </filter>
              </defs>
              {/* 树干投影 */}
              <path d="M36 68Q34 60 35 50L35 34" stroke="url(#a1_trunk)" strokeWidth="5" strokeLinecap="round" fill="none" filter="url(#a1_trunk_shadow)" />
              {/* 枝杈 */}
              <path d="M35 42Q26 40 14 44" stroke="url(#a1_trunk)" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#a1_trunk_shadow)" />
              <path d="M35 42Q44 40 56 44" stroke="url(#a1_trunk)" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#a1_trunk_shadow)" />
              <path d="M35 36Q24 30 16 24" stroke="url(#a1_trunk)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M35 36Q46 30 54 24" stroke="url(#a1_trunk)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M35 34L35 22" stroke="url(#a1_trunk)" strokeWidth="2.2" strokeLinecap="round" />
              {/* 气球底部辉光 */}
              <ellipse cx="12" cy="32" rx="8" ry="4" fill="#10b981" opacity="0.08" filter="url(#a1_glow)" />
              <ellipse cx="58" cy="32" rx="8" ry="4" fill="#65a30d" opacity="0.08" filter="url(#a1_glow)" />
              <ellipse cx="14" cy="14" rx="7" ry="3.5" fill="#14b8a6" opacity="0.07" filter="url(#a1_glow)" />
              <ellipse cx="56" cy="14" rx="7" ry="3.5" fill="#22c55e" opacity="0.07" filter="url(#a1_glow)" />
              <ellipse cx="35" cy="8" rx="6" ry="3" fill="#34d399" opacity="0.08" filter="url(#a1_glow)" />
              {/* 气球 - 发光球体 */}
              <circle cx="12" cy="26" r="9" fill="url(#a1_b1)" filter="url(#a1_shadow)" />
              <ellipse cx="9" cy="22" rx="3.5" ry="4" fill="white" opacity="0.25" />
              <ellipse cx="8" cy="21" rx="1.5" ry="1.8" fill="white" opacity="0.35" />
              <circle cx="58" cy="26" r="9" fill="url(#a1_b2)" filter="url(#a1_shadow)" />
              <ellipse cx="55" cy="22" rx="3.5" ry="4" fill="white" opacity="0.25" />
              <ellipse cx="54" cy="21" rx="1.5" ry="1.8" fill="white" opacity="0.35" />
              <circle cx="14" cy="10" r="7.5" fill="url(#a1_b3)" filter="url(#a1_shadow)" />
              <ellipse cx="11.5" cy="7" rx="2.8" ry="3.2" fill="white" opacity="0.22" />
              <ellipse cx="11" cy="6" rx="1.2" ry="1.5" fill="white" opacity="0.3" />
              <circle cx="56" cy="10" r="7.5" fill="url(#a1_b4)" filter="url(#a1_shadow)" />
              <ellipse cx="53.5" cy="7" rx="2.8" ry="3.2" fill="white" opacity="0.22" />
              <ellipse cx="53" cy="6" rx="1.2" ry="1.5" fill="white" opacity="0.3" />
              <circle cx="35" cy="5" r="6.5" fill="url(#a1_b5)" filter="url(#a1_shadow)" />
              <ellipse cx="33" cy="2.5" rx="2.5" ry="2.8" fill="white" opacity="0.25" />
              <ellipse cx="32.5" cy="1.5" rx="1" ry="1.3" fill="white" opacity="0.35" />
            </svg>
          </LogoOption>

          {/* 2: 玻璃质感 - 半透明玻璃球 */}
          <LogoOption name="2：玻璃气球树" desc="半透明玻璃质感球体，磨砂光影" selected={selected === 2} onClick={() => setSelected(2)}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="a2_trunk" x1="36" y1="28" x2="36" y2="68" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#9CA3AF" stopOpacity="0.7" />
                  <stop offset="1" stopColor="#4B5563" stopOpacity="0.5" />
                </linearGradient>
                <radialGradient id="a2_glass1" cx="0.35" cy="0.3" r="0.65">
                  <stop stopColor="#6ee7b7" stopOpacity="0.7" />
                  <stop offset="0.5" stopColor="#10b981" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#059669" stopOpacity="0.3" />
                </radialGradient>
                <radialGradient id="a2_glass2" cx="0.35" cy="0.3" r="0.65">
                  <stop stopColor="#bef264" stopOpacity="0.7" />
                  <stop offset="0.5" stopColor="#84cc16" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#65a30d" stopOpacity="0.3" />
                </radialGradient>
                <radialGradient id="a2_glass3" cx="0.35" cy="0.3" r="0.65">
                  <stop stopColor="#99f6e4" stopOpacity="0.7" />
                  <stop offset="0.5" stopColor="#2dd4bf" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#14b8a6" stopOpacity="0.3" />
                </radialGradient>
                <radialGradient id="a2_glass4" cx="0.35" cy="0.3" r="0.65">
                  <stop stopColor="#bbf7d0" stopOpacity="0.7" />
                  <stop offset="0.5" stopColor="#4ade80" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#22c55e" stopOpacity="0.3" />
                </radialGradient>
                <radialGradient id="a2_glass5" cx="0.35" cy="0.3" r="0.65">
                  <stop stopColor="#a7f3d0" stopOpacity="0.75" />
                  <stop offset="0.5" stopColor="#34d399" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#10b981" stopOpacity="0.35" />
                </radialGradient>
                <filter id="a2_blur">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
                <filter id="a2_ds">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#064e3b" floodOpacity="0.2" />
                </filter>
              </defs>
              {/* 树干 - 柔和 */}
              <path d="M36 68Q34 58 35 48L35 32" stroke="url(#a2_trunk)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M35 40Q24 38 12 42" stroke="url(#a2_trunk)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M35 40Q46 38 58 42" stroke="url(#a2_trunk)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M35 34Q22 26 14 20" stroke="url(#a2_trunk)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M35 34Q48 26 56 20" stroke="url(#a2_trunk)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M35 32L35 18" stroke="url(#a2_trunk)" strokeWidth="2" strokeLinecap="round" />
              {/* 气球环境光 */}
              <circle cx="10" cy="28" r="12" fill="#10b981" opacity="0.06" filter="url(#a2_blur)" />
              <circle cx="60" cy="28" r="12" fill="#84cc16" opacity="0.06" filter="url(#a2_blur)" />
              <circle cx="12" cy="8" r="10" fill="#14b8a6" opacity="0.05" filter="url(#a2_blur)" />
              <circle cx="58" cy="8" r="10" fill="#22c55e" opacity="0.05" filter="url(#a2_blur)" />
              <circle cx="35" cy="4" r="8" fill="#34d399" opacity="0.06" filter="url(#a2_blur)" />
              {/* 玻璃球体 */}
              <circle cx="10" cy="28" r="9.5" fill="url(#a2_glass1)" filter="url(#a2_ds)" />
              <circle cx="10" cy="28" r="9.5" stroke="white" strokeWidth="0.5" opacity="0.25" />
              <ellipse cx="7" cy="24" rx="4" ry="4.5" fill="white" opacity="0.3" />
              <ellipse cx="6" cy="22.5" rx="1.5" ry="2" fill="white" opacity="0.5" />
              <circle cx="60" cy="28" r="9.5" fill="url(#a2_glass2)" filter="url(#a2_ds)" />
              <circle cx="60" cy="28" r="9.5" stroke="white" strokeWidth="0.5" opacity="0.25" />
              <ellipse cx="57" cy="24" rx="4" ry="4.5" fill="white" opacity="0.3" />
              <ellipse cx="56" cy="22.5" rx="1.5" ry="2" fill="white" opacity="0.5" />
              <circle cx="12" cy="8" r="8" fill="url(#a2_glass3)" filter="url(#a2_ds)" />
              <circle cx="12" cy="8" r="8" stroke="white" strokeWidth="0.4" opacity="0.2" />
              <ellipse cx="9.5" cy="5" rx="3" ry="3.5" fill="white" opacity="0.28" />
              <ellipse cx="9" cy="3.5" rx="1.2" ry="1.5" fill="white" opacity="0.45" />
              <circle cx="58" cy="8" r="8" fill="url(#a2_glass4)" filter="url(#a2_ds)" />
              <circle cx="58" cy="8" r="8" stroke="white" strokeWidth="0.4" opacity="0.2" />
              <ellipse cx="55.5" cy="5" rx="3" ry="3.5" fill="white" opacity="0.28" />
              <ellipse cx="55" cy="3.5" rx="1.2" ry="1.5" fill="white" opacity="0.45" />
              <circle cx="35" cy="4" r="7" fill="url(#a2_glass5)" filter="url(#a2_ds)" />
              <circle cx="35" cy="4" r="7" stroke="white" strokeWidth="0.4" opacity="0.22" />
              <ellipse cx="33" cy="1.5" rx="2.8" ry="3" fill="white" opacity="0.3" />
              <ellipse cx="32.5" cy="0.5" rx="1" ry="1.3" fill="white" opacity="0.45" />
            </svg>
          </LogoOption>

          {/* 3: 投影剪影 - 深色剪影+长投影 */}
          <LogoOption name="3：投影剪影" desc="深色树剪影+彩色球体+长投影" selected={selected === 3} onClick={() => setSelected(3)}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="a3_g1" x1="10" y1="18" x2="14" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#10b981" />
                  <stop offset="1" stopColor="#047857" />
                </linearGradient>
                <linearGradient id="a3_g2" x1="56" y1="18" x2="60" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#84cc16" />
                  <stop offset="1" stopColor="#4d7c0f" />
                </linearGradient>
                <linearGradient id="a3_g3" x1="16" y1="2" x2="20" y2="16" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2dd4bf" />
                  <stop offset="1" stopColor="#0d9488" />
                </linearGradient>
                <linearGradient id="a3_g4" x1="50" y1="2" x2="54" y2="16" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4ade80" />
                  <stop offset="1" stopColor="#16a34a" />
                </linearGradient>
                <linearGradient id="a3_g5" x1="33" y1="-2" x2="37" y2="10" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#34d399" />
                  <stop offset="1" stopColor="#059669" />
                </linearGradient>
                <filter id="a3_shadow">
                  <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#1e293b" floodOpacity="0.15" />
                </filter>
                <filter id="a3_ball_shadow">
                  <feDropShadow dx="1.5" dy="2.5" stdDeviation="1.5" floodColor="#064e3b" floodOpacity="0.3" />
                </filter>
              </defs>
              {/* 树干剪影 */}
              <path d="M36 68Q34 58 35 48L35 32" stroke="#1F2937" strokeWidth="5.5" strokeLinecap="round" fill="none" filter="url(#a3_shadow)" />
              <path d="M35 42Q22 38 8 44" stroke="#1F2937" strokeWidth="3.2" strokeLinecap="round" fill="none" filter="url(#a3_shadow)" />
              <path d="M35 42Q48 38 62 44" stroke="#1F2937" strokeWidth="3.2" strokeLinecap="round" fill="none" filter="url(#a3_shadow)" />
              <path d="M35 34Q22 26 14 18" stroke="#1F2937" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M35 34Q48 26 56 18" stroke="#1F2937" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M35 32L35 16" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
              {/* 渐变球体 + 投影 */}
              <circle cx="8" cy="30" r="9.5" fill="url(#a3_g1)" filter="url(#a3_ball_shadow)" />
              <ellipse cx="5" cy="26" rx="3.5" ry="4" fill="white" opacity="0.2" />
              <ellipse cx="4.5" cy="25" rx="1.5" ry="1.8" fill="white" opacity="0.35" />
              <circle cx="62" cy="30" r="9.5" fill="url(#a3_g2)" filter="url(#a3_ball_shadow)" />
              <ellipse cx="59" cy="26" rx="3.5" ry="4" fill="white" opacity="0.2" />
              <ellipse cx="58.5" cy="25" rx="1.5" ry="1.8" fill="white" opacity="0.35" />
              <circle cx="14" cy="8" r="8" fill="url(#a3_g3)" filter="url(#a3_ball_shadow)" />
              <ellipse cx="11.5" cy="5" rx="3" ry="3.2" fill="white" opacity="0.2" />
              <ellipse cx="11" cy="4" rx="1.2" ry="1.5" fill="white" opacity="0.3" />
              <circle cx="56" cy="8" r="8" fill="url(#a3_g4)" filter="url(#a3_ball_shadow)" />
              <ellipse cx="53.5" cy="5" rx="3" ry="3.2" fill="white" opacity="0.2" />
              <ellipse cx="53" cy="4" rx="1.2" ry="1.5" fill="white" opacity="0.3" />
              <circle cx="35" cy="4" r="7" fill="url(#a3_g5)" filter="url(#a3_ball_shadow)" />
              <ellipse cx="33" cy="1.5" rx="2.5" ry="2.8" fill="white" opacity="0.22" />
              <ellipse cx="32.5" cy="0.5" rx="1" ry="1.3" fill="white" opacity="0.35" />
            </svg>
          </LogoOption>

          {/* 4: 霓虹发光 - 暗背景+发光球 */}
          <LogoOption name="4：霓虹发光" desc="球体发出柔和光晕，暗色树干衬托" selected={selected === 4} onClick={() => setSelected(4)}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="a4_glow_big">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
                <filter id="a4_glow_med">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
                <filter id="a4_glow_sm">
                  <feGaussianBlur stdDeviation="2.5" />
                </filter>
                <radialGradient id="a4_b1" cx="0.4" cy="0.35" r="0.55">
                  <stop stopColor="#6ee7b7" />
                  <stop offset="1" stopColor="#059669" />
                </radialGradient>
                <radialGradient id="a4_b2" cx="0.4" cy="0.35" r="0.55">
                  <stop stopColor="#bef264" />
                  <stop offset="1" stopColor="#4d7c0f" />
                </radialGradient>
                <radialGradient id="a4_b3" cx="0.4" cy="0.35" r="0.55">
                  <stop stopColor="#5eead4" />
                  <stop offset="1" stopColor="#0d9488" />
                </radialGradient>
                <radialGradient id="a4_b4" cx="0.4" cy="0.35" r="0.55">
                  <stop stopColor="#86efac" />
                  <stop offset="1" stopColor="#16a34a" />
                </radialGradient>
                <radialGradient id="a4_b5" cx="0.4" cy="0.35" r="0.55">
                  <stop stopColor="#a7f3d0" />
                  <stop offset="1" stopColor="#10b981" />
                </radialGradient>
              </defs>
              {/* 暗色树干 */}
              <path d="M36 68Q34 58 35 48L35 32" stroke="#374151" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.7" />
              <path d="M35 42Q22 38 8 42" stroke="#374151" strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M35 42Q48 38 62 42" stroke="#374151" strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M35 34Q22 26 12 18" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.5" />
              <path d="M35 34Q48 26 58 18" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.5" />
              <path d="M35 32L35 16" stroke="#374151" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              {/* 光晕层 */}
              <circle cx="8" cy="28" r="12" fill="#10b981" opacity="0.15" filter="url(#a4_glow_big)" />
              <circle cx="62" cy="28" r="12" fill="#84cc16" opacity="0.15" filter="url(#a4_glow_big)" />
              <circle cx="12" cy="8" r="10" fill="#14b8a6" opacity="0.12" filter="url(#a4_glow_med)" />
              <circle cx="58" cy="8" r="10" fill="#22c55e" opacity="0.12" filter="url(#a4_glow_med)" />
              <circle cx="35" cy="4" r="9" fill="#34d399" opacity="0.12" filter="url(#a4_glow_med)" />
              {/* 球体 */}
              <circle cx="8" cy="28" r="9" fill="url(#a4_b1)" />
              <ellipse cx="5" cy="24" rx="3.5" ry="4" fill="white" opacity="0.3" />
              <ellipse cx="4.5" cy="23" rx="1.2" ry="1.5" fill="white" opacity="0.5" />
              <circle cx="62" cy="28" r="9" fill="url(#a4_b2)" />
              <ellipse cx="59" cy="24" rx="3.5" ry="4" fill="white" opacity="0.3" />
              <ellipse cx="58.5" cy="23" rx="1.2" ry="1.5" fill="white" opacity="0.5" />
              <circle cx="12" cy="8" r="7.5" fill="url(#a4_b3)" />
              <ellipse cx="9.5" cy="5" rx="3" ry="3.2" fill="white" opacity="0.25" />
              <ellipse cx="9" cy="4" rx="1" ry="1.3" fill="white" opacity="0.45" />
              <circle cx="58" cy="8" r="7.5" fill="url(#a4_b4)" />
              <ellipse cx="55.5" cy="5" rx="3" ry="3.2" fill="white" opacity="0.25" />
              <ellipse cx="55" cy="4" rx="1" ry="1.3" fill="white" opacity="0.45" />
              <circle cx="35" cy="4" r="6.5" fill="url(#a4_b5)" />
              <ellipse cx="33" cy="1.5" rx="2.5" ry="2.8" fill="white" opacity="0.28" />
              <ellipse cx="32.5" cy="0.5" rx="1" ry="1.2" fill="white" opacity="0.45" />
            </svg>
          </LogoOption>

          {/* 5: 渐变树干+透明球 */}
          <LogoOption name="5：柔光渐变" desc="渐变树干+半透明层叠球体，柔和光感" selected={selected === 5} onClick={() => setSelected(5)}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="a5_trunk" x1="36" y1="26" x2="36" y2="68" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#94a3b8" stopOpacity="0.6" />
                  <stop offset="0.5" stopColor="#64748b" stopOpacity="0.7" />
                  <stop offset="1" stopColor="#334155" stopOpacity="0.5" />
                </linearGradient>
                <filter id="a5_soft">
                  <feGaussianBlur stdDeviation="1" />
                </filter>
                <filter id="a5_ds">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#064e3b" floodOpacity="0.18" />
                </filter>
              </defs>
              {/* 柔和树干 */}
              <path d="M36 68Q33 58 35 48L35 32" stroke="url(#a5_trunk)" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M35 42Q20 36 6 42" stroke="url(#a5_trunk)" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M35 42Q50 36 64 42" stroke="url(#a5_trunk)" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M35 34Q20 24 10 16" stroke="url(#a5_trunk)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M35 34Q50 24 60 16" stroke="url(#a5_trunk)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M35 32L35 18" stroke="url(#a5_trunk)" strokeWidth="2.2" strokeLinecap="round" />
              {/* 底层大球 - 半透明 */}
              <circle cx="6" cy="28" r="11" fill="#10b981" opacity="0.18" filter="url(#a5_soft)" />
              <circle cx="64" cy="28" r="11" fill="#84cc16" opacity="0.18" filter="url(#a5_soft)" />
              {/* 主球层 */}
              <circle cx="6" cy="28" r="9" fill="#10b981" opacity="0.6" filter="url(#a5_ds)" />
              <ellipse cx="3" cy="24" rx="3.5" ry="4" fill="white" opacity="0.25" />
              <ellipse cx="2.5" cy="22.5" rx="1.5" ry="1.8" fill="white" opacity="0.4" />
              <circle cx="64" cy="28" r="9" fill="#84cc16" opacity="0.6" filter="url(#a5_ds)" />
              <ellipse cx="61" cy="24" rx="3.5" ry="4" fill="white" opacity="0.25" />
              <ellipse cx="60.5" cy="22.5" rx="1.5" ry="1.8" fill="white" opacity="0.4" />
              {/* 中层球 */}
              <circle cx="10" cy="8" r="9" fill="#14b8a6" opacity="0.15" filter="url(#a5_soft)" />
              <circle cx="60" cy="8" r="9" fill="#22c55e" opacity="0.15" filter="url(#a5_soft)" />
              <circle cx="10" cy="8" r="7.5" fill="#14b8a6" opacity="0.55" filter="url(#a5_ds)" />
              <ellipse cx="7.5" cy="5" rx="3" ry="3.2" fill="white" opacity="0.22" />
              <ellipse cx="7" cy="4" rx="1.2" ry="1.5" fill="white" opacity="0.4" />
              <circle cx="60" cy="8" r="7.5" fill="#22c55e" opacity="0.55" filter="url(#a5_ds)" />
              <ellipse cx="57.5" cy="5" rx="3" ry="3.2" fill="white" opacity="0.22" />
              <ellipse cx="57" cy="4" rx="1.2" ry="1.5" fill="white" opacity="0.4" />
              {/* 顶球 */}
              <circle cx="35" cy="4" r="8" fill="#34d399" opacity="0.15" filter="url(#a5_soft)" />
              <circle cx="35" cy="4" r="6.5" fill="#34d399" opacity="0.6" filter="url(#a5_ds)" />
              <ellipse cx="33" cy="1.5" rx="2.5" ry="2.8" fill="white" opacity="0.28" />
              <ellipse cx="32.5" cy="0.5" rx="1" ry="1.3" fill="white" opacity="0.45" />
            </svg>
          </LogoOption>

          {/* 6: 极简抽象 - 最精炼 */}
          <LogoOption name="6：极简抽象" desc="最精炼的表达，一竿三枝三球" selected={selected === 6} onClick={() => setSelected(6)}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="a6_trunk" x1="36" y1="24" x2="36" y2="68" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#9CA3AF" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#4B5563" stopOpacity="0.5" />
                </linearGradient>
                <radialGradient id="a6_b1" cx="0.38" cy="0.32" r="0.58">
                  <stop stopColor="#6ee7b7" />
                  <stop offset="1" stopColor="#047857" />
                </radialGradient>
                <radialGradient id="a6_b2" cx="0.38" cy="0.32" r="0.58">
                  <stop stopColor="#a3e635" />
                  <stop offset="1" stopColor="#4d7c0f" />
                </radialGradient>
                <radialGradient id="a6_b3" cx="0.38" cy="0.32" r="0.58">
                  <stop stopColor="#a7f3d0" />
                  <stop offset="1" stopColor="#059669" />
                </radialGradient>
                <filter id="a6_ds">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#064e3b" floodOpacity="0.25" />
                </filter>
                <filter id="a6_glow">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
              </defs>
              {/* 简洁树干 */}
              <line x1="36" y1="68" x2="36" y2="28" stroke="url(#a6_trunk)" strokeWidth="5.5" strokeLinecap="round" />
              {/* 三根枝杈 */}
              <path d="M36 36Q20 32 8 36" stroke="url(#a6_trunk)" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <path d="M36 36Q50 32 62 36" stroke="url(#a6_trunk)" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <path d="M36 28L36 14" stroke="url(#a6_trunk)" strokeWidth="2.5" strokeLinecap="round" />
              {/* 三个大球 + 光晕 */}
              <circle cx="6" cy="26" r="12" fill="#10b981" opacity="0.08" filter="url(#a6_glow)" />
              <circle cx="6" cy="26" r="10" fill="url(#a6_b1)" filter="url(#a6_ds)" />
              <ellipse cx="3" cy="22" rx="4" ry="4.5" fill="white" opacity="0.28" />
              <ellipse cx="2" cy="20.5" rx="1.5" ry="2" fill="white" opacity="0.45" />
              <circle cx="64" cy="26" r="12" fill="#84cc16" opacity="0.08" filter="url(#a6_glow)" />
              <circle cx="64" cy="26" r="10" fill="url(#a6_b2)" filter="url(#a6_ds)" />
              <ellipse cx="61" cy="22" rx="4" ry="4.5" fill="white" opacity="0.28" />
              <ellipse cx="60" cy="20.5" rx="1.5" ry="2" fill="white" opacity="0.45" />
              <circle cx="36" cy="4" r="10" fill="#34d399" opacity="0.08" filter="url(#a6_glow)" />
              <circle cx="36" cy="4" r="8.5" fill="url(#a6_b3)" filter="url(#a6_ds)" />
              <ellipse cx="33.5" cy="1" rx="3.5" ry="3.8" fill="white" opacity="0.3" />
              <ellipse cx="33" cy="-0.5" rx="1.3" ry="1.5" fill="white" opacity="0.5" />
            </svg>
          </LogoOption>

          {/* 7: 弧形优雅+发光 */}
          <LogoOption name="7：弧形光感" desc="弧形枝杈+光球，优雅流畅" selected={selected === 7} onClick={() => setSelected(7)}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="a7_trunk" x1="36" y1="24" x2="36" y2="68" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#94a3b8" stopOpacity="0.7" />
                  <stop offset="1" stopColor="#475569" stopOpacity="0.5" />
                </linearGradient>
                <radialGradient id="a7_b1" cx="0.38" cy="0.33" r="0.55">
                  <stop stopColor="#6ee7b7" />
                  <stop offset="0.7" stopColor="#10b981" />
                  <stop offset="1" stopColor="#059669" />
                </radialGradient>
                <radialGradient id="a7_b2" cx="0.38" cy="0.33" r="0.55">
                  <stop stopColor="#bef264" />
                  <stop offset="0.7" stopColor="#84cc16" />
                  <stop offset="1" stopColor="#65a30d" />
                </radialGradient>
                <radialGradient id="a7_b3" cx="0.38" cy="0.33" r="0.55">
                  <stop stopColor="#99f6e4" />
                  <stop offset="0.7" stopColor="#2dd4bf" />
                  <stop offset="1" stopColor="#0d9488" />
                </radialGradient>
                <radialGradient id="a7_b4" cx="0.38" cy="0.33" r="0.55">
                  <stop stopColor="#86efac" />
                  <stop offset="0.7" stopColor="#4ade80" />
                  <stop offset="1" stopColor="#16a34a" />
                </radialGradient>
                <radialGradient id="a7_b5" cx="0.38" cy="0.33" r="0.55">
                  <stop stopColor="#a7f3d0" />
                  <stop offset="0.7" stopColor="#34d399" />
                  <stop offset="1" stopColor="#10b981" />
                </radialGradient>
                <filter id="a7_ds">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#064e3b" floodOpacity="0.22" />
                </filter>
                <filter id="a7_glow">
                  <feGaussianBlur stdDeviation="2.5" />
                </filter>
              </defs>
              {/* 优雅弧形树干 */}
              <path d="M36 68Q33 56 35 46L35 30" stroke="url(#a7_trunk)" strokeWidth="5" strokeLinecap="round" fill="none" />
              {/* 弧形枝杈 */}
              <path d="M35 40Q24 36 10 40Q4 42 2 46" stroke="url(#a7_trunk)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M35 40Q46 36 60 40Q66 42 68 46" stroke="url(#a7_trunk)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M35 34Q24 26 14 20Q10 18 6 18" stroke="url(#a7_trunk)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M35 34Q46 26 56 20Q60 18 64 18" stroke="url(#a7_trunk)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M35 30L35 16" stroke="url(#a7_trunk)" strokeWidth="2" strokeLinecap="round" />
              {/* 光晕 */}
              <circle cx="2" cy="36" r="10" fill="#10b981" opacity="0.08" filter="url(#a7_glow)" />
              <circle cx="68" cy="36" r="10" fill="#84cc16" opacity="0.08" filter="url(#a7_glow)" />
              <circle cx="6" cy="10" r="8" fill="#14b8a6" opacity="0.07" filter="url(#a7_glow)" />
              <circle cx="64" cy="10" r="8" fill="#22c55e" opacity="0.07" filter="url(#a7_glow)" />
              <circle cx="35" cy="4" r="7" fill="#34d399" opacity="0.08" filter="url(#a7_glow)" />
              {/* 球体 */}
              <circle cx="2" cy="36" r="8.5" fill="url(#a7_b1)" filter="url(#a7_ds)" />
              <ellipse cx="-0.5" cy="32.5" rx="3.2" ry="3.5" fill="white" opacity="0.25" />
              <ellipse cx="-1" cy="31.5" rx="1.2" ry="1.5" fill="white" opacity="0.4" />
              <circle cx="68" cy="36" r="8.5" fill="url(#a7_b2)" filter="url(#a7_ds)" />
              <ellipse cx="65.5" cy="32.5" rx="3.2" ry="3.5" fill="white" opacity="0.25" />
              <ellipse cx="65" cy="31.5" rx="1.2" ry="1.5" fill="white" opacity="0.4" />
              <circle cx="6" cy="10" r="7" fill="url(#a7_b3)" filter="url(#a7_ds)" />
              <ellipse cx="4" cy="7" rx="2.5" ry="2.8" fill="white" opacity="0.22" />
              <ellipse cx="3.5" cy="6" rx="1" ry="1.3" fill="white" opacity="0.4" />
              <circle cx="64" cy="10" r="7" fill="url(#a7_b4)" filter="url(#a7_ds)" />
              <ellipse cx="62" cy="7" rx="2.5" ry="2.8" fill="white" opacity="0.22" />
              <ellipse cx="61.5" cy="6" rx="1" ry="1.3" fill="white" opacity="0.4" />
              <circle cx="35" cy="4" r="6" fill="url(#a7_b5)" filter="url(#a7_ds)" />
              <ellipse cx="33" cy="1.5" rx="2.2" ry="2.5" fill="white" opacity="0.25" />
              <ellipse cx="32.5" cy="0.5" rx="1" ry="1.2" fill="white" opacity="0.45" />
            </svg>
          </LogoOption>

          {/* 8: 气球飘飞 - 动感版 */}
          <LogoOption name="8：飘逸动感" desc="球体大小不一错落飘飞，充满生命力" selected={selected === 8} onClick={() => setSelected(8)}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="a8_trunk" x1="34" y1="24" x2="34" y2="68" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#94a3b8" stopOpacity="0.75" />
                  <stop offset="1" stopColor="#475569" stopOpacity="0.45" />
                </linearGradient>
                <radialGradient id="a8_b1" cx="0.38" cy="0.32" r="0.55"><stop stopColor="#6ee7b7" /><stop offset="1" stopColor="#059669" /></radialGradient>
                <radialGradient id="a8_b2" cx="0.38" cy="0.32" r="0.55"><stop stopColor="#bef264" /><stop offset="1" stopColor="#4d7c0f" /></radialGradient>
                <radialGradient id="a8_b3" cx="0.38" cy="0.32" r="0.55"><stop stopColor="#5eead4" /><stop offset="1" stopColor="#0d9488" /></radialGradient>
                <radialGradient id="a8_b4" cx="0.38" cy="0.32" r="0.55"><stop stopColor="#86efac" /><stop offset="1" stopColor="#16a34a" /></radialGradient>
                <radialGradient id="a8_b5" cx="0.38" cy="0.32" r="0.55"><stop stopColor="#a7f3d0" /><stop offset="1" stopColor="#10b981" /></radialGradient>
                <radialGradient id="a8_b6" cx="0.38" cy="0.32" r="0.55"><stop stopColor="#99f6e4" /><stop offset="1" stopColor="#14b8a6" /></radialGradient>
                <filter id="a8_ds"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#064e3b" floodOpacity="0.2" /></filter>
                <filter id="a8_glow"><feGaussianBlur stdDeviation="2" /></filter>
              </defs>
              {/* 微弯树干 */}
              <path d="M34 68Q32 58 33 48Q35 40 35 32" stroke="url(#a8_trunk)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              {/* 不对称枝杈 */}
              <path d="M34 42Q18 36 4 40" stroke="url(#a8_trunk)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M35 38Q50 32 66 30" stroke="url(#a8_trunk)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <path d="M35 34Q20 24 8 16" stroke="url(#a8_trunk)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M35 32Q46 24 58 14" stroke="url(#a8_trunk)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M35 30Q38 22 40 12" stroke="url(#a8_trunk)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M35 30Q30 22 24 12" stroke="url(#a8_trunk)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              {/* 错落球体 - 大小不一 */}
              <circle cx="4" cy="30" r="9" fill="#10b981" opacity="0.07" filter="url(#a8_glow)" />
              <circle cx="4" cy="30" r="9" fill="url(#a8_b1)" filter="url(#a8_ds)" />
              <ellipse cx="1.5" cy="26.5" rx="3.2" ry="3.5" fill="white" opacity="0.25" />
              <ellipse cx="1" cy="25.5" rx="1.2" ry="1.5" fill="white" opacity="0.4" />

              <circle cx="66" cy="20" r="10" fill="#84cc16" opacity="0.07" filter="url(#a8_glow)" />
              <circle cx="66" cy="20" r="10" fill="url(#a8_b2)" filter="url(#a8_ds)" />
              <ellipse cx="63" cy="16" rx="3.8" ry="4.2" fill="white" opacity="0.25" />
              <ellipse cx="62.5" cy="14.5" rx="1.5" ry="1.8" fill="white" opacity="0.4" />

              <circle cx="8" cy="8" r="7.5" fill="url(#a8_b3)" filter="url(#a8_ds)" />
              <ellipse cx="6" cy="5" rx="2.8" ry="3" fill="white" opacity="0.22" />
              <ellipse cx="5.5" cy="4" rx="1" ry="1.3" fill="white" opacity="0.4" />

              <circle cx="58" cy="4" r="8" fill="url(#a8_b4)" filter="url(#a8_ds)" />
              <ellipse cx="55.5" cy="1" rx="3" ry="3.2" fill="white" opacity="0.22" />
              <ellipse cx="55" cy="0" rx="1.2" ry="1.4" fill="white" opacity="0.4" />

              <circle cx="40" cy="2" r="6" fill="url(#a8_b5)" filter="url(#a8_ds)" />
              <ellipse cx="38" cy="0" rx="2.2" ry="2.5" fill="white" opacity="0.25" />
              <ellipse cx="37.5" cy="-1" rx="0.8" ry="1" fill="white" opacity="0.45" />

              <circle cx="24" cy="4" r="5.5" fill="url(#a8_b6)" filter="url(#a8_ds)" />
              <ellipse cx="22" cy="2" rx="2" ry="2.2" fill="white" opacity="0.22" />
              <ellipse cx="21.5" cy="1" rx="0.8" ry="1" fill="white" opacity="0.4" />
            </svg>
          </LogoOption>

          {/* 9: 纯绿色统一 */}
          <LogoOption name="9：纯绿统一" desc="全绿色系，深浅渐变，统一大气" selected={selected === 9} onClick={() => setSelected(9)}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="a9_trunk" x1="36" y1="28" x2="36" y2="68" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#059669" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#064e3b" stopOpacity="0.6" />
                </linearGradient>
                <radialGradient id="a9_b1" cx="0.38" cy="0.33" r="0.55"><stop stopColor="#6ee7b7" /><stop offset="1" stopColor="#047857" /></radialGradient>
                <radialGradient id="a9_b2" cx="0.38" cy="0.33" r="0.55"><stop stopColor="#34d399" /><stop offset="1" stopColor="#065f46" /></radialGradient>
                <radialGradient id="a9_b3" cx="0.38" cy="0.33" r="0.55"><stop stopColor="#a7f3d0" /><stop offset="1" stopColor="#059669" /></radialGradient>
                <filter id="a9_ds"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#064e3b" floodOpacity="0.25" /></filter>
                <filter id="a9_glow"><feGaussianBlur stdDeviation="3" /></filter>
              </defs>
              {/* 深绿树干 */}
              <path d="M36 68Q34 58 35 48L35 32" stroke="url(#a9_trunk)" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M35 42Q22 36 8 40" stroke="url(#a9_trunk)" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M35 42Q48 36 62 40" stroke="url(#a9_trunk)" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M35 34Q22 26 12 18" stroke="url(#a9_trunk)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M35 34Q48 26 58 18" stroke="url(#a9_trunk)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M35 32L35 18" stroke="url(#a9_trunk)" strokeWidth="2.2" strokeLinecap="round" />
              {/* 绿色光晕 */}
              <circle cx="8" cy="28" r="12" fill="#10b981" opacity="0.1" filter="url(#a9_glow)" />
              <circle cx="62" cy="28" r="12" fill="#10b981" opacity="0.1" filter="url(#a9_glow)" />
              <circle cx="35" cy="4" r="9" fill="#34d399" opacity="0.1" filter="url(#a9_glow)" />
              {/* 球体 */}
              <circle cx="8" cy="28" r="9.5" fill="url(#a9_b1)" filter="url(#a9_ds)" />
              <ellipse cx="5" cy="24" rx="3.5" ry="4" fill="white" opacity="0.22" />
              <ellipse cx="4.5" cy="23" rx="1.5" ry="1.8" fill="white" opacity="0.38" />
              <circle cx="62" cy="28" r="9.5" fill="url(#a9_b1)" filter="url(#a9_ds)" />
              <ellipse cx="59" cy="24" rx="3.5" ry="4" fill="white" opacity="0.22" />
              <ellipse cx="58.5" cy="23" rx="1.5" ry="1.8" fill="white" opacity="0.38" />
              <circle cx="12" cy="8" r="7.5" fill="url(#a9_b2)" filter="url(#a9_ds)" />
              <ellipse cx="9.5" cy="5" rx="3" ry="3.2" fill="white" opacity="0.2" />
              <ellipse cx="9" cy="4" rx="1.2" ry="1.5" fill="white" opacity="0.35" />
              <circle cx="58" cy="8" r="7.5" fill="url(#a9_b2)" filter="url(#a9_ds)" />
              <ellipse cx="55.5" cy="5" rx="3" ry="3.2" fill="white" opacity="0.2" />
              <ellipse cx="55" cy="4" rx="1.2" ry="1.5" fill="white" opacity="0.35" />
              <circle cx="35" cy="4" r="6.5" fill="url(#a9_b3)" filter="url(#a9_ds)" />
              <ellipse cx="33" cy="1.5" rx="2.5" ry="2.8" fill="white" opacity="0.25" />
              <ellipse cx="32.5" cy="0.5" rx="1" ry="1.2" fill="white" opacity="0.4" />
            </svg>
          </LogoOption>

          {/* 10: 3D感 */}
          <LogoOption name="10：3D 立体" desc="球体带强烈3D高光和阴影，立体感十足" selected={selected === 10} onClick={() => setSelected(10)}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="a10_trunk" x1="36" y1="28" x2="36" y2="68" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6B7280" />
                  <stop offset="1" stopColor="#374151" />
                </linearGradient>
                <radialGradient id="a10_b1" cx="0.3" cy="0.25" r="0.7">
                  <stop stopColor="#a7f3d0" />
                  <stop offset="0.3" stopColor="#34d399" />
                  <stop offset="0.7" stopColor="#10b981" />
                  <stop offset="1" stopColor="#064e3b" />
                </radialGradient>
                <radialGradient id="a10_b2" cx="0.3" cy="0.25" r="0.7">
                  <stop stopColor="#d9f99d" />
                  <stop offset="0.3" stopColor="#a3e635" />
                  <stop offset="0.7" stopColor="#84cc16" />
                  <stop offset="1" stopColor="#3f6212" />
                </radialGradient>
                <radialGradient id="a10_b3" cx="0.3" cy="0.25" r="0.7">
                  <stop stopColor="#ccfbf1" />
                  <stop offset="0.3" stopColor="#5eead4" />
                  <stop offset="0.7" stopColor="#14b8a6" />
                  <stop offset="1" stopColor="#134e4a" />
                </radialGradient>
                <radialGradient id="a10_b4" cx="0.3" cy="0.25" r="0.7">
                  <stop stopColor="#bbf7d0" />
                  <stop offset="0.3" stopColor="#86efac" />
                  <stop offset="0.7" stopColor="#22c55e" />
                  <stop offset="1" stopColor="#14532d" />
                </radialGradient>
                <radialGradient id="a10_b5" cx="0.3" cy="0.25" r="0.7">
                  <stop stopColor="#d1fae5" />
                  <stop offset="0.3" stopColor="#6ee7b7" />
                  <stop offset="0.7" stopColor="#10b981" />
                  <stop offset="1" stopColor="#064e3b" />
                </radialGradient>
                <filter id="a10_ds"><feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#1e293b" floodOpacity="0.25" /></filter>
              </defs>
              {/* 树干 */}
              <path d="M36 68Q34 58 35 48L35 32" stroke="url(#a10_trunk)" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M35 42Q22 38 8 42" stroke="url(#a10_trunk)" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M35 42Q48 38 62 42" stroke="url(#a10_trunk)" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M35 34Q22 26 12 18" stroke="url(#a10_trunk)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M35 34Q48 26 58 18" stroke="url(#a10_trunk)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M35 32L35 16" stroke="url(#a10_trunk)" strokeWidth="2.2" strokeLinecap="round" />
              {/* 3D 球体 - 更强烈的高光和暗部 */}
              <circle cx="8" cy="28" r="9.5" fill="url(#a10_b1)" filter="url(#a10_ds)" />
              <ellipse cx="4" cy="23" rx="4.5" ry="4.8" fill="white" opacity="0.18" />
              <ellipse cx="3" cy="21" rx="2" ry="2.5" fill="white" opacity="0.45" />
              <circle cx="62" cy="28" r="9.5" fill="url(#a10_b2)" filter="url(#a10_ds)" />
              <ellipse cx="58" cy="23" rx="4.5" ry="4.8" fill="white" opacity="0.18" />
              <ellipse cx="57" cy="21" rx="2" ry="2.5" fill="white" opacity="0.45" />
              <circle cx="12" cy="8" r="8" fill="url(#a10_b3)" filter="url(#a10_ds)" />
              <ellipse cx="8.5" cy="4" rx="3.8" ry="4" fill="white" opacity="0.15" />
              <ellipse cx="7.5" cy="2.5" rx="1.5" ry="2" fill="white" opacity="0.4" />
              <circle cx="58" cy="8" r="8" fill="url(#a10_b4)" filter="url(#a10_ds)" />
              <ellipse cx="54.5" cy="4" rx="3.8" ry="4" fill="white" opacity="0.15" />
              <ellipse cx="53.5" cy="2.5" rx="1.5" ry="2" fill="white" opacity="0.4" />
              <circle cx="35" cy="4" r="7" fill="url(#a10_b5)" filter="url(#a10_ds)" />
              <ellipse cx="32" cy="0.5" rx="3.2" ry="3.5" fill="white" opacity="0.18" />
              <ellipse cx="31" cy="-1" rx="1.5" ry="1.8" fill="white" opacity="0.45" />
            </svg>
          </LogoOption>

        </div>

        {selected && (
          <div className="text-center pt-2">
            <p className="text-sm text-primary font-medium">已选择：方案 {selected}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LogoPreview
