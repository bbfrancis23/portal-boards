import {AppShell} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {Outlet} from "react-router"

import AppHeader from "@/components/AppHeader/AppHeader"
import styles from "./AppLayout.module.css"

const AppLayout = () => {
  const [navbarOpened, navbar] = useDisclosure()
  const [asideOpened, aside] = useDisclosure()

  // On small screens the panels cover the page, so only one is open at a time.
  const toggleNavbar = () => {
    aside.close()
    navbar.toggle()
  }
  const toggleAside = () => {
    navbar.close()
    aside.toggle()
  }

  return (
    <AppShell
      withBorder={false}
      padding="xl"
      header={{height: 64}}
      navbar={{width: 260, breakpoint: "sm", collapsed: {mobile: !navbarOpened}}}
      aside={{width: 320, breakpoint: "md", collapsed: {mobile: !asideOpened}}}>
      <AppShell.Header className={styles.header}>
        <AppHeader
          navbarOpened={navbarOpened}
          onToggleNavbar={toggleNavbar}
          asideOpened={asideOpened}
          onToggleAside={toggleAside}
        />
      </AppShell.Header>

      <AppShell.Navbar p="md" className={styles.navbar} data-closed={!navbarOpened || undefined}>
        Navbar
      </AppShell.Navbar>

      <AppShell.Aside p="md" className={styles.aside} data-closed={!asideOpened || undefined}>
        Assistant
      </AppShell.Aside>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default AppLayout
