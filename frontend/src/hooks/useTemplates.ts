import {api} from "@/api/client"
import type {components} from "@/api/schema"
import {useQuery} from "@tanstack/react-query"

export type Template = components["schemas"]["TemplateRead"]

export const useTemplates = () =>
  useQuery({
    queryKey: ["templates"],
    queryFn: async (): Promise<Template[]> => {
      const {data, response} = await api.GET("/api/templates")
      if (!data) throw new Error(`Couldn't load the current templates (${response.status})`)
      return data
    },
    retry: false,
  })
