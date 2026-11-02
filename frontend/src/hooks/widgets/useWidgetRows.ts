import {api} from "@/api/client"
import type {components} from "@/api/schema"
import {skipToken, useQuery} from "@tanstack/react-query"

export type WidgetData = components["schemas"]["WidgetDataRead"]

export const useWidgetRows = (widgetId: number | undefined) =>
  useQuery({
    queryKey: ["widgets", widgetId, "data"],
    queryFn:
      widgetId === undefined
        ? skipToken
        : async (): Promise<WidgetData[]> => {
            const {data, response} = await api.GET("/api/widgets/{widget_id}/data", {
              params: {path: {widget_id: widgetId}},
            })
            if (!data) throw new Error(`Couldn't load the rows (${response.status})`)
            return data
          },
  })
