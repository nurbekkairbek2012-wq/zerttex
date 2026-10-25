import { kb } from './kb';

export type Currency = 'INR' | 'USD' | 'KZT';

const symbols: Record<Currency, string> = { INR: '₹', USD: '$', KZT: '₸' };

/** Convert a tenge amount to the display currency using NBK official rates. */
export function convert(kzt: number, cur: Currency): number {
  const rate = kb.rates[cur];
  return kzt / rate;
}

export function money(kzt: number, cur: Currency): string {
  const v = convert(kzt, cur);
  if (cur === 'KZT') return `${Math.round(v).toLocaleString('en-US')} ₸`;
  if (cur === 'USD') return `$${Math.round(v).toLocaleString('en-US')}`;
  // Indian digit grouping, e.g. ₹16,632 / ₹1,05,000
  return `${symbols.INR}${Math.round(v).toLocaleString('en-IN')}`;
}

export const rateNote = `${kb.rates.source}: 1 ₹ = ${kb.rates.INR} ₸, 1 $ = ${kb.rates.USD} ₸`;
