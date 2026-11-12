import {api} from "@/api/client"
import type {components} from "@/api/schema"
import {useMutation, useQueryClient} from "@tanstack/react-query"

type WidgetDataCreate = components["schemas"]["WidgetDataCreate"]
type WidgetDataRead = components["schemas"]["WidgetDataRead"]

/** Adds many rows in one request: all of them, or none if any is rejected. */
export const useCreateWidgetRows = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      boardId,
      widgetId,
      rows,
    }: {
      boardId: number
      widgetId: number
      rows: WidgetDataCreate["data"][]
    }): Promise<WidgetDataRead[]> => {
      const {data: created, response} = await api.POST(
        "/api/boards/{board_id}/widgets/{widget_id}/data/bulk",
        {
          params: {path: {board_id: boardId, widget_id: widgetId}},
          body: {rows: rows.map((data) => ({data}))},
        },
      )

      if (!created) throw new Error(`Couldn't add the rows (${response.status})`)
      return created
    },
    // The table and every stat and chart reading it share this key, so they all refresh.
    onSuccess: (_rows, {widgetId}) =>
      queryClient.invalidateQueries({queryKey: ["widgets", widgetId, "data"]}),
  })
}
