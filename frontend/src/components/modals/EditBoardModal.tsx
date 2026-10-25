import {Button, Divider, Modal, Stack, TextInput} from "@mantine/core"
import {hasLength, useForm} from "@mantine/form"
import {useBoards} from "@/hooks/useBoards"
import {useEditBoard} from "@/hooks/useEditBoard"
import {useNumberIds} from "@/hooks/useNumberIds"
import {useDisclosure} from "@mantine/hooks"

import DeleteBoardModal from "@/components/modals/DeleteBoardModal"

type EditBoardModalProps = {
  opened: boolean
  onClose: () => void
}

const EditBoardModal = ({opened, onClose}: EditBoardModalProps) => {
  const {portalId, boardId} = useNumberIds()

  const board = useBoards(portalId).data?.find((b) => b.id === boardId)
  const editBoard = useEditBoard()
  const [deleteOpened, deleteModal] = useDisclosure(false)

  const form = useForm({
    initialValues: {label: board?.label ?? ""},
    validate: {label: hasLength({min: 2}, "Must be at least 2 characters")},
  })

  const close = () => {
    form.reset()
    editBoard.reset()
    onClose()
  }

  const save = (values: {label: string}) => {
    if (!board) return // the modal only opens on a dashboard, so this just satisfies TypeScript
    editBoard.mutate({boardId: board.id, label: values.label.trim()}, {onSuccess: close})
  }

  // Swap this modal for the delete confirmation, rather than stacking one on top of the other.
  const askToDelete = () => {
    close()
    deleteModal.open()
  }

  return (
    <>
      <Modal opened={opened} onClose={close} title="Edit dashboard">
        <form onSubmit={form.onSubmit(save)}>
          <Stack>
            <TextInput {...form.getInputProps("label")} label="Label" />
            <Button type="submit" disabled={!form.isDirty() || !form.isValid()}>
              Save
            </Button>
            <Divider />
            <Button variant="subtle" color="coral" onClick={askToDelete}>
              Delete dashboard
            </Button>
          </Stack>
        </form>
      </Modal>
      {board && portalId !== undefined && (
        <DeleteBoardModal
          opened={deleteOpened}
          onClose={deleteModal.close}
          portalId={portalId}
          boardId={board.id}
          boardLabel={board.label}
        />
      )}
    </>
  )
}

export default EditBoardModal
