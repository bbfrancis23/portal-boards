import {usePortals} from "@/hooks/usePortals"
import {useTemplates} from "@/hooks/useTemplates"
import {Card, Grid, Group, Skeleton, Stack, Text, Title} from "@mantine/core"
import {IconPhotoCircle as PortalIcon} from "@tabler/icons-react"
import {Link} from "react-router"

// Every card (and its loading skeleton) is this tall, so rows line up whatever the text.
// Names stay on one line and descriptions on two, with "…" when they're longer.
const CARD_HEIGHT = 130

const Portals = () => {
  const {data: portals, isPending: isPendingPortals} = usePortals()
  const {data: templates, isPending: isPendingTemplates} = useTemplates()

  return (
    <>
      <Title order={1}>Portals</Title>
      <Grid gap="md" rowGap="xl" columnGap="sm">
        {(isPendingPortals || isPendingTemplates) && (
          <Grid.Col span={{base: 12, sm: 6, md: 4}}>
            <Card shadow="sm" padding="lg" withBorder h={CARD_HEIGHT}>
              <Group mt="md" mb="xs">
                <Skeleton height={22} circle />
                <Skeleton height={10} width="40%" radius="xl" />
              </Group>

              <Stack gap={8}>
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
        {portals &&
          portals.length > 0 &&
          portals?.map((portal) => (
            <Grid.Col span={{base: 12, sm: 6, md: 4}} key={portal.id}>
              <Card
                shadow="sm"
                padding="lg"
                withBorder
                h={CARD_HEIGHT}
                component={Link}
                to={`/portals/${portal.id}`}>
                <Group mt="md" mb="xs">
                  <PortalIcon />
                  <Text fw={500} truncate>
                    {portal.name}
                  </Text>
                </Group>
                <Text size="sm" c="dimmed" lineClamp={2}>
                  {templates?.find((t) => t.id === portal.template_id)?.description}
                </Text>
              </Card>
            </Grid.Col>
          ))}
      </Grid>
    </>
  )
}

export default Portals
