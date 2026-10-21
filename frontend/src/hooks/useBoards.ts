import {api} from "@/api/client"
import type {components} from "@/api/schema"
import {useQuery} from "@tanstack/react-query"

export type Board = components["schemas"]["BoardRead"]

export const useBoards = (portalId: number) =>
  useQuery({
    queryKey: ["portals", "portalId", "boards"],
    queryFn: async (): Promise<Board[]> => {
      const {data, response} = await api.GET("/api/portals/{portal_id}/boards", {
        params: {path: {portal_id: portalId}},
      })
      if (!data) throw new Error(`Couldn't load the current boards (${response.status})`)
      return data
    },
    enabled: portalId > 0,
    retry: false,
  })
