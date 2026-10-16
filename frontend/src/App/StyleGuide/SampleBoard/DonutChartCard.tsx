import {Center} from "@mantine/core"
import type {CardSpec} from "./SampleBoard"
import {DonutChart} from "@mantine/charts"
import WidgetCard from "./WidgetCard"

const data = [
  {name: "Monthly Unlimited", value: 39, color: "cyan.6"},
  {name: "10-Class Pack", value: 26, color: "violet.6"},
  {name: "Drop-in", value: 22, color: "lime.6"},
]

const DonutChartCard = ({title, span, minHeight}: CardSpec) => {
  return (
    <WidgetCard title={title} span={span} minHeight={minHeight}>
      <Center flex={1}>
        <DonutChart data={data} withLegend chartLabel={"87 members"} />
      </Center>
    </WidgetCard>
  )
}

export default DonutChartCard
