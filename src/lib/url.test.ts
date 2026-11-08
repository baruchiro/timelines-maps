// @story: SHARE-1
import { describe, expect, it } from "vitest";
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
  });
});
