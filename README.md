# portal-boards

AI-assisted dashboard boards. A Python/FastAPI successor to [compass-boards](https://github.com/bbfrancis23/compass-boards).

Users sign in with GitHub or Google and build boards of input, chart and metric widgets they can drag and resize. Claude is built in: it streams answers about a board's data, summarizes boards, and runs as an agent that can add, edit and rearrange widgets.

> **Status:** planning. Work is tracked in [issues](https://github.com/bbfrancis23/portal-boards/issues) and [milestones](https://github.com/bbfrancis23/portal-boards/milestones).

## Stack

- **Frontend:** Vite, React 19, TypeScript, Mantine 9, `@mantine/charts`, react-grid-layout v2, TanStack Query
- **Backend:** Python 3.12, FastAPI, SQLModel, Alembic, Authlib (GitHub and Google OAuth)
- **Database:** SQLite locally, [Turso](https://turso.tech) (libSQL) in production
- **AI:** [Claude API](https://docs.anthropic.com) through the official `anthropic` Python SDK
- **Hosting:** Vercel

## Docs

- [Project plan](docs/PLAN.md): architecture, data model, API, auth, Claude integration, build order
- [Look plan](docs/LOOK.md): the "Clean Future" visual design

## Workflow

Each task is a GitHub issue under a milestone. Branch as `<issue#>-short-name`, open a PR with `Closes #<issue#>`, and merge to `main`.

## License

[MIT](LICENSE)
