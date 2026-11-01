import {api} from "@/api/client"
import type {components} from "@/api/schema"
import {skipToken, useQuery} from "@tanstack/react-query"

export type Board = components["schemas"]["BoardRead"]

export const useBoards = (portalId: number | undefined) =>
  useQuery({
    queryKey: ["portals", portalId, "boards"],
    // No portal in the URL: don't fetch at all (replaces enabled: portalId > 0).
    queryFn:
      portalId === undefined
        ? skipToken
        : async (): Promise<Board[]> => {
            const {data, response} = await api.GET("/api/portals/{portal_id}/boards", {
              params: {path: {portal_id: portalId}},
            })
            if (!data) throw new Error(`Couldn't load the boards (${response.status})`)
            return data
          },
  })
