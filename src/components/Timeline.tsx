import { scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatTime, ticks } from "../lib/dates";
import type { PlacedEvent } from "../lib/events";
import type { LoadedLayer, TimeWindow } from "../lib/types";

interface Props {
  /** The full range the user can zoom out to. */
  domain: TimeWindow;
  window: TimeWindow;
  onWindowChange: (w: TimeWindow) => void;
  layers: LoadedLayer[];
  events: PlacedEvent[];
}

const LANE = 6;
const LANE_GAP = 3;
const AXIS = 22;
const MIN_SPAN_YEARS = 1 / 24; // about two weeks

const close = (a: TimeWindow, b: TimeWindow) => {
  const eps = (a[1] - a[0]) * 1e-6;
  return Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps;
};

/**
 * Gives every event a row so overlapping events stay distinguishable: layers are
 * stacked in order, and inside a layer events are packed greedily into sub-rows.
 * Returns event key → row, plus the total row count under the key "".
 */
function packRows(layers: LoadedLayer[], events: PlacedEvent[]): Map<string, number> {
  const out = new Map<string, number>();
  let base = 0;
  for (const layer of layers) {
    const ends: number[] = [];
    const mine = events.filter((e) => e.layerId === layer.id).sort((a, b) => a.t0 - b.t0);
    for (const e of mine) {
      let row = ends.findIndex((end) => end <= e.t0);
      if (row === -1) row = ends.push(0) - 1;
      ends[row] = e.t1;
      out.set(e.key, base + row);
    }
    base += Math.max(ends.length, 1);
  }
  out.set("", base);
  return out;
}

export function Timeline({ domain, window, onWindowChange, layers, events }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [width, setWidth] = useState(0);
  const rowOf = useMemo(() => packRows(layers, events), [layers, events]);
  const rows = Math.max(1, rowOf.get("") ?? 1);
  const height = rows * (LANE + LANE_GAP) + LANE_GAP + AXIS;

  const onChangeRef = useRef(onWindowChange);
  const windowRef = useRef(window);
  useLayoutEffect(() => {
    onChangeRef.current = onWindowChange;
    windowRef.current = window;
  });

  useEffect(() => {
    const el = svgRef.current!;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const base = useMemo(() => scaleLinear().domain(domain).range([0, width]), [domain, width]);

  // (Re)create the zoom behavior when the domain or size changes.
  useEffect(() => {
    if (!width) return;
    const span = domain[1] - domain[0];
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, Math.max(1, span / MIN_SPAN_YEARS)])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (ev) => {
        const w = ev.transform.rescaleX(base).domain() as TimeWindow;
        if (!close(w, windowRef.current)) onChangeRef.current(w);
      });
    zoomRef.current = z;
    const sel = select(svgRef.current!);
    sel.call(z).on("dblclick.zoom", null);
    return () => {
      sel.on(".zoom", null);
    };
  }, [base, domain, width, height]);

  // Apply window changes that came from outside (URL, layer change, "jump to event").
  useEffect(() => {
    const z = zoomRef.current;
    if (!z || !width) return;
    const [d0, d1] = domain;
    const k = (d1 - d0) / (window[1] - window[0]);
    const t = zoomIdentity.translate(-base(window[0]) * k, 0).scale(k);
    select(svgRef.current!).call(z.transform, t);
  }, [window, base, domain, width]);

  const x = useMemo(() => scaleLinear().domain(window).range([0, width]), [window, width]);
  const span = window[1] - window[0];
  const precision = span < 3 ? "month" : "year";
  const tickList = width ? ticks(window[0], window[1], Math.max(2, Math.floor(width / 90))) : [];

  return (
    <section className="timeline" aria-label="ציר זמן">
      <div className="timeline-label" data-testid="window-label">
        {formatTime(window[0], precision)} – {formatTime(window[1], precision)}
      </div>
      <svg ref={svgRef} className="timeline-svg" height={height} style={{ direction: "ltr" }} data-testid="timeline">
        {events.map((e) => {
          const lane = rowOf.get(e.key) ?? 0;
          const x0 = Math.max(x(e.t0), -10);
          const x1 = Math.min(x(e.t1), width + 10);
          if (x1 < 0 || x0 > width) return null;
          return (
            <rect
              key={e.key}
              className="timeline-event"
              data-layer={e.layerId}
              x={x0}
              y={LANE_GAP + lane * (LANE + LANE_GAP)}
              width={Math.max(x1 - x0, 3)}
              height={LANE}
              rx={2}
              fill={e.color}
            >
              <title>{e.name}</title>
            </rect>
          );
        })}
        <line x1={0} x2={width} y1={height - AXIS} y2={height - AXIS} className="timeline-axis" />
        {tickList.map((t) => (
          <g key={t.t} transform={`translate(${x(t.t)},${height - AXIS})`}>
            <line y2={5} className="timeline-axis" />
            <text y={17} textAnchor="middle" className="timeline-tick">
              {t.label}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}
