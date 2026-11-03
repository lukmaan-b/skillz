# Database schemas (ERDs) and class diagrams

A schema table is a header plus N field rows plus typed columns plus crow's-foot connectors. That is a text-layout problem, and hand-placing it in SVG fails the same way every time. Use Mermaid's `erDiagram`, which does layout, cardinality and connector routing for you. Use this for ERDs and class diagrams only; everything else stays in hand-written SVG.

Mermaid is bundled with the skill (`assets/vendor/mermaid.min.js`, MIT licence), so nothing loads from the internet. Build with the `--mermaid` flag and the library is inlined into the page:

```
node scripts/build.js schema.fragment.html schema.html --mermaid
```

The page is about 3.5 MB because the library is inside it. That's the cost of working offline.

## Fragment pattern

Start from `evals/reference/6-erd.html`, which is complete and passes the checks, and replace the diagram source. What it does:

- `direction LR` so the tables sit side by side in the 680px frame.
- Initialises Mermaid with colours read from the theme variables (`--surface-*`, `--text-*`), and the theme's `--font-sans`. Fonts are measured for layout, so it waits for `document.fonts.ready` before rendering, or text clips.
- Renders with `mermaid.render(id, source)` and inserts the SVG into `#erd`.
- Replaces each entity's sharp-cornered outline with a `<rect rx="8">`.
- Forces row fills, row borders and the "zero or more" circles to theme colours with CSS, because Mermaid's own dark mode ignores them.
- Re-renders on the page's `modechange` event, so the light/dark switch works.

Schema source example:

```
erDiagram
  direction LR
  USERS ||--o{ POSTS : writes
  POSTS ||--o{ COMMENTS : has
  USERS {
    uuid id PK
    string email
    timestamp created_at
  }
  POSTS {
    uuid id PK
    uuid user_id FK
    string title
  }
```

## Class diagrams

Same fragment, same init. Swap the source for `classDiagram` syntax and keep everything else.

## Checking

`check.js` recognises Mermaid's SVG and skips the text-class rule for it, but still checks overflow, overlaps and contrast in both modes. Look at both screenshots: Mermaid layouts get long fast, and more than about five tables should be split into several diagrams.
