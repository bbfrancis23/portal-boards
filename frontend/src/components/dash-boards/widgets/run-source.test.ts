import {expect, test} from "vitest"

import {periodRange, runSource, type Source} from "./run-source"
import type {WidgetData} from "@/hooks/widgets/useWidgetRows"

// Wednesday, 4 November 2026.
const today = new Date(2026, 10, 4)

const row = (id: number, data: WidgetData["data"]): WidgetData => ({
  id,
  widget_instance_id: 1,
  data,
  created_at: "2026-11-01T00:00:00",
})

const members = [
  row(1, {name: "Ann", status: "active"}),
  row(2, {name: "Bo", status: "inactive"}),
  row(3, {name: "Cy", status: "active"}),
]

const sales = [
  row(1, {date: "2026-11-02", stream: "Spa", amount: 120}),
  row(2, {date: "2026-11-03", stream: "Membership", amount: 89}),
  row(3, {date: "2026-10-28", stream: "Spa", amount: 95}),
  row(4, {date: "2026-10-31", stream: "Spa", amount: "40"}),
]

const spaRevenueThisMonth: Source = {
  widget: 1,
  aggregate: "sum",
  field: "amount",
  where: {stream: "Spa"},
  dateField: "date",
  period: "this_month",
}

test("count counts every row", () => {
  expect(runSource(members, {widget: 1, aggregate: "count"})).toBe(3)
})

test("count with where counts only matching rows", () => {
  expect(runSource(members, {widget: 1, aggregate: "count", where: {status: "active"}})).toBe(2)
})

test("sum adds up the field, reading numbers saved as text", () => {
  expect(runSource(sales, {widget: 1, aggregate: "sum", field: "amount"})).toBe(344)
})

test("sum this month leaves out last month's rows", () => {
  expect(runSource(sales, spaRevenueThisMonth, today)).toBe(120)
})

test("one period back is last month", () => {
  expect(runSource(sales, spaRevenueThisMonth, today, 1)).toBe(135)
})

test("this week starts on Monday", () => {
  expect(periodRange("this_week", today)).toEqual({start: "2026-11-02", end: "2026-11-09"})
})

test("a week back crosses into last month", () => {
  expect(periodRange("this_week", today, 1)).toEqual({start: "2026-10-26", end: "2026-11-02"})
})

test("date-times count on their day", () => {
  const classes = [row(1, {start: "2026-11-08T18:30"}), row(2, {start: "2026-11-09T07:00"})]
  const source: Source = {widget: 1, aggregate: "count", dateField: "start", period: "this_week"}
  expect(runSource(classes, source, today)).toBe(1)
})

test("avg averages the field over matching rows", () => {
  const source: Source = {widget: 1, aggregate: "avg", field: "amount", where: {stream: "Spa"}}
  expect(runSource(sales, source)).toBe(85)
})

test("no rows gives 0", () => {
  expect(runSource([], spaRevenueThisMonth, today)).toBe(0)
  expect(runSource([], {widget: 1, aggregate: "avg", field: "amount"})).toBe(0)
})
