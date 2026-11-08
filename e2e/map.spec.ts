// @story: MAP-1, MAP-2, LAYER-1
import { expect, test } from "@playwright/test";
import { label, waitForUrl } from "./helpers";

test("lands on a loaded layer with its events on the map", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  // First layer (alphabetical) is preselected; its events are all inside the opening window.
  await expect(page.getByLabel("תרבויות עתיקות").first()).toBeChecked();
  for (const id of ["ancient-egypt", "roman-empire", "ancient-greece", "maya"]) {
    await expect(label(page, `ancient-civilizations/${id}`)).toBeAttached();
  }
  await expect(label(page, "world-wars/ww1")).toHaveCount(0);
});

test("the map pans and zooms", async ({ page }) => {
  await page.goto("/?map=30,20,2");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await waitForUrl(page, /map=30,20,3/);
  const canvas = (await page.locator(".maplibregl-canvas").boundingBox())!;
  await page.mouse.move(canvas.x + 100, canvas.y + 100);
  await page.mouse.down();
  await page.mouse.move(canvas.x + 200, canvas.y + 150, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => new URL(page.url()).searchParams.get("map")).not.toMatch(/^30,20,/);
});
