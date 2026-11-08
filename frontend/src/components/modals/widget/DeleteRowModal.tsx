import {useDeleteWidgetRow} from "@/hooks/widgets/useDeleteWidgetRow"
import type {Row} from "@/components/dash-boards/widgets/table-widget/table-types"
import {Alert, Button, Group, Modal, Stack, Text} from "@mantine/core"

type DeleteRowModalProps = {
  opened: boolean
  onClose: () => void
  row: Row
}

const DeleteRowModal = ({opened, onClose, row}: DeleteRowModalProps) => {
  const deleteRow = useDeleteWidgetRow()

  const close = () => {
    deleteRow.reset()
    onClose()
  }

  return (
    <Modal opened={opened} onClose={close} title="Delete this row?">
      <Stack>
        <Text size="sm">
          Stats and charts that read this table will update without it. This can't be undone.
        </Text>
        {deleteRow.isError && (
          <Alert color="danger">Couldn't delete the row. Please try again.</Alert>
        )}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={close}>
            Cancel
          </Button>
          <Button
            color="danger"
            loading={deleteRow.isPending}
            onClick={() => deleteRow.mutate({row}, {onSuccess: close})}>
            Delete row
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default DeleteRowModal
