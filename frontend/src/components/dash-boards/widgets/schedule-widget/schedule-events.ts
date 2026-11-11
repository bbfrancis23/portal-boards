import type {ScheduleEventData} from "@mantine/schedule"
import dayjs from "dayjs"

import type {WidgetData} from "@/hooks/widgets/useWidgetRows"

export type EntryKind = "class" | "appointment"

/** A schedule row's data. Sample appointments also carry fields like `client`, kept as they are. */
export type ScheduleEntry = {
  title: string
  start: string
  end: string
  kind: EntryKind
  classType?: string
  staff?: string
  capacity?: number
  booked?: number
}

export type ScheduleConfig = {dayStartHour?: number; dayEndHour?: number; classTypes?: string[]}

export const KIND_COLORS: Record<EntryKind, string> = {class: "cyan", appointment: "violet"}

// Rows store "YYYY-MM-DDTHH:mm"; Mantine's schedule and date pickers use "YYYY-MM-DD HH:mm:ss".
export const toPickerTime = (stored: string) => dayjs(stored).format("YYYY-MM-DD HH:mm:ss")
export const toStoredTime = (picked: string) => dayjs(picked).format("YYYY-MM-DDTHH:mm")

export const hourTime = (hour: number) => `${String(hour).padStart(2, "0")}:00:00`

export const isScheduleEntry = (data: Record<string, unknown>) =>
  typeof data.title === "string" && typeof data.start === "string" && typeof data.end === "string"

export const toScheduleEvent = (row: WidgetData): ScheduleEventData<{row: WidgetData}> => {
  const entry = row.data as ScheduleEntry
  return {
    id: row.id,
    title: entry.title,
    start: toPickerTime(entry.start),
    end: toPickerTime(entry.end),
    color: KIND_COLORS[entry.kind] ?? KIND_COLORS.class,
    payload: {row},
  }
}

export const rowOf = (event: ScheduleEventData) => event.payload?.row as WidgetData | undefined

export const toScheduleEvents = (rows: WidgetData[] = []) =>
  rows.filter((row) => isScheduleEntry(row.data)).map(toScheduleEvent)
