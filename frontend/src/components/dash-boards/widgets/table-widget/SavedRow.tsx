import {ActionIcon, Group, Table} from "@mantine/core"
import type {Column, Row} from "./table-types"
import {IconEdit, IconTrash} from "@tabler/icons-react"
import {useState} from "react"
import EditRow from "./EditRow"

const SavedRow = ({columns, row}: {columns: Column[]; row: Row}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  return isEditing ? (
    <EditRow columns={columns} row={row} onDone={() => setIsEditing(false)} />
  ) : (
    <Table.Tr>
      {columns.map((column) => (
        <Table.Td key={column.key}>{String(row.data[column.key] ?? "")}</Table.Td>
      ))}
      <Table.Td>
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => setIsEditing(true)}
            aria-label="Edit row">
            <IconEdit />
          </ActionIcon>
          <ActionIcon variant="filled" size="sm" color="danger">
            <IconTrash />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}

export default SavedRow
