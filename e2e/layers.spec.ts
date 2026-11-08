// @story: LAYER-2, TIME-2
import { expect, test } from "@playwright/test";
import { label } from "./helpers";

test("on mobile, layers open from a button and several can be shown together", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".side-panel")).toBeHidden();
  await page.getByRole("button", { name: /שכבות/ }).click();
  const sheet = page.getByRole("dialog", { name: "בחירת שכבות" });
  await expect(sheet).toContainText("מאת ModernHistorian");
  await sheet.getByLabel("מלחמות העולם").check();
  await page.getByRole("button", { name: "סגירה" }).click();

  // Both layers, each with its own color, over the combined range.
  await expect(label(page, "ancient-civilizations/maya")).toBeAttached();
  await expect(label(page, "world-wars/ww2-europe")).toBeAttached();
  const colors = await page
    .locator(".timeline-event")
    .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("fill")))]);
  expect(colors).toHaveLength(2);
});

test("on desktop, layers sit in a side panel", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const panel = page.getByRole("complementary", { name: "שכבות" });
  await expect(panel).toBeVisible();
  await panel.getByLabel("מלחמות העולם").check();
  await panel.getByLabel("תרבויות עתיקות").uncheck();
  await expect(page.getByTestId("window-label")).toContainText("1913");
  await expect(label(page, "world-wars/ww1")).toBeAttached();
});
