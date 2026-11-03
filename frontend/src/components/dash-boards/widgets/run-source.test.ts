import {expect, test} from "vitest"

import {periodRange, runSource, runSourceGroups, runSourceSeries, type Source} from "./run-source"
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

test("groups give one slice per value, counted after where", () => {
  const members = [
    row(1, {membership: "Drop-in", status: "active"}),
    row(2, {membership: "Class pack", status: "active"}),
    row(3, {membership: "Drop-in", status: "active"}),
    row(4, {membership: "Monthly unlimited", status: "inactive"}),
  ]
  const source: Source = {
    widget: 1,
    aggregate: "count",
    where: {status: "active"},
    groupBy: "membership",
  }

  expect(runSourceGroups(members, source, ["cyan.6", "violet.6"])).toEqual([
    {name: "Drop-in", value: 2, color: "cyan.6"},
    {name: "Class pack", value: 1, color: "violet.6"},
    {name: "Monthly unlimited", value: 0, color: "cyan.6"},
  ])
})

test("last 6 months runs through the end of this month", () => {
  expect(periodRange("last_6_months", today)).toEqual({start: "2026-06-01", end: "2026-12-01"})
})

test("series give each month a total per value, with 0 for months without sales", () => {
  const source: Source = {
    widget: 1,
    aggregate: "sum",
    field: "amount",
    dateField: "date",
    bucket: "month",
    period: "last_6_months",
    seriesBy: "stream",
  }

  const {data, series} = runSourceSeries(sales, source, ["cyan.6", "violet.6"], today)

  expect(series).toEqual([
    {name: "Spa", color: "cyan.6"},
    {name: "Membership", color: "violet.6"},
  ])
  expect(data.map((point) => point.month)).toEqual(["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"])
  expect(data[0]).toEqual({month: "Jun", Spa: 0, Membership: 0})
  expect(data[4]).toEqual({month: "Oct", Spa: 135, Membership: 0})
  expect(data[5]).toEqual({month: "Nov", Spa: 120, Membership: 89})
})

test("no rows gives 0", () => {
  expect(runSource([], spaRevenueThisMonth, today)).toBe(0)
  expect(runSource([], {widget: 1, aggregate: "avg", field: "amount"})).toBe(0)
})
