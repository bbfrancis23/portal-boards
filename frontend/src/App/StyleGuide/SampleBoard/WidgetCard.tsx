import {Card, Grid, Text} from "@mantine/core"
import type {ReactNode} from "react"

export type WidgetCardProps = {
  title: string
  span: number
  minHeight: number
  children: ReactNode
}

const WidgetCard = ({title, span, minHeight, children}: WidgetCardProps) => {
  return (
    <Grid.Col span={{base: 12, md: span}}>
      <Card h="100%" mih={minHeight}>
        <Text fw={600}>{title}</Text>
        {children}
      </Card>
    </Grid.Col>
  )
}

export default WidgetCard
