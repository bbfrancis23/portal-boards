import {Box, SimpleGrid, Text, useMantineTheme} from "@mantine/core"

import type {Token} from "../../theme/theme"

const Swatches = () => {
  const theme = useMantineTheme()
  const tokens = Object.entries(theme.other.colorTokens as Record<string, Token>)

  return (
    <SimpleGrid cols={{base: 2, lg: 4}}>
      {tokens.map(([name, token]) => (
        <div key={name}>
          <Box
            style={{
              height: "100px",
              borderRadius: "15px",
              border: `1px solid var(--pb-text-dim)`,
              background: `var(--pb-${name})`,
            }}></Box>
          <Text ff="monospace" ta="center">
            --pb-{name}
          </Text>
          <Text c="dimmed" ff="monospace" ta="center" size="sm">
            {token.use}
          </Text>
        </div>
      ))}
    </SimpleGrid>
  )
}

export default Swatches
