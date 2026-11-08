import { startOf, type HDate } from "./dates";
import type { Layer } from "./types";

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

function checkDate(v: unknown, where: string, errors: string[]): v is HDate {
  if (!isObj(v)) {
    errors.push(`${where}: חסר תאריך`);
    return false;
  }
  const { year, month, day } = v;
  let ok = true;
  if (!Number.isInteger(year) || year === 0) {
    errors.push(`${where}.year: חייב להיות מספר שלם שאינו 0 (שלילי = לפנה"ס)`);
    ok = false;
  }
  if (month !== undefined && !(Number.isInteger(month) && (month as number) >= 1 && (month as number) <= 12)) {
    errors.push(`${where}.month: חייב להיות 1–12`);
    ok = false;
  }
  if (day !== undefined) {
    if (month === undefined) {
      errors.push(`${where}.day: יום בלי חודש`);
      ok = false;
    } else if (!(Number.isInteger(day) && (day as number) >= 1 && (day as number) <= 31)) {
      errors.push(`${where}.day: חייב להיות 1–31`);
      ok = false;
    }
  }
  return ok;
}

/** Returns a list of human-readable problems; empty means the layer is valid. */
export function validateLayer(raw: unknown, source = "layer"): string[] {
  const errors: string[] = [];
  if (!isObj(raw)) return [`${source}: הקובץ חייב להיות אובייקט JSON`];
  if (!isStr(raw.id) || !ID_RE.test(raw.id)) errors.push(`${source}.id: חובה, אותיות קטנות/ספרות/מקף`);
  if (!isStr(raw.name)) errors.push(`${source}.name: חובה`);
  if (!isStr(raw.creator)) errors.push(`${source}.creator: חובה`);
  if (raw.color !== undefined && !(typeof raw.color === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.color)))
    errors.push(`${source}.color: צבע בפורמט #RRGGBB`);
  if (!Array.isArray(raw.events) || raw.events.length === 0) {
    errors.push(`${source}.events: חובה, לפחות אירוע אחד`);
    return errors;
  }
  const ids = new Set<string>();
  raw.events.forEach((e: unknown, i: number) => {
    const where = `${source}.events[${i}]`;
    if (!isObj(e)) {
      errors.push(`${where}: חייב להיות אובייקט`);
      return;
    }
    if (!isStr(e.id) || !ID_RE.test(e.id)) errors.push(`${where}.id: חובה, אותיות קטנות/ספרות/מקף`);
    else if (ids.has(e.id)) errors.push(`${where}.id: כפול (${e.id})`);
    else ids.add(e.id);
    if (!isStr(e.name)) errors.push(`${where}.name: חובה`);
    if (e.description !== undefined && typeof e.description !== "string")
      errors.push(`${where}.description: חייב להיות טקסט`);
    if (!isNum(e.lat) || e.lat < -90 || e.lat > 90) errors.push(`${where}.lat: חובה, בין -90 ל-90`);
    if (!isNum(e.lng) || e.lng < -180 || e.lng > 180) errors.push(`${where}.lng: חובה, בין -180 ל-180`);
    if (e.radiusKm !== undefined && !(isNum(e.radiusKm) && e.radiusKm > 0))
      errors.push(`${where}.radiusKm: מספר חיובי`);
    const startOk = checkDate(e.start, `${where}.start`, errors);
    if (e.end !== undefined) {
      const endOk = checkDate(e.end, `${where}.end`, errors);
      if (startOk && endOk && startOf(e.end as HDate) < startOf(e.start as HDate))
        errors.push(`${where}.end: לפני start`);
    }
  });
  return errors;
}

export function assertLayer(raw: unknown, source: string): Layer {
  const errors = validateLayer(raw, source);
  if (errors.length) throw new Error(`שכבה לא חוקית:\n${errors.join("\n")}`);
  return raw as Layer;
}
