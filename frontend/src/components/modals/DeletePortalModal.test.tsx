import {fireEvent, screen} from "@testing-library/react"
import {expect, test} from "vitest"

import {renderWithProviders} from "@/test/renderWithProviders"
import DeletePortalModal from "./DeletePortalModal"

const open = () =>
  renderWithProviders(
    <DeletePortalModal opened onClose={() => {}} portalId={1} portalName="Downtown Studio" />,
  )

const deleteButton = () => screen.getByRole("button", {name: "Delete portal"})
const confirmField = () => screen.getByLabelText('Type "Downtown Studio" to confirm')

test("the delete button starts disabled", async () => {
  open()
  expect(await screen.findByRole("button", {name: "Delete portal"})).toBeDisabled()
})

test("a name that doesn't match keeps it disabled", async () => {
  open()
  await screen.findByRole("dialog")
  fireEvent.change(confirmField(), {target: {value: "Downtown"}})
  expect(deleteButton()).toBeDisabled()
})

test("typing the exact name enables it", async () => {
  open()
  await screen.findByRole("dialog")
  fireEvent.change(confirmField(), {target: {value: "Downtown Studio"}})
  expect(deleteButton()).toBeEnabled()
})
