import {Button, Divider, Modal, Stack, TextInput, Textarea} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {usePortals} from "@/hooks/portal/usePortals"
import {hasLength, useForm} from "@mantine/form"
import {useEditPortal} from "@/hooks/portal/useEditPortal"
import DeletePortalModal from "@/components/modals/portal/DeletePortalModal"
import {useTemplates} from "@/hooks/useTemplates"

type EditPortalModalProps = {
  opened: boolean
  onClose: () => void
  portalId: number
}

const EditPortalModal = ({opened, onClose, portalId}: EditPortalModalProps) => {
  const portal = usePortals().data?.find((p) => p.id === portalId)
  const {data: templates} = useTemplates()
  const editPortal = useEditPortal()
  const [deleteOpened, deleteModal] = useDisclosure(false)
  const form = useForm({
    initialValues: {name: portal?.name ?? "", description: portal?.description ?? ""},
    validate: {
      name: hasLength({min: 2, max: 100}, "Must be 2 to 100 characters"),
      description: hasLength({max: 200}, "Must be 200 characters or fewer"),
    },
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

  const save = (values: {name: string; description: string}) =>
    editPortal.mutate(
      {name: values.name.trim(), description: values.description.trim(), portalId: portalId},
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
            <Textarea
              {...form.getInputProps("description")}
              label="Description"
              autosize
              maxRows={3}
              placeholder={templates?.find((t) => t.id === portal?.template_id)?.description}
            />
            <Button type="submit" disabled={!form.isDirty() || !form.isValid()}>
              Save
            </Button>
            <Divider />
            <Button variant="subtle" color="danger" onClick={askToDelete}>
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
