// @story: SHARE-1
import { expect, test } from "@playwright/test";
import { label, waitForUrl } from "./helpers";

test("the view is written to the URL and restored from it", async ({ page }) => {
  await page.goto("/");
  await waitForUrl(page, /layers=ancient-civilizations&t=.+&map=/);

  const shared = "/?layers=world-wars&t=1940,1942&map=48,10,3.5";
  await page.goto(shared);
  await expect(page.getByTestId("window-label")).toContainText("1940");
  await expect(page.getByTestId("window-label")).toContainText("1942");
  await expect(label(page, "world-wars/ww2-europe")).toBeAttached();
  await expect(label(page, "world-wars/ww2-pacific")).toBeAttached();
  await expect(label(page, "world-wars/ww1")).toHaveCount(0);
  await waitForUrl(page, /map=48,10,3\.5/);
});
