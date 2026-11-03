# Charts

Charts are hand-built in SVG with a little inline script, so they work offline. There is no chart library. Read the design layer first, then build with the recipe.

A complete working bar chart, with every rule below applied, is in `evals/reference/5-chart-bars.html`. Copy it as a starting point.

## Design layer

Color comes LAST. Most bad charts pick colors first. The procedure:

1. **Pick the form** from the table below — and sometimes the right form is not a chart.
2. **Assign color by its job** — categorical, sequential, diverging, or status. Never cycled; never a rainbow.
3. **Apply the mark specs** below — thin marks, surface gaps, recessive axes.
4. **Add a legend** for ≥2 series and direct labels for ≤4; a single series needs no legend (the title names it).
5. **Add hover** — crosshair+tooltip on line/area, per-mark tooltip on bar/dot.
6. **Build and check.** Run `scripts/check.js` with `--hover` on one mark, then look at both screenshots.

### Choosing a form

| The data is… | Use | Not |
|---|---|---|
| A single current value (+ maybe a trend) | **Stat tile** — value + delta + sparkline | A one-bar bar chart |
| A handful of headline numbers | **KPI row** of stat tiles | A grouped bar chart |
| A single ratio against a limit | **Meter** (same-ramp track) | A 2-slice pie |
| More than ~7 classes that all matter | A **table** (or table + chart) | More colors |

If a chart is right, the data's job picks the type:

| Job | Form | Color job |
|---|---|---|
| Compare magnitude | bar / column; heatmap for a grid | sequential (one hue) |
| Trend over time | line; area for a single series | sequential or 1 categorical |
| Tell distinct series apart | grouped/stacked bar, multi-line | categorical |
| One series is the point, rest context | **emphasis** — highlight one, gray the rest | 1 hue + gray |
| Above/below a baseline; Δ to target | diverging bar or line vs baseline | diverging |
| Part-to-whole | stacked bar (horizontal for long names) | categorical |
| Before → after per item | dumbbell | 1 hue, 2 shades |

**Sequential is the safe default.** Categorical has a cost — it can bury the one point that matters. If the story is "this one went up," that's emphasis (one hue + gray), not categorical. Never solve "too many series" with more hues: past 8, fold into "Other" or use small multiples.

### Colors (all from theme.css)

- **Categorical**: `var(--series-1)` to `var(--series-8)`, always in that fixed order. The 9th series is never a generated hue — it folds into "Other" or small multiples.
- **Sequential** (magnitude — heatmap): one ramp, light to dark, e.g. `--blue-100` to `--blue-800`.
- **Diverging** (polarity — delta, above/below): `--blue-*` ↔ `--red-*` with `var(--diverging-mid)` at the midpoint — never a hue at the midpoint.
- **Status** (good / warning / serious / critical): `var(--status-good)`, `var(--status-warning)`, `var(--status-serious)`, `var(--status-critical)`. Reserved; never "series 4". Always paired with an icon or label, never color alone.

### Chart chrome

| Role | Token |
|---|---|
| Chart surface | `var(--surface-1)` |
| Primary ink (values, title) | `var(--text-primary)` |
| Secondary ink (legend, sub) | `var(--text-secondary)` |
| Muted (axis ticks, labels) | `var(--text-muted)` — must still reach 4.5:1 |
| Gridline (hairline) | `var(--grid)` |
| Baseline / axis line | `var(--baseline)` |
| Hairline border | `var(--border)` |

**Text wears text tokens, never the series color** — values, axis labels, and legend text stay in primary/secondary/muted ink; a small colored square beside the text carries identity.

### Mark specs

- **Bar/column**: ≤24px thick, 4px rounded data-end, square at baseline.
- **Line**: 2px stroke, round join/cap.
- **End-dot / marker**: ≥8px, filled with series color, 2px surface-color ring.
- **Area fill**: series hue at ~10% opacity.
- **Gridlines**: `var(--grid)`, 1px, recessive. No vertical gridlines on a time axis.
- **Surface gap**: 2px surface-color gap between touching marks (stacked segments, adjacent bars). Never a stroke around a mark.

### Non-negotiables

- **One y-axis.** Never a dual-axis chart. Two scales → two charts or indexed.
- **Color follows the entity, never its rank.** Filtering must not repaint.
- **Assign categorical hues in the fixed series order.**
- **Sequential = one hue. Diverging = two hues + neutral midpoint.** No rainbow.
- **Hero number** (stat tile): one figure in `var(--font-voice)` ≥48px, tabular + lining numerals. Everything else stays sans with tabular figures.

## Building a chart in SVG

### Canvas and plot area

Use `viewBox="0 0 680 H"` like every other diagram (300 is a good height for one chart). Keep a plot area inside it:

```js
const plot = { left: 64, right: 640, top: 48, bottom: H - 40 };
```

`left` leaves room for y-axis labels, `bottom` for x-axis labels, and `top` leaves 48px of headroom so tooltips have somewhere to go above the tallest mark.

### Scale

Round the axis maximum up to a nice number so the tallest mark never touches the top, and use 4–5 ticks:

```js
const niceStep = (raw) => {
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw);
};
const step = niceStep(peak / 4);
const max = Math.ceil((peak * 1.05) / step) * step;
const y = (v) => plot.bottom - (v / max) * (plot.bottom - plot.top);
```

### Axes and gridlines

- One horizontal 1px line per tick: `var(--grid)`, with the zero line in `var(--baseline)`.
- Tick labels: `class="ts"`, `fill: var(--text-muted)`, `text-anchor="end"` at `x = plot.left - 10`, `dominant-baseline="central"`.
- Category labels: `class="ts"`, muted, centred under each band at `plot.bottom + 18`.
- Format every number with `Intl.NumberFormat` — never print raw floats. Negative currency is `-$5M`, not `$-5M`.

### Bars

```js
const band = (plot.right - plot.left) / data.length;
const barW = Math.min(24, band * 0.6);
// Rounded data end, square at the baseline:
const d = `M${x} ${plot.bottom} V${top + 4} Q${x} ${top} ${x + 4} ${top} H${x + barW - 4} Q${x + barW} ${top} ${x + barW} ${top + 4} V${plot.bottom} Z`;
```

Give every data mark `class="mark"` and a `data-label`, plus `tabindex="0"` and an `aria-label` so it can be reached by keyboard. Value labels sit centred above the bar at `top - 12`.

### Lines and areas

A `<path>` with `fill="none"`, 2px stroke in the series color, `stroke-linejoin="round"`, `stroke-linecap="round"`. Areas reuse the same points closed down to the baseline, filled with the series color at ~10% opacity. Put an end-dot on the last point, and use invisible hit areas (`class="mark"`) at each point for hover.

### Tooltips

- One HTML `<div role="tooltip">` per chart, `position: absolute` inside a `position: relative` wrapper around the SVG, `pointer-events: none`.
- Show it on `mouseenter` and `focus`, hide on `mouseleave` and `blur`.
- **Place it centred above the hovered mark's value label**, then clamp it inside the wrapper:

```js
const scale = svg.getBoundingClientRect().width / 680;
const left = Math.max(0, Math.min(cx * scale - tip.offsetWidth / 2, wrap.clientWidth - tip.offsetWidth));
const topPx = Math.max(0, (markTop - 22) * scale - tip.offsetHeight);
```

- It must never cover another mark or label. `check.js --hover` fails if it does.
- For line charts, add a vertical crosshair (1px `var(--baseline)`) at the hovered x, and show every series' value in one tooltip.

### Legends

Build them in HTML above or below the chart, never inside it: small squares, tight spacing, and the value or percentage in each label when the data is categorical.

```html
<div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 8px; font-size: 12px; color: var(--text-secondary);">
  <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 10px; height: 10px; border-radius: 2px; background: var(--series-1);"></span>Chrome 65%</span>
  <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 10px; height: 10px; border-radius: 2px; background: var(--series-2);"></span>Safari 18%</span>
</div>
```

### Accessibility

- The `<svg>` carries `role="img"`, a `<title>` and a `<desc>` that lists the actual values.
- Start the fragment with a visually hidden `<h2 class="sr-only">` summarising what the chart shows.
- Never rely on color alone to tell series apart: pair color with a dash pattern (lines), marker shape (scatter) or hatching (bars).

### Dashboard layout

Wrap summary numbers in metric cards (see `references/ui.md`) above the chart. The chart flows below without a card wrapper.
