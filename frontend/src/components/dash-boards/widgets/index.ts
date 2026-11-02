import PlaceholderWidget from "./PlaceholderWidget"
import {widgetRegistry} from "./widget-registry"
import type {WidgetDefinition} from "./widget-types"

// Every widget type the API knows, all drawn by the placeholder for now. #21 swaps in the real
// components. Input widgets collect data (the same set as INPUT_TYPES in the backend's
// widget_data.py); output widgets show it. Default sizes match the template's.
const definitions: Omit<WidgetDefinition, "component">[] = [
  {type: "stat", kind: "output", label: "Stat", defaultSize: {w: 3, h: 2}},
  {type: "chart", kind: "output", label: "Chart", defaultSize: {w: 8, h: 6}},
  {type: "table", kind: "input", label: "Table", defaultSize: {w: 12, h: 10}},
  {type: "schedule", kind: "input", label: "Schedule", defaultSize: {w: 12, h: 12}},
  {type: "form", kind: "input", label: "Form", defaultSize: {w: 6, h: 8}},
]

for (const definition of definitions) {
  widgetRegistry.register({...definition, component: PlaceholderWidget})
}
