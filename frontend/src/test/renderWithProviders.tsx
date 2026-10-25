import {MantineProvider} from "@mantine/core"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {render} from "@testing-library/react"
import type {ReactElement} from "react"
import {MemoryRouter} from "react-router"

import {theme} from "@/theme/theme"

// Renders a component with what the app normally wraps it in: the Mantine theme, a fresh
// TanStack Query client (no retries, so failures show at once) and a router.
export const renderWithProviders = (ui: ReactElement) => {
  const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}})
  return render(
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>,
  )
}
