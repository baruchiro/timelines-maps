import { assertLayer } from "./schema";
import type { Layer, LoadedLayer } from "./types";

// Distinct, readable on a light map; used when a layer file has no color.
export const PALETTE = ["#7c3aed", "#ea580c", "#0891b2", "#db2777", "#65a30d", "#ca8a04", "#2563eb"];

/** Sort by id and give color-less layers palette colors no other layer already uses. */
export function resolveLayers(layers: Layer[]): LoadedLayer[] {
  const taken = new Set(layers.map((l) => l.color?.toLowerCase()).filter(Boolean));
  const free = PALETTE.filter((c) => !taken.has(c));
  let next = 0;
  return [...layers]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((l) => ({ ...l, color: l.color ?? (free.length ? free[next++ % free.length] : PALETTE[next++ % PALETTE.length]) }));
}

const files = import.meta.glob("../../data/layers/*.json", { eager: true, import: "default" });

export const ALL_LAYERS: LoadedLayer[] = resolveLayers(
  Object.entries(files).map(([path, raw]) => assertLayer(raw, path.split("/").pop()!)),
);
