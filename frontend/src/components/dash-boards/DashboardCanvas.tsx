import {
  ResponsiveGridLayout,
  useContainerWidth,
  type Layout,
  type LayoutItem,
} from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import {Alert, SimpleGrid, Skeleton, Text} from "@mantine/core"
import EmptyState from "@/theme/EmptyState"
import WidgetShell from "./widgets/WidgetShell"
import {widgetRegistry} from "./widgets/widget-registry"
import {useWidgets} from "@/hooks/widgets/useWidgets"
import {useNumberIds} from "@/hooks/useNumberIds"
import {useSaveLayout} from "@/hooks/useSaveLayout"

const dynamicColCount = {lg: 12, md: 12, sm: 12, xs: 1, xxs: 1}

type DashboardCanvasProps = {onAddWidget: () => void}

const DashboardCanvas = ({onAddWidget}: DashboardCanvasProps) => {
  const {width, containerRef, mounted} = useContainerWidth()
  const saveLayout = useSaveLayout()

  const {boardId} = useNumberIds()
  const {data: widgets, isPending, isError} = useWidgets(boardId)

  const layout = (widgets ?? []).map((widget) => ({
    i: String(widget.id),
    x: widget.x,
    y: widget.y,
    w: widget.w,
    h: widget.h,
  }))

  const editable = width >= 768

  const handleLayoutStop = (
    newLayout: Layout,
    oldItem: LayoutItem | null,
    newItem: LayoutItem | null,
  ) => {
    if (boardId === undefined || !oldItem || !newItem) return
    const {x, y, w, h} = newItem
    if (x === oldItem.x && y === oldItem.y && w === oldItem.w && h === oldItem.h) return
    saveLayout.mutate({
      boardId,
      layout: newLayout.map(({i, x, y, w, h}) => ({id: Number(i), x, y, w, h})),
    })
  }

  return (
    <div ref={containerRef}>
      {isPending && (
        <SimpleGrid cols={{base: 1, sm: 3}}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} height={160} radius="lg" />
          ))}
        </SimpleGrid>
      )}
      {isError && <Alert color="danger">Couldn't load the widgets. Please try again.</Alert>}
      {widgets?.length === 0 && (
        <EmptyState
          message="This board has no widgets yet"
          action={{label: "Add widget", onClick: onAddWidget}}
        />
      )}
      {mounted && widgets && widgets.length > 0 && (
        <ResponsiveGridLayout
          cols={dynamicColCount}
          dragConfig={{enabled: editable, handle: ".widget-drag-handle"}}
          layouts={{lg: layout}}
          onDragStop={handleLayoutStop}
          onResizeStop={handleLayoutStop}
          resizeConfig={{enabled: editable}}
          rowHeight={80}
          width={width}>
          {widgets.map((widget) => {
            const definition = widgetRegistry.get(widget.type)
            const Widget = definition?.component
            const title =
              typeof widget.config.title === "string"
                ? widget.config.title
                : (definition?.label ?? widget.type)
            return (
              <div key={String(widget.id)}>
                <WidgetShell title={title} editable={editable} instance={widget}>
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
