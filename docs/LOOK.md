# Look plan: "Clean Future"

**Concept:** a clean, futuristic interface that's barely there. White and pale-silver glass surfaces float over a soft pastel background, edges are very rounded, thin chrome outlines and soft glows replace shadows, and neon (cyan, lime, a rare rainbow) is reserved for **data and highlights**. A dark **"Night"** mode uses the same tokens, and there the neon actually glows.

**Rules that keep it usable (from the design review):**
1. Neon is for lines, fills, glows and chart series, **never body text**. Text is dark slate (light mode) or near-white (dark mode).
2. Widgets get a **large radius**, not a full pill, so charts aren't clipped. **Controls are full pills.**
3. Real `backdrop-filter` blur only on chrome (header, side panels, modals, menus). Widget cards use semi-opaque white with **no blur**, to keep dragging smooth.
4. Thin, rounded type for headings and display numbers only. Body text is normal weight, and numbers use tabular figures.
5. The dragged widget follows the cursor exactly. The **reflow** of other widgets gets the slow glide.
6. Cutout shapes for icons, empty states and the logo, never chart frames.
7. Respect `prefers-reduced-motion`. Text meets WCAG AA (4.5:1) and chart lines and controls meet ≥3:1 against their surface.

## Design tokens (`frontend/src/theme/tokens.css`, CSS variables per color scheme)
| Token | Light | Night (dark) | Use |
|---|---|---|---|
| `--pb-bg` | `#F6F8FB` | `#060A13` | page base under the pastel background |
| `--pb-surface` | `rgba(255,255,255,.78)` | `rgba(16,22,36,.72)` | widget cards (no blur) |
| `--pb-glass` | `rgba(255,255,255,.55)` + blur 20px | `rgba(14,20,34,.55)` + blur 20px | header, navbar, aside, modals, menus |
| `--pb-silver` | `#E4E9EF` | `#1C2433` | dividers, subtle fills, skeletons |
| `--pb-chrome` | gradient `#FFFFFF → #C5CED8 → #FFFFFF` | `#3A4558 → #8A97AB → #3A4558` | 1px outlines on cards and panels |
| `--pb-text` | `#1B2633` | `#E7EEF7` | body text |
| `--pb-text-dim` | `#5A6878` | `#93A1B3` | secondary text, axes |
| `--pb-cyan` | `#00E5FF` glow / `#0091A3` lines and text-safe | `#22EEFF` | primary accent |
| `--pb-lime` | `#B8FF3C` glow / `#558E00` lines | `#C6FF5A` | secondary accent, success |
| `--pb-rainbow` | `linear-gradient(90deg,#22EEFF,#B8FF3C,#FFC24B,#FF6F91,#A77BFF)` | same | **sparingly**: active nav indicator, logo underline, agent "working" bar |
| `--pb-glow-sm/md` | `0 0 0 1px rgba(0,229,255,.18), 0 6px 24px rgba(0,180,220,.10)` | stronger cyan, `0 0 18px rgba(34,238,255,.35)` | hover, focus, dragged widget |
| `--pb-focus` | 2px solid `#0091A3`, 2px offset | 2px solid `#22EEFF` | keyboard focus (accessible, not rainbow) |

Exact values are tuned on the styleguide page with a contrast checker. The line/text-safe variants exist because pure neon cyan and lime fail contrast on white.

## Mantine theme (`frontend/src/theme/theme.ts`, Mantine 9 `createTheme`)
- `colors`: custom 10-shade ramps `cyan` (neon), `lime`, `violet`, `coral`, `amber`, `silver`, `slate`; `primaryColor: "cyan"`, `primaryShade: { light: 7, dark: 4 }` (darker shade on white for contrast).
- `defaultRadius: "lg"`; radius scale `xs 8, sm 12, md 16, lg 24, xl 32`.
- `fontFamily: "Nunito, system-ui, sans-serif"`; `headings: { fontFamily: "Quicksand, Nunito, sans-serif", fontWeight: "400" }`; `fontFamilyMonospace` for code only.
- `shadows`: replace drop shadows with the glow tokens (xs–xl = increasingly soft cyan halos).
- `components` defaults:
  - **Pills:** `Button`, `TextInput`/`NumberInput`/`Select`/`Textarea`, `Badge`, `SegmentedControl`, `Tabs` (pills variant), `NavLink`, `ActionIcon`, `Chip` → `radius: "xl"` (pill at their heights).
  - **Cards:** `Card`/`Paper` → `radius: "lg"`, a `glass-card` class (surface + chrome outline), no shadow.
  - **Glass chrome:** `Modal`, `Menu`, `Popover`, `Tooltip`, `Drawer` → glass background + blur + chrome outline, `radius: "lg"`.
  - `Button` variants: `filled` = solid cyan.7 with white text (primary actions); custom `glow` variant = transparent + chrome outline + cyan glow on hover (secondary actions).
- `cssVariablesResolver` maps the `--pb-*` tokens per color scheme, so CSS modules use the same values.

## Fonts
- `@fontsource-variable/quicksand` (headings and display) and `@fontsource-variable/nunito` (body/UI), self-hosted so there are no external font requests.
- Headings use Quicksand at 300–500 weight with slight letter spacing. Body uses Nunito 400/600 at 14–16px. Charts and tables use `font-variant-numeric: tabular-nums`.
- **Neon-tube style** (`.pb-neon` class), for the **logo and big metric numbers only**: `color: transparent; -webkit-text-stroke: 1.25px var(--pb-cyan); text-shadow: 0 0 6px …, 0 0 18px …`. In light mode the glow is subtle and the stroke uses the text-safe cyan. Night mode glows fully. Fallback: solid text when `-webkit-text-stroke` isn't supported.

## Surfaces & depth
- **Background** (`<AmbientBackground/>`, fixed behind the app): three large blurred radial blobs (pale cyan, pale lime, pale lilac) on `--pb-bg`, static by default. An optional very slow drift (60s loop) is off under reduced motion. Night mode uses deep neon tints at low opacity. This is what makes the glass visible.
- **Chrome outline:** 1px gradient border via a pseudo-element with `mask` (works with border-radius), in `glass.module.css` (`.glassCard`, `.glassPanel`).
- **Glass fallback:** `@supports not (backdrop-filter: blur(1px))` → more opaque surfaces. Include `-webkit-backdrop-filter` for Safari.
- **Elevation:** no drop shadows. Hover adds `--pb-glow-sm`, the dragged widget gets `--pb-glow-md`, and modals get a soft glow plus a silver backdrop overlay at 30%.

## Layout shell
- Mantine `AppShell` with **floating panels**: header, navbar and aside are inset 12px from the edges with `radius: xl` glass, so no panel touches a hard edge.
- **Header:** neon-outline "portal" wordmark (the "o" is a circular portal-ring cutout), a rainbow underline on hover, the color-scheme toggle (sun/moon pill `SegmentedControl`), and the avatar menu.
- **Navbar:** board list as pill `NavLink`s; the active board gets a thin rainbow indicator bar and a cyan glow; "+ New board" is a `glow` button.
- **Aside:** the assistant panel as a glass column. Messages are rounded bubbles, the input is a pill, and while the agent works a thin rainbow progress bar shimmers (static under reduced motion).
- **Main:** the board canvas, with generous gutters (16–20px) and white space.

## Widgets (`WidgetShell` restyle)
- `glassCard` (surface, chrome outline, `radius: lg`). The title bar is the drag handle: Quicksand title, a small circular cutout icon chip, and a ⋯ menu.
- The **metric** widget shows a big `.pb-neon` number, a delta badge (lime up / coral down, pill), and an optional sparkline.
- Empty-state widgets show a geometric SVG composition (a circle plus a triangle outline with a gradient stroke) and one line of dim text.
- Input/form widgets have pill inputs and a cyan filled submit pill.

## Charts (`frontend/src/theme/chart-palette.ts`, `@mantine/charts`)
- Series order: **cyan, violet, lime, coral, amber, slate**. Light mode uses the line-safe shades (≥3:1 on white); night mode uses bright neon. Distinguishable for common color blindness, with markers or dash patterns as a second cue when more than three series share a chart.
- Defaults: `curveType="monotone"` (smooth curves fit the rounded style), `strokeWidth={2}`, dots off (active dot on hover), `gridAxis="y"` with a very faint silver dashed grid, `AreaChart` gradient fills from series color at 25% to 0%.
- Tooltips use glass with a chrome outline and tabular numbers. Legends are pill chips.
- Rainbow gradient only for the single highlighted series or a "goal" line. Optional SVG glow filter on lines in night mode, if profiling shows no drag jank.
- Charts sit inside a padded inner frame, never clipped by the card radius.

## Motion (`frontend/src/theme/motion.css`)
- Easing token `--pb-ease: cubic-bezier(.22,.8,.24,1)`; durations `--pb-dur-fast 150ms`, `--pb-dur 300ms`, `--pb-dur-slow 450ms`.
- **react-grid-layout:** `.react-grid-item { transition: transform var(--pb-dur) var(--pb-ease), width var(--pb-dur) var(--pb-ease), height var(--pb-dur) var(--pb-ease); }`. While dragging or resizing (`.react-draggable-dragging`, `.resizing`): `transition: none` (follows the cursor 1:1) plus a slight lift (`scale(1.01)`, `--pb-glow-md`). The placeholder is a rounded dashed cyan outline with a soft glow, not RGL's default red/grey block.
- Drop: the widget settles with a 300ms glide and the glow fades out. The agent's `board_updated` changes animate the same way, so AI edits visibly glide into place.
- Hover: 150ms glow fade. Modals and menus: Mantine `transition="pop"` at 200ms.
- `@media (prefers-reduced-motion: reduce)`: all transitions ≤1ms, no background drift, no shimmer.

## Iconography & geometric cutouts
- `@tabler/icons-react` at stroke 1.5 (thin lines match the type), placed in **circle** (default) or **triangle** (alerts and AI) chips made with `clip-path`, filled with a silver or pale-neon tint.
- The logo, empty states and the 404/sign-in illustrations use circle/triangle cutout compositions with gradient strokes. Sign-in page: a centered glass card over the ambient background, with pill "Continue with GitHub/Google" buttons.

## Files
`frontend/src/theme/`: `theme.ts`, `tokens.css`, `glass.module.css`, `motion.css`, `chart-palette.ts`, `AmbientBackground.tsx`, `NeonText.tsx`, `CutoutIcon.tsx`, `EmptyState.tsx`. `frontend/src/pages/Styleguide.tsx` (dev-only route `/styleguide`).

## Look verification
- **`/styleguide` page** (built first; it's the mockup to review): every color token, type scale, buttons/inputs/badges, glass panels, a sample board with each widget type and a multi-series chart, the empty state, and a modal, with a light/night toggle and a reduced-motion toggle.
- **Contrast:** axe DevTools / Lighthouse accessibility audit on styleguide and board pages (AA text). A small vitest checks key token pairs (text on surface ≥4.5:1, chart lines on surface ≥3:1).
- **Performance:** Chrome Performance panel while dragging on a board with 12 widgets in both modes. Target is a steady ~60fps with no long frames from blur or glow. If it falls short, drop the night-mode SVG glow first, then reduce blur radius.
- **Browsers:** Chrome, Edge, Firefox and Safari (backdrop-filter fallback, text-stroke fallback).
- **Reduced motion:** with the OS setting on, there are no transitions, drift or shimmer.
