import type {SVGProps} from "react"

type IconDashboardPlusProps = Omit<SVGProps<SVGSVGElement>, "stroke"> & {
  size?: number | string
  stroke?: number | string
}

// IconDashboard with a plus, for "New dashboard". Like Tabler's "…Plus" icons, the screen's frame
// opens at its bottom-right corner to make room for the plus; one short bar keeps the chart hint.
// Same props as Tabler's icons (size, stroke, color).
const IconDashboardPlus = ({
  size = 24,
  stroke = 2,
  color = "currentColor",
  ...props
}: IconDashboardPlusProps) => (
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
    <path d="M12 20h-8a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v6" />
    <circle cx="8" cy="10" r="3" />
    <path d="M8 7v3l2.6 1.5" />
    <path d="M14 8h5M14 10.5h3" />
    <path d="M13 17v-1.5" />
    <path d="M16 19h6M19 16v6" />
  </svg>
)

export default IconDashboardPlus
