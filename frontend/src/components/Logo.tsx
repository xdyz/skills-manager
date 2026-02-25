interface LogoProps {
  size?: number
  className?: string
  showBackground?: boolean
}

const Logo = ({ size = 32, className = "", showBackground = false }: LogoProps) => {
  // Use unique IDs to avoid conflicts when multiple Logos render
  const uid = showBackground ? "bg" : "fg"

  if (showBackground) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id={`${uid}-bgG`} x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id={`${uid}-shadow`} x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="2" dy="4" stdDeviation="10" floodColor="#000" floodOpacity="0.12" />
          </filter>
        </defs>
        {/* Background */}
        <rect width="512" height="512" rx="110" fill={`url(#${uid}-bgG)`} />

        {/* Feather/leaf - diagonal from top-right to bottom-left, matching original */}
        {/* Left curve (big arc) */}
        <path
          d="M340 100 C260 100, 140 160, 140 280 C140 330, 165 365, 195 380"
          fill="none"
          stroke="white"
          strokeWidth="0"
        />
        {/* Full feather shape */}
        <path
          d="M340 100
             C380 130, 370 180, 350 210
             C320 260, 270 320, 200 375
             L195 380
             C150 340, 130 280, 145 220
             C160 160, 220 110, 340 100Z"
          fill="white"
          filter={`url(#${uid}-shadow)`}
        />
        {/* Central vein line (pen shaft) - diagonal */}
        <line
          x1="335" y1="110"
          x2="198" y2="377"
          stroke="#10b981"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.45"
        />
        {/* Pen nib / tip extending from feather bottom */}
        <path
          d="M190 378 L197 405 L204 378"
          fill="white"
          opacity="0.9"
        />
        {/* S-curve from pen tip - horizontal/lying S shape */}
        <path
          d="M197 405 C210 395, 230 410, 250 400 C270 390, 290 405, 310 395"
          fill="none"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`${uid}-leafG`} x1="80" y1="30" x2="120" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Feather/leaf shape - diagonal from top-right to bottom-left */}
      <path
        d="M170 28
           C190 42, 185 70, 175 88
           C160 118, 132 150, 100 180
           L97 183
           C75 165, 62 135, 70 100
           C78 65, 110 35, 170 28Z"
        fill={`url(#${uid}-leafG)`}
      />
      {/* Vein / pen shaft */}
      <line
        x1="168" y1="32"
        x2="98" y2="182"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Pen nib */}
      <path
        d="M94 181 L98 198 L102 181"
        fill={`url(#${uid}-leafG)`}
      />
      {/* S-curve from pen tip - horizontal/lying S shape */}
      <path
        d="M98 198 C106 192, 118 200, 130 194 C142 188, 154 196, 166 190"
        fill="none"
        stroke={`url(#${uid}-leafG)`}
        strokeWidth="3"
        strokeLinecap="round"
        filter={`url(#${uid}-glow)`}
      />
    </svg>
  )
}

export default Logo
