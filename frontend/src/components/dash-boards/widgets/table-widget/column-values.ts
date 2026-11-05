import type {Column} from "./table-types"

// Date and select inputs only show as cleared when their value is null; an empty string
// leaves a Select still showing its last choice, though nothing is saved.
export const emptyValue = (column: Column) =>
  column.type === "date" || column.type === "select" ? null : ""

export const isFilledIn = (value: unknown) => value !== "" && value !== null
