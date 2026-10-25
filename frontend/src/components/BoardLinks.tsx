import {useBoards} from "@/hooks/useBoards"
import {Button, Group, NavLink, Title} from "@mantine/core"
import {Link, useParams} from "react-router"
import IconDashboard from "@/components/icons/IconDashboard"
import NewBoardModal from "./modals/NewBoardModal"
import {useDisclosure} from "@mantine/hooks"

const BoardLinks = () => {
  const {portalId, boardId} = useParams()
  const {data: boards, isPending} = useBoards(Number(portalId))
  // Hooks must run on every render, in the same order, so they all come before this return.
  const [opened, modal] = useDisclosure(false)
  if (!portalId) return null

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
            active={board.id === Number(boardId)}
          />
        ))}
      <Button mt="md" onClick={modal.open}>
        New DashBoard
      </Button>
      <NewBoardModal opened={opened} onClose={modal.close} portalId={Number(portalId)} />
    </>
  )
}

export default BoardLinks
