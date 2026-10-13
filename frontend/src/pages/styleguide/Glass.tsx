import {SimpleGrid, Text, Title} from "@mantine/core"

import AmbientBackground from "@/theme/AmbientBackground"
import glass from "@/theme/glass.module.css"

const Glass = () => {
  return (
    <AmbientBackground style={{borderRadius: "var(--mantine-radius-lg)", minHeight: 320}}>
      {/* A crisp stripe behind the cards, so you can see the blur difference. */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          height: 6,
          background: "var(--pb-rainbow)",
        }}
      />
      <SimpleGrid cols={{base: 1, sm: 2}} p="xl" spacing="xl">
        <div className={glass.glassPanel}>
          <Title order={4}>Glass panel</Title>
          <Text size="sm" c="dimmed">
            Header, side panels, modals. Blurs what's behind it.
          </Text>
        </div>
        <div className={glass.glassCard}>
          <Title order={4}>Surface card</Title>
          <Text size="sm" c="dimmed">
            Widgets. No blur, so dragging stays smooth.
          </Text>
        </div>
      </SimpleGrid>
    </AmbientBackground>
  )
}

export default Glass
