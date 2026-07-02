---
name: react-component-creator
description: Guidance for writing and structuring React code — components, hooks, pages, and features — with a strong bias toward small files, extracted hooks/utils, and readable JSX. Use this skill whenever the user asks to create, build, scaffold, or add a new React component, page, form, modal, or feature, or when editing an existing React component that is growing large or messy. Also apply it when reviewing or refactoring React code for structure, even if the user didn't explicitly ask for a "new" component.
---

# React Component Creator

Write React code that stays small, composable, and easy to navigate as it grows.
The rules below aren't arbitrary — they exist because React files silently
accrete state, JSX nesting, and helper functions until a single file becomes
unreadable and untestable. Applying them from the first line avoids that
slide, rather than requiring a big refactor later.

## Before writing code

1. Identify what the component's job is: does it *orchestrate* (fetch data,
   hold state, wire up handlers) or does it *render* (take props, produce
   JSX)? If a request seems to need both, that's the signal to split into a
   container component + one or more presentational components from the start.
2. Sketch the file layout before writing: which parts are hooks, which are
   utils, which are subcomponents. Prefer creating that structure up front
   over writing one big file and splitting it after.
3. Check the target project's existing conventions (folder layout, TS vs JS,
   styling approach, existing hooks/utils directories) and match them —
   these rules describe *shape*, not naming/tooling choices the project has
   already made.

## File size and splitting

- Keep component files under ~200 lines. When a file is approaching that
  limit, split it into smaller pieces — don't keep appending to it.
- One exported component per file. Small private subcomponents (under ~30
  lines) that are only ever used by their parent may live in the same file.
- When adding new logic to a file that's already long, put the new logic in
  a new file (hook, util, or subcomponent) rather than appending it to the
  existing one.

## Extract aggressively

Move things out of the component body as soon as they don't need to be
inline:

- **Stateful logic** (data fetching, multiple `useState`/`useEffect`,
  subscriptions) → a custom hook in `hooks/useThing.js` (or `.ts`). This
  keeps the component focused on rendering and makes the logic independently
  testable/reusable.
- **Pure helpers** (formatting, sorting, transforms) → `utils/`, never
  defined inside the component body, since redefining a function every
  render is wasted work and clutters the component.
- **Static config, option arrays, constants** → module scope or
  `constants.js`, never recreated inside the render function.
- **Any self-contained JSX section** (header, card, modal, form fields, list
  item) → its own component file, once it's identifiable as a distinct
  chunk of UI rather than a couple of incidental lines.

## Readable JSX

- Cap JSX nesting at roughly 3 levels before extracting a subcomponent —
  deeper nesting is hard to scan and usually means a section deserves its
  own name.
- Use early returns for loading/error/empty states. Avoid nested ternaries
  in the returned JSX; they're hard to read and easy to get wrong.
- Don't define multi-line inline arrow functions inside JSX (e.g. in an
  `onClick`). Define a named handler above the `return` instead — it's
  easier to read and avoids creating a new function identity every render.

## Component design

- A component either orchestrates state/data or renders UI. If it's doing
  both heavily, split it into a container + presentational pair.
- More than ~6 props is a signal to group related props into an object, or
  switch to composition (`children`) instead of a flat prop list.
- Prefer composition over boolean flag props that branch what gets
  rendered (e.g. avoid `<Modal isConfirm={true} />` branching internally —
  prefer distinct components or `children`/slots).

## Example: applying this to a request

If asked for "a user profile card that fetches the user and shows a follow
button," don't write one file that fetches data, holds loading/error state,
and renders three levels of nested JSX. Instead:

```
components/UserProfileCard/
├── UserProfileCard.jsx      # orchestrates: calls the hook, handles loading/error, renders subcomponents
├── ProfileHeader.jsx        # presentational
├── FollowButton.jsx         # presentational, owns its own click handler
hooks/
└── useUserProfile.js        # fetch + state for the user data
```

`UserProfileCard.jsx` stays short: an early return for loading/error, then
composes `ProfileHeader` and `FollowButton` with at most a couple of levels
of JSX nesting.

## Reviewing existing code

When asked to review or refactor React code rather than write new code,
apply the same rules as a checklist: file length, one component per file,
extracted hooks/utils/constants, JSX nesting depth, ternary usage, inline
handlers, prop count, and orchestration/rendering separation. Point out
concrete violations with file/line references and propose the split rather
than just describing the problem abstractly.
