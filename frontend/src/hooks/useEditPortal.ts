import {useMutation, useQueryClient} from "@tanstack/react-query"
import type {Portal} from "./usePortals"
import {api} from "@/api/client"

export const useEditPortal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({portalId, name}: {portalId: number; name: string}): Promise<Portal> => {
      const {data, response} = await api.PATCH("/api/portals/{portal_id}", {
        params: {path: {portal_id: portalId}},
        body: {name},
      })
      if (!data) throw new Error(`Couldn't update the portal (${response.status})`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ["portals"]}),
  })
}
