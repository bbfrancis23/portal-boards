import {Alert, Button, Modal, Stack, TextInput} from "@mantine/core"
import {hasLength, useForm} from "@mantine/form"
import {useNavigate} from "react-router"

import {useCreateBoard} from "@/hooks/useCreateBoard"

type NewBoardModalProps = {
  opened: boolean
  onClose: () => void
  portalId: number
}

const NewBoardModal = ({opened, onClose, portalId}: NewBoardModalProps) => {
  const createBoard = useCreateBoard()
  const navigate = useNavigate()
  const form = useForm({
    initialValues: {label: ""},
    validate: {label: hasLength({min: 2}, "Must be at least 2 characters")},
  })

  const close = () => {
    form.reset()
    createBoard.reset()
    onClose()
  }

  const create = (values: {label: string}) =>
    createBoard.mutate(
      {portalId, label: values.label.trim()},
      {
        // The new dashboard comes back here, so we can go straight to it.
        onSuccess: (board) => {
          close()
          navigate(`/portals/${portalId}/boards/${board.id}`)
        },
      },
    )

  return (
    <Modal opened={opened} onClose={close} title="New dashboard">
      <form onSubmit={form.onSubmit(create)}>
        <Stack>
          <TextInput
            {...form.getInputProps("label")}
            label="Name"
            placeholder="Weekly classes"
            data-autofocus
          />
          {createBoard.isError && (
            <Alert color="coral">Couldn't create the dashboard. Please try again.</Alert>
          )}
          <Button type="submit" fullWidth loading={createBoard.isPending}>
            Create dashboard
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

export default NewBoardModal
