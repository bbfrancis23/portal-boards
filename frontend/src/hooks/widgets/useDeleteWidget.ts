import {useMutation, useQueryClient} from "@tanstack/react-query"

import {api} from "@/api/client"
import type {WidgetInstance} from "@/components/dash-boards/widgets/widget-types"

export const useDeleteWidget = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({widget}: {widget: WidgetInstance}): Promise<void> => {
      const {response} = await api.DELETE("/api/widgets/{widget_id}", {
        params: {path: {widget_id: widget.id}},
      })
      if (!response.ok) throw new Error(`Couldn't delete the widget (${response.status})`)
    },
    // Drop it from the cached board right away, then refresh in the background.
    onSuccess: (_result, {widget}) => {
      const key = ["boards", widget.board_id, "widgets"]
      queryClient.setQueryData<WidgetInstance[]>(key, (widgets) =>
        widgets?.filter((w) => w.id !== widget.id),
      )
      queryClient.invalidateQueries({queryKey: ["boards"]})
    },
  })
}
