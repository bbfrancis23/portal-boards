import {ActionIcon, Avatar, Menu, Skeleton, Text, UnstyledButton} from "@mantine/core"
import {IconKey, IconLogout, IconPhotoCircle as PortalIcon} from "@tabler/icons-react"
import {useQueryClient} from "@tanstack/react-query"
import {Link, useNavigate} from "react-router"

import {api} from "@/api/client"
import {useCurrentUser} from "@/hooks/useCurrentUser"

// The account corner of the header: a skeleton while checking, the avatar menu when logged in,
// and a log-in key when not.
const UserMenu = () => {
  const {data: user, isPending} = useCurrentUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const logOut = async () => {
    await api.POST("/api/auth/logout")
    queryClient.setQueryData(["me"], null) // the header updates right away
    navigate("/log-in")
  }

  if (isPending) return <Skeleton height={25} circle />

  if (!user)
    return (
      <ActionIcon variant="subtle" component={Link} to="/log-in" aria-label="Log in">
        <IconKey size={20} />
      </ActionIcon>
    )

  return (
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
        <Menu.Item leftSection={<PortalIcon size={15} />} component={Link} to="/portals">
          Portals
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={15} />} onClick={() => logOut()}>
          Log out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

export default UserMenu
