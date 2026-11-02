import {Button, Table} from "@mantine/core"
import {useForm} from "@mantine/form"

import ColumnInput from "./ColumnInput"
import type {Column} from "./table-types"
import type {WidgetInstance} from "../widget-types"
import {useCreateWidgetRow} from "@/hooks/widgets/useCreateWidgetRow"

type AddRowProps = {widget: WidgetInstance; columns: Column[]}

const isFilledIn = (value: unknown) => value !== "" && value !== null

const AddRow = ({widget, columns}: AddRowProps) => {
  const addRow = useCreateWidgetRow()

  const form = useForm({
    initialValues: Object.fromEntries(
      columns.map((col) => [col.key, col.type === "date" ? null : ""]),
    ),
  })

  const hasAnyValue = Object.values(form.values).some(isFilledIn)

  const save = (values: typeof form.values) => {
    const filledIn = Object.fromEntries(Object.entries(values).filter(([, v]) => isFilledIn(v)))

    addRow.mutate(
      {boardId: widget.board_id, widgetId: widget.id, data: filledIn},
      {onSuccess: () => form.reset()},
    )
  }

  return (
    <Table.Tr>
      {columns.map((column) => (
        <Table.Td key={column.key}>
          <ColumnInput column={column} inputProps={form.getInputProps(column.key)} />
        </Table.Td>
      ))}
      <Table.Td>
        <Button
          disabled={!hasAnyValue}
          onClick={() => save(form.values)}
          loading={addRow.isPending}>
          Create
        </Button>
      </Table.Td>
    </Table.Tr>
  )
}

export default AddRow
