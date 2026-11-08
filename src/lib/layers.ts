import { assertLayer } from "./schema";
import type { Layer, LoadedLayer } from "./types";

// Distinct, readable on a light map; used when a layer file has no color.
export const PALETTE = ["#7c3aed", "#ea580c", "#0891b2", "#db2777", "#65a30d", "#ca8a04", "#2563eb"];

export function resolveLayers(layers: Layer[]): LoadedLayer[] {
  return [...layers]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((l, i) => ({ ...l, color: l.color ?? PALETTE[i % PALETTE.length] }));
}

const files = import.meta.glob("../../data/layers/*.json", { eager: true, import: "default" });

export const ALL_LAYERS: LoadedLayer[] = resolveLayers(
  Object.entries(files).map(([path, raw]) => assertLayer(raw, path.split("/").pop()!)),
);
