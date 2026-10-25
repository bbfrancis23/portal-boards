import EditPortalModal from "@/components/modals/EditPortalModal"
import NewPortalModal from "@/components/modals/NewPortalModal"
import {usePortals} from "@/hooks/usePortals"
import {useTemplates} from "@/hooks/useTemplates"
import {
  ActionIcon,
  AspectRatio,
  Card,
  Grid,
  Group,
  Image,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {
  IconPhotoCircle as PortalIcon,
  IconPhotoCirclePlus as AddPortalIcon,
  IconEdit,
} from "@tabler/icons-react"
import {useState} from "react"
import {Link} from "react-router"

// Every card (and its loading skeleton) has the same shape, so rows line up whatever the text:
// the template picture at its own proportions (so none of it is cropped), the name on one line,
// and the description always taking two lines ("…" if longer, blank space if shorter).
const IMAGE_RATIO = 320 / 180 // the template SVGs are 320×180
const DESCRIPTION_HEIGHT = "3.1em" // two lines of text (line height 1.55)

const Portals = () => {
  const {data: portals, isPending: isPendingPortals} = usePortals()
  const {data: templates, isPending: isPendingTemplates} = useTemplates()
  const [opened, modal] = useDisclosure(false)
  const [editOpened, editModal] = useDisclosure(false)
  const [portalId, setPortalId] = useState<number | null>(null)

  const handleOpenEditPortalModal = (portalId: number) => {
    setPortalId(portalId)
    editModal.open()
  }

  return (
    <>
      <Stack>
        <Group justify="space-between" wrap="nowrap">
          <Title order={1}>Portals</Title>
          <ActionIcon
            variant="filled"
            size="xl"
            radius="xl"
            aria-label="New portal"
            onClick={modal.open}>
            <AddPortalIcon />
          </ActionIcon>
        </Group>
        <Grid gap="md" rowGap="xl" columnGap="sm">
          {(isPendingPortals || isPendingTemplates) && (
            <Grid.Col span={{base: 12, sm: 6, md: 4}}>
              <Card shadow="sm" padding="lg" withBorder>
                <Card.Section>
                  <AspectRatio ratio={IMAGE_RATIO}>
                    <Skeleton radius={0} />
                  </AspectRatio>
                </Card.Section>
                <Group mt="md" mb="xs">
                  <Skeleton height={22} circle />
                  <Skeleton height={10} width="40%" radius="xl" />
                </Group>
                <Stack gap={8} mih={DESCRIPTION_HEIGHT}>
                  <Skeleton height={8} radius="xl" />
                  <Skeleton height={8} width="60%" radius="xl" />
                </Stack>
              </Card>
            </Grid.Col>
          )}

          {portals?.length === 0 && (
            <Text size="sm" c="dimmed">
              No portals available.
            </Text>
          )}
          {portals?.map((portal) => (
            <Grid.Col span={{base: 12, sm: 6, md: 4}} key={portal.id}>
              <Card
                shadow="sm"
                padding="lg"
                withBorder
                component={Link}
                to={`/portals/${portal.id}`}>
                <Card.Section pos="relative">
                  <AspectRatio ratio={IMAGE_RATIO}>
                    <Image src={`/images/templates/${portal.template_id ?? "custom"}.svg`} alt="" />
                  </AspectRatio>
                  {/* Floats over the picture's top-right corner. It's inside the card's link, so
                      preventDefault keeps a click here from also opening the portal. */}
                  <ActionIcon
                    variant="filled"
                    aria-label="Portal options"
                    pos="absolute"
                    top={8}
                    right={8}
                    onClick={(event) => {
                      event.preventDefault()
                      handleOpenEditPortalModal(portal.id)
                    }}>
                    <IconEdit style={{width: "70%", height: "70%"}} />
                  </ActionIcon>
                </Card.Section>
                <Group mt="md" mb="xs" wrap="nowrap">
                  <PortalIcon />
                  <Text fw={500} truncate>
                    {portal.name}
                  </Text>
                </Group>
                <Text size="sm" c="dimmed" lineClamp={2} mih={DESCRIPTION_HEIGHT}>
                  {templates?.find((t) => t.id === portal.template_id)?.description}
                </Text>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
      <NewPortalModal opened={opened} onClose={modal.close} />
      {portalId && (
        // The name is part of the key: after a rename the modal starts fresh, so its field (and
        // isDirty) begin at the new name, not the one it had when it first opened.
        <EditPortalModal
          key={`${portalId}-${portals?.find((p) => p.id === portalId)?.name}`}
          opened={editOpened}
          onClose={editModal.close}
          portalId={portalId}
        />
      )}
    </>
  )
}

export default Portals
