import {Schedule, type ScheduleEventData} from "@mantine/schedule"
import {useDisclosure} from "@mantine/hooks"
import dayjs from "dayjs"
import {useState} from "react"

import {
  hourTime,
  rowOf,
  toScheduleEvents,
  toStoredTime,
  type ScheduleConfig,
} from "./schedule-events"
import type {WidgetComponentProps} from "../widget-types"
import ScheduleEntryModal, {type EntryTarget} from "@/components/modals/widget/ScheduleEntryModal"
import {useEditWidgetRow} from "@/hooks/widgets/useEditWidgetRow"
import {useWidgetRows} from "@/hooks/widgets/useWidgetRows"

const DEFAULT_START_HOUR = 6
const DEFAULT_END_HOUR = 21

type MovedEvent = {newStart: string; newEnd: string; event: ScheduleEventData}
type DroppedTimes = Record<number, {start: string; end: string}>

const withoutRow = (dropped: DroppedTimes, rowId: number) =>
  Object.fromEntries(Object.entries(dropped).filter(([id]) => Number(id) !== rowId))

const ScheduleWidget = ({instance}: WidgetComponentProps) => {
  const {data: rows} = useWidgetRows(instance.id)
  const editRow = useEditWidgetRow()
  const [date, setDate] = useState(() => dayjs().format("YYYY-MM-DD"))
  const [target, setTarget] = useState<EntryTarget>()
  const [timesOpened, setTimesOpened] = useState(0)
  const [modalOpened, modal] = useDisclosure(false)
  // Drawn in the same render as the drop, so an entry never flashes back to its old slot.
  const [droppedTimes, setDroppedTimes] = useState<DroppedTimes>({})

  const events = toScheduleEvents(rows).map((event) => ({
    ...event,
    ...droppedTimes[Number(event.id)],
  }))

  const config = (instance.config ?? {}) as ScheduleConfig
  // Day and week views show only the studio's open hours; entries have no all-day slot.
  const dayHours = {
    startTime: hourTime(config.dayStartHour ?? DEFAULT_START_HOUR),
    endTime: hourTime(config.dayEndHour ?? DEFAULT_END_HOUR),
    withAllDaySlots: false,
  }

  const openEntry = (next: EntryTarget) => {
    setTarget(next)
    setTimesOpened((count) => count + 1)
    modal.open()
  }

  // Dragging or resizing an entry saves its new times, keeping everything else.
  const saveNewTimes = ({newStart, newEnd, event}: MovedEvent) => {
    const row = rowOf(event)
    if (!row) return
    setDroppedTimes((dropped) => ({...dropped, [row.id]: {start: newStart, end: newEnd}}))
    const data = {...row.data, start: toStoredTime(newStart), end: toStoredTime(newEnd)}
    // Once saved (or undone after an error), the rows themselves have the right times.
    editRow.mutate(
      {row, data},
      {onSettled: () => setDroppedTimes((dropped) => withoutRow(dropped, row.id))},
    )
  }

  return (
    <>
      <Schedule
        date={date}
        onDateChange={setDate}
        defaultView="week"
        dayViewProps={dayHours}
        weekViewProps={dayHours}
        events={events}
        onTimeSlotClick={({slotStart, slotEnd}) => openEntry({start: slotStart, end: slotEnd})}
        onEventClick={(event) => {
          const row = rowOf(event)
          if (row) openEntry({row})
        }}
        withEventsDragAndDrop
        onEventDrop={saveNewTimes}
        withEventResize
        onEventResize={saveNewTimes}
      />
      {target && (
        // A new key on every open remounts the form, so it starts from the entry's current values.
        <ScheduleEntryModal
          key={timesOpened}
          opened={modalOpened}
          onClose={modal.close}
          widget={instance}
          target={target}
          classTypes={config.classTypes ?? []}
        />
      )}
    </>
  )
}

export default ScheduleWidget
