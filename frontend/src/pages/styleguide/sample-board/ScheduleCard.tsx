import {Box, Group, Text, Tooltip} from "@mantine/core"
import type {CardSpec} from "./SampleBoard"
import WidgetCard from "./WidgetCard"

type Entry = {
  day: number // 0 = Monday
  start: string // "HH:MM"
  minutes: number
  title: string
  kind: "class" | "appointment"
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAY_START = 6 * 60 // 06:00, in minutes
const DAY_END = 21 * 60 // 21:00
const DAY_LENGTH = DAY_END - DAY_START
const HOUR_LABELS = [6, 9, 12, 15, 18, 21]

// A slice of Atrium's weekly timetable (#6), plus some spa appointments.
const ENTRIES: Entry[] = [
  {day: 0, start: "06:30", minutes: 60, title: "Yoga", kind: "class"},
  {day: 0, start: "09:30", minutes: 60, title: "Pilates", kind: "class"},
  {day: 0, start: "14:00", minutes: 60, title: "Swedish massage", kind: "appointment"},
  {day: 0, start: "18:45", minutes: 60, title: "Yoga", kind: "class"},
  {day: 1, start: "06:30", minutes: 60, title: "Pilates", kind: "class"},
  {day: 1, start: "11:00", minutes: 50, title: "Signature facial", kind: "appointment"},
  {day: 1, start: "17:30", minutes: 45, title: "Upper body toning", kind: "class"},
  {day: 2, start: "06:30", minutes: 60, title: "Yoga", kind: "class"},
  {day: 2, start: "12:00", minutes: 60, title: "Pilates", kind: "class"},
  {day: 2, start: "15:00", minutes: 75, title: "Hot stone massage", kind: "appointment"},
  {day: 3, start: "09:30", minutes: 45, title: "Upper body toning", kind: "class"},
  {day: 3, start: "13:00", minutes: 60, title: "Deep tissue massage", kind: "appointment"},
  {day: 3, start: "18:45", minutes: 60, title: "Yoga", kind: "class"},
  {day: 4, start: "06:30", minutes: 60, title: "Yoga", kind: "class"},
  {day: 4, start: "12:00", minutes: 45, title: "Lower body toning", kind: "class"},
  {day: 4, start: "16:00", minutes: 60, title: "Body wrap", kind: "appointment"},
  {day: 5, start: "08:00", minutes: 60, title: "Yoga", kind: "class"},
  {day: 5, start: "11:00", minutes: 60, title: "Swedish massage", kind: "appointment"},
  {day: 6, start: "09:00", minutes: 60, title: "Yoga", kind: "class"},
  {day: 6, start: "16:00", minutes: 60, title: "Yoga", kind: "class"},
]

const COLORS = {
  class: {fill: "var(--mantine-color-cyan-light)", edge: "var(--mantine-color-cyan-filled)"},
  appointment: {
    fill: "var(--mantine-color-violet-light)",
    edge: "var(--mantine-color-violet-filled)",
  },
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

const formatTime = (totalMinutes: number) =>
  `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, "0")}`

// Percentage of the visible day (06:00–21:00), for positioning blocks and labels.
const percentOfDay = (minutes: number) => `${(minutes / DAY_LENGTH) * 100}%`

const GRID_COLUMNS = "32px repeat(7, 1fr)"

const ScheduleCard = ({title, span, minHeight}: CardSpec) => {
  return (
    <WidgetCard title={title} span={span} minHeight={minHeight}>
      {/* Day names */}
      <Box style={{display: "grid", gridTemplateColumns: GRID_COLUMNS}}>
        <span />
        {DAYS.map((day) => (
          <Text key={day} size="xs" c="dimmed" ta="center">
            {day}
          </Text>
        ))}
      </Box>

      {/* Time labels + one column per day */}
      <Box
        flex={1}
        mih={300}
        style={{display: "grid", gridTemplateColumns: GRID_COLUMNS, columnGap: 4}}>
        <Box pos="relative">
          {HOUR_LABELS.map((hour) => (
            <Text
              key={hour}
              size="10px"
              c="dimmed"
              pos="absolute"
              style={{top: percentOfDay(hour * 60 - DAY_START), transform: "translateY(-50%)"}}>
              {hour}:00
            </Text>
          ))}
        </Box>

        {DAYS.map((day, dayIndex) => (
          <Box
            key={day}
            pos="relative"
            style={{
              // Faint hour lines: one every 1/15 of the column (15 hours shown).
              backgroundImage: `repeating-linear-gradient(to bottom, var(--pb-silver) 0 1px, transparent 1px calc(100% / ${DAY_LENGTH / 60}))`,
              borderRadius: 6,
            }}>
            {ENTRIES.filter((entry) => entry.day === dayIndex).map((entry) => {
              const start = toMinutes(entry.start)
              const colors = COLORS[entry.kind]
              return (
                <Tooltip
                  key={`${entry.start}-${entry.title}`}
                  label={`${entry.title} · ${formatTime(start)}–${formatTime(start + entry.minutes)}`}>
                  <Box
                    pos="absolute"
                    left={2}
                    right={2}
                    px={4}
                    style={{
                      top: percentOfDay(start - DAY_START),
                      height: percentOfDay(entry.minutes),
                      background: colors.fill,
                      borderLeft: `3px solid ${colors.edge}`,
                      borderRadius: 6,
                      overflow: "hidden",
                    }}>
                    <Text size="10px" fw={600} truncate>
                      {entry.title}
                    </Text>
                  </Box>
                </Tooltip>
              )
            })}
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Group gap="md" justify="flex-end">
        {(["class", "appointment"] as const).map((kind) => (
          <Group key={kind} gap={6}>
            <Box
              w={10}
              h={10}
              style={{
                background: COLORS[kind].fill,
                borderLeft: `3px solid ${COLORS[kind].edge}`,
                borderRadius: 2,
              }}
            />
            <Text size="xs" c="dimmed">
              {kind === "class" ? "Class" : "Spa appointment"}
            </Text>
          </Group>
        ))}
      </Group>
    </WidgetCard>
  )
}

export default ScheduleCard
