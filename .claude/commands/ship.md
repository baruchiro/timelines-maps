---
description: Pre-push verification — typecheck, lint, story-coverage, tests, build. Fix everything before declaring done.
---

Run the full pre-push sequence and report results. Do not skip any step. If a
step fails, stop and fix before continuing.

> **Adjust the commands below to your stack** (see the Commands table in
> `CLAUDE.md`). Keep the story-coverage step — it's stack-agnostic and is the
> point of this template.

1. **Typecheck** — `<your typecheck command>` must pass with zero errors.
2. **Lint** — `<your lint command>` must pass with zero errors (warnings ok
   unless the user says otherwise).
3. **Format** — `<your format:check command>`. If it fails, run the writer
   (`<your format:write command>`) and re-check.
4. **Story coverage** — `node scripts/check-stories.mjs` must pass (every story
   has a tagged test; no test references an unknown story ID).
5. **Tests** — `<your test command>` must be green.
6. **Build** — `<your build command>` must succeed.

When all steps pass, say so explicitly with the command outputs. If any step
fails, surface the failing command and the relevant error excerpt — do not
summarize away the actual error message.

Do not run `git push` automatically. The user pushes (or `/open-pr` does).
