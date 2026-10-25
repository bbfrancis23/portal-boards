import type {SVGProps} from "react"

type IconDashboardProps = Omit<SVGProps<SVGSVGElement>, "stroke"> & {
  size?: number | string
  stroke?: number | string
}

// Our own dashboard icon: a screen with a pie chart, a short list and rising bars.
// It takes the same props as Tabler's icons (size, stroke, color) and draws on the same
// 24×24 grid with a 2px round stroke, so it sits naturally beside them.
const IconDashboard = ({
  size = 24,
  stroke = 2,
  color = "currentColor",
  ...props
}: IconDashboardProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <circle cx="8" cy="10" r="3" />
    <path d="M8 7v3l2.6 1.5" />
    <path d="M14 8h5M14 10.5h3" />
    <path d="M13 17v-1M16 17v-2.5M19 17v-3.5" />
  </svg>
)

export default IconDashboard
