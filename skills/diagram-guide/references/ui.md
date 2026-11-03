# UI, mockups and illustration

Read this for interactive explainers, option comparisons, data records, mockups and decorative illustration.

## UI components

### Layout width
Use `repeat(auto-fit, minmax(160px, 1fr))` for responsive columns — auto-fit lets the grid pick column count by available width.

### Aesthetic
Flat, clean, white surfaces. Minimal 0.5px borders. Generous whitespace. No gradients, no shadows (except functional focus rings).

### Tokens
- Borders: always `0.5px solid var(--border)` (or `--border-strong` for emphasis)
- Corner radius: `var(--radius)` for most elements, `12px` for cards
- Cards: white bg (`var(--surface-2)`), 0.5px border, 12px radius, padding 1rem 1.25rem
- Form elements (input, select, textarea, button, range slider) are styled by base.css — write bare tags. Text inputs are 36px with a focus ring; buttons have an outline style with hover and press states. Only add inline styles to override (e.g. a different width).
- Buttons (from base.css): transparent bg, 0.5px `--border-strong` border, hover `--surface-1`, active scale(0.98).
- **Round every displayed number.** JS float math leaks artifacts — `0.1 + 0.2` gives `0.30000000000000004`, `7 * 1.1` gives `7.700000000000001`. Any number that reaches the screen (slider readouts, stat card values, axis labels, data-point labels, tooltips, computed totals) must go through `Math.round()`, `.toFixed(n)`, or `Intl.NumberFormat`. Pick the precision that makes sense for the context — integers for counts, 1–2 decimals for percentages, `toLocaleString()` for currency. For range sliders, also set `step="1"` (or step="0.1" etc.) so the input itself emits round values.
- Spacing: use rem for vertical rhythm (1rem, 1.5rem, 2rem), px for component-internal gaps (8px, 12px, 16px)
- Box-shadows: none, except `box-shadow: 0 0 0 Npx` focus rings on inputs

### Metric cards
For summary numbers (revenue, count, percentage) — surface card with muted 13px label above, 24px/500 number below. `background: var(--surface-1)`, no border, `border-radius: var(--radius)`, padding 1rem. Use in grids of 2-4 with `gap: 12px`. Distinct from raised cards (which have white bg + border).

### Layout
- Editorial (explanatory content): no card wrapper, prose flows naturally
- Card (bounded objects like a contact record, receipt): single raised card wraps the whole thing

**Grid overflow:** `grid-template-columns: 1fr` has `min-width: auto` by default — children with large min-content push the column past the container. Use `minmax(0, 1fr)` to clamp.

**Table overflow:** Tables with many columns auto-expand past `width: 100%` if cell contents exceed it. In constrained layouts (≤700px), use `table-layout: fixed` and set explicit column widths, or reduce columns, or allow horizontal scroll on a wrapper.

### Mockup presentation
Contained mockups — mobile screens, chat threads, single cards, modals, small UI components — should sit on a background surface (`var(--surface-1)` container with `border-radius: 12px` and padding, or a device frame) so they don't float naked on the canvas. Full-width mockups like dashboards, settings pages, or data tables that naturally fill the viewport do not need an extra wrapper.

### 1. Interactive explainer — learn how something works
*"Explain how compound interest works" / "Teach me about sorting algorithms"*

Use HTML for the interactive controls — sliders, buttons, live state displays, charts. No card wrapper. Whitespace is the container.

```html
<div style="display: flex; align-items: center; gap: 12px; margin: 0 0 1.5rem;">
  <label style="font-size: 14px; color: var(--text-secondary);">Years</label>
  <input type="range" min="1" max="40" value="20" id="years" style="flex: 1;" />
  <span style="font-size: 14px; font-weight: 500; min-width: 24px;" id="years-out">20</span>
</div>

<div style="display: flex; align-items: baseline; gap: 8px; margin: 0 0 1.5rem;">
  <span style="font-size: 14px; color: var(--text-secondary);">£1,000 →</span>
  <span style="font-size: 24px; font-weight: 500;" id="result">£3,870</span>
</div>
```

### 2. Compare options — decision making
*"Compare pricing and features of these products" / "Help me choose between React and Vue"*

Use HTML. Side-by-side card grid for options. Highlight differences with semantic colors. Interactive elements for filtering or weighting.

- Each option in a card. Use badges for key differentiators.
- When one option is recommended or "most popular", accent its card with `border: 2px solid var(--border-accent)` only (2px is deliberate — the only exception to the 0.5px rule, used to accent featured items) — keep the same background and border as the other cards. Add a small badge (e.g. "Most popular") above or inside the card header using `background: var(--bg-accent); color: var(--text-accent); font-size: 12px; padding: 4px 12px; border-radius: var(--radius)`.

### 3. Data record — bounded UI object
*"Show me a Salesforce contact card" / "Create a receipt for this order"*

Use HTML. Wrap the entire thing in a single raised card. All content is sans-serif since it's pure UI. Use an avatar/initials circle for people (see example below).

```html
<div style="background: var(--surface-2); border-radius: 12px; border: 0.5px solid var(--border); padding: 1rem 1.25rem;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
    <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--bg-accent); display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 14px; color: var(--text-accent);">MR</div>
    <div>
      <p style="font-weight: 500; font-size: 15px; margin: 0;">Maya Rodriguez</p>
      <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">VP of Engineering</p>
    </div>
  </div>
  <div style="border-top: 0.5px solid var(--border); padding-top: 12px;">
    <table style="width: 100%; font-size: 13px;">
      <tr><td style="color: var(--text-secondary); padding: 4px 0;">Email</td><td style="text-align: right; padding: 4px 0; color: var(--text-accent);">m.rodriguez@acme.com</td></tr>
      <tr><td style="color: var(--text-secondary); padding: 4px 0;">Phone</td><td style="text-align: right; padding: 4px 0;">+1 (415) 555-0172</td></tr>
    </table>
  </div>
</div>
```

## Art and illustration
*"Draw me a sunset" / "Create a geometric pattern"*

Use SVG. Same technical rules (viewBox, safe area) but the aesthetic is different:
- Fill the canvas — art should feel rich, not sparse
- Bold colors: mix `--text-*` categories for variety (info blue, success green, warning amber)
- Art is the one place custom `<style>` color blocks are fine — freestyle colors, `[data-mode="dark"]` selectors (plus the `:root:not([data-mode])` media-query fallback) for dark mode variants if you want them
- Layer overlapping opaque shapes for depth
- Organic forms with `<path>` curves, `<ellipse>`, `<circle>`
- Texture via repetition (parallel lines, dots, hatching) not raster effects
- Geometric patterns with `<g transform="rotate()">` for radial symmetry
