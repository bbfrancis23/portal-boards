import {Card, Text, Group, Box, Menu, ActionIcon, TextInput} from "@mantine/core"
import {useRef, useState, type ReactNode} from "react"
import {IconDotsVertical} from "@tabler/icons-react"
import {hasLength, useForm} from "@mantine/form"
import type {WidgetInstance} from "./widget-types"
import {useEditWidget} from "@/hooks/widgets/useEditWidget"
import {useDisclosure} from "@mantine/hooks"
import DeleteWidgetModal from "@/components/modals/DeleteWidgetModal"

export type WidgetShellProps = {
  title: string
  // The board is in edit mode: the widget can be dragged, renamed and deleted.
  editable?: boolean
  children: ReactNode
  instance: WidgetInstance
}

const WidgetShell = ({title, editable = false, children, instance}: WidgetShellProps) => {
  const editWidget = useEditWidget()
  const [isEditingName, setIsEditingName] = useState<boolean>(false)
  const [deleting, {open: openDelete, close: closeDelete}] = useDisclosure(false)

  const form = useForm({
    initialValues: {name: title},
    validate: {name: hasLength({min: 2}, "Must be at least 2 characters")},
  })

  // A ref, not state: it changes at once, so a blur fired while the input is being removed
  // (after Enter or Escape) sees that editing already ended and doesn't save again.
  const stillEditing = useRef(false)

  const startEditing = () => {
    stillEditing.current = true
    setIsEditingName(true)
  }

  const stopEditing = () => {
    stillEditing.current = false
    setIsEditingName(false)
  }

  const save = (values: {name: string}) => {
    if (!stillEditing.current || form.validate().hasErrors) return
    const name = values.name.trim()
    if (name !== title) {
      editWidget.mutate({widgetId: instance.id, config: {...instance.config, title: name}})
    }
    stopEditing()
  }

  const cancel = () => {
    form.setFieldValue("name", title)
    stopEditing()
  }

  return (
    <Card radius="lg" h="100%">
      <Group justify="space-between" mb="xs">
        {!isEditingName && (
          <Text
            fw={500}
            className="widget-drag-handle"
            style={{cursor: editable ? "grab" : undefined}}>
            {title}
          </Text>
        )}
        {isEditingName && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              save(form.values)
            }}>
            <TextInput
              autoFocus
              {...form.getInputProps("name")}
              onBlur={() => save(form.values)}
              onKeyDown={(event) => event.key === "Escape" && cancel()}
            />
          </form>
        )}
        {editable && (
          <Menu returnFocus={false}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDotsVertical />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Actions</Menu.Label>
              <Menu.Item onClick={startEditing}>Rename</Menu.Item>
              <Menu.Item color="danger" onClick={openDelete}>
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
      <Box style={{flex: 1, overflow: "auto"}}>{children}</Box>
      <DeleteWidgetModal
        opened={deleting}
        onClose={closeDelete}
        widget={instance}
        widgetTitle={title}
      />
    </Card>
  )
}

export default WidgetShell
