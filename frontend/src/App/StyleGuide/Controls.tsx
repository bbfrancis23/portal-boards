import {Badge, Button, Group, NumberInput, SegmentedControl, Select, TextInput} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"

const Controls = () => {
  return (
    <>
      <Group>
        <Button>Filled</Button>
        <Button variant="glow">Glow</Button>
        <Button variant="subtle">Subtle</Button>
        <Button disabled>Disabled</Button>
        <Button aria-label="Add widget">
          <IconPlus />
        </Button>
      </Group>
      <Group>
        <TextInput label="Member name" placeholder="Input placeholder" />
        <Select
          label="Membership"
          placeholder="Pick value"
          data={["Monthly unlimited", "10-class pack", "Drop-in"]}
        />
        <NumberInput label="Class size" />
      </Group>
      <Group>
        <Badge>Active</Badge>
        <Badge variant="light">Inactive</Badge>
        <Badge color="lime">+8%</Badge>
        <Badge color="coral">-3%</Badge>
      </Group>
      <div>
        <SegmentedControl data={["Week", "Month"]} />
      </div>
    </>
  )
}

export default Controls
