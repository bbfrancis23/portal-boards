import {Button, Center, Paper, Stack, Title} from "@mantine/core"
import {IconBrandGithub, IconBrandGoogle} from "@tabler/icons-react"
import {Navigate} from "react-router"

import {useCurrentUser} from "@/hooks/useCurrentUser"
import glass from "@/theme/glass.module.css"

const LogIn = () => {
  const {data: user} = useCurrentUser()

  // Already logged in: nothing to do here, go straight to the app.
  if (user) return <Navigate to="/portals" replace />

  return (
    <Center pt={64}>
      {/* Paper, not Card: the theme gives every Card the .surface background, which would
          override the glass one. */}
      <Paper className={glass.glassPanel} w="100%" maw={380} p="xl">
        <Stack align="center">
          <Title order={2}>Log in to your portals</Title>
          <Stack w="100%" gap="sm" mt="sm">
            <Button
              component="a"
              href="/api/auth/github/login"
              variant="glow"
              fullWidth
              leftSection={<IconBrandGithub size={18} />}>
              Continue with GitHub
            </Button>
            <Button
              component="a"
              href="/api/auth/google/login"
              variant="glow"
              fullWidth
              leftSection={<IconBrandGoogle size={18} />}>
              Continue with Google
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Center>
  )
}

export default LogIn
