import {Center, Loader, Text} from "@mantine/core"
import {Navigate} from "react-router"

import {useBoards} from "@/hooks/useBoards"
import {useNumberIds} from "@/hooks/useNumberIds"

// /portals/:portalId has no page of its own: it forwards to the portal's first dashboard,
// replacing the URL so the board's address is what gets bookmarked.
const PortalHome = () => {
  const {portalId} = useNumberIds()
  const {data: boards, isPending} = useBoards(portalId)

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
