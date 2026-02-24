interface LogoProps {
  size?: number
  className?: string
}

const Logo = ({ size = 32, className = "" }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="512" height="512" rx="110" fill="url(#logo-bg)" />
    {/* Leaf shape matching appicon.png */}
    <path
      d="M360 152C360 152 310 130 245 175C180 220 155 300 155 355C155 355 200 330 235 295"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M155 355C155 355 175 255 245 195C315 135 360 152 360 152C360 152 365 250 295 320C225 390 155 355 155 355Z"
      fill="white"
    />
    {/* Leaf vein / center line */}
    <line x1="170" y1="340" x2="345" y2="165" stroke="url(#logo-bg)" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.3" />
    <defs>
      <linearGradient id="logo-bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
        <stop stopColor="#5ee9a8" />
        <stop offset="1" stopColor="#34d399" />
      </linearGradient>
    </defs>
  </svg>
)

export default Logo
