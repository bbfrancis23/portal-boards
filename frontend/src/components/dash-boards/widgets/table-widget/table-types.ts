import type {WidgetData} from "@/hooks/widgets/useWidgetRows"

export type Column = {
  key: string
  label: string
  type: "text" | "select" | "date" | "currency" | "number"
  options?: string[]
}

export type Row = WidgetData
