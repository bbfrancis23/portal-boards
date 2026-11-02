import {Card, Text, Group, Box} from "@mantine/core"
import type {ReactNode} from "react"

export type WidgetShellProps = {
  title: string
  draggable?: boolean
  children: ReactNode
}

const WidgetShell = ({title, draggable = false, children}: WidgetShellProps) => {
  return (
    <Card radius="lg" h="100%">
      <Group justify="space-between" mb="xs">
        <Text
          fw={500}
          className="widget-drag-handle"
          style={{cursor: draggable ? "grab" : undefined}}>
          {title}
        </Text>
      </Group>
      <Box style={{flex: 1, overflow: "auto"}}>{children}</Box>
    </Card>
  )
}

export default WidgetShell
