import {Alert, Button, Card, Group, Image, Modal, Stack, Text, TextInput} from "@mantine/core"
import {hasLength, useForm} from "@mantine/form"
import {useNavigate} from "react-router"

import {useCreatePortal} from "@/hooks/useCreatePortal"
import {useTemplates} from "@/hooks/useTemplates"

type NewPortalModalProps = {
  opened: boolean
  onClose: () => void
}

// The name is the only form field; each card's button says which template to start from.
const NewPortalModal = ({opened, onClose}: NewPortalModalProps) => {
  const {data: templates} = useTemplates()
  const createPortal = useCreatePortal()
  const navigate = useNavigate()
  const form = useForm({
    initialValues: {name: ""},
    validate: {name: hasLength({min: 2}, "Must be at least 2 characters")},
  })

  const close = () => {
    form.reset()
    createPortal.reset()
    onClose()
  }

  // form.onSubmit(...) returns a submit handler; calling it straight away validates the name,
  // then runs this with the valid values.
  const create = (templateId: string | null) =>
    form.onSubmit((values) =>
      createPortal.mutate(
        {name: values.name, template_id: templateId},
        {
          onSuccess: (portal) => {
            close()
            navigate(`/portals/${portal.id}`)
          },
        },
      ),
    )()

  return (
    <Modal opened={opened} onClose={close} title="New portal">
      <Stack>
        <TextInput {...form.getInputProps("name")} label="Name" placeholder="My portal" />
        {createPortal.isError && (
          <Alert color="coral">Couldn't create the portal. Please try again.</Alert>
        )}
        {templates?.map((template) => (
          <Card key={template.id} shadow="sm" padding="lg" withBorder>
            <Card.Section>
              <Image src={`/images/templates/${template.id}.svg`} alt="" height={160} />
            </Card.Section>
            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={500}>{template.name}</Text>
            </Group>
            <Text size="sm" c="dimmed">
              {template.description}
            </Text>
            <Button
              fullWidth
              mt="md"
              loading={createPortal.isPending}
              onClick={() => create(template.id)}>
              Create my {template.name} portal
            </Button>
          </Card>
        ))}
        <Card shadow="sm" padding="lg" withBorder>
          <Card.Section>
            <Image src="/images/templates/custom.svg" alt="" height={160} />
          </Card.Section>
          <Group justify="space-between" mt="md" mb="xs">
            <Text fw={500}>Custom portal</Text>
          </Group>
          <Text size="sm" c="dimmed">
            An empty portal you build your way, dashboard by dashboard.
          </Text>
          <Button fullWidth mt="md" loading={createPortal.isPending} onClick={() => create(null)}>
            Create my custom portal
          </Button>
        </Card>
      </Stack>
    </Modal>
  )
}

export default NewPortalModal
