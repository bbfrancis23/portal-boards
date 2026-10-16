import {ActionIcon, Avatar, Burger, Group} from "@mantine/core"
import {IconSparkles} from "@tabler/icons-react"

import LiteDarkModeToggle from "@/components/LiteDarkModeToggle/LiteDarkModeToggle"
import Logo from "@/components/Logo/Logo"

type AppHeaderProps = {
  navbarOpened?: boolean
  onToggleNavbar?: () => void
  asideOpened?: boolean
  onToggleAside?: () => void
}

// The header on every page. The boards burger and the assistant button only show when their
// toggles are passed in (portal pages have a navbar and an aside; public pages don't).
const AppHeader = ({navbarOpened, onToggleNavbar, asideOpened, onToggleAside}: AppHeaderProps) => {
  return (
    <Group h="100%" px="md" justify="space-between" wrap="nowrap">
      <Group wrap="nowrap">
        {onToggleNavbar && (
          <Burger
            opened={navbarOpened}
            onClick={onToggleNavbar}
            hiddenFrom="sm"
            size="sm"
            aria-label="Toggle boards"
          />
        )}
        <Logo />
      </Group>
      <Group wrap="nowrap" gap={4}>
        {/* Nudged toward the assistant button, whose icon has padding around it. */}
        <Group wrap="nowrap" gap={4} pos="relative" left={onToggleAside ? 4 : 0}>
          <Avatar radius="xl" size="sm" color="cyan">
            DU
          </Avatar>
          <LiteDarkModeToggle />
        </Group>

        {onToggleAside && (
          <ActionIcon
            variant="subtle"
            onClick={onToggleAside}
            hiddenFrom="md"
            aria-label="Toggle assistant"
            aria-pressed={asideOpened}>
            <IconSparkles size={20} />
          </ActionIcon>
        )}
      </Group>
    </Group>
  )
}

export default AppHeader
