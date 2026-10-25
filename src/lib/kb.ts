import raw from '../../shared/knowledge.json';

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
export const trips = raw.trips as Trip[];
export const guides = raw.guides as Record<string, Guide>;
export const inclusionLabels = raw.inclusionLabels as Record<string, string>;
export const policies = raw.policies;
export const company = raw.company;

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

export const fmtDate = (d: Date, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  d.toLocaleDateString('en-GB', opts);
