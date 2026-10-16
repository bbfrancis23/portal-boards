import {
  Indicator,
  SimpleGrid,
  Text,
  Tooltip,
  useComputedColorScheme,
  useMantineTheme,
} from "@mantine/core"
import {IconStarFilled} from "@tabler/icons-react"

const ColorScales = () => {
  const theme = useMantineTheme()
  const computedColorScheme = useComputedColorScheme()
  const primaryShade =
    typeof theme.primaryShade === "number"
      ? theme.primaryShade
      : theme.primaryShade[computedColorScheme]

  return (
    <SimpleGrid cols={10}>
      {Object.entries(theme.colors).map(([colorName, colorScale]) =>
        colorScale.map((hex, shadeIndex) => (
          <div key={`${colorName}-${shadeIndex}`}>
            <Tooltip label="Primary shade" disabled={shadeIndex !== primaryShade}>
              <Indicator
                disabled={shadeIndex !== primaryShade}
                label={<IconStarFilled size={10} aria-label="Primary shade" />}
                size={18}
                offset={4}
                color="var(--pb-bg)"
                styles={{
                  indicator: {color: "var(--pb-text)", border: "1px solid var(--pb-silver)"},
                }}>
                <div
                  style={{
                    height: "50px",
                    borderRadius: "15px",
                    background: hex,
                  }}></div>
              </Indicator>
            </Tooltip>
            <div style={{textAlign: "center"}}>
              <Text size="xs" ff="monospace">
                {colorName}-{shadeIndex}
              </Text>
            </div>
          </div>
        )),
      )}
    </SimpleGrid>
  )
}

export default ColorScales
