import {api} from "@/api/client"
import type {components} from "@/api/schema"
import {useQuery} from "@tanstack/react-query"

export type Portal = components["schemas"]["PortalRead"]

export const usePortals = () =>
  useQuery({
    queryKey: ["portals"],
    queryFn: async (): Promise<Portal[]> => {
      const {data, response} = await api.GET("/api/portals")
      if (!data) throw new Error(`Couldn't load the current portals (${response.status})`)
      return data
    },
    retry: false,
  })
