import "@testing-library/jest-dom/vitest"

import {cleanup} from "@testing-library/react"
import {afterEach} from "vitest"

// Unmount rendered components after each test so tests don't affect each other
afterEach(() => {
  cleanup()
})

// jsdom doesn't implement these browser APIs, but Mantine uses them
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver
