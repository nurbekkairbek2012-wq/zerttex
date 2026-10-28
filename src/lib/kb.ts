import raw from '../../shared/knowledge.json';
import { getLang, getLocale, setLangListener, tr, type Lang } from './i18n';

export type InclusionKey = keyof typeof raw.inclusionLabels;

export interface Trip {
  id: string;
  name: string;
  short: string;
  region: string;
  start: string;
  days: number;
  priceKZT: number;
  scene: 'lake' | 'canyon' | 'heritage' | 'forest' | 'steppe';
  tagline: string;
  difficulty: string;
  groupSize: string;
  season: string;
  departures: number[];
  seatsBase: number;
  guide: string;
  highlights: string[];
  itinerary: { day: number; title: string; text: string }[];
  included: string[];
  notIncluded: string[];
  pickup: string;
}

export interface Guide {
  name: string;
  langs: string;
  years: number;
  trips: number;
  bio: string;
}

export const kb = raw;
// English originals stay untouched; the exported objects below are translated in place
// when the language changes, so every page that reads them follows the chosen language.
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
export const tripsEn = clone(raw.trips) as Trip[];
const guidesEn = clone(raw.guides) as Record<string, Guide>;
const inclusionEn = clone(raw.inclusionLabels) as Record<string, string>;
const policiesEn = clone(raw.policies) as Record<string, string>;

export const trips = clone(raw.trips) as Trip[];
export const guides = clone(raw.guides) as Record<string, Guide>;
export const inclusionLabels = clone(raw.inclusionLabels) as Record<string, string>;
export const policies = clone(raw.policies) as typeof raw.policies;
export const company = raw.company;

let localized: Lang = 'en';
/** Translate the knowledge base texts into a language (English keys, see src/i18n). */
export function localizeKb(lang: Lang = getLang()) {
  if (lang === localized) return;
  localized = lang;
  const t = (s: string) => tr(s, undefined, lang);
  tripsEn.forEach((en, i) => {
    Object.assign(trips[i], {
      name: t(en.name),
      short: t(en.short),
      region: t(en.region),
      start: t(en.start),
      tagline: t(en.tagline),
      difficulty: t(en.difficulty),
      groupSize: t(en.groupSize),
      season: t(en.season),
      highlights: en.highlights.map(t),
      itinerary: en.itinerary.map((d) => ({ day: d.day, title: t(d.title), text: t(d.text) })),
      notIncluded: en.notIncluded.map(t),
      pickup: t(en.pickup),
    });
  });
  for (const k in guidesEn) Object.assign(guides[k], { langs: t(guidesEn[k].langs), bio: t(guidesEn[k].bio) });
  for (const k in inclusionEn) inclusionLabels[k] = t(inclusionEn[k]);
  const pol = policies as Record<string, string>;
  for (const k in policiesEn) pol[k] = t(policiesEn[k]);
}

setLangListener((l) => localizeKb(l));

/** English trip name: what the offline engine understands. */
export const tripEnName = (id: string) => tripsEn.find((t) => t.id === id)?.name ?? id;

export const tripById = (id: string | undefined) => trips.find((t) => t.id === id);

/** Next departure dates for a trip (weekday pattern), starting tomorrow. */
export function upcomingDepartures(trip: Trip, count = 8, from = new Date()): Date[] {
  const out: Date[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  while (out.length < count) {
    if (trip.departures.includes(d.getDay())) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Deterministic "seats left" so the demo looks alive but stable. */
export function seatsLeft(trip: Trip, date: Date): number {
  const seed = date.getDate() * 7 + date.getMonth() * 13 + trip.id.length * 3;
  return Math.max(2, trip.seatsBase - (seed % (trip.seatsBase - 1)));
}

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Kazakh written by hand: some browsers ship without Kazakh date names.
const KK_MONTHS = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
const KK_DAYS = ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі'];
function fmtKk(d: Date, o: Intl.DateTimeFormatOptions): string {
  const parts: string[] = [];
  if (o.year) parts.push(`${d.getFullYear()} ж.`);
  if (o.day || o.month) {
    const m = KK_MONTHS[d.getMonth()];
    parts.push([o.day ? d.getDate() : '', o.month ? (o.month === 'short' ? m.slice(0, 3) : m) : ''].filter(Boolean).join(' '));
  }
  if (o.weekday) {
    const w = KK_DAYS[d.getDay()];
    parts.push(o.weekday === 'short' ? w.slice(0, 3) : w);
  }
  return parts.join(', ');
}

export const fmtDate = (d: Date, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  getLang() === 'kk' ? fmtKk(d, opts) : d.toLocaleDateString(getLocale(), opts);
