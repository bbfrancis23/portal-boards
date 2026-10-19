# Plan: portal-boards — Python/FastAPI successor to compass-boards

## Context
`compass-boards` (`C:\Users\18018\Desktop\compass-boards`, public repo `bbfrancis23/compass-boards`, branch `master` @ `1ff0cb0`) is a Next.js 16 / React 19 dashboard-boards app: Mantine 9 + `@mantine/charts`, react-grid-layout v2, Drizzle on SQLite/Turso, Auth.js (GitHub), and an off-by-flag Claude "advice" widget. The user wants the same product with a **Python backend instead of Next.js**, reusing compass-boards' frontend pieces and widget architecture.

`C:\Users\18018\Desktop\portal-boards` is empty. Target: a new **public** repo `bbfrancis23/portal-boards` (gh CLI authenticated), with a Vite + React SPA, a FastAPI backend, Turso in production on Vercel, GitHub + Google login, and Claude features: a streaming assistant, board summary/advice, and an agent that edits boards via tool use.

**Visual design** follows the **"Clean Future"** look plan ([LOOK.md](LOOK.md)). The Mantine theme, tokens and fonts were built early, in #43 and #44, so the styleguide runs on the real theme; milestone 8 applies the look to the real screens (app shell, widgets, motion). Compass's earthy theme, parchment shell and landing page are **not** reused.

**Product direction (updated in #57, before the first migration):** users own **portals**, and a portal is a collection of boards. A **template** is a bundle for one business type (boards, widgets, layouts, sample data and AI personas), defined in code and **copied** into a new portal; from then on the portal is the user's own and every change is saved. The first and only template is a **wellness studio**. compass's financial and fitness boards are not carried over, but its widget engine is. Anyone can try a fully working wellness studio portal **without signing in**. See [Templates, personas and demo](#templates-personas-and-demo).

## Stack
| Layer | Choice |
|---|---|
| Frontend | Vite + **React 19** + TypeScript (React Compiler via `babel-plugin-react-compiler`, as in compass), TanStack Query, React Router |
| UI | **Mantine 9.5** (`@mantine/core`, `form`, `hooks`, `notifications`, `modals`), `@tabler/icons-react`, `postcss-preset-mantine` (reuse compass `postcss.config.mjs`) |
| Charts / grid | `@mantine/charts` + `recharts` 3; **react-grid-layout v2** (`ResponsiveGridLayout`, `useContainerWidth`, `dragConfig`) + `react-resizable` (same versions as compass) |
| API client | `openapi-typescript` + `openapi-fetch` generated from FastAPI `/openapi.json` |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 typed models (sync; switched from SQLModel in #74), Pydantic `BaseModel` API schemas, Alembic, `sqlalchemy-libsql` (prod/Linux only), Authlib + PyJWT + `itsdangerous`, `slowapi` |
| Database | Local/tests: SQLite file via stdlib driver (works on Windows). Prod: **Turso** via `sqlite+libsql://…?secure=true` + auth token |
| AI | `anthropic` SDK, `AsyncAnthropic`, `claude-sonnet-5-5` (configurable `CLAUDE_MODEL`), adaptive thinking, SSE |
| Hosting | Vercel: Vite build plus FastAPI as a Python Function under `/api/*` (same origin) |
| Tooling | `uv`, ruff, pytest; pnpm, eslint, vitest; root `pnpm dev` (`concurrently`); GitHub Actions; no Docker |

**Risk:** `sqlalchemy-libsql` is experimental, Linux/macOS only, and sync only. Mitigation: dependency marker `sys_platform != 'win32'`; CI runs tests on both SQLite and libSQL; plain SQLAlchemy code allows a fallback to Neon Postgres.

## Reuse from compass-boards (copy files, fresh history; first commit notes source `compass-boards@1ff0cb0`)
**Copy as-is → `frontend/src/`**
- `lib/widget-types.ts`, `lib/board-types.ts` (drop `buildAdvicePrompt` from the TS type; prompts move to Python personas), `lib/widget-registry.ts`, `lib/widget-shell.tsx`, `lib/widget-data-bus.tsx`
- `widgets/advice.ts` registration. The `widgets/financial/**` and `widgets/fitness/**` registrations are **not** copied; they serve as reference for the generic widgets in M5.
- `postcss.config.mjs` (done in #3)
- *Not copied:* `boards/*.board.ts` and `boards/index.ts` (financial/fitness board configs). Board configs now come from backend templates.

**Port with small edits (server actions → TanStack Query + fetch)**
- `lib/dashboard-canvas.tsx` (`updateWidgetLayout` → `PATCH` mutation), `lib/form-widget.tsx` (`addWidgetData` → `POST`), `lib/line-chart-widget.tsx`, `lib/advice-widget.tsx`, `lib/use-widget-data.ts`, `lib/use-board-advice.ts`
- `app/(app)/board-nav.tsx` (`next/link` → react-router `Link`)
- `app/layout.tsx` provider setup → `main.tsx`; `app/register-widgets.tsx` → plain imports in `main.tsx`

**Rewrite in Python → `backend/app/`**
- `db/schema.ts` (Drizzle) → SQLAlchemy 2.0 models (`app/models.py`)
- `lib/board-queries.ts`, `widget-queries.ts`, `widget-data-queries.ts`, `widget-actions.ts`, `widget-data-actions.ts`, `advice-actions.ts` → services + FastAPI routers
- `lib/demo-seed.ts` + `db/seed.ts` → `app/templates/` (the wellness studio template and its sample-data generator; compass's seeding approach is the reference, its financial/fitness data is not reused)
- `boards/*.board.ts` `buildAdvicePrompt` → per-template persona prompts in `app/ai/personas.py`
- `lib/require-session.ts` + Auth.js → `get_current_user` dependency

**Not reused (replaced by the Clean Future look):** `lib/theme.ts`, `app/(app)/layout.tsx` (parchment shell), `app/(marketing)/**` (landing page, hero demo, CSS modules), compass fonts, `public/compass-parchment-background.png`.

**Drop:** `suppress-color-scheme-script-warning.tsx`, `test-grid/`, `server-only`, Next/Auth.js/Drizzle config.

## Data model (compass model, extended)
```
User ──< Portal ──< Board ──< WidgetInstance ──< WidgetData
                      └──< Conversation ──< Message
```
- **User**: id, email (unique, **nullable** for guests), display_name, avatar_url, **is_guest**, **expires_at** (guests only), created_at *(new; compass had none and keyed boards by GitHub id)*
- **OAuthAccount**: user_id, provider (`github`|`google`), provider_account_id; unique (provider, provider_account_id)
- **Portal** *(new)*: id, owner_id → User, name, **template_id** (`wellness-studio`|null; renamed from `template` in #74), created_at. No uniqueness on template: a user may create several portals from the same template.
- **Board**: id, **portal_id** → Portal, label, **position** (order within the portal), **persona_id** (the board's AI persona; null = the portal template's default), created_at. Replaces compass's per-user `domain` boards; boards are addressed by **id**.
- **WidgetInstance**: id, board_id, type, x, y, w, h, config (JSON), created_at (same as compass; layout stored per widget, so a user's rearrangement is saved)
- **WidgetData**: id, widget_instance_id, data (JSON row), created_at (same as compass)
- **Conversation / Message**: per-board chat history; full `response.content` blocks as JSON, replayed append-only *(new)*

All foreign keys use `ON DELETE CASCADE` (SQLite `foreign_keys=ON`), so deleting a user, portal, board or widget removes everything beneath it. Constraint names follow a SQLAlchemy naming convention so later SQLite batch migrations can address them.

**Widget types (registry-based)**
**Live queries (decided in #6):** only **input** widgets (`table`, `schedule`) hold `WidgetData` rows. **Output** widgets (`chart`, `stat`) hold no rows: their config has a `source` query over an input widget, evaluated client-side when rendered, so new rows update every chart and stat through the data bus. The query vocabulary: `widget` (the source widget), `aggregate` (`count`|`sum`|`avg`), `field`, `groupBy`, `seriesBy`, `dateField`, `bucket` (`week`|`month`), `period` (`this_week`|`this_month`|`last_8_weeks`|`last_6_months`), `where` (`{field: value}`). In a template, `source.widget` is a template-local widget key, resolved to the real widget id when the portal is created.
- **chart**: generalizes compass's `line-chart-widget`: `{title, chartType: line|bar|area|pie, stacked?, source}`.
- **stat**: a single value with an optional delta (`compare: previous_period`) and sparkline: `{title, format, compare?, source}` (renamed from "metric").
- **table**: `data-table` input widget (generic rows, CSV paste).
- **schedule** *(new)*: a week view of classes and appointments: days as columns, time slots as rows, entries as blocks. Rows live in its own `WidgetData` (`{title, start, end, kind, ...}`).
- **form**: compass's `form-widget` and **advice** stay available.
- Backend Pydantic schemas per widget type validate config for both the API and agent tools.

Every query is scoped to the current user through `Portal.owner_id` (compass's "widget belongs to board" check is kept, extended to "board belongs to portal belongs to user"). Sync `def` endpoints; async AI endpoints do DB work via `run_in_threadpool`.

## API (FastAPI, all under `/api`, all require a session except auth, demo and template-list routes)
| Route | Replaces compass |
|---|---|
| `GET /templates` → available templates (id, name, description, persona name/avatar) | new |
| `GET /portals`, `POST /portals` `{name, template_id?}` (copies the template's boards, widgets and sample data), `PATCH/DELETE /portals/{id}` | `getBoardWidgets` auto-provision |
| `GET /portals/{id}/boards`, `POST /portals/{id}/boards`, `PATCH/DELETE /boards/{id}` | new (compass had fixed domain boards) |
| `POST /demo` → creates a guest user and a wellness studio portal, sets the session cookie | new |
| `GET /boards/{id}/widgets` | `getBoardWidgets` |
| `POST /boards/{id}/widgets`, `PATCH/DELETE /widgets/{wid}` | new (`WidgetShell.onRemove` gets wired) |
| `PATCH /boards/{id}/layout` `[{id,x,y,w,h}]` | `updateWidgetLayout` |
| `GET/POST /boards/{id}/widgets/{wid}/data` | `getWidgetData` / `addWidgetData` |
| `POST /boards/{id}/advice` (SSE) | `getBoardAdvice` |
| `POST /boards/{id}/chat` (SSE; `agent: bool`) | new |
| `GET /auth/{provider}/login`, `GET /auth/{provider}/callback`, `POST /auth/logout`, `GET /users/me` | Auth.js |

## Authentication (GitHub + Google, no passwords)
- Authlib Starlette OAuth clients: `github` (scope `read:user user:email`, primary **verified** email from `user/emails`) and `google` (OIDC metadata, `openid email profile`, requires `email_verified`). `SessionMiddleware` holds OAuth state only.
- The callback upserts OAuthAccount + User (link by verified email) and sets a PyJWT HS256 cookie `pb_session` (`sub`=user id, 7d, httpOnly, Secure in prod, SameSite=Lax). `get_current_user` → 401 otherwise. `slowapi` on auth routes.
- Frontend: sign-in page with GitHub/Google links to `/api/auth/{provider}/login` (replaces compass's server-action `signIn`); `useCurrentUser()`, `<RequireAuth>` (replaces `boards/layout.tsx` guard); user menu calls `POST /api/auth/logout` (replaces the server component `user-menu.tsx`). Vite proxy `/api` → `:8000`.
- Manual setup: GitHub OAuth App (new, or reuse compass's app after adding portal callback URLs) + Google OAuth client; callbacks for `localhost:5173` and the Vercel domain.
- **Guest sessions (public demo):** `POST /api/demo` creates a `User` with `is_guest=true` and `expires_at` = now + 24h, and issues the same `pb_session` cookie, so the demo uses the real app. `get_current_user` rejects expired guests. Expired guests are deleted (cascading to their portals) lazily on new demo creation and by a scheduled cleanup. `POST /demo` is rate-limited per IP, and AI calls are capped per guest (`DEMO_AI_MESSAGE_LIMIT`). Later: signing in with GitHub/Google during a guest session converts the guest into a real account, keeping the portal.

## Claude integration (`backend/app/ai`)
Shared: `AsyncAnthropic()`, `model=settings.CLAUDE_MODEL` (default `claude-sonnet-5-5`), `thinking={"type":"adaptive"}`, explicit `output_config.effort` per feature. Sonnet 5.5 rules: no `thinking: disabled`, no forced `tool_choice`, no prefill. Server-side refusal fallback (`server-side-fallback-2026-07-01`, `fallbacks="default"`; Python form verified at implementation); check `stop_reason`. Typed SDK errors → HTTP errors. `cache_control` on the stable system prompt + tools. `ADVICE_ENABLED`-style flag → `AI_ENABLED` env setting.

**Personas (per board, decided in #6):** each **board's** assistant is a persona (`app/ai/personas.py`); templates assign one per board, plus a default for the portal (stored as `Board.persona_id`, null = the default). A persona has a **name**, an **avatar** (frontend asset keyed by persona id), a **personality** (tone of voice) and **expertise** (domain knowledge in the system prompt, plus the set of agent tools it may use, and its effort level). One shared agent loop loads the **current board's** persona; boards in portals without a template get a general-purpose persona. Each persona's system prompt is kept stable so it is prompt-cached. Users can't edit personas yet (a later column + migration could allow a custom name or instructions).
1. **Advice / summary** (port of compass `getBoardAdvice`): gather all widget data → the board persona's advice prompt (replaces the ported `buildAdvicePrompt`) → stream to the existing advice widget. Effort `low`.
2. **Assistant chat**: streaming Q&A about the board's data. Effort `low`.
3. **Board agent**: `client.beta.messages.tool_runner(stream=True)` with `@beta_async_tool(eager_input_streaming=True)` tools `list_widgets`, `get_widget_data`, `add_widget(type, config, x?, y?, w?, h?)`, `update_widget`, `remove_widget`, `move_widget`, `add_data_rows` (filtered to the persona's allowed tools). Effort from the persona (default `medium`), `tool_choice` auto. Per-request closures scope to user/board; Pydantic validation; mutations recorded for **Undo**; capped iterations (within Vercel function limits); SSE `text` / `tool_call` / `board_updated` events → the frontend invalidates queries and the data bus refreshes charts.

## Frontend (neutral shell until the look plan)
- `main.tsx`: `MantineProvider` with the Clean Future theme and `cssVariablesResolver` from `theme/theme.ts`, `Notifications`, `ModalsProvider`, QueryClient, router, widget registration imports.
- Routes: `/` (landing with **Try the demo** and sign in), `/signin`, `/demo` (calls `POST /api/demo`, then opens the guest portal), `/portals` (list + "New portal": blank or from a template), `/portals/:portalId` (redirects to its first board), `/portals/:portalId/boards/:boardId` (canvas + assistant panel).
- Portal shell: board list for the current portal as navigation (create, rename, reorder, delete boards), portal switcher, guest banner during the demo ("Demo: expires in N hours, sign in to keep it").
- Board page: ported `DashboardCanvas` (RGL v2, `dragConfig.handle=".widget-drag-handle"`, debounced layout save) + `WidgetShell` (+ remove and edit actions now wired) + "Add widget" modal (pick a registered type, configure).
- Assistant panel: the board persona's name and avatar, chat, "Agent mode" switch, streaming render, tool-call badges, "Applied N changes — Undo" notification.

## Templates, personas and demo
- **Template** (`backend/app/templates/<id>.py`, registered in `app/templates/__init__.py`): id, name, description, default portal name, a default persona id, and the portal's boards (each with an optional persona id), each with its widgets (type, layout, config) and a **sample-data generator**. Sample data is generated relative to today, so the demo always looks current. Widgets reference each other (a chart's `source.widget`) by template-local keys that are resolved to real ids when copied. Templates live in **code**, not the database: the sample data is a function of today's date, and templates are reviewed, versioned and tested like the rest of the code (user-made templates could be stored in the database later).
- **Copy-on-create:** `POST /portals {template_id}` calls `create_portal(...)`, which copies the template into new rows in one transaction. **Sample data is only copied for the demo** (`with_sample_data=True`); real owners get the structure with empty tables (the default, `with_sample_data=False`). After that the portal belongs to the user; template changes never alter existing portals, and user changes never alter the template.
- **Wellness studio** (first template, #6): **Atrium Spa and Wellness**, about 100 members, 30 classes a week (Yoga, Pilates, Upper body toning, Lower body toning), memberships (Monthly unlimited, 10-class pack, Drop-in), and spa services priced per service with 15% off for monthly members.

  | Board | Persona | Widgets |
  |---|---|---|
  | Overview | `studio-manager` (default) | stats: active members, revenue this month (vs previous), classes this week, spa bookings this week; weekly attendance chart |
  | Schedule | `secretary` | schedule (week view of classes and appointments); average attendance by class type |
  | Members | `yoga-instructor` | members table; membership mix pie chart |
  | Revenue | `accountant` | revenue by month stacked by revenue stream; spa revenue this month; sales table |
- **Demo:** `/demo` → guest user + wellness studio portal (see *Authentication*); fully interactive, private to that visitor, expires after 24 hours.

## Repo layout
```
portal-boards/
  backend/app/ main.py config.py db.py models.py schemas.py auth.py
               routers/ (auth, demo, templates, portals, boards, widgets, data, ai)  services/
               templates/ (wellness_studio, …)  ai/ (client, personas, prompts, tools, service)
  backend/ alembic/ tests/ pyproject.toml
  api/index.py                     # Vercel entry → backend app
  frontend/src/ lib/ widgets/ api/ pages/ assets/personas/ main.tsx   # lib/widgets mirror compass paths
  vercel.json  requirements.txt (uv export)  package.json (root dev script)
  .github/workflows/ ci.yml migrate.yml
  .env.example  .gitignore  LICENSE (MIT)  README.md
```

## Step 0 (first execution step): GitHub setup, then STOP for review
No app code is written in this step.
1. `git init` in `portal-boards`; commit `README.md` (short project intro + link to docs), `docs/PLAN.md` (this plan minus the look section), `docs/LOOK.md` (Clean Future look plan), `.gitignore`, MIT `LICENSE`, `.env.example`.
2. `gh repo create bbfrancis23/portal-boards --public --source . --push` (default branch `main`); enable secret scanning + push protection (`gh api` repo security settings) and Dependabot.
3. **Labels** (`gh label create`): `backend`, `frontend`, `ai`, `auth`, `infra`, `design`, `port-from-compass`, `bug`, `enhancement`.
4. **Milestones** (`gh api repos/.../milestones`): M1 Bootstrap · M2 Backend core · M3 Auth · M4 Frontend port · M5 Extensions · M6 Claude · M7 CI + deploy · M8 Look & feel.
5. **Issues** (`gh issue create` with body from a template: Summary, Tasks checklist, Files (incl. compass source paths for ports), Acceptance criteria, link to the `docs/` section). Draft list (as created in Step 0; several were revised for portals, templates and the demo in #57, so the issues themselves are the current source):
   - **M1:** Monorepo skeleton + root dev script · Backend scaffold (uv, FastAPI, ruff, pytest) · Frontend scaffold (Vite, React 19, Mantine 9, React Compiler, eslint, vitest)
   - **M2:** Config + DB engine (SQLite/libSQL switch) · SQLModel models + Alembic initial migration · Port demo seed + template auto-provision · Boards router · Widgets + layout router · Widget data router · Owner-scoping tests
   - **M3:** Authlib GitHub OAuth · Authlib Google OAuth · JWT cookie session + `get_current_user` · Link accounts by verified email · Auth tests · Rate limiting
   - **M4:** Generated API client · Copy compass registry/types/shell/data bus · Port widget registrations + board configs · Port DashboardCanvas · Port FormWidget / LineChartWidget / AdviceWidget + hooks · Sign-in page + RequireAuth + user menu · Board nav + routes · Parity check vs compass
   - **M5:** Custom boards (create/rename/delete) · Add/edit/remove widget UI · Generic `chart` widget (line/bar/area/pie) · `metric` widget · `data-table` input widget · Backend widget config schemas
   - **M6:** Anthropic client + settings + error mapping · Port advice prompts + streaming advice endpoint · Assistant chat (SSE) + panel · Conversation persistence · Board agent tools · Agent loop + SSE events · Undo for agent changes · AI tests with mocked client
   - **M7:** CI workflow (SQLite + libSQL matrix, frontend checks) · Turso DB + migrate workflow · Vercel project + `vercel.json` + env vars · Production OAuth callbacks + smoke test
   - **M8:** `/styleguide` page · Theme + tokens + fonts · Glass, background, chrome outline · AppShell floating panels + logo · Widget + chart restyle · Motion + RGL styling · Contrast/perf/browser verification
6. **Project** "portal-boards roadmap" (`gh project create --owner bbfrancis23`; needs `gh auth refresh -s project` first, which opens a browser to approve the extra scope): add all issues, a Status field (Todo / In progress / Done), a **Board** view by Status and a **Roadmap/Table** view grouped by Milestone; enable the built-in workflow that auto-adds new repo issues.
7. Report the repo, project and milestone links, then **stop** for review before M1 coding.

**Workflow afterwards** (as in compass-boards): branch `<issue#>-short-name` → PR with `Closes #N` → merge to `main`.

## Build order
Since 2026-10-18 the roadmap is organized **by feature**: each milestone mixes backend and frontend work, backend first. Milestone names carry no numbers, so this list is the order:

1. **Bootstrap** (done): monorepo skeleton, backend and frontend scaffolds, root dev script.
2. **Backend core** (done): config, models (with portals), Alembic, wellness studio template + create-portal-from-template, template/portal/board/widget/data routers + tests. The styleguide, theme, ambient background and app shell were also built early (#43–#46).
3. **Log in**: JWT cookie session and `get_current_user`, GitHub and Google OAuth, account linking, rate limiting, auth tests, owner-scoping tests; then the typed API client and the log-in page, RequireAuth and user menu.
4. **Deploy**: Turso DB + migrate workflow, Vercel project + env vars + `vercel.json`, production OAuth callbacks and smoke test.
5. **Portals and boards**: default portal (backend); portal and board nav and routes, the Portals page (create, rename, delete, make default), navbar board links look.
6. **Board canvas**: port compass's widget engine (registry, data bus, registrations, DashboardCanvas, Form/LineChart/Advice widgets), parity check, widget restyle, motion and grid styling.
7. **Widget types**: widget config schemas (backend); add/edit/remove widget UI, stat, chart, data table and schedule widgets.
8. **Settings**: the settings page (account, appearance, delete account) and the navbar settings link. Portals have their own page, not settings.
9. **Demo**: public demo with guest sessions, and the landing page.
10. **AI assistant**: Anthropic client, personas per board, advice, assistant chat and panel, conversation persistence, agent tools and loop, undo, AI tests.
11. **Polish**: contrast, performance and browser verification.

## Verification
- `uv run pytest`: CRUD + owner scoping (user → portal → board → widget), create-portal-from-template copies every board, widget and data row with references resolved, cascading deletes, guest expiry, auth flows with mocked Authlib, AI tools with a mocked Anthropic client. CI repeats on `sqlite+libsql:///test.db`.
- `pnpm test && pnpm build`; CI green.
- **Engine parity check vs compass-boards** (run both locally): entering data in an input widget refreshes the linked chart via the data bus; drag/resize persists after reload; advice produces output.
- **Demo:** in a private window, `/demo` opens a populated wellness studio portal without signing in; add a class to the schedule, rearrange widgets and chat with the persona; changes persist on reload and are invisible to another visitor's demo; the guest expires after 24 hours.
- New features: create a portal from the wellness studio template and a blank portal; create a custom board → agent: "add a data table of monthly revenue and a bar chart of it" → widgets appear live → Undo reverts; sign in with Google using the same email → same portals.
- Production: run `migrate.yml`, repeat the smoke test on the Vercel URL. `git ls-files | grep .env` shows only `.env.example`.

