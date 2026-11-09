import ChartWidget from "./ChartWidget"
import PlaceholderWidget from "./PlaceholderWidget"
import ScheduleWidget from "./schedule-widget/ScheduleWidget"
import StatWidget from "./StatWidget"
import TableWidget from "./table-widget/TableWidget"
import {widgetRegistry} from "./widget-registry"
import type {WidgetDefinition} from "./widget-types"

// Stats and tables are real; the rest are placeholders until later issues replace them
const definitions: WidgetDefinition[] = [
  {
    type: "stat",
    kind: "output",
    label: "Stat",
    defaultSize: {w: 3, h: 2},
    component: StatWidget,
  },
  {
    type: "chart",
    kind: "output",
    label: "Chart",
    defaultSize: {w: 8, h: 6},
    component: ChartWidget,
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
    component: ScheduleWidget,
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
