import {Table, Text} from "@mantine/core"

import type {Column, Row} from "./table-types"

type SavedRowsProps = {rows: Row[] | undefined; columns: Column[]}

const SavedRows = ({rows, columns}: SavedRowsProps) => (
  <>
    {rows?.length === 0 && (
      <Table.Tr>
        <Table.Td colSpan={columns.length + 1}>
          <Text size="sm" c="dimmed">
            No rows yet
          </Text>
        </Table.Td>
      </Table.Tr>
    )}
    {rows?.map((row) => (
      <Table.Tr key={row.id}>
        {columns.map((column) => (
          <Table.Td key={column.key}>{String(row.data[column.key] ?? "")}</Table.Td>
        ))}
        <Table.Td />
      </Table.Tr>
    ))}
  </>
)

export default SavedRows
