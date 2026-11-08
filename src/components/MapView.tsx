import type { Feature, FeatureCollection } from "geojson";
import maplibregl, { type GeoJSONSource, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useLayoutEffect, useRef } from "react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import countriesTopo from "world-atlas/countries-110m.json";
import type { PlacedEvent } from "../lib/events";
import { circlePolygon } from "../lib/geo";
import type { MapView as MapViewState } from "../lib/url";

interface Props {
  events: PlacedEvent[];
  /** Used only once, when the map is created. */
  initialView?: MapViewState;
  /** Used only once, when there is no initial view: fit the map to these. */
  initialFit: PlacedEvent[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onViewChange: (v: MapViewState) => void;
}

const topo = countriesTopo as unknown as Topology;
const countries = fixAntimeridian(feature(topo, topo.objects.countries) as FeatureCollection);
const POINT_KM = 60; // used for fitting bounds of radius-less events

const style: StyleSpecification = {
  version: 8,
  sources: { countries: { type: "geojson", data: countries } },
  layers: [
    { id: "sea", type: "background", paint: { "background-color": "#dbe4ec" } },
    { id: "land", type: "fill", source: "countries", paint: { "fill-color": "#f7f5f0" } },
    { id: "borders", type: "line", source: "countries", paint: { "line-color": "#b9c1c9", "line-width": 0.6 } },
  ],
};

/**
 * World-atlas rings that cross ±180° (Russia, Fiji) draw stripes across a flat map:
 * shift their western points by +360° so the ring stays continuous. Antarctica wraps
 * the pole and can't be fixed that way — it's dropped (nothing historical there yet).
 */
function fixAntimeridian(fc: FeatureCollection): FeatureCollection {
  const crosses = (ring: number[][]) => ring.some((pt, i) => i > 0 && Math.abs(pt[0] - ring[i - 1][0]) > 180);
  const unwrap = (ring: number[][]) => (crosses(ring) ? ring.map(([x, y]) => [x < 0 ? x + 360 : x, y]) : ring);
  const features = fc.features
    .filter((f) => f.id !== "010")
    .map((f) => {
      const g = f.geometry;
      if (g.type === "Polygon") return { ...f, geometry: { ...g, coordinates: g.coordinates.map(unwrap) } };
      if (g.type === "MultiPolygon")
        return { ...f, geometry: { ...g, coordinates: g.coordinates.map((p) => p.map(unwrap)) } };
      return f;
    });
  return { ...fc, features };
}

function toGeoJSON(events: PlacedEvent[], selectedKey: string | null) {
  const areas: Feature[] = [];
  const points: Feature[] = [];
  for (const e of events) {
    const properties = { key: e.key, color: e.color, radius: e.radiusKm ?? 0, selected: e.key === selectedKey };
    if (e.radiusKm) areas.push({ ...circlePolygon(e.lat, e.lng, e.radiusKm), properties });
    else points.push({ type: "Feature", properties, geometry: { type: "Point", coordinates: [e.lng, e.lat] } });
  }
  const fc = (features: Feature[]): FeatureCollection => ({ type: "FeatureCollection", features });
  return { areas: fc(areas), points: fc(points) };
}

/** Hide labels that overlap a more important (larger) one. */
function declutter(labels: Map<string, { el: HTMLElement; radius: number }>) {
  const items = [...labels.values()].sort((a, b) => b.radius - a.radius);
  const placed: DOMRect[] = [];
  for (const { el } of items) {
    el.classList.remove("label-hidden");
    const r = el.getBoundingClientRect();
    const hit = placed.some((p) => r.left < p.right && r.right > p.left && r.top < p.bottom && r.bottom > p.top);
    if (hit) el.classList.add("label-hidden");
    else placed.push(r);
  }
}

export function MapView({ events, initialView, initialFit, selectedKey, onSelect, onViewChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const labelsRef = useRef(new Map<string, { el: HTMLElement; radius: number; marker: maplibregl.Marker }>());
  const cb = useRef({ onSelect, onViewChange });
  const initRef = useRef({ initialView, initialFit });
  useLayoutEffect(() => {
    cb.current = { onSelect, onViewChange };
  });

  useEffect(() => {
    const { initialView, initialFit } = initRef.current;
    const map = new maplibregl.Map({
      container: containerRef.current!,
      style,
      center: initialView ? [initialView.lng, initialView.lat] : [20, 30],
      zoom: initialView?.zoom ?? 1,
      renderWorldCopies: false,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: "Natural Earth" }));
    mapRef.current = map;

    if (!initialView && initialFit.length) {
      const bounds = new maplibregl.LngLatBounds();
      for (const e of initialFit) {
        const ring = circlePolygon(e.lat, e.lng, e.radiusKm ?? POINT_KM, 16).geometry.coordinates[0];
        ring.forEach(([lng, lat]) => bounds.extend([lng, lat]));
      }
      map.fitBounds(bounds, { padding: 30, maxZoom: 5, animate: false });
    }

    map.on("load", () => {
      map.addSource("event-areas", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("event-points", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "area-fill",
        type: "fill",
        source: "event-areas",
        paint: { "fill-color": ["get", "color"], "fill-opacity": ["case", ["get", "selected"], 0.35, 0.2] },
      });
      map.addLayer({
        id: "area-line",
        type: "line",
        source: "event-areas",
        paint: { "line-color": ["get", "color"], "line-width": ["case", ["get", "selected"], 3, 1.5] },
      });
      map.addLayer({
        id: "points",
        type: "circle",
        source: "event-points",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": ["case", ["get", "selected"], 8, 6],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
      const click = (ev: maplibregl.MapMouseEvent) => {
        const hits = map.queryRenderedFeatures(ev.point, { layers: ["points", "area-fill"] });
        if (!hits.length) return;
        // Prefer the smallest shape under the finger: big empires shouldn't swallow taps.
        hits.sort((a, b) => (a.properties.radius as number) - (b.properties.radius as number));
        cb.current.onSelect(hits[0].properties.key as string);
      };
      map.on("click", click);
      for (const id of ["points", "area-fill"]) {
        map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
      }
      loadedRef.current = true;
      map.fire("events-changed");
    });

    const reportView = () => {
      const c = map.getCenter();
      cb.current.onViewChange({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    };
    map.once("load", reportView);
    map.on("moveend", () => {
      reportView();
      declutter(labelsRef.current);
    });
    map.on("move", () => declutter(labelsRef.current));

    const labels = labelsRef.current;
    return () => {
      // StrictMode re-runs this effect: drop labels so the next map recreates them.
      labels.forEach((l) => l.marker.remove());
      labels.clear();
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Sync event shapes and labels.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const { areas, points } = toGeoJSON(events, selectedKey);
      (map.getSource("event-areas") as GeoJSONSource).setData(areas);
      (map.getSource("event-points") as GeoJSONSource).setData(points);
    };
    if (loadedRef.current) apply();
    else map.once("events-changed", apply);

    const labels = labelsRef.current;
    const wanted = new Set(events.map((e) => e.key));
    for (const [key, l] of labels) {
      if (!wanted.has(key)) {
        l.marker.remove();
        labels.delete(key);
      }
    }
    for (const e of events) {
      let l = labels.get(e.key);
      if (!l) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "event-label";
        el.dataset.eventKey = e.key;
        el.textContent = e.name;
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          cb.current.onSelect(e.key);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: e.radiusKm ? "center" : "bottom", offset: e.radiusKm ? [0, 0] : [0, -10] })
          .setLngLat([e.lng, e.lat])
          .addTo(map);
        l = { el, radius: e.radiusKm ?? 0, marker };
        labels.set(e.key, l);
      }
      l.el.classList.toggle("selected", e.key === selectedKey);
      l.el.style.setProperty("--layer-color", e.color);
    }
    declutter(labels);
  }, [events, selectedKey]);

  return <div ref={containerRef} className="map" data-testid="map" />;
}
