import {MantineProvider} from "@mantine/core"
import {render, screen} from "@testing-library/react"
import {expect, test} from "vitest"

import App from "./App"

test("renders the Mantine button", () => {
  render(
    <MantineProvider>
      <App />
    </MantineProvider>,
  )

  expect(screen.getByRole("button", {name: "Hello Mantine"})).toBeInTheDocument()
})
