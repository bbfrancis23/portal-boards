import {ActionIcon, useComputedColorScheme, useMantineColorScheme} from "@mantine/core"
import {IconMoon, IconBrightness2 as IconSun} from "@tabler/icons-react"

const LiteDarkModeToggle = () => {
  const {toggleColorScheme} = useMantineColorScheme()
  const colorScheme = useComputedColorScheme("light")

  return (
    <ActionIcon
      variant="subtle"
      onClick={() => toggleColorScheme()}
      aria-label="Toggle Lite and Nite mode"
      aria-pressed={colorScheme === "dark"}>
      {colorScheme === "light" ? <IconSun size={26} /> : <IconMoon size={20} />}
    </ActionIcon>
  )
}

export default LiteDarkModeToggle
