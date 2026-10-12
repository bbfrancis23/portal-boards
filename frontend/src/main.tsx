import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import "@mantine/charts/styles.css"
import "@fontsource-variable/quicksand"
import "@fontsource-variable/nunito"

import {createRoot} from "react-dom/client"
import {createBrowserRouter} from "react-router"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {MantineProvider} from "@mantine/core"
import {ModalsProvider} from "@mantine/modals"
import {Notifications} from "@mantine/notifications"
import {RouterProvider} from "react-router/dom"
import {StrictMode} from "react"

import App from "./App"
import {cssVariablesResolver, theme} from "./theme/theme"

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  ...(import.meta.env.DEV
    ? [
        {
          path: "/styleguide",
          lazy: async () => ({Component: (await import("./pages/Styleguide")).default}),
        },
      ]
    : []),
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider
      defaultColorScheme="light"
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}>
      <QueryClientProvider client={queryClient}>
        <Notifications />
        <ModalsProvider>
          <RouterProvider router={router} />
        </ModalsProvider>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
)
