import {
  Alert,
  Button,
  Divider,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import {DateTimePicker} from "@mantine/dates"
import {isNotEmpty, useForm} from "@mantine/form"
import dayjs from "dayjs"
import {useState} from "react"

import {
  toPickerTime,
  toStoredTime,
  type EntryKind,
  type ScheduleEntry,
} from "@/components/dash-boards/widgets/schedule-widget/schedule-events"
import type {WidgetInstance} from "@/components/dash-boards/widgets/widget-types"
import {useCreateWidgetRow} from "@/hooks/widgets/useCreateWidgetRow"
import {useDeleteWidgetRow} from "@/hooks/widgets/useDeleteWidgetRow"
import {useEditWidgetRow} from "@/hooks/widgets/useEditWidgetRow"
import type {WidgetData} from "@/hooks/widgets/useWidgetRows"

/** A new entry starts from the clicked slot; an existing one is edited in place. */
export type EntryTarget = {row: WidgetData} | {start: string; end: string}

type ScheduleEntryModalProps = {
  opened: boolean
  onClose: () => void
  widget: WidgetInstance
  target: EntryTarget
}

type EntryValues = {
  title: string
  kind: EntryKind
  start: string
  end: string
  staff: string
  capacity: number | string
  booked: number | string
}

const KIND_OPTIONS = [
  {label: "Class", value: "class"},
  {label: "Appointment", value: "appointment"},
]

const initialValues = (target: EntryTarget): EntryValues => {
  if (!("row" in target)) {
    return {...target, title: "", kind: "class", staff: "", capacity: "", booked: ""}
  }
  const entry = target.row.data as ScheduleEntry
  return {
    title: entry.title,
    kind: entry.kind ?? "class",
    start: toPickerTime(entry.start),
    end: toPickerTime(entry.end),
    staff: entry.staff ?? "",
    capacity: entry.capacity ?? "",
    booked: entry.booked ?? "",
  }
}

// Keeps fields this form doesn't edit (a sample appointment's client, say) and drops emptied ones.
const toRowData = (values: EntryValues, existing: Record<string, unknown> = {}) => {
  const isClass = values.kind === "class"
  const data: Record<string, unknown> = {
    ...existing,
    title: values.title.trim(),
    kind: values.kind,
    start: toStoredTime(values.start),
    end: toStoredTime(values.end),
    staff: values.staff.trim(),
    capacity: isClass ? values.capacity : "",
    booked: isClass ? values.booked : "",
  }
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== ""))
}

// Names what's saved, not the form: unsaved edits aren't what gets deleted.
const deleteQuestion = (row: WidgetData) =>
  `Delete ${String(row.data.title)} on ${dayjs(String(row.data.start)).format("ddd, MMM D [at] h:mm A")}? This can't be undone.`

const ScheduleEntryModal = ({opened, onClose, widget, target}: ScheduleEntryModalProps) => {
  const existingRow = "row" in target ? target.row : undefined
  const createRow = useCreateWidgetRow()
  const editRow = useEditWidgetRow()
  const deleteRow = useDeleteWidgetRow()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const form = useForm<EntryValues>({
    initialValues: initialValues(target),
    validate: {
      title: isNotEmpty("Enter a title"),
      start: isNotEmpty("Pick a start"),
      end: (end, values) => {
        if (!end) return "Pick an end"
        return end > values.start ? null : "Must be after the start"
      },
    },
  })

  const save = (values: EntryValues) => {
    if (existingRow) {
      editRow.mutate(
        {row: existingRow, data: toRowData(values, existingRow.data)},
        {onSuccess: onClose},
      )
    } else {
      createRow.mutate(
        {boardId: widget.board_id, widgetId: widget.id, data: toRowData(values)},
        {onSuccess: onClose},
      )
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={existingRow ? "Edit entry" : "New entry"}>
      <form onSubmit={form.onSubmit(save)}>
        <Stack>
          <SegmentedControl data={KIND_OPTIONS} {...form.getInputProps("kind")} />
          <TextInput label="Title" data-autofocus {...form.getInputProps("title")} />
          <Group grow>
            <DateTimePicker label="Start" {...form.getInputProps("start")} />
            <DateTimePicker label="End" {...form.getInputProps("end")} />
          </Group>
          <TextInput
            label={form.values.kind === "class" ? "Instructor" : "Therapist"}
            {...form.getInputProps("staff")}
          />
          {form.values.kind === "class" && (
            <Group grow>
              <NumberInput label="Capacity" min={0} {...form.getInputProps("capacity")} />
              <NumberInput label="Booked" min={0} {...form.getInputProps("booked")} />
            </Group>
          )}
          <Button type="submit" loading={createRow.isPending || editRow.isPending}>
            Save
          </Button>
          {existingRow && (
            <>
              <Divider />
              {confirmingDelete ? (
                <Stack gap="xs">
                  {deleteRow.isError && (
                    <Alert color="danger">Couldn't delete the entry. Please try again.</Alert>
                  )}
                  <Text size="sm">{deleteQuestion(existingRow)}</Text>
                  <Group justify="flex-end">
                    <Button variant="subtle" onClick={() => setConfirmingDelete(false)}>
                      Cancel
                    </Button>
                    <Button
                      color="danger"
                      loading={deleteRow.isPending}
                      onClick={() => deleteRow.mutate({row: existingRow}, {onSuccess: onClose})}>
                      Delete entry
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Button variant="subtle" color="danger" onClick={() => setConfirmingDelete(true)}>
                  Delete entry
                </Button>
              )}
            </>
          )}
        </Stack>
      </form>
    </Modal>
  )
}

export default ScheduleEntryModal
