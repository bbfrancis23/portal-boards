# How it works: users

What you can do in portal-boards, step by step.

## 1. Getting started
Log in with GitHub or Google, create a portal, and you land on its first board.

```mermaid
flowchart TD
    Home["Home page"] --> LogIn["Log in"]
    LogIn --> Which{"GitHub or Google?"}
    Which --> Approve["Approve on GitHub / Google"]
    Approve --> Portals["Portals page<br/>all your portals"]
    Portals --> New["New portal"]
    New --> Kind{"Start from"}
    Kind -- "Blank" --> Blank["Empty portal"]
    Kind -- "Wellness studio" --> Studio["Portal with ready-made boards:<br/>Overview · Schedule · Members · Revenue"]
    Blank --> Board["First board"]
    Studio --> Board
    Portals -- "open a portal" --> Board
```

## 2. Working on a board
A board is a grid of widgets. Add tables first, then the stats and charts that read from them.

```mermaid
flowchart TD
    Board["📋 Board"]

    Board --> Add["➕ Add widget"]
    Add --> Presets["Pick from the template's presets:<br/>Tables → Stats → Charts"]
    Presets --> Note["A stat or chart appears in the list<br/>once its table is in the portal"]

    Board --> Arrange["✋ Arrange"]
    Arrange --> Drag["Drag a widget by its title"]
    Arrange --> Resize["Resize from the corner"]
    Arrange --> Saved["Saved automatically"]

    Board --> Menu["⋯ Widget menu"]
    Menu --> Rename["Rename"]
    Menu --> Delete["Delete (asks first)"]
    Delete --> DelData["Deleting a table or schedule also deletes<br/>the stats and charts that read it (listed first)"]

    Board --> Rows["📝 Table rows"]
    Rows --> AddRow["Add a row"]
    Rows --> PasteCsv["Paste CSV from a spreadsheet<br/>(adds the rows that fit, says how many were skipped)"]
    Rows --> EditRow["Edit a row"]
    Rows --> DelRow["Delete a row (asks first)"]
    AddRow --> Live["Stats and charts using<br/>that table update right away"]
    PasteCsv --> Live
    EditRow --> Live
    DelRow --> Live
```

## 3. Organizing
```mermaid
flowchart LR
    subgraph Portals["Portals page"]
        PNew["Create a portal"]
        PEdit["Rename a portal"]
        PDel["Delete a portal<br/>(removes everything in it)"]
    end
    subgraph Boards["Inside a portal"]
        BNew["Create a board"]
        BEdit["Rename a board"]
        BDel["Delete a board<br/>(removes its widgets)"]
    end
```

## 4. Coming soon
```mermaid
flowchart LR
    Demo["🎟️ Try the demo<br/>no account, sample data, 24 hours"]
    AI["💬 Board assistant<br/>a persona per board that answers<br/>questions and can edit the board"]
    Settings["⚙️ Settings<br/>account, appearance, delete account"]
    Schedule["📅 Schedule widget<br/>week view of classes"]
    Default["⭐ Default portal<br/>pick which portal opens first"]

    classDef planned stroke-dasharray: 5 5
    class Demo,AI,Settings,Schedule,Default planned
```
