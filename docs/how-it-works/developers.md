# How it works: developers

The programmer's view of portal-boards. See [PLAN.md](../PLAN.md) for the full architecture and decisions.

## 1. System architecture
One Vercel project serves two services from the same origin: the Vite SPA and the FastAPI backend. Locally, Vite proxies `/api` to `127.0.0.1:8000`.

```mermaid
flowchart LR
    Browser["Browser<br/>React 19 SPA<br/>Mantine · TanStack Query"]

    subgraph Vercel["Vercel (region pdx1)"]
        Rewrites{"rewrites"}
        Frontend["frontend service<br/>Vite build"]
        Backend["backend service<br/>FastAPI app.main:app"]
    end

    subgraph Data["Database"]
        SQLite[("SQLite<br/>local and tests")]
        Turso[("Turso / libSQL<br/>production")]
    end

    GitHub["GitHub OAuth"]
    Google["Google OAuth"]
    Claude["Claude API<br/>(planned)"]

    Browser --> Rewrites
    Rewrites -- "/(.*)" --> Frontend
    Rewrites -- "/api/(.*)" --> Backend
    Backend -- "SQLAlchemy 2.0" --> SQLite
    Backend -- "sqlite+libsql" --> Turso
    Backend <-- "Authlib" --> GitHub
    Backend <-- "Authlib" --> Google
    Backend -.-> Claude

    classDef planned stroke-dasharray: 5 5
    class Claude planned
```

## 2. Request lifecycle
Every call goes through the typed openapi-fetch client, which sends the `pb_session` cookie. Every query is scoped to the current user through `Portal.owner_id`, and anything the user doesn't own returns 404.

```mermaid
sequenceDiagram
    autonumber
    participant C as React component
    participant H as TanStack Query hook
    participant A as api client (openapi-fetch)
    participant R as FastAPI router
    participant U as get_current_user
    participant O as get_owned_board
    participant DB as Database

    C->>H: useWidgets(boardId)
    H->>A: api.GET("/api/boards/{board_id}/widgets")
    A->>R: HTTP + pb_session cookie
    R->>U: decode JWT
    alt no or invalid cookie
        U-->>A: 401
        A-->>C: redirect to /log-in
    else valid
        U->>U: refresh cookie if older than 24h
        R->>O: board joined through Portal.owner_id
        alt not the owner
            O-->>A: 404
        else owner
            O->>DB: select widgets
            DB-->>R: rows
            R-->>A: Pydantic response (typed by schema.d.ts)
            A-->>H: data
            H-->>C: cached data, re-render
        end
    end
```

## 3. Data model
SQLAlchemy 2.0 typed models. Every foreign key below the user is `ON DELETE CASCADE`, so deleting a portal removes its boards, widgets and rows. A stat or chart's link to its table or schedule is not a foreign key: it's `source.widget` inside its JSON config. So deleting a table or schedule removes its readers in code (`get_widget_dependents`, in the same commit), and `GET /api/widgets/{id}/dependents` lists them for the delete confirmation. `Conversation` and `Message` exist for the AI assistant but aren't used yet.

```mermaid
erDiagram
    User ||--o{ OAuthAccount : "logs in with"
    User ||--o{ Portal : owns
    User |o--o| Portal : "default_portal_id"
    Portal ||--o{ Board : contains
    Board ||--o{ WidgetInstance : contains
    WidgetInstance ||--o{ WidgetData : "rows (input widgets only)"
    Board ||--o{ Conversation : "planned"
    Conversation ||--o{ Message : "planned"

    User {
        int id
        string email "unique, null for guests"
        string display_name
        string avatar_url
        bool is_guest
        datetime expires_at
        int default_portal_id
    }
    OAuthAccount {
        int user_id
        string provider "github | google"
        string provider_account_id
    }
    Portal {
        int id
        int owner_id
        string name
        string template_id "wellness-studio | null"
    }
    Board {
        int id
        int portal_id
        string label
        int position
        string persona_id
    }
    WidgetInstance {
        int id
        int board_id
        string type "stat | chart | table | schedule | form"
        int x
        int y
        int w
        int h
        string template_key
        json config
    }
    WidgetData {
        int id
        int widget_instance_id
        json data
    }
```

## 4. Log-in
GitHub and Google OAuth through Authlib. Accounts are linked by verified email. The session is a 7-day HS256 JWT in an httponly cookie.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SPA as /log-in page
    participant API as FastAPI /api/auth
    participant P as GitHub or Google
    participant S as users_service
    participant DB as Database

    User->>SPA: click "Log in with GitHub/Google"
    SPA->>API: GET /api/auth/{provider}/login
    API-->>User: redirect (OAuth state in pb_oauth cookie)
    User->>P: approve
    P-->>API: GET /api/auth/{provider}/callback
    API->>P: exchange code, fetch profile + verified email
    API->>S: find_or_create_oauth_user
    S->>DB: by OAuthAccount, else by verified email, else new User
    API-->>User: Set-Cookie pb_session (JWT, 7 days) + redirect /portals
```

## 5. Creating a portal from a template
Templates live in code (`app/templates/`), not the database. `create_portal` copies one into new rows in a single transaction. After that the portal belongs to the user.

```mermaid
flowchart TD
    Req["POST /api/portals<br/>{name, template_id}"] --> Blank{"template_id?"}
    Blank -- "null" --> Empty["Insert Portal only<br/>(blank portal)"]
    Blank -- "wellness-studio" --> T["get_template()"]
    T --> P["Insert Portal"]
    P --> B["For each BoardSpec:<br/>insert Board with position + persona_id"]
    B --> W["For each WidgetSpec:<br/>insert WidgetInstance with template_key"]
    W --> Ref["Rewrite config.source.widget<br/>from template key to real widget id"]
    Ref --> Sample{"with_sample_data?"}
    Sample -- "False (API default)" --> Done["Commit"]
    Sample -. "True (planned demo)" .-> Rows["Insert sample WidgetData<br/>generated from today's date"]
    Rows -.-> Done
```

### Adding a widget from a preset
The Add widget modal lists the portal template's widgets. A table can be added once per portal, and a stat or chart only when its source table is already in the portal.

```mermaid
flowchart LR
    Modal["AddWidgetModal"] -- "useWidgetPresets" --> List["GET /boards/{id}/widgets/presets"]
    List --> Filter["skip unbuilt types (schedule)<br/>skip stats/charts whose table is missing<br/>mark tables already in the portal"]
    Modal -- "useAddWidgetPreset" --> Add["POST /boards/{id}/widgets/presets/{key}"]
    Add --> Check{"409 if the table is already in the portal<br/>or the source table is missing"}
    Check -- ok --> Insert["copy config, resolve source.widget,<br/>place at the bottom of the board"]
    Insert --> Inv["invalidate ['boards', id, 'widgets']<br/>(refreshes widgets and presets)"]
```

## 6. Widget rendering and live queries
Only **input** widgets (table, schedule, form) store `WidgetData` rows. **Output** widgets (stat, chart) store a `source` query in their config and compute their value in the browser, so a new row updates every stat and chart that reads it.

```mermaid
flowchart TD
    Page["BoardPage"] --> Canvas["DashboardCanvas<br/>react-grid-layout, 12 cols"]
    Canvas -- "useWidgets(boardId)" --> Widgets[("widgets query")]
    Canvas --> Reg["widgetRegistry.get(type)"]
    Reg --> Shell["WidgetShell<br/>drag handle · rename · delete"]
    Shell --> Table["TableWidget"]
    Shell --> Stat["StatWidget"]
    Shell --> Chart["ChartWidget"]
    Shell --> Placeholder["PlaceholderWidget<br/>schedule, form"]

    Table -- "useCreateWidgetRow / useEditWidgetRow / useDeleteWidgetRow" --> RowsAPI["/api/.../widgets/{w}/data"]
    RowsAPI --> Rows[("rows query<br/>per source widget")]
    Stat -- "useWidgetRows(source.widget)" --> Rows
    Chart -- "useWidgetRows(source.widget)" --> Rows
    Rows --> Agg["aggregate: count · sum · avg<br/>groupBy · bucket · period"]
    Agg --> Stat
    Agg --> Chart

    Canvas -- "drag/resize stop → useSaveLayout" --> Layout["PATCH /boards/{id}/widgets/layout"]
```

## 7. CI and deploy
Every PR runs CI and gets a Vercel preview. Previews share the production database and can't log in, so pages behind log-in are checked on production after merging. Migrations are run by hand.

```mermaid
flowchart LR
    Branch["branch NNN-short-name"] --> PR["Pull request<br/>Closes #N"]
    PR --> CI
    subgraph CI["GitHub Actions ci.yml"]
        BE["backend × {sqlite, libsql}<br/>ruff · alembic upgrade + check · pytest"]
        FE["frontend<br/>lint · prettier · vitest · build"]
    end
    PR --> Preview["Vercel preview<br/>(check styling here)"]
    CI --> Merge["merge to main"]
    Preview --> Merge
    Merge --> Prod["Vercel production<br/>portal-boards.vercel.app"]
    Merge -. "if there's a new migration" .-> Migrate["migrate.yml (manual)<br/>alembic upgrade on Turso"]
```
