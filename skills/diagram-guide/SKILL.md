---
name: diagram-guide
description: Draw diagrams, illustrations, charts, database schemas and interactive explainers as standalone offline HTML/SVG files, then render and check them. Use whenever the user asks for a flowchart, architecture or structural diagram, an explainer of how something works, a chart, an ERD or class diagram, a UI mockup or an illustration, or when a visual would explain something better than text.
---

# Diagram guide

Diagrams are standalone `.html` files that open in any browser, work offline, and look right in light and dark mode. You write a **fragment** (an SVG, or HTML with inline SVG and inline script). `scripts/build.js` wraps it in a page with the theme and base styles. `scripts/check.js` renders it in both modes, screenshots it and catches layout and contrast mistakes.

Paths below are relative to this skill's folder.

## Before first use

`assets/theme.css` holds every colour, font and size, and ships blank (`____`). If `check.js` reports blank theme values, tell the user and ask them to fill in `assets/theme.css`, or offer to fill it with a palette they approve. Never invent values silently.

## Workflow

1. **Pick the type** from the table below. Route on the verb, not the noun.
2. **Plan inside the complexity budget.** Count the nouns before drawing. Over budget means an overview plus detail diagrams, not one crowded diagram.
3. **Read the reference** for that type: `references/diagrams.md` (flowchart, structural, illustrative), `references/charts.md`, `references/erd.md`, `references/ui.md` (explainers, comparisons, records, mockups, illustration).
4. **Write the fragment** to `<name>.fragment.html`. Content only: no `<html>`, `<head>` or `<body>`, no `<link>`, no `<script src>`, nothing loaded from the network. Inline `<style>` and `<script>` are fine.
5. **Build**: `node scripts/build.js <name>.fragment.html <name>.html` (add `--mermaid` for ERDs and class diagrams).
6. **Check**: `node scripts/check.js <name>.html`. For interactive diagrams, exercise them: `--click-all "<selector>"` to press every button that adds data, `--hover "<selector>"` on one chart mark, `--step "<next-button>:<count>"` for steppers. Fix every FAIL, rebuild and re-check. Warnings are judgement calls; fix them unless there's a reason not to.
7. **Look at both screenshots** (`<name>.light.png`, `<name>.dark.png`). The checker can't tell whether the diagram actually explains the thing.
8. **Deliver** `<name>.html`. The fragment and screenshots are working files.

If Playwright isn't installed, install it (`npm i -D playwright && npx playwright install chromium`). If that's impossible, open the page in both modes yourself and go through the SVG checklist below by hand, and say that the automated check didn't run.

To put a diagram inside a document (Markdown, MDX, a docs site), build and check it the same way, then embed the built page in an `<iframe>` or embed the fragment directly. A fragment depends on `assets/base.css` and `assets/theme.css`, so the host page must include both.

## Pick the type

The decision is about *intent*, not subject matter. Ask: is the user trying to *document* this, or *understand* it?

**Reference diagrams** — the user wants a map they can point at. Precision matters more than feeling.
- **Flowchart** — steps in sequence, decisions branching, data transforming. Trigger phrases: *"walk me through the process"*, *"what are the steps"*, *"what's the flow"*.
- **Structural diagram** — things inside other things. Trigger phrases: *"what's the architecture"*, *"how is this organised"*, *"where does X live"*.

**Intuition diagrams** — the user wants to *feel* how something works. The goal is the right mental model, so these should look nothing like a flowchart.
- **Illustrative diagram** — draw the mechanism. Physical things get cross-sections; abstract things get spatial metaphors (gradient descent is a ball rolling down a loss surface, a hash table is a row of buckets with items falling into them). Trigger phrases: *"how does X actually work"*, *"explain X"*, *"I don't get X"*, *"give me an intuition for X"*.

| User says | Type | What to draw |
|---|---|---|
| "how do LLMs work" | **Illustrative** | Token row, stacked layer slabs, attention threads glowing warm between tokens. Go interactive if you can. |
| "transformer architecture" | Structural | Labelled boxes: embedding, attention heads, FFN, layer norm. |
| "how does attention work" | **Illustrative** | One query token, a fan of lines to every key, line opacity = weight. |
| "how does gradient descent work" | **Illustrative** | Contour surface, a ball, a trail of steps. Slider for learning rate. |
| "what are the training steps" | Flowchart | Forward → loss → backward → update. Boxes and arrows. |
| "how does TCP work" | **Illustrative** | Two endpoints, numbered packets in flight, an ACK returning. |
| "TCP handshake sequence" | Flowchart | SYN → SYN-ACK → ACK. Three boxes. |
| "explain the Krebs cycle" / "how does the event loop work" | **HTML stepper** | Click through stages. Never a ring. |
| "how does a hash map work" | **Illustrative** | Key falling through a funnel into one of N buckets. |
| "draw the database schema" / "show me the ERD" | **Mermaid ERD** | See `references/erd.md`. Build with `--mermaid`. |
| "chart X over time" / "compare these numbers" | **SVG chart** | See `references/charts.md`. |

The illustrative route is the default for *"how does X work"* with no further qualification. It is the more ambitious choice — don't retreat to a flowchart because it feels safer.

Don't mix families in one diagram. If you need both, draw the intuition version first, then the reference version as a second diagram.

**Prefer interactive when the real system has a control.** A water heater has a thermostat, so give the diagram a slider. Reach for HTML with inline SVG first; fall back to static SVG when there's nothing to operate.

## Complexity budget — hard limits

- **Box subtitles**: ≤5 words. Detail goes in the text around the diagram, not the box.
- **Colours**: ≤2 colour ramps per diagram, plus gray for neutral and structural parts. If colours encode meaning (states, tiers) and the labels don't already say it, add a one-line legend.
- **Horizontal tier**: ≤4 boxes at full width (~140px each). 5+ boxes → shrink to ≤110px, wrap to 2 rows, or split into overview + detail diagrams.
- **Nodes**: 4–5 per flowchart. If the user lists 6+ components, draw an overview with boxes only and at most one or two arrows, then one diagram per interesting sub-flow with 3–4 nodes each.

If a diagram needs a "click to learn more", it must actually be sparse. Don't promise brevity then front-load everything.

## Core design rules

**Philosophy**
- **Flat**: no gradients, mesh backgrounds, noise textures, shadows, blur, glow or decorative effects. Clean flat surfaces. (Illustrative diagrams get one exception; see `references/diagrams.md`.)
- **Compact**: show the essential in the diagram. Explain the rest in the surrounding text.

**Rules**
- No font size below 11px.
- No emoji.
- **Typography**: `var(--font-sans)` everywhere; `var(--font-voice)` only for the rare editorial or blockquote moment. Headings: h1 22px, h2 18px, h3 16px, all weight 500, colour `var(--text-primary)`. Body 16px, weight 400, line-height 1.7. **Two weights only: 400 and 500.** Never 600 or 700.
- **Sentence case** always, including SVG labels and headings. Never Title Case, never ALL CAPS.
- **No mid-sentence bolding.** Entity, class and function names go in `code style`. Bold is for headings and labels only.
- **Contrast**: every piece of text needs 4.5:1 against what's behind it, muted text included. `check.js` measures the theme and every SVG label.
- Text on a coloured background (badges, pills, cards, tags) uses the dark stops of the same colour family, never plain black or generic gray. The `c-{ramp}` classes do this for you.
- **Corners**: `border-radius: var(--radius)` for controls, `12px` for cards. In SVG, `rx="4"` is the default; `rx="8"` max for emphasis; `rx` ≥ half the height makes a pill, so only use it when you mean a pill.
- **No rounded corners on single-sided borders** — a `border-left` or `border-top` accent gets `border-radius: 0`.
- **Icon sizing**: 16–20px inline, 24px max decorative. For inline SVG icons, set `width`/`height` explicitly.
- **Validate input in interactive widgets.** Anything that collects input checks it in the submit handler: if a required field is empty or invalid, show an inline error next to the control (13px, `color: var(--text-danger)`, e.g. "Enter an answer first") and stop. Clear the error as soon as the user edits the field.
- **Round every displayed number** with `Math.round()`, `.toFixed(n)` or `Intl.NumberFormat`. JS float maths leaks artifacts (`0.1 + 0.2` is `0.30000000000000004`). Range sliders get a `step`.
- **Animation**: CSS `@keyframes` on `transform` and `opacity` only, loops under ~2s, always inside `@media (prefers-reduced-motion: no-preference)`. Animate behaviour (flow, rotation), never decoration.

**Accessibility**: an HTML fragment begins with a visually hidden `<h2 class="sr-only">` holding a one-sentence summary. An SVG has `role="img"` with `<title>` and `<desc>` as its first children.

**When nothing fits**: pick the closest type and adapt. Default to an editorial layout (no card) for explanatory content and a single raised card for a bounded object. All rules still apply.

## Colour

Every value lives in `assets/theme.css`. Use CSS variables for HTML, and the classes below for SVG. Never hardcode a hex colour except in physical-colour scenes (below).

**Ramps**: purple, teal, coral, pink, gray, blue, green, amber, red. Each has stops 50, 100, 200, 400, 600, 800, 900 (`--teal-400` etc.). 50 = lightest fill, 100–200 = light fills, 400 = mid tone, 600 = strong / border, 800–900 = text on light fills.

**Classes** (from `assets/base.css`, dark mode automatic):
- `c-{ramp}` — light: 50 fill, 600 stroke, 800 title, 600 subtitle. Dark: 800 fill, 200 stroke, 100 title, 200 subtitle.
- `c-{ramp}-2` — one shade deeper, for a region nested inside a `c-{ramp}` container of the same ramp.
- Apply to a `<g>` wrapping shape and text, or directly to a `<rect>`, `<circle>`, `<ellipse>` or `<polygon>`. Never to a connector `<path>`. For a coloured connector, use an inline `stroke="var(--{ramp}-400)"`.
- **Nesting**: the classes use direct-child selectors (`>`). Put `c-*` on the innermost `<g>` that holds the shapes, or on the shapes themselves; a shape that is a grandchild loses its fill and renders black.

**How to assign colours** — colour encodes meaning, not sequence:
- Group by **category**: all nodes of the same type share one colour.
- **Gray for neutral and structural** nodes (start, end, generic steps, outer containers).
- **Prefer purple, teal, coral, pink** for general categories. Reserve blue, green, amber and red for things that genuinely are informational, success, warning or error. (Illustrative diagrams may use blue/amber/red freely for physical properties like temperature.)
- For illustrative diagrams, colour encodes **intensity**: warm ramps for heat, energy or attention; cool or gray for calm, dormant or ignored.
- Never cycle through colours like a rainbow.
- Never rely on colour alone to distinguish categories; pair it with a label, dash pattern, hatching or shape.

**Physical-colour scenes** (sky, water, grass, skin, materials): use hardcoded hex for the whole scene and never mix it with `c-*` classes, or half of it inverts in dark mode and half doesn't. For a dark variant, key it on `[data-mode="dark"] .scene`.

## SVG setup

```html
<svg width="100%" viewBox="0 0 680 H" role="img">
  <title>…</title>
  <desc>…</desc>
  <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>
  …
</svg>
```

- **680 wide, flexible height.** Safe area: x=40 to 640, y=40 to H−40. Background transparent.
- **The 680 is load-bearing.** The page frame is 680px, so SVG units render 1:1 with CSS pixels, and all the text-width maths assumes that. If content is naturally narrow, keep 680 and centre the content; never shrink the viewBox to hug it.
- **Height**: find the lowest point of any shape or text (baseline + 4px descent) and set H = that + 20–40. Don't guess, and don't leave empty space below.
- **Arrow marker**: always include the `<defs>` above and use `marker-end="url(#arrow)"`. The head uses `context-stroke`, so it matches its line's colour. No filters or extra markers in `<defs>`; a `<clipPath>`, subtle `<pattern>` hatching as a secondary cue, and (illustrative only) one `<linearGradient>` are the only other things allowed.

**Classes** (`assets/base.css`):
- `t` = 14px primary text, `ts` = 12px secondary text, `th` = 14px medium (500). Every `<text>` carries one of these; inside a `c-{ramp}` group they take the ramp's text colours.
- `box` = neutral rect (surface fill, strong border).
- `shape` = neutral freeform shape: surface fill, 1px outline that stays visible. Use for any polygon, path or ellipse that has no `c-*` class.
- `node` = clickable group with hover effect.
- `arr` = connector line (1.5px). `leader` = dashed 0.5px leader line for labels.
- Short aliases: `var(--p)` primary text, `var(--s)` secondary, `var(--t)` muted, `var(--bg2)` card surface, `var(--b)` border.

**Text**
- Two sizes only: 14px for node and region labels (`t` or `th`), 12px for subtitles, descriptions and arrow labels (`ts`).
- Text inside a box gets `dominant-baseline="central"` with y at the centre of its slot: `<text x={x+w/2} y={y+h/2} text-anchor="middle" dominant-baseline="central">`. For a row in a multi-row box, y is the centre of that row.
- **SVG text never wraps.** Every line break needs a `<tspan x="…" dy="1.2em">`. If a subtitle needs wrapping, it's too long; shorten it.
- `text-anchor="end"` extends left from x and clips easily near x<60. Check `label_chars × 8 < anchor_x`, or use `start`.
- **No rotated text.** No decorative step numbers or oversized headings outside boxes. No icons inside boxes (illustrative diagrams may use simple shape indicators).
- **Minimise standalone labels.** Every `<text>` sits inside a box (title or ≤5-word subtitle) or in a legend. Arrow labels are usually unnecessary; if the meaning isn't obvious from source and target, put it in the box subtitle.

**Sizing text** — rendered widths in Anthropic Sans (other fonts differ by up to ~10%; widen boxes accordingly):

```csv
text, chars, weight, size, rendered width
Authentication Service, 22, 500, 14px, 167px
Background Job Processor, 24, 500, 14px, 201px
Detects and validates incoming tokens, 37, 400, 14px, 279px
forwards request to, 19, 400, 12px, 123px
データベースサーバー接続, 12, 400, 14px, 181px
```

**Box width from the longest label**: `rect_width = max(title_chars × 8, subtitle_chars × 7) + 24`. A 100px box holds at most a 10-character subtitle. Formulas, subscripts and symbols (C₆H₁₂O₆, ∑, √) are 30–50% wider. When in doubt, widen the box; overflow looks worse than padding.

**Tier packing**: compute total width before placing. Four 130px boxes with 20px gaps = 580px, which fits the 600px safe width; four 160px boxes don't. Work bottom-up for trees: size the leaf tier first, then parents ≥ the sum of their children.

**Lines and shapes**
- **Arrow intersection check**: before writing any `<line>` or `<path>`, trace it against every box already placed. If it crosses a box or label that isn't its source or target, route around with an L-bend: `<path d="M x1 y1 L x1 ymid L x2 ymid L x2 y2" fill="none"/>`.
- **Connector paths need `fill="none"`**, or SVG fills them black.
- **Strokes**: 0.5px for boxes and edges that have a coloured fill. 1px (`class="shape"`) for freeform shapes without a ramp class.
- **Lines stop at component edges**: compute where the line meets the boundary instead of drawing through and hiding it behind a fill. Leave a 10px gap between an arrowhead and the box it points to.
- **Schematic containers** are dashed rects with a label, not literal shapes (cloud outlines, server icons, organelle ovals).

**Checklist** (check.js automates most of this; run through it by hand if it can't run):
1. Lowest element + padding = viewBox height.
2. All content within x=0..680 and inside the viewBox; no negative coordinates.
3. No unintended overlaps: label on label, label on arrow, box on box. Only deliberate layering is allowed.
4. Boxes in the same row are ≥20px apart (≥60px between boxes in a flowchart).
5. Every text fits its box with ~12px side padding.
6. Every text has a class and 4.5:1 contrast in both modes.
7. Nothing loads from the network.

## Testing changes to this skill

`evals/` holds six test prompts with reference diagrams. After changing anything in `assets/` or `scripts/`, run `node evals/run.js`. After changing the rules, follow `evals/README.md` to re-test with a fresh session.
