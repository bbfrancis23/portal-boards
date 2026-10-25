import {
  ActionIcon,
  Badge,
  Button,
  Chip,
  type ButtonVariant,
  createTheme,
  type CSSVariablesResolver,
  NumberInput,
  rem,
  SegmentedControl,
  Select,
  TableOfContents,
  Textarea,
  TextInput,
  Tooltip,
  Modal,
  NavLink,
  Drawer,
  Menu,
  Popover,
  Card,
} from "@mantine/core"

import buttonClasses from "./Button.module.css"
import modalClasses from "./Modal.module.css"
import numberInputClasses from "./NumberInput.module.css"
import tableOfContentsClasses from "./TableOfContents.module.css"
import glassClasses from "./glass.module.css"
import "./motion.css"
import {
  amber,
  colorTokens,
  coral,
  cyan,
  effectTokens,
  lime,
  silver,
  slate,
  tokenVariables,
  violet,
} from "./colors"

// Let TypeScript (and autocomplete) know about our custom button variant.
declare module "@mantine/core" {
  export interface ButtonProps {
    variant?: ButtonVariant | "glow"
  }
}

export const scales = {cyan, lime, violet, coral, amber, silver, slate}

// Text-style variants (subtle, outline, light), focus rings and links use `primaryShade`:
// a deep shade in light mode (readable on the pale page), a bright one in dark mode.
export const PRIMARY_SHADE = {light: 8, dark: 4} as const

// Filled Buttons and Badges are bright neon with dark text in BOTH modes (shade 4, hover 5).
export const FILLED_SHADE = 4
export const FILLED_HOVER_SHADE = 5
export const ON_FILLED_TEXT = slate[9]

// The CSS variables that make a filled Button or Badge in one of our colors bright with dark text.
const filledVars = (
  prefix: "button" | "badge",
  color: string | undefined,
  variant: string | undefined,
) => {
  const name = color ?? "cyan"
  if ((variant !== undefined && variant !== "filled") || !(name in scales)) return {}
  const vars: Record<string, string> = {
    [`--${prefix}-bg`]: `var(--mantine-color-${name}-${FILLED_SHADE})`,
    [`--${prefix}-color`]: ON_FILLED_TEXT,
  }
  if (prefix === "button")
    vars["--button-hover"] = `var(--mantine-color-${name}-${FILLED_HOVER_SHADE})`
  return vars
}

// Mantine's own page colors point at our tokens, so `c="dimmed"` etc. use them too.
const mantineVariables = {
  "--mantine-color-body": "var(--pb-bg)",
  "--mantine-color-text": "var(--pb-text)",
  "--mantine-color-dimmed": "var(--pb-text-dim)",
}

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {...tokenVariables("light"), ...mantineVariables},
  dark: {...tokenVariables("dark"), ...mantineVariables},
})

export const theme = createTheme({
  fontFamily: '"Nunito Variable", system-ui, sans-serif',
  headings: {
    fontFamily: '"Quicksand Variable", "Nunito Variable", sans-serif',
    fontWeight: "400",
  },

  colors: scales,
  primaryColor: "cyan",
  primaryShade: PRIMARY_SHADE,
  autoContrast: true,
  // Mantine's own transitions (modals, menus) respect the OS reduced-motion setting.
  respectReducedMotion: true,

  radius: {xs: rem(8), sm: rem(12), md: rem(16), lg: rem(24), xl: rem(32)},
  defaultRadius: "lg",

  // No drop shadows (LOOK.md): every shadow size is a soft cyan glow.
  shadows: {
    xs: "var(--pb-glow-xs)",
    sm: "var(--pb-glow-sm)",
    md: "var(--pb-glow-md)",
    lg: "var(--pb-glow-lg)",
    xl: "var(--pb-glow-xl)",
  },

  other: {colorTokens, effectTokens},

  // Controls are full pills (LOOK.md rule 2).
  components: {
    ActionIcon: ActionIcon.extend({defaultProps: {radius: "xl"}}),
    Badge: Badge.extend({
      defaultProps: {radius: "xl"},
      vars: (_theme, props) => {
        return {root: filledVars("badge", props.color, props.variant)}
      },
    }),
    Button: Button.extend({
      defaultProps: {radius: "xl"},
      classNames: {root: buttonClasses.root},
      vars: (_theme, props) => {
        return {root: filledVars("button", props.color, props.variant)}
      },
    }),
    // The surface look and chrome outline only: Mantine keeps control of padding and radius
    // (so the `padding` / `radius` props and Card.Section still work). Mantine's Card is
    // already position: relative, which the chrome outline needs.
    Card: Card.extend({
      defaultProps: {padding: "lg"},
      classNames: {root: glassClasses.surface},
    }),
    Chip: Chip.extend({defaultProps: {radius: "xl"}}),
    // Pill-shaped nav items (LOOK.md: controls are full pills), so the hover and active
    // highlight are rounded too. #82 adds the rainbow active bar on top.
    NavLink: NavLink.extend({styles: {root: {borderRadius: "var(--mantine-radius-xl)"}}}),
    NumberInput: NumberInput.extend({
      defaultProps: {radius: "xl", rightSectionWidth: rem(40)},
      classNames: {controls: numberInputClasses.controls, control: numberInputClasses.control},
    }),
    SegmentedControl: SegmentedControl.extend({defaultProps: {radius: "xl"}}),
    TableOfContents: TableOfContents.extend({
      classNames: {control: tableOfContentsClasses.control},
    }),
    Select: Select.extend({defaultProps: {radius: "xl"}}),
    Textarea: Textarea.extend({defaultProps: {radius: "xl"}}),
    TextInput: TextInput.extend({defaultProps: {radius: "xl"}}),
    Modal: Modal.extend({
      classNames: {
        content: `${glassClasses.glass} ${glassClasses.positioned}`,
        inner: modalClasses.inner,
      },
      defaultProps: {
        // The app's window never scrolls (only the content area does, see AppLayout.module.css),
        // so there's nothing to lock, and locking shifted the header and assistant panel.
        lockScroll: false,
        shadow: "lg",
        radius: "lg",
        overlayProps: {color: "var(--pb-silver)", backgroundOpacity: 0.3},
      },
    }),
    Drawer: Drawer.extend({
      classNames: {content: `${glassClasses.glass} ${glassClasses.positioned}`},
      defaultProps: {
        // The app's window never scrolls (only the content area does, see AppLayout.module.css),
        // so there's nothing to lock, and locking shifted the header and assistant panel.
        lockScroll: false,
        shadow: "lg",
        radius: "lg",
        overlayProps: {color: "var(--pb-silver)", backgroundOpacity: 0.3},
      },
    }),
    Menu: Menu.extend({
      classNames: {dropdown: glassClasses.glass},
      defaultProps: {shadow: "lg", radius: "lg"},
    }),
    Popover: Popover.extend({
      classNames: {dropdown: glassClasses.glass},
      defaultProps: {shadow: "lg", radius: "lg"},
    }),
    Tooltip: Tooltip.extend({
      classNames: {tooltip: `${glassClasses.glass} ${glassClasses.onGlass}`},
      defaultProps: {radius: "lg"},
    }),
  },
})
