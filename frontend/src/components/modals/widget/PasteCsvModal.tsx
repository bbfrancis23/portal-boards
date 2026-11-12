import {Alert, Button, Group, Modal, Stack, Text, Textarea} from "@mantine/core"
import {notifications} from "@mantine/notifications"
import {useState} from "react"

import {MAX_PASTE_ROWS, csvToRows} from "@/components/dash-boards/widgets/table-widget/csv-rows"
import type {Column} from "@/components/dash-boards/widgets/table-widget/table-types"
import type {WidgetInstance} from "@/components/dash-boards/widgets/widget-types"
import {useCreateWidgetRows} from "@/hooks/widgets/useCreateWidgetRows"

type PasteCsvModalProps = {
  opened: boolean
  onClose: () => void
  widget: WidgetInstance
  columns: Column[]
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`

const PasteCsvModal = ({opened, onClose, widget, columns}: PasteCsvModalProps) => {
  const [text, setText] = useState("")
  const createRows = useCreateWidgetRows()
  const {rows, skipped, unmatchedRequired} = csvToRows(text, columns)
  const hasText = text.trim() !== ""
  const tooMany = rows.length > MAX_PASTE_ROWS

  const close = () => {
    setText("")
    createRows.reset()
    onClose()
  }

  const addRows = () =>
    createRows.mutate(
      {boardId: widget.board_id, widgetId: widget.id, rows},
      {
        onSuccess: () => {
          notifications.show({
            title: `Added ${plural(rows.length, "row")}`,
            message: skipped ? `${plural(skipped, "row")} skipped` : undefined,
          })
          close()
        },
      },
    )

  return (
    <Modal opened={opened} onClose={close} title="Paste CSV" size="lg">
      <Stack>
        <Text size="sm">
          Paste rows from a spreadsheet, with a header row. Headers are matched to this table's
          columns: {columns.map((column) => column.label).join(", ")}.
        </Text>
        <Textarea
          data-autofocus
          autosize
          minRows={6}
          maxRows={14}
          placeholder={columns.map((column) => column.label).join(",")}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          styles={{input: {fontFamily: "var(--mantine-font-family-monospace)"}}}
        />
        {hasText && unmatchedRequired.length > 0 && (
          <Alert color="danger">
            No header for {unmatchedRequired.map((column) => column.label).join(", ")}, which every
            row needs.
          </Alert>
        )}
        {hasText && unmatchedRequired.length === 0 && (
          <Text size="sm" c="dimmed">
            {plural(rows.length, "row")} ready
            {skipped > 0 &&
              `, ${plural(skipped, "row")} will be skipped (a value that doesn't fit its column, or a required one left empty)`}
            .
          </Text>
        )}
        {tooMany && (
          <Alert color="danger">
            Paste up to {MAX_PASTE_ROWS.toLocaleString()} rows at a time (this has{" "}
            {rows.length.toLocaleString()}).
          </Alert>
        )}
        {createRows.isError && (
          <Alert color="danger">Couldn't add the rows, so none were added. Please try again.</Alert>
        )}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={rows.length === 0 || tooMany}
            loading={createRows.isPending}
            onClick={addRows}>
            {rows.length > 0 ? `Add ${plural(rows.length, "row")}` : "Add rows"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default PasteCsvModal
