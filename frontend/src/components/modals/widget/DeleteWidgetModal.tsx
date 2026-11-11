import {useDeleteWidget} from "@/hooks/widgets/useDeleteWidget"
import type {WidgetInstance} from "@/components/dash-boards/widgets/widget-types"
import {Alert, Button, Group, Modal, Stack, Text} from "@mantine/core"
import {useWidgetDependents} from "@/hooks/widgets/useWidgetDependents"

type DeleteWidgetModalProps = {
  opened: boolean
  onClose: () => void
  widget: WidgetInstance
  widgetTitle: string
}

// Only tables and schedules are read by stats and charts.
const DATA_WIDGET_TYPES: WidgetInstance["type"][] = ["table", "schedule"]

const DeleteWidgetModal = ({opened, onClose, widget, widgetTitle}: DeleteWidgetModalProps) => {
  const deleteWidget = useDeleteWidget()
  const isDataWidget = DATA_WIDGET_TYPES.includes(widget.type)
  const {data: dependents, isError: dependentsFailed} = useWidgetDependents(
    opened && isDataWidget ? widget.id : undefined,
  )
  const dependentsLoading = isDataWidget && dependents === undefined

  const close = () => {
    deleteWidget.reset()
    onClose()
  }

  return (
    <Modal opened={opened} onClose={close} title={`Delete "${widgetTitle}"?`}>
      <Stack>
        <Text size="sm">This removes the widget and any rows it holds.</Text>
        {dependents && dependents.length > 0 && (
          <>
            <Text size="sm">The following stats and charts will also be deleted:</Text>
            {dependents.map((dependent) => (
              <Text key={dependent.id} size="sm" c="danger" fw={600}>
                {String(dependent.config.title)}
              </Text>
            ))}
          </>
        )}
        <Text size="sm">This can't be undone.</Text>
        {deleteWidget.isError && (
          <Alert color="danger">Couldn't delete the widget. Please try again.</Alert>
        )}
        {dependentsFailed && (
          <Alert color="danger">
            Couldn't check which stats and charts read this widget. Close this and try again.
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={close}>
            Cancel
          </Button>
          <Button
            color="danger"
            loading={deleteWidget.isPending}
            disabled={dependentsLoading}
            onClick={() => deleteWidget.mutate({widget})}>
            Delete widget
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default DeleteWidgetModal
