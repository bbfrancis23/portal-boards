import {api} from "@/api/client"
import type {WidgetInstance} from "@/components/dash-boards/widgets/widget-types"
import {skipToken, useQuery} from "@tanstack/react-query"

export const useWidgets = (boardId: number | undefined) =>
  useQuery({
    queryKey: ["boards", boardId, "widgets"],
    queryFn:
      boardId === undefined
        ? skipToken
        : async (): Promise<WidgetInstance[]> => {
            const {data, response} = await api.GET("/api/boards/{board_id}/widgets", {
              params: {path: {board_id: boardId}},
            })
            if (!data) throw new Error(`Couldn't load the widgets (${response.status})`)
            return data
          },
  })
