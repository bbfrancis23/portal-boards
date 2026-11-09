import {expect, test} from "vitest"

import {hourTime, toPickerTime, toScheduleEvents, toStoredTime} from "./schedule-events"
import type {WidgetData} from "@/hooks/widgets/useWidgetRows"

const row = (id: number, data: WidgetData["data"]): WidgetData => ({
  id,
  widget_instance_id: 1,
  data,
  created_at: "2026-11-01T00:00:00",
})

test("stored times convert to picker times and back", () => {
  expect(toPickerTime("2026-11-09T06:30")).toBe("2026-11-09 06:30:00")
  expect(toStoredTime("2026-11-09 06:30:00")).toBe("2026-11-09T06:30")
})

test("hours become schedule times", () => {
  expect(hourTime(6)).toBe("06:00:00")
  expect(hourTime(21)).toBe("21:00:00")
})

test("rows become events colored by kind", () => {
  const yoga = row(1, {
    title: "Yoga",
    kind: "class",
    start: "2026-11-09T06:30",
    end: "2026-11-09T07:30",
  })
  const facial = row(2, {
    title: "Facial",
    kind: "appointment",
    start: "2026-11-10T11:00",
    end: "2026-11-10T11:50",
  })

  const events = toScheduleEvents([yoga, facial])

  expect(events).toEqual([
    {
      id: 1,
      title: "Yoga",
      start: "2026-11-09 06:30:00",
      end: "2026-11-09 07:30:00",
      color: "cyan",
      payload: {row: yoga},
    },
    {
      id: 2,
      title: "Facial",
      start: "2026-11-10 11:00:00",
      end: "2026-11-10 11:50:00",
      color: "violet",
      payload: {row: facial},
    },
  ])
})

test("rows without a title, start or end are skipped", () => {
  const rows = [
    row(1, {title: "Yoga", start: "2026-11-09T06:30"}),
    row(2, {start: "2026-11-09T06:30", end: "2026-11-09T07:30"}),
  ]

  expect(toScheduleEvents(rows)).toEqual([])
})
