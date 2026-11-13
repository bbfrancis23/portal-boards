import {PortalCard, PortalCardSkeleton} from "@/App/Portals/PortalCard"
import EditPortalModal from "@/components/modals/portal/EditPortalModal"
import NewPortalModal from "@/components/modals/portal/NewPortalModal"
import {usePortals} from "@/hooks/portal/usePortals"
import {useCurrentUser} from "@/hooks/useCurrentUser"
import {useSetDefaultPortal} from "@/hooks/users/useSetDefaultPortal"
import {useTemplates} from "@/hooks/useTemplates"
import {ActionIcon, Grid, Group, Stack, Text, Title} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconPhotoCirclePlus as AddPortalIcon} from "@tabler/icons-react"
import {useState} from "react"

const Portals = () => {
  const {data: portals, isPending: isPendingPortals} = usePortals()
  const {data: templates, isPending: isPendingTemplates} = useTemplates()
  const {data: user} = useCurrentUser()
  const setDefaultPortal = useSetDefaultPortal()
  const [opened, modal] = useDisclosure(false)
  const [editOpened, editModal] = useDisclosure(false)
  const [portalId, setPortalId] = useState<number | null>(null)
  const editingPortal = portals?.find((p) => p.id === portalId)
  // Same rule as log-in: the chosen home, or the first portal when none is chosen (or it was deleted).
  const homePortal = user?.default_portal_id ?? portals?.[0]?.id

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
              <PortalCardSkeleton />
            </Grid.Col>
          )}

          {portals?.length === 0 && (
            <Text size="sm" c="dimmed">
              No portals available.
            </Text>
          )}
          {portals?.map((portal) => (
            <Grid.Col span={{base: 12, sm: 6, md: 4}} key={portal.id}>
              <PortalCard
                portal={portal}
                description={
                  portal.description ??
                  templates?.find((t) => t.id === portal.template_id)?.description
                }
                isHome={portal.id === homePortal}
                isSettingHome={
                  setDefaultPortal.isPending && setDefaultPortal.variables?.portalId === portal.id
                }
                onMakeHome={() => setDefaultPortal.mutate({portalId: portal.id})}
                onEdit={() => handleOpenEditPortalModal(portal.id)}
              />
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
      <NewPortalModal opened={opened} onClose={modal.close} />
      {portalId && (
        // The name and description are part of the key: after an edit the modal starts fresh, so its
        // fields (and isDirty) begin at the saved values, not the ones it had when it first opened.
        <EditPortalModal
          key={`${portalId}-${editingPortal?.name}-${editingPortal?.description}`}
          opened={editOpened}
          onClose={editModal.close}
          portalId={portalId}
        />
      )}
    </>
  )
}

export default Portals
