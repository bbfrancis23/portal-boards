import {useDeleteWidget} from "@/hooks/widgets/useDeleteWidget"
import type {WidgetInstance} from "@/components/dash-boards/widgets/widget-types"
import {Alert, Button, Group, Modal, Stack, Text} from "@mantine/core"

type DeleteWidgetModalProps = {
  opened: boolean
  onClose: () => void
  widget: WidgetInstance
  widgetTitle: string
}

const DeleteWidgetModal = ({opened, onClose, widget, widgetTitle}: DeleteWidgetModalProps) => {
  const deleteWidget = useDeleteWidget()

  const close = () => {
    deleteWidget.reset()
    onClose()
  }

  return (
    <Modal opened={opened} onClose={close} title={`Delete "${widgetTitle}"?`}>
      <Stack>
        <Text size="sm">
          This removes the widget and any rows it holds. Stats and charts that read it will show
          nothing. This can't be undone.
        </Text>
        {deleteWidget.isError && (
          <Alert color="danger">Couldn't delete the widget. Please try again.</Alert>
        )}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={close}>
            Cancel
          </Button>
          <Button
            color="danger"
            loading={deleteWidget.isPending}
            onClick={() => deleteWidget.mutate({widget})}>
            Delete widget
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default DeleteWidgetModal
