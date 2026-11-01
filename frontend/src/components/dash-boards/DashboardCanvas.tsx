import {ResponsiveGridLayout, useContainerWidth} from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import {Alert, SimpleGrid, Skeleton, Text} from "@mantine/core"
import WidgetShell from "./widgets/WidgetShell"
import {widgetRegistry} from "./widgets/widget-registry"
import {useWidgets} from "@/hooks/useWidgets"
import {useNumberIds} from "@/hooks/useNumberIds"

const DashboardCanvas = () => {
  const {width, containerRef, mounted} = useContainerWidth()

  const {boardId} = useNumberIds()
  const {data: widgets, isPending, isError} = useWidgets(boardId)

  const layout = (widgets ?? []).map((widget) => ({
    i: String(widget.id),
    x: widget.x,
    y: widget.y,
    w: widget.w,
    h: widget.h,
  }))

  return (
    <div ref={containerRef}>
      {/* Without these, a slow or failed request would look like an empty dashboard. */}
      {isPending && (
        <SimpleGrid cols={{base: 1, sm: 3}}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} height={160} radius="lg" />
          ))}
        </SimpleGrid>
      )}
      {isError && <Alert color="coral">Couldn't load the widgets. Please try again.</Alert>}
      {mounted && widgets && (
        <ResponsiveGridLayout
          width={width}
          layouts={{lg: layout}}
          cols={{lg: 12, md: 12, sm: 12, xs: 1, xxs: 1}}
          rowHeight={80}
          dragConfig={{enabled: false}}
          resizeConfig={{enabled: false}}>
          {widgets.map((widget) => {
            const definition = widgetRegistry.get(widget.type)
            const Widget = definition?.component
            const title =
              typeof widget.config.title === "string"
                ? widget.config.title
                : (definition?.label ?? widget.type)
            return (
              <div key={String(widget.id)}>
                <WidgetShell title={title}>
                  {Widget ? (
                    <Widget instance={widget} />
                  ) : (
                    <Text size="sm" c="dimmed">
                      Unknown widget
                    </Text>
                  )}
                </WidgetShell>
              </div>
            )
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  )
}

export default DashboardCanvas
