import type {Column} from "./table-types"

// Two or fewer options show as a row of buttons, which can't show an error, so a required one
// starts on its first option and is never blank.
const isRequiredButtonRow = (column: Column) =>
  column.type === "select" && column.required && (column.options?.length ?? 0) <= 2

// Date and select inputs only show as cleared when their value is null; an empty string
// leaves a Select still showing its last choice, though nothing is saved.
export const emptyValue = (column: Column) => {
  if (isRequiredButtonRow(column)) return column.options?.[0] ?? null
  return column.type === "date" || column.type === "select" ? null : ""
}

export const isFilledIn = (value: unknown) => value !== "" && value !== null

export const requiredColumnRules = (columns: Column[]) =>
  Object.fromEntries(
    columns
      .filter((column) => column.required)
      .map((column) => [
        column.key,
        (value: unknown) => (isFilledIn(value) ? null : `${column.label} is required`),
      ]),
  )
