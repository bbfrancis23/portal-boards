import {
  Container,
  Grid,
  SegmentedControl,
  Stack,
  TableOfContents,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core"
import Section from "./styleguide/Section"
import Swatches from "./styleguide/Swatches"
import TypeScale from "./styleguide/TypeScale"
import Controls from "./styleguide/Controls"
import ColorScales from "./styleguide/ColorScales"
import Glass from "./styleguide/Glass"
import Shadows from "./styleguide/Shadows"
import Overlays from "./styleguide/Overlays"

const Styleguide = () => {
  const {colorScheme, setColorScheme} = useMantineColorScheme()

  return (
    <Container size="lg" py="xl">
      <Grid>
        <Grid.Col span={{base: 12, sm: 9}}>
          <Stack gap="xs">
            <Title order={1}>Styleguide</Title>
            <Text c="dimmed">The Clean Future look, piece by piece.</Text>
            <Section label="Swatches">
              <Swatches />
            </Section>
            <Section label="Color Scales">
              <ColorScales />
            </Section>
            <Section label="Type Scale">
              <TypeScale />
            </Section>
            <Section label="Controls">
              <Controls />
            </Section>
            <Section label="Glass">
              <Glass />
            </Section>
            <Section label="Shadows">
              <Shadows />
            </Section>
            <Section label="Overlays">
              <Overlays />
            </Section>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{sm: 3}} visibleFrom="sm">
          <div style={{position: "sticky", top: "var(--mantine-spacing-xl)"}}>
            <SegmentedControl
              data={[
                {label: "Lite", value: "light"},
                {label: "Nite", value: "dark"},
              ]}
              onChange={(value) => setColorScheme(value)}
              value={colorScheme}
            />
            <Text>Contents</Text>
            <TableOfContents
              scrollSpyOptions={{selector: "[data-toc]"}}
              variant="light"
              getControlProps={({data}) => ({
                onClick: () => data.getNode().scrollIntoView({behavior: "smooth"}),
                children: data.value,
              })}
            />
          </div>
        </Grid.Col>
      </Grid>
    </Container>
  )
}

export default Styleguide
