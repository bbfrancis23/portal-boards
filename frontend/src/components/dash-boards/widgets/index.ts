import PlaceholderWidget from "./PlaceholderWidget"
import TableWidget from "./table-widget/TableWidget"
import {widgetRegistry} from "./widget-registry"
import type {WidgetDefinition} from "./widget-types"

// Tables are real; the rest are placeholders until #21 and later issues replace them
const definitions: WidgetDefinition[] = [
  {
    type: "stat",
    kind: "output",
    label: "Stat",
    defaultSize: {w: 3, h: 2},
    component: PlaceholderWidget,
  },
  {
    type: "chart",
    kind: "output",
    label: "Chart",
    defaultSize: {w: 8, h: 6},
    component: PlaceholderWidget,
  },
  {
    type: "table",
    kind: "input",
    label: "Table",
    defaultSize: {w: 12, h: 10},
    component: TableWidget,
  },
  {
    type: "schedule",
    kind: "input",
    label: "Schedule",
    defaultSize: {w: 12, h: 12},
    component: PlaceholderWidget,
  },
  {
    type: "form",
    kind: "input",
    label: "Form",
    defaultSize: {w: 6, h: 8},
    component: PlaceholderWidget,
  },
]

for (const definition of definitions) {
  widgetRegistry.register(definition)
}
