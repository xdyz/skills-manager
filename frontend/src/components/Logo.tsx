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
    {/* Background with 3D depth */}
    <rect width="48" height="48" rx="12" fill="url(#bg-grad)" />
    <rect width="48" height="24" rx="12" fill="white" fillOpacity="0.08" />

    {/* Body - round blob creature */}
    <ellipse cx="24" cy="27" rx="13" ry="12" fill="url(#body-grad)" />
    {/* Body highlight for 3D feel */}
    <ellipse cx="22" cy="22" rx="8" ry="5" fill="white" fillOpacity="0.25" />

    {/* Left ear */}
    <ellipse cx="15" cy="16" rx="4" ry="5" transform="rotate(-15 15 16)" fill="url(#body-grad)" />
    <ellipse cx="15" cy="15.5" rx="2.2" ry="3" transform="rotate(-15 15 15.5)" fill="white" fillOpacity="0.2" />
    {/* Right ear */}
    <ellipse cx="33" cy="16" rx="4" ry="5" transform="rotate(15 33 16)" fill="url(#body-grad)" />
    <ellipse cx="33" cy="15.5" rx="2.2" ry="3" transform="rotate(15 33 15.5)" fill="white" fillOpacity="0.2" />

    {/* Eyes - big round shiny */}
    <ellipse cx="19.5" cy="26" rx="3.2" ry="3.5" fill="white" />
    <ellipse cx="28.5" cy="26" rx="3.2" ry="3.5" fill="white" />
    <ellipse cx="20" cy="26.5" rx="2" ry="2.2" fill="#1a1a2e" />
    <ellipse cx="29" cy="26.5" rx="2" ry="2.2" fill="#1a1a2e" />
    {/* Eye sparkle */}
    <circle cx="20.8" cy="25.5" r="0.8" fill="white" />
    <circle cx="29.8" cy="25.5" r="0.8" fill="white" />
    <circle cx="19.5" cy="27" r="0.4" fill="white" fillOpacity="0.6" />
    <circle cx="28.5" cy="27" r="0.4" fill="white" fillOpacity="0.6" />

    {/* Mouth - cute W shape */}
    <path d="M22 30.5 Q23 31.5 24 30.5 Q25 31.5 26 30.5" stroke="#1a1a2e" strokeWidth="0.8" fill="none" strokeLinecap="round" />

    {/* Cheek blush */}
    <ellipse cx="15.5" cy="29.5" rx="2" ry="1.2" fill="#ff9eb1" fillOpacity="0.3" />
    <ellipse cx="32.5" cy="29.5" rx="2" ry="1.2" fill="#ff9eb1" fillOpacity="0.3" />

    <defs>
      <linearGradient id="bg-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6ee7b7" />
        <stop offset="0.5" stopColor="#34d399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="body-grad" x1="24" y1="14" x2="24" y2="39" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f0fdf4" />
        <stop offset="1" stopColor="#bbf7d0" />
      </linearGradient>
    </defs>
  </svg>
)

export default Logo
