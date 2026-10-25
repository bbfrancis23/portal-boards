import {Alert, Button, Group, Modal, Stack, Text, TextInput} from "@mantine/core"
import {useState} from "react"

import {useDeletePortal} from "@/hooks/useDeletePortal"

type DeletePortalModalProps = {
  opened: boolean
  onClose: () => void
  portalId: number
  portalName: string
}

// Deleting a portal can't be undone, so (like GitHub's repo delete) the button only turns on
// once you've typed the portal's name.
const DeletePortalModal = ({opened, onClose, portalId, portalName}: DeletePortalModalProps) => {
  const deletePortal = useDeletePortal()
  const [typed, setTyped] = useState("")

  const close = () => {
    setTyped("")
    deletePortal.reset()
    onClose()
  }

  // Both sides trimmed: portals saved before names were trimmed may end in a space.
  const confirmed = typed.trim() === portalName.trim()

  return (
    <Modal opened={opened} onClose={close} title={`Delete "${portalName}"?`}>
      <Stack>
        <Text size="sm">
          This deletes the portal and all its dashboards and widgets. This can't be undone.
        </Text>
        <TextInput
          label={`Type "${portalName}" to confirm`}
          value={typed}
          onChange={(event) => setTyped(event.currentTarget.value)}
          data-autofocus
        />
        {deletePortal.isError && (
          <Alert color="coral">Couldn't delete the portal. Please try again.</Alert>
        )}
        <Group justify="flex-end">
          <Button variant="subtle" onClick={close}>
            Cancel
          </Button>
          <Button
            color="coral"
            disabled={!confirmed}
            loading={deletePortal.isPending}
            onClick={() => deletePortal.mutate(portalId, {onSuccess: close})}>
            Delete portal
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default DeletePortalModal
