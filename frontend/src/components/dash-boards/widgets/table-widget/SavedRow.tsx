import {ActionIcon, Group, Table} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import type {Column, Row} from "./table-types"
import {IconEdit, IconTrash} from "@tabler/icons-react"
import {useState} from "react"
import EditRow from "./EditRow"
import DeleteRowModal from "@/components/modals/widget/DeleteRowModal"

const SavedRow = ({columns, row}: {columns: Column[]; row: Row}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [deleting, {open: openDelete, close: closeDelete}] = useDisclosure(false)
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
          <ActionIcon
            variant="filled"
            size="sm"
            color="danger"
            onClick={openDelete}
            aria-label="Delete row">
            <IconTrash />
          </ActionIcon>
        </Group>
        <DeleteRowModal opened={deleting} onClose={closeDelete} row={row} />
      </Table.Td>
    </Table.Tr>
  )
}

export default SavedRow
