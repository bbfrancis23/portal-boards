import {expect, test} from "vitest"

import {emptyValue, requiredColumnRules} from "./column-values"
import type {Column} from "./table-types"

const columns: Column[] = [
  {key: "date", label: "Date", type: "date", required: true},
  {key: "amount", label: "Amount", type: "currency", required: true},
  {key: "member", label: "Member", type: "text"},
]

test("required columns reject empty values but accept 0", () => {
  const rules = requiredColumnRules(columns)

  expect(Object.keys(rules)).toEqual(["date", "amount"])
  expect(rules.date(null)).toBe("Date is required")
  expect(rules.amount("")).toBe("Amount is required")
  expect(rules.amount(0)).toBeNull()
  expect(rules.date("2026-11-11")).toBeNull()
})

test("a required two-option column starts on its first option", () => {
  const status: Column = {
    key: "status",
    label: "Status",
    type: "select",
    options: ["active", "inactive"],
    required: true,
  }

  expect(emptyValue(status)).toBe("active")
  expect(emptyValue({...status, required: false})).toBeNull()
  expect(emptyValue({...status, options: ["a", "b", "c"]})).toBeNull()
})
