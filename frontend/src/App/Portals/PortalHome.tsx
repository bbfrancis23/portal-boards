import {Center, Loader, Text} from "@mantine/core"
import {Navigate, useParams} from "react-router"

import {useBoards} from "@/hooks/useBoards"

// /portals/:portalId has no page of its own: it forwards to the portal's first dashboard,
// replacing the URL so the board's address is what gets bookmarked.
const PortalHome = () => {
  const {portalId} = useParams()
  const {data: boards, isPending} = useBoards(Number(portalId))

  if (isPending)
    return (
      <Center mih="50vh">
        <Loader />
      </Center>
    )

  const first = boards?.[0]
  if (first) return <Navigate to={`/portals/${portalId}/boards/${first.id}`} replace />

  return <Text c="dimmed">This portal has no dashboards yet.</Text>
}

export default PortalHome
