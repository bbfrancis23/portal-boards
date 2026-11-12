import {ActionIcon, Group, Table} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconClipboardText, IconPlus, IconX} from "@tabler/icons-react"

import AddRow from "./AddRow"
import SavedRows from "./SavedRows"
import type {Column} from "./table-types"
import type {WidgetComponentProps} from "../widget-types"
import PasteCsvModal from "@/components/modals/widget/PasteCsvModal"
import {useWidgetRows} from "@/hooks/widgets/useWidgetRows"

const TableWidget = ({instance}: WidgetComponentProps) => {
  const {data: rows} = useWidgetRows(instance.id)
  // Closing the add-row form unmounts it, which also clears what was typed.
  const [adding, {toggle}] = useDisclosure(false)
  const [pasting, pasteModal] = useDisclosure(false)

  const config = instance.config as {columns?: Column[]} | null | undefined
  const columns = Array.isArray(config?.columns) ? config.columns : []

  return (
    // Fill the widget's body, so rows reach its bottom edge and scroll only when they don't fit.
    <>
      <Table.ScrollContainer minWidth={600} h="100%" maxHeight="100%">
        <Table striped stickyHeader highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {columns.map((column) => (
                <Table.Th key={column.key}>{column.label}</Table.Th>
              ))}
              <Table.Th>
                <Group justify="flex-end" gap="xs">
                  <ActionIcon variant="subtle" onClick={pasteModal.open} aria-label="Paste CSV">
                    <IconClipboardText size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    onClick={toggle}
                    aria-label={adding ? "Cancel" : "Add row"}>
                    {adding ? <IconX size={18} /> : <IconPlus size={18} />}
                  </ActionIcon>
                </Group>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {adding && <AddRow widget={instance} columns={columns} />}
            <SavedRows rows={rows} columns={columns} />
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <PasteCsvModal
        opened={pasting}
        onClose={pasteModal.close}
        widget={instance}
        columns={columns}
      />
    </>
  )
}

export default TableWidget
