import NeonText from "@/theme/NeonText"
import {Indicator, Stack, Text} from "@mantine/core"
import {Sparkline} from "@mantine/charts"
import type {WidgetComponentProps} from "./widget-types"
import {aggregateByPeriod, aggregateRows, type Source} from "./aggregate"
import {useWidgetRows} from "@/hooks/widgets/useWidgetRows"

type StatConfig = {
  format?: "number" | "currency"
  compare?: "previous_period"
  // A small line of the stat's last few periods, under the number. Needs a source period.
  sparkline?: boolean
  source?: Source
}

const SPARKLINE_PERIODS = 6

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

// Comparisons are to date, so early in a period it isn't measured against a whole one.
const comparisonLabel = {
  this_week: "vs same point last week",
  this_month: "vs same point last month",
  last_6_months: "vs same point in the 6 months before",
  last_8_weeks: "vs same point in the 8 weeks before",
}

const StatWidget = ({instance}: WidgetComponentProps) => {
  const config = instance.config as StatConfig
  const source = config.source
  const {data: rows} = useWidgetRows(source?.widget)

  const value = source && rows ? aggregateRows(rows, source) : undefined
  const comparing = config.compare === "previous_period" && source?.period
  const badge =
    comparing && rows && value !== undefined
      ? changeBadge(
          value,
          aggregateRows(rows, source, {periodsBack: 1, toDate: true}),
          config.format,
        )
      : undefined
  const history =
    config.sparkline && source?.period && rows
      ? aggregateByPeriod(rows, source, SPARKLINE_PERIODS)
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
      {history?.some((value) => value !== 0) && (
        <Sparkline
          data={history}
          w="100%"
          maw={160}
          h={28}
          curveType="monotone"
          fillOpacity={0.2}
          aria-label={`Last ${SPARKLINE_PERIODS} periods`}
        />
      )}
    </Stack>
  )
}

export default StatWidget
