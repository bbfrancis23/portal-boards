import {ActionIcon, Group, Table} from "@mantine/core"
import {useForm} from "@mantine/form"

import ColumnInput from "./ColumnInput"
import {emptyValue, isFilledIn} from "./column-values"
import type {Column, Row} from "./table-types"
import {useEditWidgetRow} from "@/hooks/widgets/useEditWidgetRow"
import {IconX, IconCheck} from "@tabler/icons-react"

type EditRowProps = {columns: Column[]; row: Row; onDone: () => void}

const EditRow = ({columns, row, onDone}: EditRowProps) => {
  const editRow = useEditWidgetRow()

  const form = useForm({
    initialValues: Object.fromEntries(
      columns.map((col) => [col.key, row.data[col.key] ?? emptyValue(col)]),
    ),
  })

  const hasAnyValue = Object.values(form.values).some(isFilledIn)

  const save = (values: typeof form.values) => {
    const filledIn = Object.fromEntries(Object.entries(values).filter(([, v]) => isFilledIn(v)))
    editRow.mutate({row, data: filledIn}, {onSuccess: onDone})
  }

  return (
    <Table.Tr>
      {columns.map((column) => (
        <Table.Td key={column.key}>
          <ColumnInput column={column} inputProps={form.getInputProps(column.key)} />
        </Table.Td>
      ))}
      <Table.Td>
        <Group justify="flex-end">
          <ActionIcon
            disabled={!hasAnyValue || !form.isDirty()}
            onClick={() => save(form.values)}
            loading={editRow.isPending}
            aria-label="Save row"
            size="sm">
            <IconCheck />
          </ActionIcon>
          <ActionIcon variant="subtle" size="sm" onClick={() => onDone()} aria-label="Cancel">
            <IconX />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}

export default EditRow
