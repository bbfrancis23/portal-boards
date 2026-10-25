import {fireEvent, screen} from "@testing-library/react"
import {expect, test} from "vitest"

import {renderWithProviders} from "@/test/renderWithProviders"
import NewBoardModal from "./NewBoardModal"

test("a one-letter name is rejected before anything is sent", async () => {
  renderWithProviders(<NewBoardModal opened onClose={() => {}} portalId={1} />)

  fireEvent.change(await screen.findByLabelText("Name"), {target: {value: "A"}})
  fireEvent.click(screen.getByRole("button", {name: "Create dashboard"}))

  expect(await screen.findByText("Must be at least 2 characters")).toBeInTheDocument()
})
