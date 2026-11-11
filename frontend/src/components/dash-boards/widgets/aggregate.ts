import type {WidgetData} from "@/hooks/widgets/useWidgetRows"

export type Period = "this_week" | "this_month" | "last_6_months" | "last_8_weeks"

// A stat or chart's query over a data widget's rows.
export type Source = {
  widget: number
  aggregate: "count" | "sum" | "avg"
  field?: string
  groupBy?: string
  where?: Record<string, unknown>
  dateField?: string
  period?: Period
  bucket?: "month" | "week"
  seriesBy?: string
}

const isoDay = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")

const WEEKS_SHOWN = 8

const wholePeriod = (period: Period, today: Date, periodsBack: number) => {
  if (period === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth() - periodsBack, 1)
    return {start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1)}
  }
  if (period === "last_6_months") {
    const start = new Date(today.getFullYear(), today.getMonth() - 5 - 6 * periodsBack, 1)
    return {start, end: new Date(start.getFullYear(), start.getMonth() + 6, 1)}
  }
  const weeks = period === "last_8_weeks" ? WEEKS_SHOWN : 1
  const daysSinceMonday = (today.getDay() + 6) % 7
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - daysSinceMonday - 7 * (weeks - 1) - 7 * weeks * periodsBack,
  )
  return {start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7 * weeks)}
}

const DAY_MS = 24 * 60 * 60 * 1000

// Days from the start of the current period through today, counting today.
const daysSoFar = (period: Period, today: Date) => {
  const {start} = wholePeriod(period, today, 0)
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // Rounding absorbs the hour a daylight-saving change adds or removes.
  return Math.round((midnight.getTime() - start.getTime()) / DAY_MS) + 1
}

// First and last-plus-one day of the period, as "YYYY-MM-DD". periodsBack 1 is the one before.
// toDate keeps only as many days as have passed in the current period, never past its end.
export const periodRange = (period: Period, today: Date, periodsBack = 0, toDate = false) => {
  const {start, end} = wholePeriod(period, today, periodsBack)
  if (!toDate) return {start: isoDay(start), end: isoDay(end)}
  const soFar = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + daysSoFar(period, today),
  )
  return {start: isoDay(start), end: isoDay(soFar < end ? soFar : end)}
}

// Rows without the field a chart splits by have no slice or series to go in.
const hasValue = (row: WidgetData, field: string) =>
  row.data[field] !== undefined && row.data[field] !== null && row.data[field] !== ""

const matchesWhere = (row: WidgetData, where: Source["where"] = {}) =>
  Object.entries(where).every(([key, value]) => row.data[key] === value)

// Dates are stored as "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM", so the first ten characters are the day.
const inPeriod = (
  row: WidgetData,
  source: Source,
  today: Date,
  periodsBack: number,
  toDate: boolean,
) => {
  if (!source.period || !source.dateField) return true
  const value = row.data[source.dateField]
  if (typeof value !== "string") return false
  const day = value.slice(0, 10)
  const {start, end} = periodRange(source.period, today, periodsBack, toDate)
  return start <= day && day < end
}

export const aggregateRows = (
  rows: WidgetData[],
  source: Source,
  {today = new Date(), periodsBack = 0, toDate = false} = {},
) => {
  const matching = rows.filter(
    (row) => matchesWhere(row, source.where) && inPeriod(row, source, today, periodsBack, toDate),
  )
  if (source.aggregate === "count") return matching.length
  const field = source.field
  if (!field) return 0
  const sum = matching.reduce((total, row) => total + (Number(row.data[field]) || 0), 0)
  if (source.aggregate === "sum") return sum
  return matching.length === 0 ? 0 : sum / matching.length
}

// The value for each of the last `count` periods, oldest first. Each is taken to date, so a
// period still in progress lines up with the same days of the ones before it.
export const aggregateByPeriod = (
  rows: WidgetData[],
  source: Source,
  count: number,
  today = new Date(),
) =>
  Array.from({length: count}, (_, i) =>
    aggregateRows(rows, source, {today, periodsBack: count - 1 - i, toDate: true}),
  )

// One slice per value of `groupBy`, colored in order and repeating when there are more slices.
export const aggregateByGroup = (
  rows: WidgetData[],
  source: Source,
  colors: string[],
): {name: string; value: number; color: string}[] => {
  const groupBy = source.groupBy
  if (!groupBy) return []

  const groups: Record<string, WidgetData[]> = {}
  for (const row of rows.filter((row) => hasValue(row, groupBy))) {
    const key = String(row.data[groupBy])
    groups[key] ??= []
    groups[key].push(row)
  }

  return Object.entries(groups).map(([name, rowsInGroup], i) => ({
    name,
    value: aggregateRows(rowsInGroup, source),
    color: colors[i % colors.length],
  }))
}

const MONTHS_SHOWN = 6

// One point per month, oldest first, holding each `seriesBy` value's total for that month.
export const aggregateByMonth = (
  rows: WidgetData[],
  source: Source,
  colors: string[],
  today = new Date(),
) => {
  const seriesBy = source.seriesBy
  if (!seriesBy) return {data: [], series: []}

  const rowsShown = rows.filter(
    (row) =>
      hasValue(row, seriesBy) &&
      matchesWhere(row, source.where) &&
      inPeriod(row, source, today, 0, false),
  )
  const names = [...new Set(rowsShown.map((row) => String(row.data[seriesBy])))]
  const series = names.map((name, i) => ({name, color: colors[i % colors.length]}))

  const data = Array.from({length: MONTHS_SHOWN}, (_, i) => {
    const monthsBack = MONTHS_SHOWN - 1 - i
    const month = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1)
    const point: Record<string, string | number> = {
      month: month.toLocaleString("en-US", {month: "short"}),
    }
    for (const name of names) {
      const oneSeriesThisMonth: Source = {
        ...source,
        period: "this_month",
        where: {...source.where, [seriesBy]: name},
      }
      point[name] = aggregateRows(rows, oneSeriesThisMonth, {today, periodsBack: monthsBack})
    }
    return point
  })

  return {data, series}
}

// One point per week (Monday to Sunday), oldest first, labeled by its Monday. Weeks without
// rows are 0, so the line doesn't skip them. Always the last 8 weeks, whatever source.period
// says: last_8_weeks is the only period week buckets use today.
export const aggregateByWeek = (rows: WidgetData[], source: Source, today = new Date()) =>
  Array.from({length: WEEKS_SHOWN}, (_, i) => {
    const weeksBack = WEEKS_SHOWN - 1 - i
    const {start} = wholePeriod("this_week", today, weeksBack)
    const oneWeek: Source = {...source, period: "this_week"}
    return {
      week: start.toLocaleString("en-US", {month: "short", day: "numeric"}),
      value: aggregateRows(rows, oneWeek, {today, periodsBack: weeksBack}),
    }
  })
