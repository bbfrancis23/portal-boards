import {Text} from "@mantine/core"

import {widgetRegistry} from "./widget-registry"
import type {WidgetComponentProps} from "./widget-types"

// Stands in for every widget type until #21 brings the real ones.
const PlaceholderWidget = ({instance}: WidgetComponentProps) => {
  const label = widgetRegistry.get(instance.type)?.label ?? instance.type
  return (
    <Text size="sm" c="dimmed">
      {label}, coming soon
    </Text>
  )
}

export default PlaceholderWidget
