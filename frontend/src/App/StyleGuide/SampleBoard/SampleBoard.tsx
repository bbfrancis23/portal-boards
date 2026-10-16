import {
  Anchor,
  Grid,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core"
import {Link} from "react-router"

import StatCard, {type StatCardProps} from "./StatCard"
import LineChartCard from "./LineChartCard"
import DonutChartCard from "./DonutChartCard"
import TableCard from "./TableCard"
import ScheduleCard from "./ScheduleCard"

export type CardSpec = {
  title: string
  span: number
  minHeight: number
}

// Atrium's Overview board, with one mockup of each widget type.
const SCHEDULE_CARDS: CardSpec[] = [{title: "This week's schedule", span: 6, minHeight: 480}]

const STAT_CARDS: StatCardProps[] = [
  {
    title: "Active members",
    value: "87",
    delta: 3,
    comparison: "vs last month",
    span: 3,
    minHeight: 120,
  },
  {
    title: "Revenue this month",
    value: "$18,240",
    delta: 8,
    deltaUnit: "%",
    comparison: "vs last month",
    span: 3,
    minHeight: 120,
  },
  {title: "Classes this week", value: "30", span: 3, minHeight: 120},
  {
    title: "Spa bookings this week",
    value: "18",
    delta: -2,
    comparison: "vs last week",
    span: 3,
    minHeight: 120,
  },
]

const LINECHART_CARDS: CardSpec[] = [{title: "Weekly class attendance", span: 8, minHeight: 300}]
const DONUTCHART_CARDS: CardSpec[] = [{title: "Membership mix", span: 4, minHeight: 300}]
const TABLE_CARDS: CardSpec[] = [{title: "Members", span: 6, minHeight: 360}]

const SampleBoard = () => {
  const {colorScheme, setColorScheme} = useMantineColorScheme()

  return (
    <Stack p="xl" gap="lg" maw={1400} mx="auto">
      <Group justify="space-between">
        <Stack gap={0}>
          <Title order={2}>Atrium Spa and Wellness</Title>
          <Text c="dimmed">Overview</Text>
        </Stack>
        <Group>
          <Anchor component={Link} to="/styleguide">
            ← Styleguide
          </Anchor>
          <SegmentedControl
            data={[
              {label: "Lite", value: "light"},
              {label: "Nite", value: "dark"},
            ]}
            onChange={(value) => setColorScheme(value)}
            value={colorScheme}
          />
        </Group>
      </Group>

      <Grid>
        {STAT_CARDS.map((card) => (
          <StatCard {...card} key={card.title} />
        ))}
        {LINECHART_CARDS.map((card) => (
          <LineChartCard {...card} key={card.title} />
        ))}
        {DONUTCHART_CARDS.map((card) => (
          <DonutChartCard {...card} key={card.title} />
        ))}
        {TABLE_CARDS.map((card) => (
          <TableCard {...card} key={card.title} />
        ))}
        {SCHEDULE_CARDS.map((card) => (
          <ScheduleCard {...card} key={card.title} />
        ))}
      </Grid>
    </Stack>
  )
}

export default SampleBoard
