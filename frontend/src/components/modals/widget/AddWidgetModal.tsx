import {useNumberIds} from "@/hooks/useNumberIds"
import {useAddWidgetPreset} from "@/hooks/widgets/useAddWidgetPreset"
import {useWidgetPresets, type WidgetPreset} from "@/hooks/widgets/useWidgetPresets"
import {Box, Card, Modal, Stack, Image, Group, Text, Button, SimpleGrid, Title} from "@mantine/core"

type AddWidgetModalProps = {
  opened: boolean
  onClose: () => void
}

// Tables and schedules first: stats and charts read from them.
const GROUPS: {type: WidgetPreset["type"]; label: string}[] = [
  {type: "table", label: "Tables"},
  {type: "schedule", label: "Schedules"},
  {type: "stat", label: "Stats"},
  {type: "chart", label: "Charts"},
]

const AddWidgetModal = ({opened, onClose}: AddWidgetModalProps) => {
  const {boardId} = useNumberIds()
  const addWidgetPreset = useAddWidgetPreset()

  const {data: presets} = useWidgetPresets(boardId)

  const groups = GROUPS.map((group) => ({
    ...group,
    presets: (presets ?? [])
      .filter((preset) => preset.type === group.type)
      .sort((a, b) => a.title.localeCompare(b.title)),
  })).filter((group) => group.presets.length > 0)

  const add = (key: string) => {
    if (boardId === undefined) return
    addWidgetPreset.mutate({boardId, key}, {onSuccess: onClose})
  }

  const isAdding = (key: string) =>
    addWidgetPreset.isPending && addWidgetPreset.variables?.key === key

  return (
    <Modal opened={opened} onClose={onClose} title="Add widget" size="xl">
      <Stack pt="md">
        {presets?.length === 0 && (
          <Text size="sm" c="dimmed">
            This portal wasn't made from a template, so it has no presets yet.
          </Text>
        )}
        {groups.map((group) => (
          <Stack key={group.type} gap="xs">
            <Title order={4}>{group.label}</Title>
            <SimpleGrid cols={{base: 1, sm: 2, md: 3}}>
              {group.presets.map((preset) => (
                <Card key={preset.key} shadow="sm" padding="lg" withBorder>
                  <Card.Section>
                    <Image src={`/images/widgets/${preset.type}.svg`} alt="" height={100} />
                  </Card.Section>
                  <Group justify="space-between" mt="md" mb="xs">
                    <Text fw={600} size="lg">
                      {preset.title}
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {preset.description}
                  </Text>
                  {/* Pushes the button to the bottom, so buttons in a row line up when titles wrap. */}
                  <Box mt="auto">
                    <Button
                      fullWidth
                      mt="md"
                      disabled={preset.data_widget_in_portal}
                      loading={isAdding(preset.key)}
                      onClick={() => add(preset.key)}>
                      {preset.data_widget_in_portal ? "Already added" : "Add"}
                    </Button>
                  </Box>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        ))}
      </Stack>
    </Modal>
  )
}

export default AddWidgetModal
