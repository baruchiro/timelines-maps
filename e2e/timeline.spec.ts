// @story: TIME-1, TIME-2, MAP-2
import { expect, test } from "@playwright/test";
import { label, wheelTimeline, windowText } from "./helpers";

test("opens on the full range of the selected layers, with a bar per event", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("window-label")).toContainText('לפנה"ס');
  await expect(page.getByTestId("window-label")).toContainText("לספירה");
  await expect(page.locator('.timeline-event[data-layer="ancient-civilizations"]')).toHaveCount(4);
});

test("dragging and zooming the timeline changes what the map shows", async ({ page }) => {
  // Narrow window: the Roman Empire is visible, Greece (ended 146 BCE) is not.
  await page.goto("/?layers=ancient-civilizations&t=300,400");
  await expect(label(page, "ancient-civilizations/roman-empire")).toBeAttached();
  await expect(label(page, "ancient-civilizations/ancient-greece")).toHaveCount(0);

  // Drag toward the past (time runs left→right, so drag right) until Greece appears.
  const box = (await page.getByTestId("timeline").boundingBox())!;
  for (let i = 0; i < 6; i++) {
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
  }
  await expect(page.getByTestId("window-label")).toContainText('לפנה"ס');
  await expect(label(page, "ancient-civilizations/ancient-greece")).toBeAttached();

  // Zooming in narrows the visible period.
  const before = await windowText(page);
  await wheelTimeline(page, -300, 2);
  await expect.poll(() => windowText(page)).not.toBe(before);
});

test("zooms in to month precision", async ({ page }) => {
  await page.goto("/?layers=world-wars&t=1944,1945.5");
  await expect(page.locator(".timeline-tick", { hasText: /^(מרץ|אפריל|יולי|אוקטובר)$/ }).first()).toBeVisible();
  await expect(page.getByTestId("window-label")).toContainText("1944 לספירה");
});
