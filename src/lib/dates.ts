// Historical dates as written in layer files: year < 0 is BCE, year 0 does not exist.
export interface HDate {
  year: number;
  month?: number;
  day?: number;
}

// Internally time is a continuous number: astronomical year (1 BCE = 0, 2 BCE = -1)
// plus a fraction of the year. Months are 1/12 each, days 1/31 of a month — not
// calendar-exact, but monotonic and good enough for placing events on a timeline.
export function toAstronomical(year: number): number {
  return year < 0 ? year + 1 : year;
}

export function fromAstronomical(astro: number): number {
  return astro <= 0 ? astro - 1 : astro;
}

export function startOf(d: HDate): number {
  let t = toAstronomical(d.year);
  if (d.month) t += (d.month - 1) / 12;
  if (d.month && d.day) t += (d.day - 1) / (12 * 31);
  return t;
}

/** The moment just after the last unit covered by the date (a year-only date covers the whole year). */
export function endOf(d: HDate): number {
  const s = startOf(d);
  if (d.month && d.day) return s + 1 / (12 * 31);
  if (d.month) return s + 1 / 12;
  return s + 1;
}

export function formatYear(year: number): string {
  return year < 0 ? `${-year} לפנה"ס` : `${year} לספירה`;
}

const MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

export function monthName(month: number): string {
  return MONTHS[month - 1];
}

export function formatHDate(d: HDate): string {
  const parts: string[] = [];
  if (d.day) parts.push(String(d.day));
  if (d.month) parts.push(monthName(d.month));
  parts.push(formatYear(d.year));
  return parts.join(" ");
}

export function formatRange(start: HDate, end?: HDate): string {
  if (!end) return formatHDate(start);
  return `${formatHDate(start)} – ${formatHDate(end)}`;
}

/** Human label for a continuous time value, at year or month precision. */
export function formatTime(t: number, precision: "year" | "month" = "year"): string {
  // A small epsilon keeps exact boundaries (1 Feb = 1944 + 1/12) from rounding down.
  const astro = Math.floor(t + 1e-9);
  const year = fromAstronomical(astro);
  if (precision === "month") {
    const month = Math.min(12, Math.floor((t - astro) * 12 + 1e-9) + 1);
    return `${monthName(month)} ${formatYear(year)}`;
  }
  return formatYear(year);
}

export interface Tick {
  t: number;
  label: string;
}

const YEAR_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];

/** Ticks for the visible window [a, b], aiming for about `maxTicks` labels. */
export function ticks(a: number, b: number, maxTicks: number): Tick[] {
  const span = b - a;
  if (span <= 0 || maxTicks < 1) return [];
  const step = YEAR_STEPS.find((s) => span / s <= maxTicks);
  if (step === undefined) {
    const step = YEAR_STEPS[YEAR_STEPS.length - 1];
    return yearTicks(a, b, step);
  }
  if (step === 1 && span * 12 <= maxTicks * 6) return monthTicks(a, b, maxTicks);
  return yearTicks(a, b, step);
}

// Ticks fall on round *human* years (100 BCE, 100 CE), never on the nonexistent year 0.
function yearTicks(a: number, b: number, step: number): Tick[] {
  const out: Tick[] = [];
  const first = Math.ceil(fromAstronomical(Math.floor(a)) / step) * step;
  for (let y = first; ; y += step) {
    if (y === 0) continue;
    const t = toAstronomical(y);
    if (t > b) break;
    if (t >= a) out.push({ t, label: formatYear(y) });
  }
  return out;
}

function monthTicks(a: number, b: number, maxTicks: number): Tick[] {
  const span = b - a;
  const monthStep = [1, 2, 3, 6].find((m) => (span * 12) / m <= maxTicks) ?? 6;
  const out: Tick[] = [];
  let m = Math.ceil(a * 12);
  m = Math.ceil(m / monthStep) * monthStep;
  for (; m / 12 <= b; m += monthStep) {
    const t = m / 12;
    const astro = Math.floor(t + 1e-9);
    const month = Math.round((t - astro) * 12) + 1;
    const label = month === 1 ? formatYear(fromAstronomical(astro)) : monthName(month);
    out.push({ t, label });
  }
  return out;
}
