import {Button, Stack, Text} from "@mantine/core"
import {useId} from "react"

export type EmptyStateProps = {
  message: string
  // Optional call to action, shown as a glow button.
  action?: {label: string; onClick?: () => void}
}

// What a widget shows before it has any data (LOOK.md: a geometric drawing + one line of dim text).
const EmptyState = ({message, action}: EmptyStateProps) => {
  // Each drawing needs its own gradient id; React's ids contain characters SVG urls don't like.
  const gradientId = `empty-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`

  return (
    <Stack align="center" gap="sm" py="md">
      <svg width={140} height={80} viewBox="0 0 140 80" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--pb-cyan)" />
            <stop offset="100%" stopColor="var(--pb-lime)" />
          </linearGradient>
        </defs>
        <circle
          cx={48}
          cy={42}
          r={26}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={1.5}
        />
        <polygon
          points="62,66 92,16 122,66"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>
      <Text size="sm" c="dimmed" ta="center">
        {message}
      </Text>
      {action && (
        <Button variant="glow" size="xs" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Stack>
  )
}

export default EmptyState
