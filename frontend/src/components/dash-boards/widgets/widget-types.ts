import type {components} from "@/api/schema"
import type {ComponentType} from "react"

/** Whether a widget collects data from the user or renders/derives it. */
export type WidgetKind = "input" | "output"

/** The widget type names the API knows ("stat", "chart", ...). */
export type WidgetType = components["schemas"]["WidgetType"]

/** A widget placed on a board, as the API returns it. */
export type WidgetInstance = components["schemas"]["WidgetRead"]

/** Props every widget component receives when rendered on a board. */
export interface WidgetComponentProps {
  instance: WidgetInstance
}

/** How a widget type registers itself with the widget registry. */
export interface WidgetDefinition {
  type: WidgetType
  kind: WidgetKind
  label: string
  component: ComponentType<WidgetComponentProps>
  defaultSize: {w: number; h: number}
  defaultConfig?: WidgetInstance["config"]
}
