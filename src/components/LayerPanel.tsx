import type { LoadedLayer } from "../lib/types";

interface Props {
  layers: LoadedLayer[];
  selected: string[];
  onToggle: (id: string) => void;
}

export function LayerPanel({ layers, selected, onToggle }: Props) {
  return (
    <ul className="layer-list">
      {layers.map((l) => (
        <li key={l.id}>
          <label className="layer-item">
            <input type="checkbox" checked={selected.includes(l.id)} onChange={() => onToggle(l.id)} />
            <span className="swatch" style={{ background: l.color }} aria-hidden />
            <span className="layer-text">
              <span className="layer-name">{l.name}</span>
              <span className="layer-meta">
                {l.events.length} אירועים · מאת {l.creator}
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
