import {AppShell} from "@mantine/core"
import {Outlet} from "react-router"

import AppHeader from "@/components/AppHeader/AppHeader"
import styles from "./AppLayout.module.css"

// Pages outside a portal (sign-in, and later the landing page): the header only.
const PublicLayout = () => {
  return (
    <AppShell withBorder={false} padding="xl" header={{height: 64}}>
      <AppShell.Header className={styles.header}>
        <AppHeader />
      </AppShell.Header>

      <AppShell.Main className={styles.main}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default PublicLayout
