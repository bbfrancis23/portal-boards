import {api} from "@/api/client"
import type {components} from "@/api/schema"
import {notifications} from "@mantine/notifications"
import {useMutation, useQueryClient} from "@tanstack/react-query"

type WidgetDataCreate = components["schemas"]["WidgetDataCreate"]
type WidgetDataRead = components["schemas"]["WidgetDataRead"]

const rowsKey = (widgetId: number) => ["widgets", widgetId, "data"]

export const useEditWidgetRow = () => {
  const queryClient = useQueryClient()

  // Shows the edit right away (a dragged schedule entry stays where it was dropped).
  const editRowInCacheAndKeepOld = (row: WidgetDataRead, data: WidgetDataCreate["data"]) => {
    const oldRows = queryClient.getQueryData<WidgetDataRead[]>(rowsKey(row.widget_instance_id))
    queryClient.setQueryData<WidgetDataRead[]>(rowsKey(row.widget_instance_id), (rows) =>
      rows?.map((saved) => (saved.id === row.id ? {...saved, data} : saved)),
    )
    return oldRows
  }

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
    onMutate: async ({row, data}) => {
      await queryClient.cancelQueries({queryKey: rowsKey(row.widget_instance_id)})
      return {oldRows: editRowInCacheAndKeepOld(row, data)}
    },
    onSuccess: (_updated, {row}) =>
      queryClient.invalidateQueries({queryKey: rowsKey(row.widget_instance_id)}),
    onError: (_error, {row}, context) => {
      queryClient.setQueryData(rowsKey(row.widget_instance_id), context?.oldRows)
      notifications.show({
        color: "danger",
        title: "Couldn't save the row",
        message: "Your change was undone. Please try again.",
      })
    },
  })
}
