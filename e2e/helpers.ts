import { expect, type Page } from "@playwright/test";

export const label = (page: Page, key: string) => page.locator(`.event-label[data-event-key="${key}"]`);

export async function windowText(page: Page) {
  return (await page.getByTestId("window-label").textContent()) ?? "";
}

/** Wheel over the middle of the timeline (negative = zoom in). */
export async function wheelTimeline(page: Page, deltaY: number, times = 1) {
  const box = (await page.getByTestId("timeline").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < times; i++) await page.mouse.wheel(0, deltaY);
}

export async function waitForUrl(page: Page, re: RegExp) {
  await expect.poll(() => page.url()).toMatch(re);
}
