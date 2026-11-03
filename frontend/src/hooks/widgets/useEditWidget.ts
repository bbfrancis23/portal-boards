import {api} from "@/api/client"
import type {WidgetInstance} from "@/components/dash-boards/widgets/widget-types"
import {notifications} from "@mantine/notifications"
import {useMutation, useQueryClient} from "@tanstack/react-query"

export const useEditWidget = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      widgetId,
      config,
    }: {
      widgetId: number
      config: WidgetInstance["config"]
    }): Promise<WidgetInstance> => {
      const {data, response} = await api.PATCH("/api/widgets/{widget_id}", {
        params: {path: {widget_id: widgetId}},
        body: {config},
      })
      if (!data) throw new Error(`Couldn't update the widget (${response.status})`)
      return data
    },
    onSuccess: (widget) =>
      queryClient.invalidateQueries({queryKey: ["boards", widget.board_id, "widgets"]}),
    onError: () =>
      notifications.show({
        color: "danger",
        title: "Couldn't save the widget",
        message: "Please try again.",
      }),
  })
}
