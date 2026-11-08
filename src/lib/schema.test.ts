// @story: DATA-1
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateLayer } from "./schema";

const valid = () => ({
  id: "demo",
  name: "Demo",
  creator: "me",
  events: [{ id: "e1", name: "E", lat: 1, lng: 2, start: { year: -100 }, end: { year: 50 } }],
});

describe("layer files", () => {
  const dir = join(__dirname, "../../data/layers");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    it(`${file} is valid`, () => {
      expect(validateLayer(JSON.parse(readFileSync(join(dir, file), "utf8")), file)).toEqual([]);
    });
  }
});

describe("validateLayer rejects", () => {
  it("a missing required field", () => {
    const l = valid() as Record<string, unknown>;
    delete l.creator;
    expect(validateLayer(l).join()).toMatch(/creator/);
  });

  it("year 0", () => {
    const l = valid();
    l.events[0].start = { year: 0 };
    expect(validateLayer(l).join()).toMatch(/start\.year/);
  });

  it("an impossible month and a day without a month", () => {
    const l = valid();
    l.events[0].start = { year: 10, month: 13 } as never;
    l.events[0].end = { year: 20, day: 3 } as never;
    const errors = validateLayer(l).join();
    expect(errors).toMatch(/start\.month/);
    expect(errors).toMatch(/end\.day/);
  });

  it("coordinates out of range", () => {
    const l = valid();
    l.events[0].lat = 91;
    l.events[0].lng = -181;
    const errors = validateLayer(l).join();
    expect(errors).toMatch(/lat/);
    expect(errors).toMatch(/lng/);
  });

  it("an end before the start, and duplicate event ids", () => {
    const l = valid();
    l.events[0].end = { year: -200 };
    l.events.push({ ...l.events[0], end: { year: 1 } });
    const errors = validateLayer(l).join();
    expect(errors).toMatch(/end: לפני start/);
    expect(errors).toMatch(/כפול/);
  });
});
