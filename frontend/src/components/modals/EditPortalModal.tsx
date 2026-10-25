import {Button, Divider, Modal, Stack, TextInput} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {usePortals} from "@/hooks/usePortals"
import {hasLength, useForm} from "@mantine/form"
import {useEditPortal} from "@/hooks/useEditPortal"
import DeletePortalModal from "@/components/modals/DeletePortalModal"

type EditPortalModalProps = {
  opened: boolean
  onClose: () => void
  portalId: number
}

const EditPortalModal = ({opened, onClose, portalId}: EditPortalModalProps) => {
  const portal = usePortals().data?.find((p) => p.id === portalId)
  const editPortal = useEditPortal()
  const [deleteOpened, deleteModal] = useDisclosure(false)
  const form = useForm({
    initialValues: {name: portal?.name ?? ""},
    validate: {name: hasLength({min: 2}, "Must be at least 2 characters")},
  })

  const close = () => {
    form.reset()
    editPortal.reset()
    onClose()
  }

  // Swap this modal for the delete confirmation, rather than stacking one on top of the other.
  const askToDelete = () => {
    close()
    deleteModal.open()
  }

  const save = (values: {name: string}) =>
    editPortal.mutate(
      {name: values.name.trim(), portalId: portalId},
      {
        onSuccess: () => {
          close()
        },
      },
    )

  return (
    <>
      <Modal opened={opened} onClose={close} title="Edit portal">
        <form onSubmit={form.onSubmit(save)}>
          <Stack>
            <TextInput {...form.getInputProps("name")} label="Name" />
            <Button type="submit" disabled={!form.isDirty() || !form.isValid()}>
              Save
            </Button>
            <Divider />
            <Button variant="subtle" color="coral" onClick={askToDelete}>
              Delete portal
            </Button>
          </Stack>
        </form>
      </Modal>
      {portal && (
        <DeletePortalModal
          opened={deleteOpened}
          onClose={deleteModal.close}
          portalId={portalId}
          portalName={portal.name}
        />
      )}
    </>
  )
}

export default EditPortalModal
