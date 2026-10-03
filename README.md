# portal-boards

AI-assisted dashboard boards. A Python/FastAPI successor to [compass-boards](https://github.com/bbfrancis23/compass-boards).

Users sign in with GitHub or Google and build boards of input, chart and metric widgets they can drag and resize. Claude is built in: it streams answers about a board's data, summarizes boards, and runs as an agent that can add, edit and rearrange widgets.

> **Status:** early development (M1 Bootstrap). Work is tracked in [issues](https://github.com/bbfrancis23/portal-boards/issues) and [milestones](https://github.com/bbfrancis23/portal-boards/milestones).

## Stack

- **Frontend:** Vite, React 19, TypeScript, Mantine 9, `@mantine/charts`, react-grid-layout v2, TanStack Query
- **Backend:** Python 3.12, FastAPI, SQLModel, Alembic, Authlib (GitHub and Google OAuth)
- **Database:** SQLite locally, [Turso](https://turso.tech) (libSQL) in production
- **AI:** [Claude API](https://docs.anthropic.com) through the official `anthropic` Python SDK
- **Hosting:** Vercel

## Docs

- [Project plan](docs/PLAN.md): architecture, data model, API, auth, Claude integration, build order
- [Look plan](docs/LOOK.md): the "Clean Future" visual design

## Local development

### Prerequisites

- [Git](https://git-scm.com)
- [Node.js](https://nodejs.org) 22 or newer
- [pnpm](https://pnpm.io) (the version pinned in `package.json` → `packageManager`)
- [uv](https://docs.astral.sh/uv/) for Python. uv downloads Python 3.12 itself, so no separate Python install is needed.
  - Windows: `winget install --id=astral-sh.uv -e`
  - macOS / Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`

### Setup

```sh
git clone https://github.com/bbfrancis23/portal-boards.git
cd portal-boards
pnpm install                  # root tooling and frontend (pnpm workspace)
cp .env.example backend/.env  # Windows PowerShell: Copy-Item .env.example backend\.env
```

Fill in `backend/.env` (see the comments in `.env.example`). The backend's Python environment is created automatically by `uv` on first run.

### Run

```sh
pnpm dev
```

This starts both servers with `concurrently`:

| Output prefix | Server | URL |
|---|---|---|
| `[api]` | FastAPI (`uv run fastapi dev`), auto-reloads | http://localhost:8000 (docs at `/docs`) |
| `[web]` | Vite dev server | http://localhost:5173 |

Open http://localhost:5173. Vite forwards `/api` requests to the backend.

> **Conda users:** if your terminal shows `(base)`, conda's Python is active. That's fine, because `uv run` always uses the project's `backend/.venv`, but don't install backend packages with `pip`. Use `uv add` in `backend/`.

## Workflow

Each task is a GitHub issue under a milestone. Branch as `<issue#>-short-name`, open a PR with `Closes #<issue#>`, and merge to `main`.

## License

[MIT](LICENSE)
