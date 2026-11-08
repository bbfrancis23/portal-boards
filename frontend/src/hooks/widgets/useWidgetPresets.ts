import {api} from "@/api/client"
import type {components} from "@/api/schema"
import {skipToken, useQuery} from "@tanstack/react-query"

export type WidgetPreset = components["schemas"]["WidgetPresetRead"]

export const useWidgetPresets = (boardId: number | undefined) =>
  useQuery({
    queryKey: ["boards", boardId, "widgets", "presets"],
    queryFn:
      boardId === undefined
        ? skipToken
        : async (): Promise<WidgetPreset[]> => {
            const {data, response} = await api.GET("/api/boards/{board_id}/widgets/presets", {
              params: {path: {board_id: boardId}},
            })
            if (!data) throw new Error(`Couldn't load the presets (${response.status})`)
            return data
          },
  })
