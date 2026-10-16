import {Paper, SimpleGrid, Text} from "@mantine/core"

const SIZES = ["xs", "sm", "md", "lg", "xl"]

const Shadows = () => {
  return (
    <SimpleGrid cols={{base: 2, sm: 5}} spacing="xl" p="md">
      {SIZES.map((size) => (
        <Paper key={size} shadow={size} p="lg" bg="var(--pb-surface)">
          <Text ff="monospace" ta="center">
            {size}
          </Text>
        </Paper>
      ))}
    </SimpleGrid>
  )
}

export default Shadows
