import {Indicator, Stack, Text} from "@mantine/core"
import NeonText from "@/theme/NeonText"

import type {CardSpec} from "./SampleBoard"
import WidgetCard from "./WidgetCard"

export type Stat = {
  title: string
  value: string
  // Change since the previous period: positive is shown lime, negative coral.
  delta?: number
  // Unit after the delta, e.g. "%". Badges stay short: words go in `comparison`.
  deltaUnit?: string
  // What the delta compares against, shown as small text under the number.
  comparison?: string
}

export type StatCardProps = CardSpec & Stat

const formatDelta = (delta: number, suffix = "") =>
  `${delta > 0 ? "+" : "−"}${Math.abs(delta)}${suffix}`

const StatCard = ({title, value, delta, deltaUnit, comparison, minHeight, span}: StatCardProps) => {
  return (
    <WidgetCard title={title} span={span} minHeight={minHeight}>
      <Stack flex={1} align="center" justify="center">
        <Indicator
          disabled={delta === undefined || delta === 0}
          label={delta === undefined ? null : formatDelta(delta, deltaUnit)}
          color={delta !== undefined && delta > 0 ? "lime.4" : "coral.4"}
          position="top-end"
          size={20}
          offset={4}
          styles={{
            indicator: {
              color: "var(--mantine-color-slate-9)",
              fontVariantNumeric: "tabular-nums",
              paddingInline: 8,
              // Start just inside the number's top-right corner and grow to the right.
              left: "100%",
              right: "auto",
              transform: "translate(-12px, -50%)",
              whiteSpace: "nowrap",
            },
          }}>
          <NeonText
            ff="var(--mantine-font-family-headings)"
            style={{
              fontSize: "56px",
              fontWeight: "300",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}>
            {value}
          </NeonText>
        </Indicator>
        {comparison && (
          <Text size="xs" c="dimmed">
            {comparison}
          </Text>
        )}
      </Stack>
    </WidgetCard>
  )
}

export default StatCard
