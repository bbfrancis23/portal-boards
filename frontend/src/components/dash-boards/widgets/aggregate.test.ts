import {expect, test} from "vitest"

import {
  periodRange,
  aggregateRows,
  aggregateByGroup,
  aggregateByMonth,
  aggregateByPeriod,
  aggregateByWeek,
  type Source,
} from "./aggregate"
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
  expect(aggregateRows(members, {widget: 1, aggregate: "count"})).toBe(3)
})

test("count with where counts only matching rows", () => {
  expect(aggregateRows(members, {widget: 1, aggregate: "count", where: {status: "active"}})).toBe(2)
})

test("sum adds up the field, reading numbers saved as text", () => {
  expect(aggregateRows(sales, {widget: 1, aggregate: "sum", field: "amount"})).toBe(344)
})

test("sum this month leaves out last month's rows", () => {
  expect(aggregateRows(sales, spaRevenueThisMonth, {today})).toBe(120)
})

test("one period back is last month", () => {
  expect(aggregateRows(sales, spaRevenueThisMonth, {today, periodsBack: 1})).toBe(135)
})

test("this month to date one period back is the same days of last month", () => {
  expect(periodRange("this_month", today, 1, true)).toEqual({
    start: "2026-10-01",
    end: "2026-10-05",
  })
})

test("to date never runs past the end of a shorter month", () => {
  const march31 = new Date(2026, 2, 31)
  expect(periodRange("this_month", march31, 1, true)).toEqual({
    start: "2026-02-01",
    end: "2026-03-01",
  })
})

test("this week to date one period back stops on the same weekday", () => {
  expect(periodRange("this_week", today, 1, true)).toEqual({
    start: "2026-10-26",
    end: "2026-10-29",
  })
})

test("to date leaves out the rest of last month", () => {
  const options = {today, periodsBack: 1, toDate: true}
  expect(aggregateRows(sales, spaRevenueThisMonth, options)).toBe(0)
})

test("by period gives each period to date, oldest first", () => {
  const spa = [
    row(1, {date: "2026-09-02", stream: "Spa", amount: 50}),
    row(2, {date: "2026-09-20", stream: "Spa", amount: 999}),
    row(3, {date: "2026-10-03", stream: "Spa", amount: 70}),
    row(4, {date: "2026-11-02", stream: "Spa", amount: 120}),
  ]
  expect(aggregateByPeriod(spa, spaRevenueThisMonth, 3, today)).toEqual([50, 70, 120])
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
  expect(aggregateRows(classes, source, {today})).toBe(1)
})

test("avg averages the field over matching rows", () => {
  const source: Source = {widget: 1, aggregate: "avg", field: "amount", where: {stream: "Spa"}}
  expect(aggregateRows(sales, source)).toBe(85)
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

  expect(aggregateByGroup(members, source, ["cyan.6", "violet.6"])).toEqual([
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

  const {data, series} = aggregateByMonth(sales, source, ["cyan.6", "violet.6"], today)

  expect(series).toEqual([
    {name: "Spa", color: "cyan.6"},
    {name: "Membership", color: "violet.6"},
  ])
  expect(data.map((point) => point.month)).toEqual(["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"])
  expect(data[0]).toEqual({month: "Jun", Spa: 0, Membership: 0})
  expect(data[4]).toEqual({month: "Oct", Spa: 135, Membership: 0})
  expect(data[5]).toEqual({month: "Nov", Spa: 120, Membership: 89})
})

test("series leave out rows without the field they split by", () => {
  const source: Source = {
    widget: 1,
    aggregate: "sum",
    field: "amount",
    dateField: "date",
    period: "last_6_months",
    seriesBy: "stream",
  }
  const withMissing = [...sales, row(5, {date: "2026-11-03", amount: 60})]

  const {data, series} = aggregateByMonth(withMissing, source, ["cyan.6", "violet.6"], today)

  expect(series.map((s) => s.name)).toEqual(["Spa", "Membership"])
  expect(data[5]).toEqual({month: "Nov", Spa: 120, Membership: 89})
})

test("groups leave out rows without the field they group by", () => {
  const members = [row(1, {membership: "Drop-in"}), row(2, {})]
  const source: Source = {widget: 1, aggregate: "count", groupBy: "membership"}

  expect(aggregateByGroup(members, source, ["cyan.6"])).toEqual([
    {name: "Drop-in", value: 1, color: "cyan.6"},
  ])
})

test("no rows gives 0", () => {
  expect(aggregateRows([], spaRevenueThisMonth, {})).toBe(0)
  expect(aggregateRows([], {widget: 1, aggregate: "avg", field: "amount"})).toBe(0)
})

test("last 8 weeks runs from seven Mondays back through the end of this week", () => {
  expect(periodRange("last_8_weeks", today)).toEqual({start: "2026-09-14", end: "2026-11-09"})
})

const weeklyAttendance: Source = {
  widget: 1,
  aggregate: "sum",
  field: "booked",
  where: {kind: "class"},
  dateField: "start",
  bucket: "week",
  period: "last_8_weeks",
}

test("weeks give each of the last 8 weeks a total, oldest first, with 0 for empty weeks", () => {
  const classes = [
    row(1, {kind: "class", start: "2026-09-14T07:00", booked: 10}),
    row(2, {kind: "class", start: "2026-09-20T18:30", booked: 5}),
    row(3, {kind: "appointment", start: "2026-11-03T10:00", booked: 99}),
    row(4, {kind: "class", start: "2026-11-08T09:00", booked: 12}),
    row(5, {kind: "class", start: "2026-09-13T09:00", booked: 99}),
  ]

  const weeks = aggregateByWeek(classes, weeklyAttendance, today)

  expect(weeks.map((week) => week.week)).toEqual([
    "Sep 14",
    "Sep 21",
    "Sep 28",
    "Oct 5",
    "Oct 12",
    "Oct 19",
    "Oct 26",
    "Nov 2",
  ])
  expect(weeks.map((week) => week.value)).toEqual([15, 0, 0, 0, 0, 0, 0, 12])
})

test("bars by group average each class type", () => {
  const classes = [
    row(1, {kind: "class", classType: "Yoga", booked: 10}),
    row(2, {kind: "class", classType: "Yoga", booked: 14}),
    row(3, {kind: "class", classType: "Pilates", booked: 8}),
    row(4, {kind: "appointment", service: "Massage"}),
  ]
  const source: Source = {
    widget: 1,
    aggregate: "avg",
    field: "booked",
    where: {kind: "class"},
    groupBy: "classType",
  }

  expect(
    aggregateByGroup(classes, source, ["cyan.6"]).map(({name, value}) => [name, value]),
  ).toEqual([
    ["Yoga", 12],
    ["Pilates", 8],
  ])
})
