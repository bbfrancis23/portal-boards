import {useBoards, type Board} from "@/hooks/useBoards"
import {Skeleton, Stack, Title, Text} from "@mantine/core"
import {useParams} from "react-router"

const BoardPage = () => {
  const {portalId, boardId} = useParams()
  const {data: boards, isPending} = useBoards(Number(portalId))
  const board = boards?.find((board: Board) => board.id === Number(boardId))
  return (
    <>
      {isPending && <Skeleton height={32} mt={6} width="30%" radius="xl" />}
      {!board && !isPending && <p>No board found</p>}
      {board && (
        <Stack>
          <Title>{board.label}</Title>
          <Text>Widgets coming soon.</Text>
        </Stack>
      )}
    </>
  )
}

export default BoardPage
