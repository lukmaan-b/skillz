#!/usr/bin/env node
// Wraps a diagram fragment into a standalone, offline HTML page.
//
//   node build.js <fragment.html> <out.html> [--title "Text"] [--mermaid] [--theme path/to/theme.css]
//
// The page inlines assets/theme.css and assets/base.css, adds a light/dark
// switch, and (with --mermaid) inlines the bundled Mermaid library so ERDs
// render without any network access.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const has = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return false;
  args.splice(i, 1);
  return true;
};

const skillDir = path.resolve(__dirname, '..');
const themePath = path.resolve(flag('--theme') || path.join(skillDir, 'assets', 'theme.css'));
const titleArg = flag('--title');
const withMermaid = has('--mermaid');
const [fragmentPath, outPath] = args;
if (!fragmentPath || !outPath) {
  console.error('Usage: node build.js <fragment.html> <out.html> [--title "Text"] [--mermaid] [--theme theme.css]');
  process.exit(2);
}

const read = (p) => fs.readFileSync(p, 'utf8');
const fragment = read(fragmentPath);
const theme = read(themePath);
const base = read(path.join(skillDir, 'assets', 'base.css'));
const template = read(path.join(skillDir, 'assets', 'template.html'));

const svgTitle = fragment.match(/<title[^>]*>([^<]+)<\/title>/);
const title = titleArg || (svgTitle ? svgTitle[1].trim() : path.basename(outPath, '.html'));
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let head = '';
if (withMermaid) {
  const lib = read(path.join(skillDir, 'assets', 'vendor', 'mermaid.min.js')).replace(/<\/script/gi, '<\\/script');
  head = `<script>${lib}</script>`;
}

const page = template
  .replace('{{TITLE}}', () => escapeHtml(title))
  .replace('{{THEME}}', () => theme)
  .replace('{{BASE}}', () => base)
  .replace('{{HEAD}}', () => head)
  .replace('{{DIAGRAM}}', () => fragment.trim());

fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(outPath, page);

const blanks = (theme.match(/:\s*____\s*;/g) || []).length;
console.log(`Built ${outPath}`);
if (blanks) console.warn(`Warning: ${path.relative(process.cwd(), themePath)} still has ${blanks} blank values (____). Fill them in, or check.js will fail.`);
