#!/usr/bin/env node
// Builds every reference diagram with the test theme and runs check.js on it.
// Use this after changing base.css, the template or the scripts.
//
//   node evals/run.js [--theme ../assets/theme.css]
//
// Output goes to evals/out/ (git-ignored): one page and two screenshots per diagram.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const here = __dirname;
const scripts = path.join(here, '..', 'scripts');
const themeIndex = process.argv.indexOf('--theme');
const theme = themeIndex > -1 ? path.resolve(process.argv[themeIndex + 1]) : path.join(here, 'test-theme.css');
const out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });

const prompts = JSON.parse(fs.readFileSync(path.join(here, 'prompts.json'), 'utf8'));
let failures = 0;
for (const p of prompts) {
  const fragment = path.join(here, 'reference', `${p.id}.html`);
  const page = path.join(out, `${p.id}.html`);
  execFileSync('node', [path.join(scripts, 'build.js'), fragment, page, '--theme', theme, ...p.build_args], { stdio: 'pipe' });
  try {
    const result = execFileSync('node', [path.join(scripts, 'check.js'), page, ...p.check_args], { encoding: 'utf8' });
    console.log(`PASS ${p.id}${/warn:/.test(result) ? ' (with warnings)' : ''}`);
    result.split('\n').filter((l) => l.includes('warn:')).forEach((l) => console.log('   ' + l.trim()));
  } catch (e) {
    failures++;
    console.log(`FAIL ${p.id}`);
    (e.stdout || '').split('\n').filter((l) => /FAIL|warn/.test(l) && !l.startsWith('Result')).forEach((l) => console.log('   ' + l.trim()));
  }
}
console.log(`\n${prompts.length - failures}/${prompts.length} reference diagrams pass. Screenshots are in ${path.relative(process.cwd(), out)}.`);
process.exit(failures ? 1 : 0);
