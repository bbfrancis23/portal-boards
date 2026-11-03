import {api} from "@/api/client"
import type {components} from "@/api/schema"
import {notifications} from "@mantine/notifications"
import {useMutation, useQueryClient} from "@tanstack/react-query"

type WidgetDataCreate = components["schemas"]["WidgetDataCreate"]
type WidgetDataRead = components["schemas"]["WidgetDataRead"]

export const useCreateWidgetRow = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      boardId,
      widgetId,
      data,
    }: {
      boardId: number
      widgetId: number
      data: WidgetDataCreate["data"]
    }): Promise<WidgetDataRead> => {
      const {data: row, response} = await api.POST(
        "/api/boards/{board_id}/widgets/{widget_id}/data",
        {
          params: {path: {board_id: boardId, widget_id: widgetId}},
          body: {data},
        },
      )

      if (!row) throw new Error(`Couldn't add the row (${response.status})`)
      return row
    },
    onSuccess: (_row, {widgetId}) =>
      queryClient.invalidateQueries({queryKey: ["widgets", widgetId, "data"]}),
    onError: () =>
      notifications.show({
        color: "danger",
        title: "Couldn't save the row",
        message: "Please try again.",
      }),
  })
}
