import {
  ActionIcon,
  Badge,
  Button,
  Chip,
  type ButtonVariant,
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
  NumberInput,
  rem,
  SegmentedControl,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core"

import buttonClasses from "./Button.module.css"
import numberInputClasses from "./NumberInput.module.css"

// Let TypeScript (and autocomplete) know about our custom button variant.
declare module "@mantine/core" {
  export interface ButtonProps {
    variant?: ButtonVariant | "glow"
  }
}

// 10 shades each, lightest (0) to darkest (9).
const cyan: MantineColorsTuple = [
  "#E5FDFF",
  "#C2F9FF",
  "#95F4FF",
  "#62EFFF",
  "#22EEFF",
  "#00E5FF",
  "#00BCD1",
  "#0091A3",
  "#00707E",
  "#004F59",
]
const lime: MantineColorsTuple = [
  "#F6FFE6",
  "#EBFFC7",
  "#DCFF9E",
  "#CCFF75",
  "#C6FF5A",
  "#B8FF3C",
  "#8CCB1E",
  "#558E00",
  "#436F00",
  "#304F00",
]
const violet: MantineColorsTuple = [
  "#F4EEFF",
  "#E6D9FF",
  "#D2BAFF",
  "#BD9AFF",
  "#B28BFF",
  "#A77BFF",
  "#8F5EF0",
  "#7646D6",
  "#5C34AD",
  "#432581",
]
const coral: MantineColorsTuple = [
  "#FFEEF2",
  "#FFD6E0",
  "#FFB5C7",
  "#FF94AE",
  "#FF7FA0",
  "#FF6F91",
  "#F04E76",
  "#D2345E",
  "#A82449",
  "#7C1834",
]
const amber: MantineColorsTuple = [
  "#FFF8E6",
  "#FFEDC2",
  "#FFE09A",
  "#FFD272",
  "#FFC95E",
  "#FFC24B",
  "#F0A821",
  "#C98608",
  "#9C6605",
  "#704903",
]
const silver: MantineColorsTuple = [
  "#F7F9FB",
  "#EEF2F6",
  "#E4E9EF",
  "#D3DAE3",
  "#C5CED8",
  "#A9B4C1",
  "#8A97AB",
  "#6B788C",
  "#4F5A6B",
  "#3A4558",
]
const slate: MantineColorsTuple = [
  "#E7EEF7",
  "#C9D3E0",
  "#93A1B3",
  "#74839A",
  "#5A6878",
  "#3F4C5D",
  "#2C3846",
  "#1B2633",
  "#121A26",
  "#060A13",
]

// Clean Future tokens (docs/LOOK.md). Each becomes a CSS variable `--pb-<name>`
// with its light or dark value, via `cssVariablesResolver` below.
export type Token = {light: string; dark: string; use: string}

export const colorTokens: Record<string, Token> = {
  bg: {light: "#f6f8fb", dark: "#060a13", use: "Page background"},
  surface: {
    light: "rgba(255, 255, 255, 0.78)",
    dark: "rgba(16, 22, 36, 0.72)",
    use: "Widget cards",
  },
  glass: {
    light: "rgba(255, 255, 255, 0.55)",
    dark: "rgba(14, 20, 34, 0.55)",
    use: "Header, panels, modals",
  },
  silver: {light: "#e4e9ef", dark: "#1c2433", use: "Dividers, subtle fills"},
  chrome: {
    light: "linear-gradient(135deg, #ffffff, #c5ced8, #ffffff)",
    dark: "linear-gradient(135deg, #3a4558, #8a97ab, #3a4558)",
    use: "1px outlines",
  },
  text: {light: "#1b2633", dark: "#e7eef7", use: "Body text"},
  "text-dim": {light: "#5a6878", dark: "#93a1b3", use: "Secondary text, axes"},
  cyan: {light: "#00e5ff", dark: "#22eeff", use: "Primary accent, glows"},
  "cyan-line": {light: "#0091a3", dark: "#22eeff", use: "Cyan for lines and text"},
  lime: {light: "#b8ff3c", dark: "#c6ff5a", use: "Secondary accent, success"},
  "lime-line": {light: "#558e00", dark: "#c6ff5a", use: "Lime for lines and text"},
  rainbow: {
    light: "linear-gradient(90deg, #22eeff, #b8ff3c, #ffc24b, #ff6f91, #a77bff)",
    dark: "linear-gradient(90deg, #22eeff, #b8ff3c, #ffc24b, #ff6f91, #a77bff)",
    use: "Rare highlights only",
  },
  focus: {light: "#0091a3", dark: "#22eeff", use: "Keyboard focus ring"},
}

// Not colors (box-shadow values), so they aren't shown as swatches.
export const effectTokens: Record<string, Token> = {
  "glow-sm": {
    light: "0 0 0 1px rgba(0, 229, 255, 0.18), 0 6px 24px rgba(0, 180, 220, 0.1)",
    dark: "0 0 0 1px rgba(34, 238, 255, 0.25), 0 0 18px rgba(34, 238, 255, 0.25)",
    use: "Hover, focus",
  },
  "glow-md": {
    light: "0 0 0 1px rgba(0, 229, 255, 0.3), 0 10px 36px rgba(0, 180, 220, 0.18)",
    dark: "0 0 0 1px rgba(34, 238, 255, 0.4), 0 0 28px rgba(34, 238, 255, 0.35)",
    use: "Dragged widget",
  },
}

const tokenVariables = (scheme: "light" | "dark") =>
  Object.fromEntries(
    Object.entries({...colorTokens, ...effectTokens}).map(([name, token]) => [
      `--pb-${name}`,
      token[scheme],
    ]),
  )

// Filled components use a deep shade in light mode and a bright one in dark (see
// `primaryShade`), but Mantine picks their text color only once. `--pb-on-filled` sets it
// per mode instead: white text in light mode, dark text in dark mode.
const scales = {cyan, lime, violet, coral, amber, silver, slate}
const FILLED_SHADE = {light: 7, dark: 4} as const
const onFilledVariables = {light: {"--pb-on-filled": "#ffffff"}, dark: {"--pb-on-filled": slate[9]}}

// For filled Buttons and Badges in one of our colors (or the primary).
const filledTextColor = (color: string | undefined, variant: string | undefined) =>
  (variant === undefined || variant === "filled") && (color === undefined || color in scales)
    ? "var(--pb-on-filled)"
    : undefined

// Mantine's own page colors point at our tokens, so `c="dimmed"` etc. use them too.
const mantineVariables = {
  "--mantine-color-body": "var(--pb-bg)",
  "--mantine-color-text": "var(--pb-text)",
  "--mantine-color-dimmed": "var(--pb-text-dim)",
}

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {...tokenVariables("light"), ...onFilledVariables.light, ...mantineVariables},
  dark: {...tokenVariables("dark"), ...onFilledVariables.dark, ...mantineVariables},
})

export const theme = createTheme({
  fontFamily: '"Nunito Variable", system-ui, sans-serif',
  headings: {
    fontFamily: '"Quicksand Variable", "Nunito Variable", sans-serif',
    fontWeight: "400",
  },

  colors: scales,
  primaryColor: "cyan",
  primaryShade: FILLED_SHADE,
  // Filled components pick dark or white text automatically, for readable text on bright neon.
  autoContrast: true,

  radius: {xs: rem(8), sm: rem(12), md: rem(16), lg: rem(24), xl: rem(32)},
  defaultRadius: "lg",

  other: {colorTokens, effectTokens},

  // Controls are full pills (LOOK.md rule 2).
  components: {
    ActionIcon: ActionIcon.extend({defaultProps: {radius: "xl"}}),
    Badge: Badge.extend({
      defaultProps: {radius: "xl"},
      vars: (_theme, props) => {
        const color = filledTextColor(props.color, props.variant)
        return {root: color ? {"--badge-color": color} : {}}
      },
    }),
    Button: Button.extend({
      defaultProps: {radius: "xl"},
      classNames: {root: buttonClasses.root},
      vars: (_theme, props) => {
        const color = filledTextColor(props.color, props.variant)
        return {root: color ? {"--button-color": color} : {}}
      },
    }),
    Chip: Chip.extend({defaultProps: {radius: "xl"}}),
    NumberInput: NumberInput.extend({
      defaultProps: {radius: "xl", rightSectionWidth: rem(40)},
      classNames: {controls: numberInputClasses.controls, control: numberInputClasses.control},
    }),
    SegmentedControl: SegmentedControl.extend({defaultProps: {radius: "xl"}}),
    Select: Select.extend({defaultProps: {radius: "xl"}}),
    Textarea: Textarea.extend({defaultProps: {radius: "xl"}}),
    TextInput: TextInput.extend({defaultProps: {radius: "xl"}}),
  },
})
