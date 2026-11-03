import {BarChart, PieChart} from "@mantine/charts"
import type {WidgetComponentProps} from "./widget-types"
import {Box, Center, useMantineTheme} from "@mantine/core"
import {useElementSize} from "@mantine/hooks"
import {runSourceGroups, runSourceSeries, type Source} from "./run-source"
import {useWidgetRows} from "@/hooks/widgets/useWidgetRows"

// Mantine's PieChart adds this much height under the circle for its legend.
const PIE_LEGEND_HEIGHT = 80

type ChartConfig = {
  chartType: "pie" | "bar"
  stacked?: boolean
  source?: Source
}

const ChartWidget = ({instance}: WidgetComponentProps) => {
  const colors: string[] = useMantineTheme().other.chartColors
  const config = instance.config as ChartConfig
  const source = config.source
  const {data: rows} = useWidgetRows(config?.source?.widget)
  const {ref, width, height} = useElementSize()

  if (config.chartType === "bar") {
    const {data, series} =
      source && rows ? runSourceSeries(rows, source, colors) : {data: [], series: []}
    return (
      <BarChart
        h="100%"
        data={data}
        dataKey="month"
        series={series}
        type={config.stacked ? "stacked" : "default"}
        withLegend
      />
    )
  }

  const groups = source && rows ? runSourceGroups(rows, source, colors) : []
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
