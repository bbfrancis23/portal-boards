import {useMutation, useQueryClient} from "@tanstack/react-query"
import {api} from "@/api/client"
import type {Board} from "./useBoards"

export const useEditBoard = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({boardId, label}: {boardId: number; label: string}): Promise<Board> => {
      const {data, response} = await api.PATCH("/api/boards/{board_id}", {
        params: {path: {board_id: boardId}},
        body: {label},
      })
      if (!data) throw new Error(`Couldn't update the board (${response.status})`)
      return data
    },
    onSuccess: (board) =>
      queryClient.invalidateQueries({queryKey: ["portals", board.portal_id, "boards"]}),
  })
}
