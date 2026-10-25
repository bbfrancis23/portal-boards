import {useMutation, useQueryClient} from "@tanstack/react-query"

import {api} from "@/api/client"
import type {Board} from "./useBoards"

// Deletes a dashboard and its widgets (a real delete for now; see "Open questions" in
// docs/PLAN.md about switching to a soft delete later).
export const useDeleteBoard = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({boardId}: {portalId: number; boardId: number}): Promise<void> => {
      const {response} = await api.DELETE("/api/boards/{board_id}", {
        params: {path: {board_id: boardId}},
      })
      // A successful delete returns no body (204), so check the status instead of the data.
      if (!response.ok) throw new Error(`Couldn't delete the dashboard (${response.status})`)
    },
    // Drop it from the cached list right away, so PortalHome (where we go next) can't forward to
    // the dashboard that was just deleted; then refresh in the background (not awaited).
    onSuccess: (_result, {portalId, boardId}) => {
      const key = ["portals", portalId, "boards"]
      queryClient.setQueryData<Board[]>(key, (boards) => boards?.filter((b) => b.id !== boardId))
      queryClient.invalidateQueries({queryKey: key})
    },
  })
}
