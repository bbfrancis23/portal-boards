import {BarChart, PieChart} from "@mantine/charts"
import type {WidgetComponentProps} from "./widget-types"
import {Center, useMantineTheme} from "@mantine/core"
import {runSourceGroups, runSourceSeries, type Source} from "./run-source"
import {useWidgetRows} from "@/hooks/widgets/useWidgetRows"

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
  return (
    <Center flex={1}>
      <PieChart data={groups} withLegend />
    </Center>
  )
}

export default ChartWidget
