interface LogoProps {
  size?: number
  className?: string
}

const Logo = ({ size = 32, className = "" }: LogoProps) => (
  <img
    src="/appicon.png"
    width={size}
    height={size}
    className={className}
    alt="Logo"
  />
)

export default Logo
