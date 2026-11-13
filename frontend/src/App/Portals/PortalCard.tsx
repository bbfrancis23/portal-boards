import type {Portal} from "@/hooks/portal/usePortals"
import {
  ActionIcon,
  AspectRatio,
  Card,
  Group,
  Image,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core"
import {IconPhotoCircle as PortalIcon, IconEdit, IconHome} from "@tabler/icons-react"
import {Link} from "react-router"

// Every card (and its loading skeleton) has the same shape, so rows line up whatever the text:
// the template picture at its own proportions (so none of it is cropped), the name on one line,
// and the description always taking two lines ("…" if longer, blank space if shorter).
const IMAGE_RATIO = 320 / 180 // the template SVGs are 320×180
const DESCRIPTION_HEIGHT = "3.1em" // two lines of text (line height 1.55)

type PortalCardProps = {
  portal: Portal
  description: string | undefined
  isHome: boolean
  isSettingHome: boolean
  onMakeHome: () => void
  onEdit: () => void
}

/** One portal on the Portals page: a link to the portal, with home and edit buttons. */
export const PortalCard = ({
  portal,
  description,
  isHome,
  isSettingHome,
  onMakeHome,
  onEdit,
}: PortalCardProps) => {
  const homeLabel = isHome ? "This is your home portal" : "Make this your home portal"

  return (
    <Card shadow="sm" padding="lg" withBorder component={Link} to={`/portals/${portal.id}`}>
      <Card.Section pos="relative">
        <AspectRatio ratio={IMAGE_RATIO}>
          <Image src={`/images/templates/${portal.template_id ?? "custom"}.svg`} alt="" />
        </AspectRatio>

        <Tooltip label={homeLabel}>
          <ActionIcon
            variant={isHome ? "light" : "subtle"}
            color={isHome ? "amber" : undefined}
            aria-label={homeLabel}
            pos="absolute"
            top={8}
            left={8}
            loading={isSettingHome}
            onClick={(event) => {
              // The card is a link; its buttons shouldn't open the portal.
              event.preventDefault()
              if (!isHome) onMakeHome()
            }}>
            <IconHome style={{width: "70%", height: "70%"}} />
          </ActionIcon>
        </Tooltip>
        <ActionIcon
          variant="filled"
          aria-label="Portal options"
          pos="absolute"
          top={8}
          right={8}
          onClick={(event) => {
            event.preventDefault()
            onEdit()
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
        {description}
      </Text>
    </Card>
  )
}

export const PortalCardSkeleton = () => (
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
)
