import {useBoards} from "@/hooks/useBoards"
import {Group, NavLink, Title} from "@mantine/core"
import {Link, useParams} from "react-router"
import {IconLayoutBoardSplit as BoardIcon} from "@tabler/icons-react"

const BoardLinks = () => {
  const {portalId, boardId} = useParams()
  const {data: boards, isPending} = useBoards(Number(portalId))
  if (!portalId) return null

  return (
    <>
      <Group>
        <BoardIcon size={24} />
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
    </>
  )
}

export default BoardLinks
