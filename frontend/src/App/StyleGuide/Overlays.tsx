import {Button, Drawer, Group, Menu, Modal, Popover, Text, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconDots, IconPencil, IconTrash} from "@tabler/icons-react"

const Overlays = () => {
  const [modalOpened, modal] = useDisclosure(false)
  const [drawerOpened, drawer] = useDisclosure(false)

  return (
    <>
      <Group>
        <Button onClick={modal.open}>Open modal</Button>
        <Button variant="glow" onClick={drawer.open}>
          Open drawer
        </Button>

        <Menu>
          <Menu.Target>
            <Button variant="glow" leftSection={<IconDots size={16} />}>
              Menu
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Widget</Menu.Label>
            <Menu.Item leftSection={<IconPencil size={14} />}>Edit</Menu.Item>
            <Menu.Item leftSection={<IconTrash size={14} />} color="coral">
              Remove
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Popover>
          <Popover.Target>
            <Button variant="glow">Popover</Button>
          </Popover.Target>
          <Popover.Dropdown>
            <Text size="sm">Monthly members get 15% off every spa service.</Text>
          </Popover.Dropdown>
        </Popover>

        <Tooltip label="Revenue this month, vs last month">
          <Button variant="subtle">Hover for tooltip</Button>
        </Tooltip>
      </Group>

      <Modal opened={modalOpened} onClose={modal.close} title="Add widget">
        <Text size="sm" c="dimmed">
          Pick a widget type to add to this board.
        </Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="subtle" onClick={modal.close}>
            Cancel
          </Button>
          <Button onClick={modal.close}>Add</Button>
        </Group>
      </Modal>

      <Drawer opened={drawerOpened} onClose={drawer.close} title="Assistant" position="right">
        <Text size="sm" c="dimmed">
          The assistant panel will live here.
        </Text>
      </Drawer>
    </>
  )
}

export default Overlays
