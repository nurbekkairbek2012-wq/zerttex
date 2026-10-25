import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Currency } from './money';

export type Meal = 'veg' | 'jain' | 'halal' | 'any';
export type PayMode = 'full' | 'deposit' | 'split';

export interface Booking {
  code: string;
  tripId: string;
  date: string; // ISO yyyy-mm-dd
  people: number;
  meal: Meal;
  lead: { name: string; email: string; phone: string; country: string };
  payMode: PayMode;
  totalKZT: number;
  paidKZT: number;
  createdAt: string;
  channel: 'web' | 'chat';
  split?: { name: string; amountKZT: number; paid: boolean }[];
}

interface Store {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  bookings: Booking[];
  addBooking: (b: Booking) => void;
  updateBooking: (code: string, patch: Partial<Booking>) => void;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  chatSeed: string | null;
  openChatWith: (text: string) => void;
  consumeSeed: () => string | null;
}

const Ctx = createContext<Store | null>(null);

// Browser storage is a convenience only: it can be blocked (private mode, previews),
// so every read and write is guarded and the app works without it.
function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep state in memory */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => load<Currency>('sg.currency', 'INR'));
  const [bookings, setBookings] = useState<Booking[]>(() => load<Booking[]>('sg.bookings', []));
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState<string | null>(null);

  useEffect(() => save('sg.bookings', bookings), [bookings]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    save('sg.currency', c);
  }, []);

  const addBooking = useCallback((b: Booking) => setBookings((prev) => [b, ...prev.filter((x) => x.code !== b.code)]), []);
  const updateBooking = useCallback(
    (code: string, patch: Partial<Booking>) => setBookings((prev) => prev.map((b) => (b.code === code ? { ...b, ...patch } : b))),
    [],
  );

  const openChatWith = useCallback((text: string) => {
    setChatSeed(text);
    setChatOpen(true);
  }, []);

  const consumeSeed = useCallback(() => {
    const s = chatSeed;
    setChatSeed(null);
    return s;
  }, [chatSeed]);

  const value = useMemo(
    () => ({ currency, setCurrency, bookings, addBooking, updateBooking, chatOpen, setChatOpen, chatSeed, openChatWith, consumeSeed }),
    [currency, setCurrency, bookings, addBooking, updateBooking, chatOpen, chatSeed, openChatWith, consumeSeed],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

export function makeCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `SG-${s}`;
}

export const mealLabel: Record<Meal, string> = {
  veg: 'Vegetarian',
  jain: 'Jain',
  halal: 'Halal',
  any: 'No preference',
};
