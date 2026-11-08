// @story: LAYER-2
import { describe, expect, it } from "vitest";
import { PALETTE, resolveLayers } from "./layers";

describe("resolveLayers", () => {
  it("never gives a color-less layer a color another layer already uses", () => {
    const base = { name: "x", creator: "c", events: [] };
    const out = resolveLayers([
      { ...base, id: "a", color: PALETTE[1] },
      { ...base, id: "b" },
      { ...base, id: "c", color: PALETTE[0] },
    ]);
    expect(new Set(out.map((l) => l.color)).size).toBe(3);
  });
});
