import { endOf, startOf } from "./dates";
import type { LoadedLayer, TimeWindow, TimelineEvent } from "./types";

export interface PlacedEvent extends TimelineEvent {
  layerId: string;
  color: string;
  /** Continuous time span [t0, t1). */
  t0: number;
  t1: number;
  /** Globally unique key: layerId/eventId. */
  key: string;
}

export function placeEvents(layers: LoadedLayer[]): PlacedEvent[] {
  return layers.flatMap((layer) =>
    layer.events.map((e) => ({
      ...e,
      layerId: layer.id,
      color: layer.color,
      t0: startOf(e.start),
      t1: endOf(e.end ?? e.start),
      key: `${layer.id}/${e.id}`,
    })),
  );
}

export function overlaps(e: PlacedEvent, [a, b]: TimeWindow): boolean {
  return e.t0 <= b && e.t1 > a;
}

export function visibleEvents(events: PlacedEvent[], window: TimeWindow): PlacedEvent[] {
  return events.filter((e) => overlaps(e, window));
}

/** Full range of the events, padded by 5% on each side (but not past `latest`, e.g. today). */
export function fullRange(events: PlacedEvent[], latest = Infinity): TimeWindow | null {
  if (events.length === 0) return null;
  const a = Math.min(...events.map((e) => e.t0));
  const b = Math.max(...events.map((e) => e.t1));
  const pad = Math.max((b - a) * 0.05, 0.5);
  return [a - pad, Math.min(b + pad, Math.max(b, latest))];
}

/** The event closest in time to the window (for the empty state). */
export function nearestEvent(events: PlacedEvent[], [a, b]: TimeWindow): PlacedEvent | null {
  let best: PlacedEvent | null = null;
  let bestDist = Infinity;
  for (const e of events) {
    const dist = e.t1 < a ? a - e.t1 : e.t0 > b ? e.t0 - b : 0;
    if (dist < bestDist) {
      best = e;
      bestDist = dist;
    }
  }
  return best;
}

/** Shortest window the timeline allows (about two weeks). */
export const MIN_SPAN_YEARS = 1 / 24;

/** Fit a window inside the domain: shift it in, shrink it only if it is wider. */
export function clampWindow([a, b]: TimeWindow, [d0, d1]: TimeWindow): TimeWindow {
  const width = Math.min(Math.max(b - a, MIN_SPAN_YEARS), d1 - d0);
  const start = Math.min(Math.max(a, d0), d1 - width);
  return [start, start + width];
}

/** A window that shows the event comfortably, keeping the current zoom when it fits. */
export function windowAround(e: PlacedEvent, [a, b]: TimeWindow): TimeWindow {
  const width = Math.max(b - a, (e.t1 - e.t0) * 1.4);
  const mid = (e.t0 + e.t1) / 2;
  return [mid - width / 2, mid + width / 2];
}
