import {renderHook} from "@testing-library/react"
import type {ReactNode} from "react"
import {MemoryRouter, Route, Routes} from "react-router"
import {expect, test} from "vitest"

import {useNumberIds} from "./useNumberIds"

// Renders the hook on `url`, under the same routes the app uses.
const idsAt = (url: string) => {
  const wrapper = ({children}: {children: ReactNode}) => (
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/portals" element={children} />
        <Route path="/portals/:portalId" element={children} />
        <Route path="/portals/:portalId/boards/:boardId" element={children} />
      </Routes>
    </MemoryRouter>
  )
  return renderHook(() => useNumberIds(), {wrapper}).result.current
}

test("turns the URL's ids into numbers", () => {
  expect(idsAt("/portals/3/boards/7")).toEqual({portalId: 3, boardId: 7})
})

test("an id that isn't in the URL is undefined", () => {
  const ids = idsAt("/portals/3")
  expect(ids.portalId).toBe(3)
  expect(ids.boardId).toBeUndefined()
})

test("no ids on the portal list", () => {
  expect(idsAt("/portals")).toEqual({})
})
