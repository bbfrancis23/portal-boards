# How portal-boards works

Diagrams that explain the app from three points of view. Pick the page that fits you:

| Page | For | What it shows |
|---|---|---|
| [Developers](developers.md) | Programmers working on the code | Architecture, request lifecycle, data model, log-in, templates, widget rendering, CI and deploy |
| [Non-programmers](non-programmers.md) | Anyone curious how it works, no code needed | The big picture in plain words, how things fit together, templates, live charts |
| [Users](users.md) | People using the app | Getting started, working on a board, organizing portals and boards, what's coming |

Features that aren't built yet are drawn with **dashed lines** or labeled **planned**.

## Updating the diagrams
The diagrams are [Mermaid](https://mermaid.js.org/) code blocks, so they're plain text:

1. Edit the text inside the ` ```mermaid ` block.
2. Preview it in VS Code's Markdown preview (`Ctrl+Shift+V`, with Mermaid support) or on GitHub, which renders Mermaid in files and PR diffs.
3. When a feature lands, update the diagram that describes it and remove its "planned" styling.
