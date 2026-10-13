import {describe, expect, it} from "vitest"

import {colorTokens} from "./colors"
import {FILLED_HOVER_SHADE, FILLED_SHADE, ON_FILLED_TEXT, PRIMARY_SHADE, scales} from "./theme"

// WCAG relative luminance and contrast ratio for #rrggbb colors.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: string, b: string) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

const AA_TEXT = 4.5 // normal text
const AA_UI = 3 // lines, focus rings, controls

const modes = ["light", "dark"] as const

// Slate is a neutral for text and backgrounds, not an accent or fill color.
const accentScales = Object.entries(scales).filter(([name]) => name !== "slate")

describe.each(modes)("%s mode", (mode) => {
  const page = colorTokens.bg[mode]

  it.each(["text", "text-dim", "cyan-line", "lime-line"])(
    "--pb-%s is readable on the page",
    (name) => {
      expect(contrast(colorTokens[name][mode], page)).toBeGreaterThanOrEqual(AA_TEXT)
    },
  )

  it("the focus ring stands out from the page", () => {
    expect(contrast(colorTokens.focus[mode], page)).toBeGreaterThanOrEqual(AA_UI)
  })

  it.each(accentScales)(
    "text-style %s (subtle, outline) is readable on the page",
    (_name, scale) => {
      expect(contrast(scale[PRIMARY_SHADE[mode]], page)).toBeGreaterThanOrEqual(AA_TEXT)
    },
  )
})

describe("filled buttons and badges (both modes)", () => {
  it.each(accentScales)("dark text is readable on filled %s, and on hover", (_name, scale) => {
    expect(contrast(ON_FILLED_TEXT, scale[FILLED_SHADE])).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrast(ON_FILLED_TEXT, scale[FILLED_HOVER_SHADE])).toBeGreaterThanOrEqual(AA_TEXT)
  })
})
