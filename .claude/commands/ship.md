---
description: Pre-push verification — typecheck, lint, story-coverage, tests, build, browser tests. Fix everything before declaring done.
---

Run the full pre-push sequence and report results. Do not skip any step. If a
step fails, stop and fix before continuing.

1. **Typecheck** — `npm run typecheck` must pass with zero errors.
2. **Lint** — `npm run lint` must pass with zero errors.
3. **Format** — not applicable: no formatter is configured (ESLint only).
4. **Story coverage** — `npm run stories` must pass (every story has a tagged
   test; no test references an unknown story ID).
5. **Unit tests** — `npm test` must be green.
6. **Build** — `npm run build` must succeed.
7. **Browser tests** — `npm run e2e` (Playwright at 375×667; builds must be
   fresh — it serves `dist/` via `vite preview`).

`npm run check` runs all of the above in order.

When all steps pass, say so explicitly with the command outputs. If any step
fails, surface the failing command and the relevant error excerpt — do not
summarize away the actual error message.

Do not run `git push` automatically. The user pushes (or `/open-pr` does).
