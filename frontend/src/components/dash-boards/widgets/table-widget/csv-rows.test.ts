import {expect, test} from "vitest"

import {csvToRows} from "./csv-rows"
import type {Column} from "./table-types"

const sales: Column[] = [
  {key: "date", label: "Date", type: "date", required: true},
  {key: "member", label: "Member", type: "text"},
  {key: "stream", label: "Stream", type: "select", options: ["Spa", "Drop-in"], required: true},
  {key: "amount", label: "Amount", type: "currency", required: true},
]

test("headers match labels ignoring case, and values convert to each column's type", () => {
  const csv = `date,MEMBER,Stream,Amount
2026-11-02,Ann,spa,"$1,200"
11/3/2026,Bo,Drop-in,25.50`

  expect(csvToRows(csv, sales).rows).toEqual([
    {date: "2026-11-02", member: "Ann", stream: "Spa", amount: 1200},
    {date: "2026-11-03", member: "Bo", stream: "Drop-in", amount: 25.5},
  ])
})

test("quoted values keep their commas", () => {
  const csv = `Date,Member,Stream,Amount
2026-11-02,"Lee, Ann",Spa,10`

  expect(csvToRows(csv, sales).rows[0].member).toBe("Lee, Ann")
})

test("headers without a matching column are ignored", () => {
  const csv = `Date,Notes,Stream,Amount
2026-11-02,paid cash,Spa,10`

  const {rows, matchedColumns} = csvToRows(csv, sales)

  expect(rows).toEqual([{date: "2026-11-02", stream: "Spa", amount: 10}])
  expect(matchedColumns.map((column) => column.key)).toEqual(["date", "stream", "amount"])
})

test("rows that can't be converted or miss a required value are skipped; blank lines are ignored", () => {
  const csv = `Date,Member,Stream,Amount
2026-11-02,Ann,Spa,10
not a date,Bo,Spa,10
2026-11-03,Cy,Gym,10
2026-11-04,Di,Spa,ten
2026-11-05,Ed,Spa,
,,,
2026-11-06,Flo,Spa,0`

  const {rows, skipped} = csvToRows(csv, sales)

  expect(rows.map((row) => row.member)).toEqual(["Ann", "Flo"])
  expect(skipped).toBe(4)
})

test("a required column with no header skips every row and is reported", () => {
  const csv = `Date,Member,Stream
2026-11-02,Ann,Spa`

  const {rows, skipped, unmatchedRequired} = csvToRows(csv, sales)

  expect(rows).toEqual([])
  expect(skipped).toBe(1)
  expect(unmatchedRequired.map((column) => column.label)).toEqual(["Amount"])
})

test("cells copied from a spreadsheet (tab-separated) parse the same way", () => {
  const pasted = "Date\tMember\tStream\tAmount\n11/3/2026\tLee, Ann\tSpa\t$1,200.00"

  expect(csvToRows(pasted, sales).rows).toEqual([
    {date: "2026-11-03", member: "Lee, Ann", stream: "Spa", amount: 1200},
  ])
})
