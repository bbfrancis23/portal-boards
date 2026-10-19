import {
  ActionIcon,
  Avatar,
  Burger,
  Group,
  Menu,
  Skeleton,
  Text,
  UnstyledButton,
} from "@mantine/core"
import LiteDarkModeToggle from "@/components/LiteDarkModeToggle/LiteDarkModeToggle"
import Logo from "@/components/Logo/Logo"
import {useCurrentUser} from "@/hooks/useCurrentUser"
import {IconKey, IconSparkles, IconLogout} from "@tabler/icons-react"
import {Link, useNavigate} from "react-router"
import {api} from "@/api/client"
import {useQueryClient} from "@tanstack/react-query"

type AppHeaderProps = {
  navbarOpened?: boolean
  onToggleNavbar?: () => void
  asideOpened?: boolean
  onToggleAside?: () => void
}

// The header on every page. The boards burger and the assistant button only show when their
// toggles are passed in (portal pages have a navbar and an aside; public pages don't).
const AppHeader = ({navbarOpened, onToggleNavbar, asideOpened, onToggleAside}: AppHeaderProps) => {
  const {data: user, isPending} = useCurrentUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const logOut = async () => {
    await api.POST("/api/auth/logout")
    queryClient.setQueryData(["me"], null) // the header updates right away
    navigate("/log-in")
  }

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
          {isPending && <Skeleton height={25} circle />}
          {!isPending && (
            <>
              {user && (
                <Menu>
                  <Menu.Target>
                    {/* A real button, so the menu opens from the keyboard too. */}
                    <UnstyledButton aria-label="Account menu">
                      <Avatar
                        radius="xl"
                        size="sm"
                        color="cyan"
                        src={user.avatar_url}
                        // Google's profile pictures refuse requests that say which page asked.
                        imageProps={{referrerPolicy: "no-referrer"}}
                        name={user.display_name}
                      />
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {/* Who you are: plain text, not clickable items. */}
                    <Menu.Label>{user.display_name}</Menu.Label>
                    {user.email && (
                      <Text size="xs" c="dimmed" px="sm" pb="xs">
                        {user.email}
                      </Text>
                    )}
                    <Menu.Divider />
                    <Menu.Item leftSection={<IconLogout size={15} />} onClick={() => logOut()}>
                      Log out
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
              {!user && (
                <ActionIcon variant="subtle" component={Link} to="/log-in" aria-label="Log in">
                  <IconKey size={20} />
                </ActionIcon>
              )}
            </>
          )}
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
