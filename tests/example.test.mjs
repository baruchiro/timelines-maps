// @story: CORE-1
//
// Example test — proves the story-coverage loop end to end. The `@story:`
// header above ties this test to CORE-1 in STORIES.md; `check-stories.mjs`
// reads that comment. Uses Node's built-in test runner (no dependencies):
//   node --test
// Replace this with your real tests once you pick a test runner.
import { test } from "node:test";
import assert from "node:assert/strict";

test("CORE-1: the template's story gate has something real to cover", () => {
  assert.equal(1 + 1, 2);
});
