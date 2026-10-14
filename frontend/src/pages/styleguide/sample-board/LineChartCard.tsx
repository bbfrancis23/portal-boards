import {LineChart} from "@mantine/charts"

import type {CardSpec} from "./SampleBoard"
import WidgetCard from "./WidgetCard"

const data = [
  {
    Week: "Aug 23",
    Attendance: 362,
  },
  {
    Week: "Aug 30",
    Attendance: 400,
  },
  {
    Week: "Sept 6",
    Attendance: 425,
  },
  {
    Week: "Sept 13",
    Attendance: 400,
  },
  {
    Week: "Sept 20",
    Attendance: 500,
  },
]

const LineChartCard = ({title, span, minHeight}: CardSpec) => {
  return (
    <WidgetCard title={title} span={span} minHeight={minHeight}>
      <LineChart
        h={300}
        data={data}
        dataKey="Week"
        series={[{name: "Attendance", color: "cyan.6"}]}
        curveType="monotone"
        strokeWidth={2}
        withDots={false}
        gridAxis="y"
      />
    </WidgetCard>
  )
}

export default LineChartCard
