// @story: SHARE-1
import { describe, expect, it } from "vitest";
import { placeEvents, visibleEvents } from "./events";
import { decodeState, encodeState } from "./url";

describe("view state in the URL", () => {
  it("round-trips layers, time window and map view", () => {
    const s = { layers: ["a", "b-2"], window: [-500, 200] as [number, number], map: { lat: 41.9, lng: 12.5, zoom: 4 } };
    expect(decodeState(encodeState(s))).toEqual(s);
  });

  it("keeps an explicitly empty layer selection", () => {
    expect(decodeState("?layers=").layers).toEqual([]);
  });

  it("drops invalid parts instead of failing", () => {
    expect(decodeState("?t=5,1&map=100,0,3&layers=ok,BAD!")).toEqual({ layers: ["ok"] });
    expect(decodeState("?t=abc")).toEqual({});
    expect(decodeState("?t=0,1e-320")).toEqual({});
  });

  it("keeps enough precision that a link shows the same thing", () => {
    const s = { window: [1900, 1914.58] as [number, number], map: { lat: 48.0049, lng: 10.0049, zoom: 18 } };
    expect(decodeState(encodeState(s))).toEqual(s);
  });

  it("keeps the window exact, so an event just past its edge stays hidden", () => {
    const [ww1] = placeEvents([
      { id: "w", name: "W", creator: "c", color: "#000000", events: [{ id: "ww1", name: "WW1", lat: 0, lng: 0, start: { year: 1914, month: 7, day: 28 } }] },
    ]);
    const window: [number, number] = [1900, ww1.t0 - 1e-5];
    const restored = decodeState(encodeState({ window })).window!;
    expect(restored).toEqual(window);
    expect(visibleEvents([ww1], restored)).toEqual([]);
  });
});
