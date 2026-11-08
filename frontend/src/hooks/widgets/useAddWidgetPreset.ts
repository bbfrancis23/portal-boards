import {api} from "@/api/client"
import type {WidgetInstance} from "@/components/dash-boards/widgets/widget-types"
import {notifications} from "@mantine/notifications"
import {useMutation, useQueryClient} from "@tanstack/react-query"

export const useAddWidgetPreset = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({boardId, key}: {boardId: number; key: string}): Promise<WidgetInstance> => {
      const {data, response} = await api.POST("/api/boards/{board_id}/widgets/presets/{key}", {
        params: {path: {board_id: boardId, key}},
      })
      if (!data) throw new Error(`Couldn't add the widget (${response.status})`)
      return data
    },
    // Also refreshes the presets, whose key starts the same, so an added table shows as added.
    onSuccess: (_widget, {boardId}) =>
      queryClient.invalidateQueries({queryKey: ["boards", boardId, "widgets"]}),
    onError: () =>
      notifications.show({
        color: "danger",
        title: "Couldn't add the widget",
        message: "Please try again.",
      }),
  })
}
