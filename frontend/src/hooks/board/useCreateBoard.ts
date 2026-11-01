import {useMutation, useQueryClient} from "@tanstack/react-query"

import {api} from "@/api/client"
import type {Board} from "./useBoards"

// Adds a dashboard to a portal and refreshes that portal's dashboard list (the navbar).
export const useCreateBoard = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({portalId, label}: {portalId: number; label: string}): Promise<Board> => {
      const {data, response} = await api.POST("/api/portals/{portal_id}/boards", {
        params: {path: {portal_id: portalId}},
        body: {label},
      })
      if (!data) throw new Error(`Couldn't create the dashboard (${response.status})`)
      return data
    },
    // The second argument is what was passed to mutate(), so we know which portal's list it is.
    // Add the new dashboard to the cached list right away, so the page we navigate to can
    // already find it; then refetch in the background to be sure the list matches the server.
    onSuccess: (board, {portalId}) => {
      const key = ["portals", portalId, "boards"]
      queryClient.setQueryData<Board[]>(key, (boards) => [...(boards ?? []), board])
      return queryClient.invalidateQueries({queryKey: key})
    },
  })
}
