# Testing diagram-guide

## Quick check: assets and scripts

```
node evals/run.js
```

Builds every reference diagram in `reference/` with `test-theme.css` (stand-in colours, not your theme) and runs `scripts/check.js` on each, in light and dark mode. All six should pass. Pages and screenshots go to `evals/out/`, which git ignores.

To check your own theme against the references, pass it in:

```
node evals/run.js --theme assets/theme.css
```

## Full check: the rules themselves

After editing `SKILL.md` or a reference file, test whether Claude still produces good diagrams from the guide alone:

1. Start a fresh Claude Code session with this skill installed.
2. Give it each `prompt` from `prompts.json`, one per session.
3. Run `scripts/check.js` on what it produced, with that prompt's `check_args`.
4. Compare its screenshots with the reference ones from `node evals/run.js`, and go through the prompt's `look_for` list.

A change is an improvement if the checks still pass and the `look_for` items hold for more prompts than before.

## Files

- `prompts.json` — the six prompts, expected diagram type, checker arguments, and what a good answer looks like.
- `reference/` — one passing fragment per prompt. These double as starting points for new diagrams.
- `test-theme.css` — stand-in colours so the references can render while `assets/theme.css` is blank.
- `run.js` — builds and checks every reference.
