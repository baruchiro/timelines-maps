// @story: MAP-3, MAP-4
import { expect, test } from "@playwright/test";
import { label } from "./helpers";

test("tapping an event opens its details, ✕ closes them", async ({ page }) => {
  await page.goto("/?layers=ancient-civilizations&t=300,400");
  await label(page, "ancient-civilizations/roman-empire").click();
  const card = page.getByRole("dialog", { name: "האימפריה הרומית" });
  await expect(card).toBeVisible();
  await expect(card).toContainText('27 לפנה"ס – 476 לספירה');
  await expect(card).toContainText("הים התיכון");
  await card.getByRole("button", { name: "סגירה" }).click();
  await expect(card).toHaveCount(0);
});

test("the card closes when its event leaves the visible period", async ({ page }) => {
  await page.goto("/?layers=ancient-civilizations&t=470,480");
  await label(page, "ancient-civilizations/roman-empire").click();
  const card = page.getByRole("dialog", { name: "האימפריה הרומית" });
  await expect(card).toBeVisible();
  // Drag the timeline forward in time (left) past 476 CE.
  const box = (await page.getByTestId("timeline").boundingBox())!;
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 20, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
  }
  await expect(card).toHaveCount(0);
});

test("an empty period offers a jump to the nearest event", async ({ page }) => {
  await page.goto("/?layers=world-wars&t=1925,1930");
  await expect(page.getByRole("status")).toContainText("אין אירועים בתקופה הזו");
  await page.getByRole("button", { name: /קפיצה אל/ }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.locator(".event-label")).not.toHaveCount(0);
});
