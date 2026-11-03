import NeonText from "@/theme/NeonText"
import {Indicator, Stack, Text} from "@mantine/core"
import type {WidgetComponentProps} from "./widget-types"
import {runSource, type Source} from "./run-source"
import {useWidgetRows} from "@/hooks/widgets/useWidgetRows"

type StatConfig = {
  format?: "number" | "currency"
  compare?: "previous_period"
  source?: Source
}

const formatValue = (value: number, format: StatConfig["format"]) =>
  format === "currency"
    ? value.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
    : value.toLocaleString()

const signed = (change: number, text: string) => `${change > 0 ? "+" : "−"}${text}`

// A percent when there's something to compare against; from zero, the amount itself.
const changeBadge = (now: number, before: number, format: StatConfig["format"]) => {
  const change = now - before
  if (change === 0) return undefined
  if (before === 0) return {change, label: signed(change, formatValue(Math.abs(change), format))}
  const percent = Math.round((Math.abs(change) / before) * 100)
  return {change, label: signed(change, `${percent}%`)}
}

const comparisonLabel = {
  this_week: "vs last week",
  this_month: "vs last month",
  last_6_months: "vs the 6 months before",
}

const StatWidget = ({instance}: WidgetComponentProps) => {
  const config = instance.config as StatConfig
  const source = config.source
  const {data: rows} = useWidgetRows(source?.widget)

  const value = source && rows ? runSource(rows, source) : undefined
  const comparing = config.compare === "previous_period" && source?.period
  const badge =
    comparing && rows && value !== undefined
      ? changeBadge(value, runSource(rows, source, new Date(), 1), config.format)
      : undefined

  return (
    // Top padding leaves room for the badge, which sits half above the number.
    <Stack flex={1} align="center" justify="center" gap={4} pt="sm">
      <Indicator
        disabled={!badge}
        label={badge?.label}
        color={badge && badge.change > 0 ? "lime.4" : "coral.4"}
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
            fontSize: "44px",
            fontWeight: "300",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}>
          {value === undefined ? "—" : formatValue(value, config.format)}
        </NeonText>
      </Indicator>
      {comparing && badge && (
        <Text size="xs" c="dimmed">
          {comparisonLabel[comparing]}
        </Text>
      )}
    </Stack>
  )
}

export default StatWidget
