import {useMutation, useQueryClient} from "@tanstack/react-query"

import {api} from "@/api/client"
import type {components} from "@/api/schema"

type WidgetDataRead = components["schemas"]["WidgetDataRead"]

export const useDeleteWidgetRow = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({row}: {row: WidgetDataRead}): Promise<void> => {
      const {response} = await api.DELETE("/api/widgets/{widget_id}/data/{row_id}", {
        params: {path: {widget_id: row.widget_instance_id, row_id: row.id}},
      })
      if (!response.ok) throw new Error(`Couldn't delete the row (${response.status})`)
    },
    onSuccess: (_result, {row}) =>
      queryClient.invalidateQueries({queryKey: ["widgets", row.widget_instance_id, "data"]}),
  })
}
