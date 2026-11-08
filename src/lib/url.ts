import type { TimeWindow } from "./types";

export interface MapView {
  lat: number;
  lng: number;
  zoom: number;
}

export interface ViewState {
  layers?: string[];
  window?: TimeWindow;
  map?: MapView;
}

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
const round = (n: number, digits: number) => Number(n.toFixed(digits));

/** Parses the query string; invalid parts are dropped, never thrown. */
export function decodeState(search: string): ViewState {
  const p = new URLSearchParams(search);
  const state: ViewState = {};
  const layers = p.get("layers");
  if (layers !== null) state.layers = layers.split(",").filter((s) => /^[a-z0-9][a-z0-9-]*$/.test(s));
  const t = p.get("t")?.split(",").map(num);
  if (t && t.length === 2 && t.every(Number.isFinite) && t[0] < t[1]) state.window = [t[0], t[1]];
  const m = p.get("map")?.split(",").map(num);
  if (
    m &&
    m.length === 3 &&
    m.every(Number.isFinite) &&
    Math.abs(m[0]) <= 90 &&
    Math.abs(m[1]) <= 180 &&
    m[2] >= 0 &&
    m[2] <= 22
  )
    state.map = { lat: m[0], lng: m[1], zoom: m[2] };
  return state;
}

export function encodeState(s: ViewState): string {
  const parts: string[] = [];
  if (s.layers) parts.push(`layers=${s.layers.join(",")}`);
  if (s.window) {
    const digits = s.window[1] - s.window[0] < 5 ? 3 : 1;
    parts.push(`t=${round(s.window[0], digits)},${round(s.window[1], digits)}`);
  }
  if (s.map) parts.push(`map=${round(s.map.lat, 2)},${round(s.map.lng, 2)},${round(s.map.zoom, 2)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}
