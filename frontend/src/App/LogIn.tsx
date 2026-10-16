import {Button, Center, Paper, Stack, Title} from "@mantine/core"
import {IconBrandGithub, IconBrandGoogle} from "@tabler/icons-react"

import glass from "@/theme/glass.module.css"

// The log-in card (LOOK.md: glass over the ambient background, pill provider buttons).
// The buttons go nowhere yet; #22 links them to /api/auth/{provider}/login.
const LogIn = () => {
  return (
    <Center pt={64}>
      {/* Paper, not Card: the theme gives every Card the .surface background, which would
          override the glass one. */}
      <Paper className={glass.glassPanel} w="100%" maw={380} p="xl">
        <Stack align="center">
          <Title order={2}>Log in to your portals</Title>
          <Stack w="100%" gap="sm" mt="sm">
            <Button variant="glow" fullWidth leftSection={<IconBrandGithub size={18} />}>
              Continue with GitHub
            </Button>
            <Button variant="glow" fullWidth leftSection={<IconBrandGoogle size={18} />}>
              Continue with Google
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Center>
  )
}

export default LogIn
