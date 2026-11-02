import type {WidgetData} from "@/hooks/widgets/useWidgetRows"

export type Period = "this_week" | "this_month"

// A stat or chart's query over an input widget's rows.
export type Source = {
  widget: number
  aggregate: "count" | "sum" | "avg"
  field?: string
  where?: Record<string, unknown>
  dateField?: string
  period?: Period
}

const isoDay = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")

// First and last-plus-one day of the period, as "YYYY-MM-DD". periodsBack 1 is the one before.
export const periodRange = (period: Period, today: Date, periodsBack = 0) => {
  if (period === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth() - periodsBack, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    return {start: isoDay(start), end: isoDay(end)}
  }
  const daysSinceMonday = (today.getDay() + 6) % 7
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - daysSinceMonday - 7 * periodsBack,
  )
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
  return {start: isoDay(start), end: isoDay(end)}
}

const matchesWhere = (row: WidgetData, where: Source["where"] = {}) =>
  Object.entries(where).every(([key, value]) => row.data[key] === value)

// Dates are stored as "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM", so the first ten characters are the day.
const inPeriod = (row: WidgetData, source: Source, today: Date, periodsBack: number) => {
  if (!source.period || !source.dateField) return true
  const value = row.data[source.dateField]
  if (typeof value !== "string") return false
  const day = value.slice(0, 10)
  const {start, end} = periodRange(source.period, today, periodsBack)
  return start <= day && day < end
}

export const runSource = (
  rows: WidgetData[],
  source: Source,
  today = new Date(),
  periodsBack = 0,
) => {
  const matching = rows.filter(
    (row) => matchesWhere(row, source.where) && inPeriod(row, source, today, periodsBack),
  )
  if (source.aggregate === "count") return matching.length
  const field = source.field
  if (!field) return 0
  const sum = matching.reduce((total, row) => total + (Number(row.data[field]) || 0), 0)
  if (source.aggregate === "sum") return sum
  return matching.length === 0 ? 0 : sum / matching.length
}
