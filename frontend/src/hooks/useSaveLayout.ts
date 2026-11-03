import {notifications} from "@mantine/notifications"
import {useMutation, useQueryClient} from "@tanstack/react-query"

import type {components} from "@/api/schema"
import {api} from "@/api/client"
import type {WidgetInstance} from "@/components/dash-boards/widgets/widget-types"

type LayoutItem = components["schemas"]["LayoutItem"]

const widgetsKey = (boardId: number) => ["boards", boardId, "widgets"]

export const useSaveLayout = () => {
  const queryClient = useQueryClient()

  const moveWidgetsInCacheAndKeepOld = (boardId: number, layout: LayoutItem[]) => {
    const oldWidgets = queryClient.getQueryData<WidgetInstance[]>(widgetsKey(boardId))
    queryClient.setQueryData<WidgetInstance[]>(widgetsKey(boardId), (widgets) =>
      widgets?.map((widget) => {
        const item = layout.find((item) => item.id === widget.id)
        return item ? {...widget, x: item.x, y: item.y, w: item.w, h: item.h} : widget
      }),
    )
    return oldWidgets
  }

  const moveWidgetsBack = (boardId: number, oldWidgets: WidgetInstance[] | undefined) =>
    queryClient.setQueryData(widgetsKey(boardId), oldWidgets)

  return useMutation({
    mutationFn: async ({boardId, layout}: {boardId: number; layout: LayoutItem[]}) => {
      const {data, response} = await api.PATCH("/api/boards/{board_id}/widgets/layout", {
        params: {path: {board_id: boardId}},
        body: layout,
      })
      if (!data) throw new Error(`Couldn't update the layout (${response.status})`)
      return data
    },
    onMutate: async ({boardId, layout}) => {
      await queryClient.cancelQueries({queryKey: widgetsKey(boardId)})
      return {oldWidgets: moveWidgetsInCacheAndKeepOld(boardId, layout)}
    },
    onSuccess: (widgets, {boardId}) => queryClient.setQueryData(widgetsKey(boardId), widgets),
    onError: (_error, {boardId}, context) => {
      moveWidgetsBack(boardId, context?.oldWidgets)
      notifications.show({
        color: "danger",
        title: "Couldn't save the layout",
        message: "Your widgets were moved back. Please try again.",
      })
    },
  })
}
