import {api} from "@/api/client"
import type {WidgetInstance} from "@/components/dash-boards/widgets/widget-types"
import {skipToken, useQuery} from "@tanstack/react-query"

/** The stats and charts that read this table or schedule, so they're deleted along with it. */
export const useWidgetDependents = (widgetId: number | undefined) =>
  useQuery({
    queryKey: ["widgets", widgetId, "dependents"],
    queryFn:
      widgetId === undefined
        ? skipToken
        : async (): Promise<WidgetInstance[]> => {
            const {data, response} = await api.GET("/api/widgets/{widget_id}/dependents", {
              params: {path: {widget_id: widgetId}},
            })
            if (!data) throw new Error(`Couldn't load the dependent widgets (${response.status})`)
            return data
          },
  })
