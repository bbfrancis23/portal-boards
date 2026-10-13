import {Stack, Text, Title} from "@mantine/core"

import NeonText from "@/theme/NeonText"

const TypeScale = () => {
  return (
    <Stack>
      <Text
        ff="var(--mantine-font-family-headings)"
        style={{fontSize: "56px", fontWeight: "300", fontVariantNumeric: "tabular-nums"}}>
        $18,240
      </Text>
      <NeonText
        ff="var(--mantine-font-family-headings)"
        style={{fontSize: "56px", fontWeight: "300", fontVariantNumeric: "tabular-nums"}}>
        $18,240
      </NeonText>
      <NeonText
        ff="var(--mantine-font-family-headings)"
        style={{fontSize: "64px", fontWeight: "400"}}>
        portal
      </NeonText>
      <Title order={1}>Heading 1</Title>
      <Title order={2}>Heading 2</Title>
      <Title order={3}>Heading 3</Title>
      <Title order={4}>Heading 4</Title>
      <Title order={5}>Heading 5</Title>
      <Title order={6}>Heading 6</Title>
      <Text size="xl">Extra Large</Text>
      <Text size="lg">Large</Text>
      <Text size="md">Normal</Text>
      <Text size="sm" c="dimmed">
        Small
      </Text>
      <Text size="xs" fs="italic" c="dimmed">
        Extra Small Caption
      </Text>
    </Stack>
  )
}

export default TypeScale
