# Stories

> This file is the source of truth for product behavior. Every change to a
> story — adding, editing, deleting — requires explicit approval from the
> repository owner. Code and tests adapt to the stories, not the other way
> around. See `CLAUDE.md` § "Stories workflow" for the test-coverage rule.

<!--
  How this file works
  ===================
  - Each story is a `## PREFIX-N — Short title` heading followed by a
    user-story paragraph ("As a ..., I want ..., so that ...").
  - PREFIX groups a feature area (CORE, AUTH, INBOX, ...); N is sequential
    within the prefix. IDs are permanent — don't renumber.
  - Every story needs at least one test tagged with its ID:
        // @story: CORE-1
    `node scripts/check-stories.mjs` fails the build if any story is uncovered
    or a test references an unknown ID.
  - To record a story before it's built, add `<!-- @unimplemented -->` inside
    its section; the gate exempts it until you remove the marker in the same
    change that adds the real tagged tests.
  - Delete the example below once you have real stories.
-->

## CORE-1 — Example story (replace me)

As a user of this template, I want a first story to exist so that the
story-coverage gate has something to check and I can see the workflow end to
end, so that adding my own stories is copy-paste from here.

## CORE-2 — Example unimplemented story (replace me)

<!-- @unimplemented -->

As a maintainer, I want to record a planned-but-unbuilt story without a
placeholder test, so that the roadmap lives in the same file as shipped
behavior without breaking the coverage gate.
