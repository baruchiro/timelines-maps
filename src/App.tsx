import { useCallback, useEffect, useMemo, useState } from "react";
import { EventCard } from "./components/EventCard";
import { LayerPanel } from "./components/LayerPanel";
import { MapView } from "./components/MapView";
import { Timeline } from "./components/Timeline";
import { toAstronomical } from "./lib/dates";
import { clampWindow, fullRange, nearestEvent, overlaps, placeEvents, visibleEvents, windowAround } from "./lib/events";
import { ALL_LAYERS } from "./lib/layers";
import type { LoadedLayer, TimeWindow } from "./lib/types";
import { decodeState, encodeState, type MapView as MapViewState } from "./lib/url";

const NOW = new Date().getFullYear() + 1;
const DEFAULT_RANGE: TimeWindow = [toAstronomical(-3000), NOW];

function rangeFor(layers: LoadedLayer[]): TimeWindow {
  return fullRange(placeEvents(layers), NOW) ?? DEFAULT_RANGE;
}

function initialState() {
  const url = decodeState(window.location.search);
  const known = new Set(ALL_LAYERS.map((l) => l.id));
  const fromUrl = url.layers?.filter((id) => known.has(id));
  // `layers=` (empty) is a deliberate empty selection; unknown ids fall back to the default.
  const selected =
    fromUrl && (fromUrl.length > 0 || url.layers!.length === 0) ? fromUrl : ALL_LAYERS.slice(0, 1).map((l) => l.id);
  const domain = rangeFor(ALL_LAYERS.filter((l) => selected.includes(l.id)));
  // Fit a shared window into what the selected layers can show.
  const win = url.window ? clampWindow(url.window, domain) : domain;
  return { selected, window: win, map: url.map };
}

export function App() {
  const [init] = useState(initialState);
  const [selected, setSelected] = useState<string[]>(init.selected);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(init.window);
  const [mapView, setMapView] = useState<MapViewState | undefined>(init.map);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const layers = useMemo(() => ALL_LAYERS.filter((l) => selected.includes(l.id)), [selected]);
  const events = useMemo(() => placeEvents(layers), [layers]);
  const domain = useMemo(() => rangeFor(layers), [layers]);
  const visible = useMemo(() => visibleEvents(events, timeWindow), [events, timeWindow]);
  const selectedEvent = visible.find((e) => e.key === selectedKey) ?? null;

  // Every window change goes through here: an open card whose event leaves the period is closed for good.
  const changeWindow = useCallback(
    (w: TimeWindow) => {
      setTimeWindow(w);
      setSelectedKey((key) => {
        const e = key ? events.find((x) => x.key === key) : undefined;
        return e && overlaps(e, w) ? key : null;
      });
    },
    [events],
  );
  const nearest = visible.length === 0 ? nearestEvent(events, timeWindow) : null;

  const toggleLayer = useCallback(
    (id: string) => {
      const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
      setSelected(next);
      // The timeline re-opens on the full range of whatever is now selected.
      setTimeWindow(rangeFor(ALL_LAYERS.filter((l) => next.includes(l.id))));
      setSelectedKey(null);
    },
    [selected],
  );

  // Keep the shareable URL in sync (throttled: browsers rate-limit replaceState).
  useEffect(() => {
    const id = setTimeout(() => {
      const qs = encodeState({ layers: selected, window: timeWindow, map: mapView });
      window.history.replaceState(null, "", `${window.location.pathname}${qs}`);
    }, 250);
    return () => clearTimeout(id);
  }, [selected, timeWindow, mapView]);

  const panel = <LayerPanel layers={ALL_LAYERS} selected={selected} onToggle={toggleLayer} />;

  return (
    <div className="app">
      <header className="app-header">
        <h1>מפת צירי זמן</h1>
        <button type="button" className="layers-button" onClick={() => setSheetOpen(true)} aria-expanded={sheetOpen}>
          שכבות ({selected.length})
        </button>
      </header>

      <aside className="side-panel" aria-label="שכבות">
        <h2>שכבות</h2>
        {panel}
      </aside>

      <main className="map-area">
        <MapView
          events={visible}
          initialView={init.map}
          initialFit={events}
          selectedKey={selectedEvent?.key ?? null}
          onSelect={setSelectedKey}
          onViewChange={setMapView}
        />
        {visible.length === 0 && (
          <div className="empty-notice" role="status">
            {layers.length === 0 ? (
              <>
                <span>לא נבחרה שכבה</span>
                <button type="button" className="layers-button-inline" onClick={() => setSheetOpen(true)}>
                  בחירת שכבות
                </button>
              </>
            ) : (
              <>
                <span>אין אירועים בתקופה הזו</span>
                {nearest && (
                  <button type="button" onClick={() => changeWindow(clampWindow(windowAround(nearest, timeWindow), domain))}>
                    קפיצה אל {nearest.name}
                  </button>
                )}
              </>
            )}
          </div>
        )}
        {selectedEvent && (
          <EventCard
            event={selectedEvent}
            layer={layers.find((l) => l.id === selectedEvent.layerId)}
            onClose={() => setSelectedKey(null)}
          />
        )}
      </main>

      <Timeline domain={domain} window={timeWindow} onWindowChange={changeWindow} layers={layers} events={events} />

      {sheetOpen && (
        <div className="sheet-backdrop" onClick={() => setSheetOpen(false)}>
          <div className="sheet" role="dialog" aria-label="בחירת שכבות" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2>שכבות</h2>
              <button type="button" className="icon-button" onClick={() => setSheetOpen(false)} aria-label="סגירה">
                ✕
              </button>
            </header>
            {panel}
          </div>
        </div>
      )}
    </div>
  );
}
