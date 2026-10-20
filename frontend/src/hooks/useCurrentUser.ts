import type {components} from "@/api/schema"
import {useQuery} from "@tanstack/react-query"

import {api} from "@/api/client"
export type User = components["schemas"]["UserRead"]

// Who's logged in: the user, or null when nobody is (a 401 is an answer, not an error).
export const useCurrentUser = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<User | null> => {
      const {data, response} = await api.GET("/api/users/me")
      if (response.status === 401) return null
      if (!data) throw new Error(`Couldn't load the current user (${response.status})`)
      return data
    },
    retry: false,
  })
