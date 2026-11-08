// @story: MAP-2, MAP-4, TIME-2
import { describe, expect, it } from "vitest";
import { fullRange, nearestEvent, placeEvents, visibleEvents, windowAround } from "./events";
import type { LoadedLayer } from "./types";

const layer: LoadedLayer = {
  id: "l",
  name: "L",
  creator: "c",
  color: "#000000",
  events: [
    { id: "rome", name: "Rome", lat: 0, lng: 0, start: { year: -27 }, end: { year: 476 } },
    { id: "ww2", name: "WW2", lat: 0, lng: 0, start: { year: 1939, month: 9 }, end: { year: 1945, month: 5 } },
    { id: "moment", name: "Moment", lat: 0, lng: 0, start: { year: 1066, month: 10, day: 14 } },
  ],
};
const events = placeEvents([layer]);
const ids = (es: { id: string }[]) => es.map((e) => e.id);

describe("visibleEvents", () => {
  it("keeps every event overlapping the window, edges included", () => {
    expect(ids(visibleEvents(events, [400, 1940]))).toEqual(["rome", "ww2", "moment"]);
    expect(ids(visibleEvents(events, [477, 1000]))).toEqual([]);
    expect(ids(visibleEvents(events, [1066.75, 1066.8]))).toEqual(["moment"]);
  });
});

describe("fullRange", () => {
  it("spans all events with padding", () => {
    const [a, b] = fullRange(events)!;
    expect(a).toBeLessThan(-26);
    expect(b).toBeGreaterThan(1945.4);
    expect(fullRange([])).toBeNull();
    expect(fullRange(events, 1950)![1]).toBe(1950);
  });
});

describe("nearestEvent", () => {
  it("finds the event closest to an empty window, in either direction", () => {
    expect(nearestEvent(events, [600, 700])?.id).toBe("rome");
    expect(nearestEvent(events, [1500, 1600])?.id).toBe("ww2");
  });

  it("centers a window on the event without zooming in", () => {
    const e = events.find((x) => x.id === "moment")!;
    const [a, b] = windowAround(e, [600, 700]);
    expect(b - a).toBeCloseTo(100);
    expect(a).toBeLessThan(e.t0);
    expect(b).toBeGreaterThan(e.t1);
  });
});
