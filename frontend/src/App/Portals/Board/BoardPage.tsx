import {useBoards, type Board} from "@/hooks/board/useBoards"
import {Skeleton, Stack, Title, ActionIcon, Group} from "@mantine/core"
import {
  IconEdit as IconEditDashBoard,
  IconLayoutGridAdd as IconAddWidget,
} from "@tabler/icons-react"
import EditBoardModal from "@/components/modals/board/EditBoardModal"
import {useDisclosure} from "@mantine/hooks"
import {useNumberIds} from "@/hooks/useNumberIds"
import DashboardCanvas from "@/components/dash-boards/DashboardCanvas"
import AddWidgetModal from "@/components/modals/widget/AddWidgetModal"

const BoardPage = () => {
  const {portalId, boardId} = useNumberIds()
  const {data: boards, isPending} = useBoards(portalId)
  const board = boards?.find((board: Board) => board.id === boardId)

  const [editDashBoardOpened, editDashBoardModal] = useDisclosure(false)
  const [addWidgetOpened, addWidgetModal] = useDisclosure(false)
  return (
    <>
      {isPending && <Skeleton height={32} mt={6} width="30%" radius="xl" />}
      {!board && !isPending && <p>No board found</p>}
      {board && (
        <>
          <Stack>
            <Group justify="space-between" wrap="nowrap">
              <Title>{board.label}</Title>
              <Group>
                <ActionIcon
                  variant="filled"
                  size="xl"
                  radius="xl"
                  aria-label="Add widget"
                  onClick={addWidgetModal.open}>
                  <IconAddWidget />
                </ActionIcon>
                <ActionIcon
                  variant="filled"
                  size="xl"
                  radius="xl"
                  aria-label="Edit dashboard"
                  onClick={editDashBoardModal.open}>
                  <IconEditDashBoard />
                </ActionIcon>
              </Group>
            </Group>
            <DashboardCanvas onAddWidget={addWidgetModal.open} />
          </Stack>
          {/* The label is part of the key: after a rename the modal starts at the new label. */}
          <EditBoardModal
            key={`${board.id}-${board.label}`}
            opened={editDashBoardOpened}
            onClose={editDashBoardModal.close}
          />
          <AddWidgetModal
            key={`${board.id}-widget`}
            opened={addWidgetOpened}
            onClose={addWidgetModal.close}
          />
        </>
      )}
    </>
  )
}

export default BoardPage
