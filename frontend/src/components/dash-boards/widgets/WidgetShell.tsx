import {Card, Text, Group, Box} from "@mantine/core"
import type {ReactNode} from "react"

export type WidgetShellProps = {
  title: string
  children: ReactNode
}

const WidgetShell = ({title, children}: WidgetShellProps) => {
  return (
    // The theme gives every Card the widget surface and chrome outline (theme.ts).
    <Card radius="lg" h="100%">
      <Group justify="space-between" mb="xs">
        <Text fw={500}>{title}</Text>
      </Group>
      <Box style={{flex: 1, overflow: "auto"}}>{children}</Box>
    </Card>
  )
}

export default WidgetShell
