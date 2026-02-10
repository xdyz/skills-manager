interface LogoProps {
  size?: number
  className?: string
}

const Logo = ({ size = 32, className = "" }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background rounded square */}
    <rect width="48" height="48" rx="12" fill="url(#logo-gradient)" />
    {/* Skill lightning bolt / spark */}
    <path
      d="M26 10L16 26h7l-3 12 14-18h-8l4-10h-4z"
      fill="white"
      fillOpacity="0.95"
    />
    {/* Subtle shine */}
    <path
      d="M26 10L16 26h7l-3 12 14-18h-8l4-10h-4z"
      fill="url(#bolt-shine)"
      fillOpacity="0.3"
    />
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="bolt-shine" x1="16" y1="10" x2="30" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
)

export default Logo
