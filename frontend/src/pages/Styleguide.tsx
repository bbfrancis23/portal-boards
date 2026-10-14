import {
  Anchor,
  Container,
  Grid,
  SegmentedControl,
  Stack,
  Switch,
  TableOfContents,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core"
import {useReducedMotion} from "@mantine/hooks"
import {useEffect, useState} from "react"
import {Link} from "react-router"

import Section from "./styleguide/Section"
import Swatches from "./styleguide/Swatches"
import TypeScale from "./styleguide/TypeScale"
import Controls from "./styleguide/Controls"
import ColorScales from "./styleguide/ColorScales"
import Glass from "./styleguide/Glass"
import Shadows from "./styleguide/Shadows"
import Overlays from "./styleguide/Overlays"
import EmptyStates from "./styleguide/EmptyStates"

const Styleguide = () => {
  const {colorScheme, setColorScheme} = useMantineColorScheme()
  const systemReducedMotion = useReducedMotion()
  const [reduceMotion, setReduceMotion] = useState(false)
  const motionReduced = reduceMotion || systemReducedMotion

  // The switch turns motion off app-wide via a data attribute (see theme/motion.css).
  useEffect(() => {
    const root = document.documentElement
    if (reduceMotion) root.setAttribute("data-reduced-motion", "")
    else root.removeAttribute("data-reduced-motion")
    return () => root.removeAttribute("data-reduced-motion")
  }, [reduceMotion])

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
            <Section label="Empty state">
              <EmptyStates />
            </Section>
            <Section label="Sample board">
              <Text c="dimmed">
                Every widget type together on Atrium's Overview board, full width.
              </Text>
              <Anchor component={Link} to="/styleguide/sample-board">
                Open the sample board →
              </Anchor>
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
            <Switch
              mt="sm"
              label="Reduce motion"
              description={
                systemReducedMotion
                  ? "On in your system settings"
                  : "Our animations only; dialogs and menus follow your system setting"
              }
              checked={motionReduced}
              disabled={systemReducedMotion}
              onChange={(event) => setReduceMotion(event.currentTarget.checked)}
            />
            <Text mt="md">Contents</Text>
            <TableOfContents
              scrollSpyOptions={{selector: "[data-toc]"}}
              variant="light"
              getControlProps={({data}) => ({
                onClick: () =>
                  data.getNode().scrollIntoView({behavior: motionReduced ? "auto" : "smooth"}),
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
