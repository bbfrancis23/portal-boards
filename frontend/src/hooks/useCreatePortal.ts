import {useMutation, useQueryClient} from "@tanstack/react-query"

import {api} from "@/api/client"
import type {Portal} from "@/hooks/usePortals"

type NewPortal = {name: string; template_id: string | null}

// Creates a portal (blank, or copied from a template) and refreshes the portal list.
export const useCreatePortal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (portal: NewPortal): Promise<Portal> => {
      const {data, response} = await api.POST("/api/portals", {body: portal})
      if (!data) throw new Error(`Couldn't create the portal (${response.status})`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ["portals"]}),
  })
}
