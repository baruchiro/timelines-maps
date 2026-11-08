# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

> **This is a vibe-coding template.** The sections under
> [Project-specific](#project-specific-fill-these-in) are placeholders — fill
> them in for your project and delete the `FILL IN` notes. Everything under
> [How we work](#how-we-work-portable-defaults) is portable process that should
> carry across projects unchanged. See `README.md` for setup.

---

## First run — the project is still empty

**Read this before writing any code in a fresh clone.** You can tell the
template hasn't been made into a real project yet when *any* of these are true:

- `CLAUDE.md` still contains `<!-- FILL IN -->` placeholders under
  [Project-specific](#project-specific-fill-these-in),
- `STORIES.md` still contains the `CORE-1` / `CORE-2` example stories,
- `tests/example.test.mjs` still exists.

In that state, **do not jump into building features.** Plan the project first.
Invoke the `/plan-project` skill (`.claude/skills/plan-project/SKILL.md`). It
orchestrates the bundled `brainstorming` and `writing-plans` skills (from the
[`obra/superpowers`](https://github.com/obra/superpowers) collection) and turns
the user's idea into a real starting point:

1. Clarify the idea — problem, users, the one constraint that matters, what
   "done enough to ship" looks like.
2. After clarifying requirements, get approval for the **smallest sufficient
   implementation form** — skill with scripts, local MCP, a combination, or an
   application — before locking the stack. Justify a remote server and a custom
   UI separately. Fill in the `Project-specific` sections of this file and
   delete the `FILL IN` notes; mark unnecessary components as not applicable.
3. Draft the **initial stories** and get them approved (stories are
   approval-gated — see below), then replace the `CORE-*` examples in
   `STORIES.md`. Mark not-yet-built ones `<!-- @unimplemented -->`.
4. Point `/ship` and `.github/workflows/ci.yml` at the stack's real commands
   (keep the `node scripts/check-stories.mjs` step).
5. Pick the **first vertical slice** and hand off to implement it test-first.

Delete `tests/example.test.mjs` once real tests exist, and delete this whole
"First run" section once the project is underway.

---

## How we work (portable defaults)

These are the process rules that make a project safe to hand to an AI agent
end-to-end. They don't depend on the stack — keep them as-is unless you have a
concrete reason to change them.

### Choose the smallest sufficient implementation

Do not assume a new project needs a full-stack application. During initial
requirements/design work, and **before locking a stack, scaffolding code, or
installing infrastructure**, ask:

> Can the required outcome be delivered as a skill with local scripts, a local
> MCP server, or both, without a deployed server or a custom user interface?

Compare those options against an application using the actual requirements.
Recommend the simplest sufficient option, explain the trade-offs, and get the
owner's explicit approval. Record the decision in the design spec and this
file's Project-specific section. If new requirements change the answer, revisit
the decision before adding infrastructure.

- **Skill with scripts:** instructions/workflow plus executable helpers, using
  the agent's existing tools and interface. Prefer this when it covers the need.
- **Local MCP server:** a standardized protocol for exposing tools (and, where
  useful, resources/prompts) to MCP clients. Add this layer only for a concrete
  need such as reuse by multiple compatible clients or protocol-level discovery
  and structured tool contracts — not merely because a script calls an API.
- **Combination:** a skill guides the workflow and MCP exposes reusable tools;
  justify why both layers are useful rather than duplicating them by default.
- **Application:** identify the specific unmet requirements before adding a
  deployed service or custom UI. Justify each separately; one does not imply the
  other. An existing chat/agent interface may already satisfy interaction needs.

Deployment and API access are separate decisions. Both scripts and local MCP
servers can call existing remote APIs; this does **not** require deploying a new
server. MCP can also operate entirely on local data via `stdio`. MCP and skills
are therefore not distinguished by whether they access a remote service.

This is an owner-approved planning gate, not an automated architecture detector.
Keep stories, tests and verification for the chosen form; do not manufacture a
web frontend, backend, database, dev server or build step just to fill a template.

### Stories workflow (approval-gated)

`STORIES.md` at the repo root is the **source of truth for product behavior**.
It is **approval-gated**: every add, edit, or delete of a story requires
explicit approval from the repository owner *before* the file is touched.
Propose the exact text in chat, wait for "approved", then write.

Coverage is enforced automatically:

- Each test that exercises a story declares it via a comment header near the
  top of the test file:
  ```ts
  // @story: CORE-1, CORE-2
  ```
- `scripts/check-stories.mjs` parses `STORIES.md` for story IDs, scans your test
  files for `@story:` annotations, and fails if:
  - any story has zero covering tests, or
  - a test references a story ID that no longer exists in `STORIES.md`.
- Wire the script into your pre-push gate and CI (see
  [After any code change](#after-any-code-change) and `.github/workflows/ci.yml`).

The check verifies that *a test exists tagged with the story's ID*, not that the
test actually proves the story. Honest tagging is on us — writing tests
test-first keeps it honest.

When implementing or changing a story: write the test(s) first, tag them, then
write the code. When deleting a story: remove or retag its tests in the **same**
commit.

**Story IDs** are `PREFIX-N` (e.g. `CORE-1`, `AUTH-3`). Group by feature area;
the prefix is yours to choose.

**Unimplemented stories.** A story can be recorded ahead of its implementation
(e.g. a roadmap commitment) without a vacuous placeholder test by adding an
`<!-- @unimplemented -->` marker line inside its section in `STORIES.md`. The
coverage gate then exempts that story (and reports it as exempt) instead of
failing. This is the *only* sanctioned way to land a story with no covering
tests — remove the marker in the same change that adds the real tagged tests.
The marker is an HTML comment, so it doesn't render in the published file.

### After any code change

Run your project's full local gate — **typecheck + lint + story-coverage +
tests** — and fix everything before declaring the change done. No "looks done
but doesn't compile" / "looks done but tests fail" / "looks done but a story is
uncovered" claims.

The `/ship` command (`.claude/commands/ship.md`) runs this sequence. Adjust the
concrete commands in that file to match your stack; keep the story-coverage step
(`node scripts/check-stories.mjs`) in the sequence.

### Verifying your change

Passing the gate is necessary, not sufficient. Before claiming a task done,
actually exercise the behavior:

- **UI changes** (pages, components, styling, routing, client state): drive the
  change in a real browser — the `playwright-cli` skill (preferred; cheaper in
  context than the Playwright MCP), **mobile-first** at `375×667`. Snapshot the accessibility tree, exercise the golden path plus 1–2
  adjacent flows that could have regressed, and watch the console/network for
  silent failures. If the UI is broken at 375px, the design is broken.
- **Backend-only changes** (APIs, schema, library code with no rendered
  surface): the typecheck + unit tests are the verification. Say so and skip the
  browser rather than theater-testing a landing page.

Honest caveats — state these explicitly rather than faking success: auth-gated
routes may need a real sign-in you can't complete headless; a change you can't
reach without seeded data or tokens can't be claimed as "tested" if you only
loaded the landing page.

### Opening a PR

Use the `/open-pr` skill (`.claude/skills/open-pr/SKILL.md`). It runs the local
gate, pushes the branch, and opens the PR. **Do not create a PR unless asked**
(or unless working a GitHub issue — see below, where every issue gets a PR).

For UI changes, include a screenshot of the change in the PR body. For
backend-only changes, note "no UI surface changed" instead.

### GitHub issue workflow

When picking up a GitHub issue, do these **before writing any code**:

1. **Assign** the issue to the repo owner via `mcp__github__issue_write`
   (`method: update`, `assignees: ["<owner>"]`).
2. **Comment** on the issue with the current session link:
   > Picking this up. Session: https://claude.ai/code/session_<id>
3. **Branch name** — create a branch named `{issue-number}-{short-slug}`
   (e.g. `18-mobile-row`). GitHub links branches whose name starts with the
   issue number to that issue's development section. Use
   `mcp__github__create_branch`, then `git fetch` + `git checkout`.
4. **Open a PR** after the first push via `/open-pr`. The PR body must end with a
   closing keyword on its own line so the issue auto-closes on merge:
   ```
   Closes #{issue-number}
   ```
   Also include the session link. Every issue gets a PR — features, bugs,
   polish, infra alike.

### Working style

- **Plan first** before any non-trivial change. Course-correct in English, not
  in diffs.
- **Vertical slices**: a feature means "this behavior visible end-to-end", not
  "all the plumbing first, then the UI."
- **@-mention paths** when referencing files (e.g. `@src/index.ts`) — don't make
  the reader guess.
- **Subagents** (e.g. `general-purpose` for research, `Explore` for read-only
  code search) keep the main context clean on big jobs.
- **Superpowers skills** are vendored in `.claude/skills/` — invoke them by name
  (`test-driven-development`, `systematic-debugging`,
  `verification-before-completion`, `requesting-code-review`, …) instead of
  reinventing the process. `README.md` lists the full set.

---

## Project-specific (fill these in)

<!-- FILL IN: replace each placeholder below and delete these notes. -->

### Project purpose

<!-- FILL IN: one or two paragraphs — what this project is, who it's for, and
     the key constraint or gap it exists to close. -->

### Stack (locked)

<!-- FILL IN: pin your runtime, framework, language, data layer, styling, test
     runner, and lint/format tools with versions. State the rule: versions are
     pinned — do not introduce parallel libraries (e.g. don't add a second HTTP
     client or date library). -->

<!-- FILL IN: record the approved implementation form and why it is sufficient.
     Record whether a new remote server and custom UI are needed, with a
     requirement-based reason for each. For MCP, record why the protocol layer
     is needed instead of scripts alone. Mark absent components not applicable;
     do not add infrastructure to satisfy these placeholders. -->

### File layout

<!-- FILL IN: a short tree of the important directories and what lives where. -->

### Commands

<!-- FILL IN: the commands a contributor actually runs. Keep the gate commands
     (typecheck / lint / test / story-coverage) accurate — /ship and CI depend
     on them. -->

| Purpose | Command |
|---|---|
| Dev server | `<fill in>` |
| Typecheck | `<fill in>` |
| Lint | `<fill in>` |
| Tests | `<fill in>` |
| Story coverage | `node scripts/check-stories.mjs` |
| Build | `<fill in>` |

### Environment variables

<!-- FILL IN: where env vars are defined/validated, and the add-a-var checklist.
     Keep `.env` gitignored and `.env.example` committed. -->

### First-time setup (fresh checkout)

<!-- FILL IN: the numbered steps to go from clone to running locally. -->
