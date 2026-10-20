import {useCurrentUser} from "@/hooks/useCurrentUser"
import {Center, Loader} from "@mantine/core"
import {Navigate, Outlet} from "react-router"

// Wraps private routes: shows them when logged in, otherwise sends you to /log-in.
export const RequireAuth = () => {
  const {data: user, isPending} = useCurrentUser()

  if (isPending)
    return (
      <Center mih="50vh">
        <Loader />
      </Center>
    )
  if (!user) return <Navigate to="/log-in" replace />
  return <Outlet />
}
