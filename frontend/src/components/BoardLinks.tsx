import {useBoards} from "@/hooks/useBoards"
import {Button, Group, NavLink, Title} from "@mantine/core"
import {Link} from "react-router"
import IconDashboard from "@/components/icons/IconDashboard"
import NewBoardModal from "./modals/NewBoardModal"
import {useDisclosure} from "@mantine/hooks"
import {useNumberIds} from "@/hooks/useNumberIds"

const BoardLinks = () => {
  // undefined on /portals (no portal in the URL), so useBoards doesn't fetch there.
  const {portalId, boardId} = useNumberIds()
  const {data: boards, isPending} = useBoards(portalId)
  // Hooks must run on every render, in the same order, so they all come before this return.
  const [opened, modal] = useDisclosure(false)
  if (portalId === undefined) return null

  return (
    <>
      <Group>
        <IconDashboard size={24} />
        <Title order={6}>DashBoards</Title>
      </Group>
      {isPending && <p>Loading...</p>}
      {!isPending && boards?.length === 0 && <p>No boards available</p>}
      {!isPending &&
        boards &&
        boards?.map((board) => (
          <NavLink
            key={board.id}
            component={Link}
            to={`/portals/${portalId}/boards/${board.id}`}
            label={board.label}
            active={board.id === boardId}
          />
        ))}
      <Button mt="md" onClick={modal.open}>
        New DashBoard
      </Button>
      <NewBoardModal opened={opened} onClose={modal.close} portalId={portalId} />
    </>
  )
}

export default BoardLinks
