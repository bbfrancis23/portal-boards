import {AreaChart, BarChart, LineChart, PieChart} from "@mantine/charts"
import type {WidgetComponentProps} from "./widget-types"
import {Box, Center, useMantineTheme} from "@mantine/core"
import {useElementSize} from "@mantine/hooks"
import {aggregateByGroup, aggregateByMonth, aggregateByWeek, type Source} from "./aggregate"
import {useWidgetRows} from "@/hooks/widgets/useWidgetRows"
import type {WidgetData} from "@/hooks/widgets/useWidgetRows"

// Mantine's PieChart adds this much height under the circle for its legend.
const PIE_LEGEND_HEIGHT = 80

type ChartConfig = {
  title?: string
  chartType: "pie" | "bar" | "line" | "area"
  stacked?: boolean
  source?: Source
}

type ChartSeries = {name: string; label?: string; color: string}
type ChartData = {data: Record<string, string | number>[]; dataKey: string; series: ChartSeries[]}

// Averages come out with long decimals; one place is enough to read.
const oneDecimal = (value: number) => value.toLocaleString("en-US", {maximumFractionDigits: 1})

// Week buckets are one line; month buckets split into a series per seriesBy value;
// without a bucket, each groupBy value is one bar.
const chartData = (
  rows: WidgetData[],
  source: Source,
  colors: string[],
  title: string | undefined,
): ChartData => {
  const oneSeries = [{name: "value", label: title, color: colors[0]}]
  if (source.bucket === "week") {
    return {data: aggregateByWeek(rows, source), dataKey: "week", series: oneSeries}
  }
  if (source.groupBy) {
    const groups = aggregateByGroup(rows, source, colors)
    return {
      data: groups.map(({name, value}) => ({name, value})),
      dataKey: "name",
      series: oneSeries,
    }
  }
  return {...aggregateByMonth(rows, source, colors), dataKey: "month"}
}

const ChartWidget = ({instance}: WidgetComponentProps) => {
  const colors: string[] = useMantineTheme().other.chartColors
  const config = instance.config as ChartConfig
  const source = config.source
  const {data: rows} = useWidgetRows(config?.source?.widget)
  const {ref, width, height} = useElementSize()

  if (config.chartType !== "pie") {
    const {data, dataKey, series} =
      source && rows
        ? chartData(rows, source, colors, config.title)
        : {data: [], dataKey: "month", series: []}
    const shared = {h: "100%", data, dataKey, series, valueFormatter: oneDecimal}
    const withLegend = series.length > 1

    if (config.chartType === "line") {
      return <LineChart {...shared} curveType="monotone" withLegend={withLegend} />
    }
    if (config.chartType === "area") {
      return (
        <AreaChart
          {...shared}
          curveType="monotone"
          type={config.stacked ? "stacked" : "default"}
          withLegend={withLegend}
        />
      )
    }
    return (
      <BarChart {...shared} type={config.stacked ? "stacked" : "default"} withLegend={withLegend} />
    )
  }

  const groups = source && rows ? aggregateByGroup(rows, source, colors) : []
  const pieSize = Math.max(0, Math.min(width, height - PIE_LEGEND_HEIGHT))
  // The pie floats over the measured box, so its own size can't feed back into the measurement.
  return (
    <Box ref={ref} pos="relative" h="100%" style={{overflow: "hidden"}}>
      <Center pos="absolute" style={{inset: 0}}>
        <PieChart data={groups} size={pieSize} withLegend />
      </Center>
    </Box>
  )
}

export default ChartWidget
