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

import AmbientBackground from "./theme/AmbientBackground"
import {cssVariablesResolver, theme} from "./theme/theme"
import AppLayout from "./App/Layout/AppLayout"
import PublicLayout from "./App/Layout/PublicLayout"
import App from "./App/App"
import LogIn from "./App/LogIn"

const queryClient = new QueryClient()

const router = createBrowserRouter([
  // Pages outside a portal (home, log in): a layout route with no path of its own, so it only
  // wraps them. App is a placeholder until the landing page is built.
  {
    element: <PublicLayout />,
    children: [
      {index: true, element: <App />},
      {path: "log-in", element: <LogIn />},
    ],
  },
  // Portal pages (#23 adds :portalId/boards/:boardId). App is a placeholder for now.
  {
    path: "portals",
    element: <AppLayout />,
    children: [{index: true, element: <App />}],
  },
  ...(import.meta.env.DEV
    ? [
        {
          path: "/styleguide",
          lazy: async () => ({Component: (await import("./App/StyleGuide/Styleguide")).default}),
        },

        {
          path: "/styleguide/sample-board",
          lazy: async () => ({
            Component: (await import("./App/StyleGuide/SampleBoard/SampleBoard")).default,
          }),
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
      <AmbientBackground fixed />
      <QueryClientProvider client={queryClient}>
        <Notifications />
        <ModalsProvider>
          <RouterProvider router={router} />
        </ModalsProvider>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
)
