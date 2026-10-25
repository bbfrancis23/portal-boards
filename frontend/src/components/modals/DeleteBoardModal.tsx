import {Alert, Button, Group, Modal, Stack, Text} from "@mantine/core"
import {useNavigate} from "react-router"

import {useDeleteBoard} from "@/hooks/useDeleteBoard"

type DeleteBoardModalProps = {
  opened: boolean
  onClose: () => void
  portalId: number
  boardId: number
  boardLabel: string
}

// A simple confirm for dashboards (portals ask you to type the name; a dashboard loses less).
const DeleteBoardModal = ({
  opened,
  onClose,
  portalId,
  boardId,
  boardLabel,
}: DeleteBoardModalProps) => {
  const deleteBoard = useDeleteBoard()
  const navigate = useNavigate()

  const close = () => {
    deleteBoard.reset()
    onClose()
  }

  // You're on the dashboard being deleted, so go to the portal: PortalHome then opens the first
  // remaining dashboard (or says there are none). mutateAsync, not mutate with an onSuccess
  // callback, because this page may already be gone by the time the delete finishes.
  const remove = async () => {
    await deleteBoard.mutateAsync({portalId, boardId})
    close()
    navigate(`/portals/${portalId}`, {replace: true})
  }

  return (
    <Modal opened={opened} onClose={close} title={`Delete "${boardLabel}"?`}>
      <Stack>
        <Text size="sm">This deletes the dashboard and all its widgets. This can't be undone.</Text>
        {deleteBoard.isError && (
          <Alert color="coral">Couldn't delete the dashboard. Please try again.</Alert>
        )}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={close}>
            Cancel
          </Button>
          <Button
            color="coral"
            loading={deleteBoard.isPending}
            onClick={() => remove().catch(() => {})}>
            Delete dashboard
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default DeleteBoardModal
