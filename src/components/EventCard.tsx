import { formatRange } from "../lib/dates";
import type { PlacedEvent } from "../lib/events";
import type { LoadedLayer } from "../lib/types";

interface Props {
  event: PlacedEvent;
  layer?: LoadedLayer;
  onClose: () => void;
}

export function EventCard({ event, layer, onClose }: Props) {
  return (
    <article className="event-card" role="dialog" aria-label={event.name} style={{ borderColor: event.color }}>
      <header>
        <h2>{event.name}</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="סגירה">
          ✕
        </button>
      </header>
      <p className="event-dates">{formatRange(event.start, event.end)}</p>
      {event.description && <p>{event.description}</p>}
      {layer && (
        <p className="event-layer">
          <span className="swatch" style={{ background: layer.color }} aria-hidden /> {layer.name}
        </p>
      )}
    </article>
  );
}
