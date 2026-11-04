import {Table, Text} from "@mantine/core"

import type {Column, Row} from "./table-types"
import SavedRow from "./SavedRow"

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
      <SavedRow columns={columns} row={row} key={row.id} />
    ))}
  </>
)

export default SavedRows
