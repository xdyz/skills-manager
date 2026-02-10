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
    <rect width="48" height="48" rx="12" fill="url(#bg)" />
    {/* Simple wand / magic stick */}
    <line x1="14" y1="34" x2="30" y2="14" stroke="white" strokeWidth="3" strokeLinecap="round" />
    {/* Star sparkle at tip */}
    <circle cx="30" cy="14" r="4" fill="white" fillOpacity="0.9" />
    <circle cx="30" cy="14" r="2" fill="#fde68a" />
    {/* Tiny sparkles */}
    <circle cx="36" cy="11" r="1.2" fill="white" fillOpacity="0.7" />
    <circle cx="34" cy="19" r="1" fill="white" fillOpacity="0.5" />
    <circle cx="25" cy="10" r="0.8" fill="white" fillOpacity="0.6" />
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
)

export default Logo
