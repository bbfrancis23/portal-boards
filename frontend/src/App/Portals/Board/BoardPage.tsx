import {useBoards, type Board} from "@/hooks/useBoards"
import {Skeleton, Stack, Title, Text, ActionIcon, Group} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"
import EditBoardModal from "@/components/modals/EditBoardModal"
import {useDisclosure} from "@mantine/hooks"
import {useNumberIds} from "@/hooks/useNumberIds"

const BoardPage = () => {
  const {portalId, boardId} = useNumberIds()
  const {data: boards, isPending} = useBoards(portalId)
  const board = boards?.find((board: Board) => board.id === boardId)

  const [opened, modal] = useDisclosure(false)
  return (
    <>
      {isPending && <Skeleton height={32} mt={6} width="30%" radius="xl" />}
      {!board && !isPending && <p>No board found</p>}
      {board && (
        <>
          <Stack>
            <Group justify="space-between" wrap="nowrap">
              <Title>{board.label}</Title>

              <ActionIcon
                variant="filled"
                size="xl"
                radius="xl"
                aria-label="Edit dashboard"
                onClick={modal.open}>
                <IconEdit />
              </ActionIcon>
            </Group>
            <Text>Widgets coming soon.</Text>
          </Stack>
          {/* The label is part of the key: after a rename the modal starts at the new label. */}
          <EditBoardModal
            key={`${board.id}-${board.label}`}
            opened={opened}
            onClose={modal.close}
          />
        </>
      )}
    </>
  )
}

export default BoardPage
