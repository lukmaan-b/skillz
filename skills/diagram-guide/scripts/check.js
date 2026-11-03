#!/usr/bin/env node
// Renders a built diagram page in light and dark mode, screenshots it, and
// checks it against the guide's rules. Exits 1 if anything fails.
//
//   node check.js <page.html> [--click-all "<selector>"] [--hover "<selector>"]
//                 [--step "<selector>:<count>"] [--shots <dir>]
//
//   --click-all  click every match first (e.g. buttons that add data)
//   --hover      hover one element before checking (e.g. a chart bar)
//   --step       click a "next" control <count> times, checking after each
//
// Checks: blank theme values, text contrast of the theme, text outside the
// viewBox, text overflowing its box, overlapping labels, arrows crossing
// boxes or labels, text below 11px, missing text classes, thin outlines on
// freeform shapes, tooltips covering other marks, script errors, and any
// network request (pages must work offline).
const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  for (const from of [__dirname, process.cwd()]) {
    try { return require(require.resolve('playwright', { paths: [from] })); } catch (e) { /* try next */ }
  }
  console.error('Playwright is not installed. Install it with:\n  npm i -D playwright && npx playwright install chromium\n' +
    'If you cannot install it, open the page yourself in both modes and go through the manual checklist in SKILL.md.');
  process.exit(2);
}

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); if (i === -1) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
const clickAll = opt('--click-all');
const hover = opt('--hover');
const stepArg = opt('--step');
const shotsDir = opt('--shots');
const pagePath = args[0] && path.resolve(args[0]);
if (!pagePath || !fs.existsSync(pagePath)) {
  console.error('Usage: node check.js <page.html> [--click-all sel] [--hover sel] [--step sel:count] [--shots dir]');
  process.exit(2);
}
const [stepSel, stepCount] = stepArg ? [stepArg.slice(0, stepArg.lastIndexOf(':')), Number(stepArg.slice(stepArg.lastIndexOf(':') + 1))] : [];

function themeAudit() {
  const issues = [];
  const blanks = new Set();
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; }
    for (const r of rules) {
      if (!r.style) continue;
      for (const prop of r.style) if (prop.startsWith('--') && r.style.getPropertyValue(prop).trim() === '____') blanks.add(prop);
    }
  }
  if (blanks.size) issues.push(`FAIL: theme has ${blanks.size} blank values (____), e.g. ${[...blanks].slice(0, 6).join(', ')}. Fill in assets/theme.css.`);
  const probe = document.createElement('span');
  document.body.appendChild(probe);
  const colour = (v) => { probe.style.color = ''; probe.style.color = `var(${v})`; return getComputedStyle(probe).color; };
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b] = m[1].split(',').map(Number); return { r, g, b }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  if (!blanks.size) {
    for (const surface of ['--surface-0', '--surface-1']) {
      const bg = parse(colour(surface));
      for (const text of ['--text-primary', '--text-secondary', '--text-muted', '--text-accent', '--text-danger', '--text-success', '--text-warning']) {
        const fg = parse(colour(text));
        if (!fg || !bg) continue;
        const c = ratio(fg, bg);
        if (c < 4.5) issues.push(`${text.match(/primary|secondary|muted/) ? 'FAIL' : 'warn'}: theme ${text} on ${surface} is ${c.toFixed(2)}:1 (needs 4.5:1)`);
      }
    }
  }
  probe.remove();
  return issues;
}

function svgAudit(skipContrast) {
  const parse = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(',').map(Number); return { r, g, b, a }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const pageBg = parse(getComputedStyle(document.documentElement).backgroundColor);
  const issues = [];
  document.querySelectorAll('svg[viewBox]').forEach((svg) => {
    if (svg.closest('[hidden]') || svg.getBoundingClientRect().width === 0) return;
    const generated = svg.hasAttribute('aria-roledescription');
    const vb = svg.viewBox.baseVal;
    const texts = [...svg.querySelectorAll('text')].filter((t) => t.textContent.trim() && t.getBBox().width > 0);
    const rects = [...svg.querySelectorAll('rect')].filter((r) => r.getBBox().width > 0);
    const box = (e) => { const b = e.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.x + b.width, btm: b.y + b.height }; };
    const inside = (p, b, pad = 0) => p.x > b.x - pad && p.x < b.r + pad && p.y > b.y - pad && p.y < b.btm + pad;
    const label = (t) => `"${t.textContent.trim().slice(0, 28)}"`;
    const tb = texts.map(box);
    const rb = rects.map(box);
    const svgName = svg.querySelector('title') ? svg.querySelector('title').textContent.trim() : 'svg';

    texts.forEach((t, i) => {
      const b = tb[i];
      if (!generated && !/\b(t|ts|th)\b/.test(t.getAttribute('class') || '')) issues.push(`warn: [${svgName}] text ${label(t)} has no t/ts/th class`);
      const size = parseFloat(getComputedStyle(t).fontSize);
      if (size < 11) issues.push(`FAIL: [${svgName}] text ${label(t)} is ${size}px (minimum 11px)`);
      if (b.x < 0 || b.y < 0 || b.r > vb.width || b.btm > vb.height) issues.push(`FAIL: [${svgName}] text ${label(t)} is outside the viewBox`);
      const centre = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      const holders = rb.map((r, j) => ({ r, j })).filter(({ r }) => inside(centre, r)).sort((a, c) => a.r.w * a.r.h - c.r.w * c.r.h);
      let bg = pageBg;
      if (holders.length) {
        const { r, j } = holders[0];
        const over = Math.max(r.x - b.x, b.r - r.r, r.y - b.y, b.btm - r.btm);
        if (over > 0.5) issues.push(`FAIL: [${svgName}] text ${label(t)} overflows its box by ${over.toFixed(1)}px`);
        else if (!generated && r.w < 300 && Math.min(b.x - r.x, r.r - b.r) < 8) issues.push(`warn: [${svgName}] text ${label(t)} is ${Math.min(b.x - r.x, r.r - b.r).toFixed(1)}px from its box edge (aim for 12px)`);
        const fill = parse(getComputedStyle(rects[j]).fill);
        if (fill && fill.a > 0.5) bg = fill;
      }
      const fg = parse(getComputedStyle(t).fill);
      if (!skipContrast && fg && bg) {
        const c = ratio(fg, bg);
        if (c < 3) issues.push(`FAIL: [${svgName}] text ${label(t)} contrast ${c.toFixed(2)}:1`);
        else if (c < 4.5) issues.push(`warn: [${svgName}] text ${label(t)} contrast ${c.toFixed(2)}:1 (aim for 4.5:1)`);
      }
    });

    for (let i = 0; i < tb.length; i++) for (let j = i + 1; j < tb.length; j++) {
      const a = tb[i], b = tb[j];
      if (Math.min(a.r, b.r) - Math.max(a.x, b.x) > 1 && Math.min(a.btm, b.btm) - Math.max(a.y, b.y) > 1) {
        issues.push(`FAIL: [${svgName}] text ${label(texts[i])} overlaps ${label(texts[j])}`);
      }
    }

    svg.querySelectorAll('line.arr, path.arr, polyline.arr, line.leader, path.leader').forEach((ln) => {
      const pts = [];
      if (ln.tagName === 'line') {
        const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((k) => +ln.getAttribute(k));
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        for (let d = 0; d <= len; d += 2) pts.push({ x: x1 + ((x2 - x1) * d) / len, y: y1 + ((y2 - y1) * d) / len });
      } else {
        const len = ln.getTotalLength();
        for (let d = 0; d <= len; d += 2) pts.push(ln.getPointAtLength(d));
      }
      const start = pts[0], end = pts[pts.length - 1], mid = pts.slice(4, -4);
      const name = `${ln.getAttribute('class')} line from (${Math.round(start.x)},${Math.round(start.y)})`;
      texts.forEach((t, i) => { if (mid.some((p) => inside(p, tb[i], 2))) issues.push(`FAIL: [${svgName}] ${name} crosses text ${label(t)}`); });
      rb.forEach((r) => {
        if (inside(start, r) || inside(end, r)) return;
        const level = ln.classList.contains('leader') ? 'warn' : 'FAIL';
        if (mid.some((p) => inside(p, { x: r.x + 1, y: r.y + 1, r: r.r - 1, btm: r.btm - 1 }))) issues.push(`${level}: [${svgName}] ${name} crosses the box at (${Math.round(r.x)},${Math.round(r.y)})`);
      });
    });

    if (!generated) {
      svg.querySelectorAll('polygon, ellipse, circle, path').forEach((s) => {
        const cls = s.getAttribute('class') || '';
        const parentCls = (s.parentElement && s.parentElement.getAttribute('class')) || '';
        if (/\b(arr|leader|c-[a-z]+(-2)?)\b/.test(cls + ' ' + parentCls) || s.closest('marker, defs, clipPath')) return;
        const st = getComputedStyle(s);
        const filled = st.fill !== 'none';
        const stroked = st.stroke !== 'none' && parseFloat(st.strokeWidth) > 0;
        if (filled && stroked && parseFloat(st.strokeWidth) < 1 && s.getBBox().width > 40) {
          issues.push(`warn: [${svgName}] freeform ${s.tagName} outline is ${st.strokeWidth}; use class="shape" or 1px so it stays visible`);
        }
      });
    }
  });
  return issues;
}

function tooltipAudit(hoverSel) {
  const issues = [];
  const tips = [...document.querySelectorAll('[role="tooltip"]')].filter((t) => {
    const st = getComputedStyle(t);
    return st.display !== 'none' && st.visibility !== 'hidden' && parseFloat(st.opacity) > 0 && t.getBoundingClientRect().width > 0;
  });
  const hovered = document.querySelector(hoverSel);
  const rect = (e) => e.getBoundingClientRect();
  const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
  if (!tips.length) issues.push('warn: hovering did not show any element with role="tooltip"');
  tips.forEach((tip) => {
    const tr = rect(tip);
    document.querySelectorAll('.mark').forEach((m) => {
      if (m === hovered) return;
      if (hit(tr, rect(m))) issues.push(`FAIL: tooltip covers another mark (${m.getAttribute('data-label') || m.tagName})`);
    });
    document.querySelectorAll('svg text').forEach((t) => {
      if (t.textContent.trim() && hit(tr, rect(t))) issues.push(`FAIL: tooltip covers label "${t.textContent.trim().slice(0, 24)}"`);
    });
    const frame = tip.offsetParent ? rect(tip.offsetParent) : null;
    if (frame && (tr.left < frame.left - 1 || tr.right > frame.right + 1)) issues.push('FAIL: tooltip runs outside its container');
  });
  return issues;
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const base = pagePath.replace(/\.html?$/, '');
  const outBase = shotsDir ? path.join(path.resolve(shotsDir), path.basename(base)) : base;
  if (shotsDir) fs.mkdirSync(path.resolve(shotsDir), { recursive: true });
  let failed = false;
  const shots = [];

  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 760, height: 1000 }, deviceScaleFactor: 2 });
    const problems = [];
    page.on('pageerror', (e) => problems.push(`FAIL: script error: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') problems.push(`FAIL: console error: ${m.text()}`); });
    page.on('request', (r) => { if (!/^(file|data|about|blob):/.test(r.url())) problems.push(`FAIL: network request to ${r.url()} (pages must work offline)`); });
    await page.goto('file://' + pagePath + '?mode=' + mode);
    await page.waitForTimeout(400);
    problems.push(...await page.evaluate(themeAudit));
    const themeBlank = problems.some((p) => p.includes('blank values'));
    if (clickAll) {
      for (const el of await page.$$(clickAll)) await el.click();
      await page.waitForTimeout(500);
    }
    if (hover) {
      await page.hover(hover);
      await page.waitForTimeout(300);
      problems.push(...await page.evaluate(tooltipAudit, hover));
    }
    problems.push(...await page.evaluate(svgAudit, themeBlank));
    if (stepSel) {
      for (let s = 1; s <= stepCount; s++) {
        await page.click(stepSel);
        await page.waitForTimeout(150);
        problems.push(...(await page.evaluate(svgAudit, themeBlank)).map((p) => `step ${s}: ${p}`));
      }
    }
    const main = await page.$('main') || await page.$('body');
    const shot = `${outBase}.${mode}.png`;
    await main.screenshot({ path: shot });
    shots.push(shot);
    const unique = [...new Set(problems)];
    console.log(`\n[${mode}] ${unique.length ? '' : 'ok'}`);
    unique.forEach((p) => console.log('  ' + p));
    if (unique.some((p) => p.includes('FAIL'))) failed = true;
    await page.close();
  }
  await browser.close();
  console.log(`\nScreenshots: ${shots.map((s) => path.relative(process.cwd(), s)).join(', ')}`);
  console.log(failed ? 'Result: FAIL — fix every FAIL above, look at the screenshots, and run again.' : 'Result: pass. Look at both screenshots before handing over.');
  process.exit(failed ? 1 : 0);
})();
