import type { HDate } from "./dates";

export interface TimelineEvent {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  radiusKm?: number;
  start: HDate;
  end?: HDate;
}

export interface Layer {
  id: string;
  name: string;
  creator: string;
  color?: string;
  events: TimelineEvent[];
}

/** A layer as shown in the app: color resolved. */
export interface LoadedLayer extends Layer {
  color: string;
}

/** Visible time window [start, end] in continuous astronomical years. */
export type TimeWindow = [number, number];
