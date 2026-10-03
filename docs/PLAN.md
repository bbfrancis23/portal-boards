# Plan: portal-boards — Python/FastAPI successor to compass-boards

## Context
`compass-boards` (`C:\Users\18018\Desktop\compass-boards`, public repo `bbfrancis23/compass-boards`, branch `master` @ `1ff0cb0`) is a Next.js 16 / React 19 dashboard-boards app: Mantine 9 + `@mantine/charts`, react-grid-layout v2, Drizzle on SQLite/Turso, Auth.js (GitHub), and an off-by-flag Claude "advice" widget. The user wants the same product with a **Python backend instead of Next.js**, reusing compass-boards' frontend pieces and widget architecture.

`C:\Users\18018\Desktop\portal-boards` is empty. Target: a new **public** repo `bbfrancis23/portal-boards` (gh CLI authenticated), with a Vite + React SPA, a FastAPI backend, Turso in production on Vercel, GitHub + Google login, and Claude features: a streaming assistant, board summary/advice, and an agent that edits boards via tool use.

**Visual design** follows the **"Clean Future"** look plan ([LOOK.md](LOOK.md)). Milestones 1–7 use a plain Mantine shell; milestone 8 applies the look. Compass's earthy theme, parchment shell and landing page are **not** reused.

## Stack
| Layer | Choice |
|---|---|
| Frontend | Vite + **React 19** + TypeScript (React Compiler via `babel-plugin-react-compiler`, as in compass), TanStack Query, React Router |
| UI | **Mantine 9.5** (`@mantine/core`, `form`, `hooks`, `notifications`, `modals`), `@tabler/icons-react`, `postcss-preset-mantine` (reuse compass `postcss.config.mjs`) |
| Charts / grid | `@mantine/charts` + `recharts` 3; **react-grid-layout v2** (`ResponsiveGridLayout`, `useContainerWidth`, `dragConfig`) + `react-resizable` (same versions as compass) |
| API client | `openapi-typescript` + `openapi-fetch` generated from FastAPI `/openapi.json` |
| Backend | Python 3.12, FastAPI, SQLModel (sync), Alembic, `sqlalchemy-libsql` (prod/Linux only), Authlib + PyJWT + `itsdangerous`, `slowapi` |
| Database | Local/tests: SQLite file via stdlib driver (works on Windows). Prod: **Turso** via `sqlite+libsql://…?secure=true` + auth token |
| AI | `anthropic` SDK, `AsyncAnthropic`, `claude-sonnet-5-5` (configurable `CLAUDE_MODEL`), adaptive thinking, SSE |
| Hosting | Vercel: Vite build plus FastAPI as a Python Function under `/api/*` (same origin) |
| Tooling | `uv`, ruff, pytest; pnpm, eslint, vitest; root `pnpm dev` (`concurrently`); GitHub Actions; no Docker |

**Risk:** `sqlalchemy-libsql` is experimental, Linux/macOS only, and sync only. Mitigation: dependency marker `sys_platform != 'win32'`; CI runs tests on both SQLite and libSQL; plain SQLAlchemy code allows a fallback to Neon Postgres.

## Reuse from compass-boards (copy files, fresh history; first commit notes source `compass-boards@1ff0cb0`)
**Copy as-is → `frontend/src/`**
- `lib/widget-types.ts`, `lib/board-types.ts` (drop `buildAdvicePrompt` from the TS type; it moves to Python), `lib/widget-registry.ts`, `lib/widget-shell.tsx`, `lib/widget-data-bus.tsx`
- `widgets/**` registrations (financial, fitness, advice)
- `boards/*.board.ts`, `boards/index.ts` (widget layouts/config only)
- `postcss.config.mjs`

**Port with small edits (server actions → TanStack Query + fetch)**
- `lib/dashboard-canvas.tsx` (`updateWidgetLayout` → `PATCH` mutation), `lib/form-widget.tsx` (`addWidgetData` → `POST`), `lib/line-chart-widget.tsx`, `lib/advice-widget.tsx`, `lib/use-widget-data.ts`, `lib/use-board-advice.ts`
- `app/(app)/board-nav.tsx` (`next/link` → react-router `Link`)
- `app/layout.tsx` provider setup → `main.tsx`; `app/register-widgets.tsx` → plain imports in `main.tsx`

**Rewrite in Python → `backend/app/`**
- `db/schema.ts` (Drizzle) → SQLModel models
- `lib/board-queries.ts`, `widget-queries.ts`, `widget-data-queries.ts`, `widget-actions.ts`, `widget-data-actions.ts`, `advice-actions.ts` → services + FastAPI routers
- `lib/demo-seed.ts` + `db/seed.ts` → `app/seed.py` (auto-provision demo data on first board visit, keeping compass's unique-index race handling)
- `boards/*.board.ts` `buildAdvicePrompt` → `app/ai/prompts.py`
- `lib/require-session.ts` + Auth.js → `get_current_user` dependency

**Not reused (replaced by the Clean Future look):** `lib/theme.ts`, `app/(app)/layout.tsx` (parchment shell), `app/(marketing)/**` (landing page, hero demo, CSS modules), compass fonts, `public/compass-parchment-background.png`.

**Drop:** `suppress-color-scheme-script-warning.tsx`, `test-grid/`, `server-only`, Next/Auth.js/Drizzle config.

## Data model (compass model, extended)
- **User**: id, email (unique), display_name, avatar_url, created_at *(new; compass had none and keyed boards by GitHub id)*
- **OAuthAccount**: user_id, provider (`github`|`google`), provider_account_id; unique (provider, provider_account_id)
- **Board**: id, owner_id, label, **template** (`financial`|`fitness`|null; replaces compass's `domain`), created_at. Unique (owner_id, template) when template is set, so each user gets one auto-seeded board per template. *New:* user-created custom boards (template null), so boards are addressed by **id**, not domain slug.
- **WidgetInstance**: id, board_id, type, x, y, w, h, config (JSON), created_at (same as compass; layout stored per widget)
- **WidgetData**: id, widget_instance_id, data (JSON row), created_at (same as compass)
- **Conversation / Message**: per-board chat history; full `response.content` blocks as JSON, replayed append-only *(new)*

**Widget extensions (new, registry-based)**
- Generalize `line-chart-widget` → `chart` widget: `config.chartType` `line|bar|area|pie`, keeping compass's `{title, dataKey, series[], sourceWidgetId?}`. Reads rows from `sourceWidgetId` (an input widget) or its own `WidgetData`.
- `metric` widget (single value/delta from a source widget's latest row).
- `data-table` input widget (generic rows, CSV paste) so custom boards can hold data without a domain form.
- Backend Pydantic schemas per widget type validate config for both the API and agent tools.

Every query is scoped by `owner_id` (compass's "widget belongs to board" check is kept). Sync `def` endpoints; async AI endpoints do DB work via `run_in_threadpool`.

## API (FastAPI, all under `/api`, all require auth except auth routes)
| Route | Replaces compass |
|---|---|
| `GET /boards`, `POST /boards`, `PATCH/DELETE /boards/{id}` | new (compass had fixed domain boards) |
| `GET /boards/template/{template}` → get-or-seed the user's template board | `getBoardWidgets` auto-provision |
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

## Claude integration (`backend/app/ai`)
Shared: `AsyncAnthropic()`, `model=settings.CLAUDE_MODEL` (default `claude-sonnet-5-5`), `thinking={"type":"adaptive"}`, explicit `output_config.effort` per feature. Sonnet 5.5 rules: no `thinking: disabled`, no forced `tool_choice`, no prefill. Server-side refusal fallback (`server-side-fallback-2026-07-01`, `fallbacks="default"`; Python form verified at implementation); check `stop_reason`. Typed SDK errors → HTTP errors. `cache_control` on the stable system prompt + tools. `ADVICE_ENABLED`-style flag → `AI_ENABLED` env setting.
1. **Advice / summary** (port of compass `getBoardAdvice`): gather all widget data → template-specific prompt (ported `buildAdvicePrompt`) or a generic prompt for custom boards → stream to the existing advice widget. Effort `low`.
2. **Assistant chat**: streaming Q&A about the board's data. Effort `low`.
3. **Board agent**: `client.beta.messages.tool_runner(stream=True)` with `@beta_async_tool(eager_input_streaming=True)` tools `list_widgets`, `get_widget_data`, `add_widget(type, config, x?, y?, w?, h?)`, `update_widget`, `remove_widget`, `move_widget`, `add_data_rows`. Effort `medium`, `tool_choice` auto. Per-request closures scope to user/board; Pydantic validation; mutations recorded for **Undo**; capped iterations (within Vercel function limits); SSE `text` / `tool_call` / `board_updated` events → the frontend invalidates queries and the data bus refreshes charts.

## Frontend (neutral shell until the look plan)
- `main.tsx`: `MantineProvider` (default theme placeholder), `Notifications`, `ModalsProvider`, QueryClient, router, widget registration imports.
- Routes: `/signin`, `/boards` (list + create), `/boards/:id` (canvas + assistant panel), `/boards/template/:template`.
- Board page: ported `DashboardCanvas` (RGL v2, `dragConfig.handle=".widget-drag-handle"`, debounced layout save) + `WidgetShell` (+ remove and edit actions now wired) + "Add widget" modal (pick a registered type, configure).
- Assistant panel: chat, "Agent mode" switch, streaming render, tool-call badges, "Applied N changes — Undo" notification.

## Repo layout
```
portal-boards/
  backend/app/ main.py config.py db.py models.py schemas.py auth.py seed.py
               routers/ (auth, boards, widgets, data, ai)  services/  ai/ (client, prompts, tools, service)
  backend/ alembic/ tests/ pyproject.toml
  api/index.py                     # Vercel entry → backend app
  frontend/src/ lib/ widgets/ boards/ api/ pages/ main.tsx   # lib/widgets/boards mirror compass paths
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
5. **Issues** (`gh issue create` with body from a template: Summary, Tasks checklist, Files (incl. compass source paths for ports), Acceptance criteria, link to the `docs/` section). Draft list:
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
1. **Bootstrap** (repo already created in Step 0): monorepo skeleton, backend and frontend scaffolds, root dev script.
2. **Backend core**: config, models, Alembic, seed port, board/widget/data routers + tests.
3. **Auth**: Authlib GitHub/Google + JWT cookie + tests.
4. **Frontend port**: Vite + Mantine 9 + React Compiler, copy/port compass files, generated client, sign-in, board list, template boards working end-to-end (parity with compass).
5. **Extensions**: custom boards, add/remove/edit widgets, generic chart/metric/data-table widgets.
6. **Claude**: advice port, assistant chat, board agent + undo.
7. **CI + deploy**: `ci.yml`, Turso DB + token, `migrate.yml` (Linux, `alembic upgrade head`), Vercel project + env vars + `vercel.json` (wiring checked against current Vercel FastAPI docs), production OAuth callbacks.
8. **Look & feel**: build the `/styleguide` page first (it doubles as the mockup to review), then the theme, tokens, glass, background and motion, then apply them across the app (see the Clean Future look plan).

## Verification
- `uv run pytest`: CRUD + owner scoping, template auto-seed (including concurrent first visit), widget-belongs-to-board checks, auth flows with mocked Authlib, AI tools with a mocked Anthropic client. CI repeats on `sqlite+libsql:///test.db`.
- `pnpm test && pnpm build`; CI green.
- **Parity check vs compass-boards** (run both locally): financial and fitness boards seed the same demo widgets/data; entering a transaction/workout refreshes the linked chart via the data bus; drag/resize persists after reload; advice produces output.
- New features: create a custom board → agent: "add a data table of monthly revenue and a bar chart of it" → widgets appear live → Undo reverts; sign in with Google using the same email → same boards.
- Production: run `migrate.yml`, repeat the smoke test on the Vercel URL. `git ls-files | grep .env` shows only `.env.example`.

