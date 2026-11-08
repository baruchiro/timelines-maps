# vibe-coding-template

A starting point for AI-driven ("vibe coding") projects. It ships the
**process** that makes a repo safe to hand to an agent end-to-end — not a stack.
Choose the smallest sufficient implementation and keep the workflow — a skill
with scripts or local MCP may be enough; an application is not the default.

Distilled from [`baruchiro/github-management`](https://github.com/baruchiro/github-management).

## What's in the box

| File | Purpose |
|---|---|
| `CLAUDE.md` | The agent's guide. Portable "how we work" rules + placeholders for your stack. |
| `STORIES.md` | Source of truth for product behavior. Approval-gated, coverage-enforced. |
| `scripts/check-stories.mjs` | Fails the build if a story has no tagged test (or a test tags an unknown story). Stack-agnostic. |
| `tests/example.test.mjs` | A working example test tagged `// @story: CORE-1`, so the loop is green from the first commit. |
| `.claude/skills/plan-project/SKILL.md` | `/plan-project` — the first-run kickoff: orchestrates the planning skills (optionally `grill-me` → `brainstorming` → `writing-plans`) and adds STORIES.md + toolchain wiring. |
| `.claude/skills/<superpowers>/` | The full [`obra/superpowers`](https://github.com/obra/superpowers) skill set (14 skills) vendored via `npx skills`. Recorded in `skills-lock.json`; update with `npx skills update`. |
| `.claude/skills/grill-me/`, `.claude/skills/grilling/` | A stateless, relentless-interview skill for sharpening a loose idea into concrete decisions before design starts, vendored from [`mattpocock/skills`](https://github.com/mattpocock/skills) via `npx skills`. `/plan-project` reaches for it first when the idea is still loose; `grill-me` is the user-invoked front door (`/grill-me`), `grilling` is the underlying interview it forwards to. |
| `.claude/commands/ship.md` | `/ship` — the pre-push gate (typecheck, lint, story-coverage, tests, build). |
| `.claude/skills/open-pr/SKILL.md` | `/open-pr` — run the gate, push, open the PR. |
| `.claude/skills/playwright-cli/` | Browser automation for agents, vendored via `playwright-cli install --skills`. Backs the "verify UI changes in a real browser" rule. Needs the CLI binary — `/plan-project` walks the install. |
| `.github/workflows/ci.yml` | CI. The story-coverage job runs as-is; the rest is a placeholder for your stack. |

## The workflow in one paragraph

Behavior is written down as **stories** in `STORIES.md` before it's built, and
every story change needs the owner's approval. Each story earns at least one
test tagged `// @story: <ID>`; a coverage gate fails the build if any story is
untested or a test references a story that doesn't exist. Before pushing, `/ship`
runs the whole gate. PRs go out through `/open-pr`. Picking up a GitHub issue has
a fixed opening (assign → comment session link → branch `{issue}-{slug}` → PR
that `Closes #N`). It's all spelled out in `CLAUDE.md`.

## Starting a new project from this template

1. Copy these files into your new repo (or use it as a GitHub template repo).
2. **Kick off with the agent**: describe your idea and run `/plan-project`. It
   walks the empty-project bootstrap — sharpen a loose idea (`grill-me`), get
   approval for the implementation form, lock only the needed toolchain, draft
   approved stories, wire the toolchain, pick the first slice.
   `CLAUDE.md`'s "First run" section tells the agent to do this before writing
   any code.

   Doing it by hand instead? Steps 3–6 are that flow spelled out:
3. Before picking a stack, compare a skill with local scripts, local MCP, a
   combination, and an application against the requirements. Get the owner's
   approval for the smallest sufficient form. Justify a deployed server and a
   custom UI separately. MCP is a tool protocol, not a synonym for a remote
   service: scripts and local MCP can both call existing APIs, and MCP can work
   entirely locally. Add MCP only when its standardized client-facing interface
   earns the extra layer; API access alone is not a reason.
   Fill in every `<!-- FILL IN -->` section of `CLAUDE.md` — stack, commands,
   layout, env vars, setup. Record the approved form, mark unnecessary components
   not applicable, and delete the notes as you go. Do not create infrastructure
   just to fill a placeholder.
4. Point the `/ship` command and `.github/workflows/ci.yml` at your real
   commands. Keep the `node scripts/check-stories.mjs` step.
5. Replace the two `CORE-*` example stories in `STORIES.md` with your own (get
   them approved first), and replace `tests/example.test.mjs` with real tests.
6. Verify the loop is green:
   ```sh
   node scripts/check-stories.mjs
   node --test           # or your test runner
   ```

## Superpowers skills (vendored from a global collection)

The whole [`obra/superpowers`](https://github.com/obra/superpowers) skill set is
pulled in with the [`skills`](https://www.npmjs.com/package/skills) CLI and
committed here, so every clone has it offline:

```sh
npx skills add obra/superpowers --skill '*' -a claude-code -y
```

**Planning** — what `/plan-project` orchestrates:

- **`brainstorming`** — idea → approved design spec (hard-gates code until the
  design is approved).
- **`writing-plans`** — spec → bite-sized, test-first implementation plan.

**Executing** a written plan:

- **`executing-plans`** — run a plan in a separate session with review
  checkpoints.
- **`subagent-driven-development`** — run a plan's independent tasks in the
  current session.
- **`dispatching-parallel-agents`** — 2+ tasks with no shared state or ordering.
- **`using-git-worktrees`** — isolate feature work from the current workspace.

**Writing code** — these reinforce rules `CLAUDE.md` already states:

- **`test-driven-development`** — test first, then implementation.
- **`systematic-debugging`** — diagnose before proposing a fix.
- **`verification-before-completion`** — evidence before any "it's done" claim.

**Wrapping up:**

- **`requesting-code-review`** / **`receiving-code-review`** — ask for review;
  handle feedback with rigor instead of agreement.
- **`finishing-a-development-branch`** — decide how to integrate finished work.

**Meta:**

- **`using-superpowers`** — how to find and invoke skills.
- **`writing-skills`** — create, edit, and verify skills.

Provenance is pinned in `skills-lock.json`; refresh with `npx skills update -p`.
Browse the collection with `npx skills add obra/superpowers --list`.

## The story-coverage gate

```sh
node scripts/check-stories.mjs
```

It scans common source dirs for test files and reads their `@story:` comment
headers. Override where it looks with env vars if your layout is unusual:

- `STORY_TEST_ROOTS` — comma-separated dirs to scan (default: `src,app,lib,test,tests,e2e,spec,packages`, whichever exist).
- `STORY_TEST_GLOB` — a JS RegExp source string for test filenames (default covers `.test.`/`.spec.`/`_test.`/`test_*.py` across common languages).
