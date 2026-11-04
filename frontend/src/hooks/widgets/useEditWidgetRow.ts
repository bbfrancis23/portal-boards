import {api} from "@/api/client"
import type {components} from "@/api/schema"
import {notifications} from "@mantine/notifications"
import {useMutation, useQueryClient} from "@tanstack/react-query"

type WidgetDataCreate = components["schemas"]["WidgetDataCreate"]
type WidgetDataRead = components["schemas"]["WidgetDataRead"]

export const useEditWidgetRow = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      row,
      data,
    }: {
      row: WidgetDataRead
      data: WidgetDataCreate["data"]
    }): Promise<WidgetDataRead> => {
      const {data: updated, response} = await api.PATCH("/api/widgets/{widget_id}/data/{row_id}", {
        params: {path: {widget_id: row.widget_instance_id, row_id: row.id}},
        body: {data},
      })

      if (!updated) throw new Error(`Couldn't save the row (${response.status})`)
      return updated
    },
    onSuccess: (_updated, {row}) =>
      queryClient.invalidateQueries({queryKey: ["widgets", row.widget_instance_id, "data"]}),
    onError: () =>
      notifications.show({
        color: "danger",
        title: "Couldn't save the row",
        message: "Please try again.",
      }),
  })
}
