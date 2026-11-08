// @story: TIME-1
import { describe, expect, it } from "vitest";
import { endOf, formatRange, formatTime, startOf, ticks, toAstronomical } from "./dates";

describe("time model", () => {
  it("has no year 0: 1 BCE is directly followed by 1 CE", () => {
    expect(toAstronomical(1) - toAstronomical(-1)).toBe(1);
    expect(endOf({ year: -1 })).toBe(startOf({ year: 1 }));
  });

  it("orders months and days inside a year", () => {
    expect(startOf({ year: 1939, month: 9, day: 1 })).toBeGreaterThan(startOf({ year: 1939, month: 8, day: 31 }));
    expect(endOf({ year: 1945, month: 5 })).toBeCloseTo(startOf({ year: 1945, month: 6 }));
  });

  it("labels BCE and CE in Hebrew", () => {
    expect(formatRange({ year: -27 }, { year: 476 })).toBe('27 לפנה"ס – 476 לספירה');
    expect(formatTime(toAstronomical(-1) + 0.5)).toBe('1 לפנה"ס');
    expect(formatTime(1944.6, "month")).toBe("אוגוסט 1944 לספירה");
  });
});

describe("ticks adapt to the zoom level", () => {
  it("uses round millennia/centuries when zoomed out, never year 0", () => {
    const t = ticks(toAstronomical(-3000), 2000, 8);
    expect(t.length).toBeLessThanOrEqual(8);
    expect(t.map((x) => x.label)).toContain('1000 לפנה"ס');
    expect(t.map((x) => x.label).some((l) => l.startsWith("0 "))).toBe(false);
  });

  it("puts a tick on 100 BCE and 100 CE around the turn of the era", () => {
    const labels = ticks(toAstronomical(-150), 150, 3).map((x) => x.label);
    expect(labels).toEqual(['100 לפנה"ס', "100 לספירה"]);
  });

  it("switches to months when zoomed into a single year", () => {
    const labels = ticks(1944, 1945.2, 8).map((x) => x.label);
    expect(labels).toContain("1945 לספירה");
    expect(labels.some((l) => l === "יולי" || l === "אפריל")).toBe(true);
  });
});
