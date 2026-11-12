import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import Papa from "papaparse"

import type {Column} from "./table-types"

dayjs.extend(customParseFormat)

// The backend's limit for one request: a table draws every row, so big imports go in batches.
export const MAX_PASTE_ROWS = 1000

// The date input stores "YYYY-MM-DD"; spreadsheets often export US-style or spelled-out dates.
const DATE_FORMATS = ["YYYY-MM-DD", "M/D/YYYY", "M/D/YY", "MMM D, YYYY", "MMMM D, YYYY"]

// Thrown for a value that can't become its column's type, so the whole row is skipped.
class NotConvertible extends Error {}

const toNumber = (text: string) => {
  const number = Number(text.replace(/[$,\s]/g, ""))
  if (Number.isNaN(number)) throw new NotConvertible()
  return number
}

const toDate = (text: string) => {
  const date = dayjs(text, DATE_FORMATS, true)
  if (!date.isValid()) throw new NotConvertible()
  return date.format("YYYY-MM-DD")
}

// Saved with the option's own spelling, so "spa" in a CSV still groups with "Spa".
const toOption = (text: string, options: string[] = []) => {
  const option = options.find((option) => option.toLowerCase() === text.toLowerCase())
  if (option === undefined) throw new NotConvertible()
  return option
}

const convert = (text: string, column: Column) => {
  switch (column.type) {
    case "currency":
    case "number":
      return toNumber(text)
    case "date":
      return toDate(text)
    case "select":
      return toOption(text, column.options)
    case "text":
      return text
  }
}

// Undefined when the row has no values, a value can't be converted or a required column is empty.
const toRow = (record: Record<string, string>, columnsByHeader: Map<string, Column>) => {
  const row: Record<string, unknown> = {}
  try {
    for (const [header, raw] of Object.entries(record)) {
      const column = columnsByHeader.get(header)
      const text = raw?.trim() ?? ""
      if (column && text !== "") row[column.key] = convert(text, column)
    }
  } catch (error) {
    if (error instanceof NotConvertible) return undefined
    throw error
  }
  const columns = [...columnsByHeader.values()]
  const missingRequired = columns.some((column) => column.required && !(column.key in row))
  return Object.keys(row).length === 0 || missingRequired ? undefined : row
}

/**
 * Turns pasted CSV (with a header row) into rows for a table. Headers match column labels,
 * ignoring case; headers with no matching column are ignored.
 */
export const csvToRows = (text: string, columns: Column[]) => {
  const {data: records, meta} = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: "greedy",
  })
  const columnsByHeader = new Map<string, Column>()
  for (const header of meta.fields ?? []) {
    const column = columns.find(
      (column) => column.label.toLowerCase() === header.trim().toLowerCase(),
    )
    if (column) columnsByHeader.set(header, column)
  }
  // A required column with no header at all leaves every row incomplete.
  const unmatchedRequired = columns.filter(
    (column) => column.required && ![...columnsByHeader.values()].includes(column),
  )
  const converted = unmatchedRequired.length
    ? []
    : records.map((record) => toRow(record, columnsByHeader))
  const rows = converted.filter((row) => row !== undefined)

  return {
    rows,
    skipped: records.length - rows.length,
    matchedColumns: [...columnsByHeader.values()],
    unmatchedRequired,
  }
}
