/**
 * Tulpar demo-engine test set: 50 typical questions from travelers in India,
 * written by the team before tuning. A case passes when the reply contains the
 * correct fact from the knowledge base, a correct quote, or a safe handoff.
 * Run: npm test
 */
import { describe, expect, test } from 'vitest';
import { emptySlots, respond, type ChatMsg, type Slots } from './tulpar';

const NOW = new Date(2026, 9, 25); // Sunday 25 Oct 2026

function chat(turns: string[]) {
  let slots: Slots = emptySlots();
  let last: ChatMsg[] = [];
  for (const t of turns) {
    const r = respond(t, slots, 'INR', NOW);
    slots = r.slots;
    last = r.messages;
  }
  const text = last.map((m) => m.text).join('\n').toLowerCase();
  const quote = last.find((m) => m.quote)?.quote;
  const handoff = last.some((m) => m.handoff);
  return { text, quote, handoff, last };
}

type Check = (r: ReturnType<typeof chat>) => boolean;
const has = (...words: string[]): Check => (r) => words.every((w) => r.text.includes(w.toLowerCase()));
const quoteIs = (tripId: string, people: number, meal?: string): Check => (r) =>
  !!r.quote && r.quote.tripId === tripId && r.quote.people === people && (!meal || r.quote.meal === meal);
const asks = (word: string): Check => (r) => !r.quote && r.text.includes(word);
const safe: Check = (r) => r.handoff || r.text.includes('person from our team') || r.text.includes('a person');

export const cases: { q: string[]; check: Check; topic: string }[] = [
  // visas, travel, flights
  { topic: 'visa', q: ['Do I need a visa for Kazakhstan?'], check: has('14 days') },
  { topic: 'visa', q: ['visa for indian passport holders?'], check: has('14 days') },
  { topic: 'flights', q: ['How do I get to Almaty from Delhi?'], check: has('3.5 hours') },
  { topic: 'flights', q: ['Are flights included?'], check: has('not included') },
  // prices
  { topic: 'price', q: ['How much is Charyn canyon?'], check: has('₹12,211') },
  { topic: 'price', q: ['price of kolsai trip'], check: has('₹16,632') },
  { topic: 'price', q: ['How much for 3 people Kolsai?'], check: (r) => r.text.includes('₹49,895') || r.text.includes('when would you like') },
  { topic: 'price', q: ['how much is the 7 day trip?'], check: has('₹39,789') },
  { topic: 'price', q: ['What currency do you charge in?'], check: has('tenge') },
  // inclusions and food
  { topic: 'included', q: ["what's included in the turkestan tour"], check: has('included in turkestan') },
  { topic: 'included', q: ['Is hotel pickup included?'], check: has('pickup') },
  { topic: 'food', q: ['Is the food vegetarian?'], check: has('vegetarian') },
  { topic: 'food', q: ['Do you have jain food'], check: has('jain') },
  { topic: 'food', q: ['halal food available?'], check: has('halal') },
  { topic: 'insurance', q: ['Do I need travel insurance?'], check: has('insurance', 'included') },
  // payments
  { topic: 'payment', q: ['Can I pay with my Indian credit card?'], check: has('3-d secure', 'international') },
  { topic: 'payment', q: ['my card got declined, what do I do'], check: has('international') },
  { topic: 'payment', q: ['Do you accept UPI?'], check: has('upi', 'card') },
  { topic: 'payment', q: ['Can I pay a deposit?'], check: has('20%') },
  { topic: 'payment', q: ['Can we split the payment between friends?'], check: has('split') },
  { topic: 'payment', q: ['can I pay with apple pay'], check: has('apple pay') },
  // policies
  { topic: 'policy', q: ['What is your cancellation policy'], check: has('72 hours') },
  { topic: 'policy', q: ['what happens if it rains or the park is closed?'], check: has('refund 100%') },
  { topic: 'policy', q: ['Can I change the date later?'], check: has('date change') },
  // trust
  { topic: 'trust', q: ['Is it safe to book with you?'], check: has('since 2020') },
  { topic: 'trust', q: ['are you a real company? do you have a licence?'], check: has('since 2020') },
  { topic: 'guide', q: ['Do you provide an English speaking guide?'], check: has('english-speaking') },
  { topic: 'guide', q: ['Who is the guide on Charyn?'], check: has('daulet') },
  // trip info
  { topic: 'season', q: ['best time to visit kolsai'], check: has('may to october') },
  { topic: 'season', q: ['Is Charyn open in winter? what is the weather like'], check: has('all year') },
  { topic: 'difficulty', q: ['Which trip is good for elderly parents?'], check: has('burabay') },
  { topic: 'difficulty', q: ['how difficult is the kolsai hike'], check: has('8 km') },
  { topic: 'difficulty', q: ['Can kids join?'], check: has('kids') },
  { topic: 'stay', q: ['Where do we stay at night on Charyn?'], check: has('yurt') },
  { topic: 'group', q: ['How many people are in a group?'], check: has('10 to 14') },
  { topic: 'pack', q: ['What should I pack?'], check: has('walking shoes') },
  { topic: 'list', q: ['Show me all trips'], check: (r) => r.last.some((m) => (m.trips?.length ?? 0) >= 5) },
  { topic: 'info', q: ['how far is charyn from almaty'], check: has('200 km') },
  { topic: 'info', q: ['What is Kaindy?'], check: has('kolsai') },
  // booking flows
  { topic: 'booking', q: ['Kolsai lakes for 2 people next Friday, veg'], check: quoteIs('kolsai-kaindy', 2, 'veg') },
  { topic: 'booking', q: ['Book Charyn for 4 on 15 November', 'no preference'], check: quoteIs('charyn-canyon', 4, 'any') },
  { topic: 'booking', q: ['We are 3 friends, want Burabay this weekend, Jain food'], check: quoteIs('burabay', 3, 'jain') },
  { topic: 'booking', q: ['I want to book a trip'], check: asks('which trip') },
  { topic: 'booking', q: ['I want to book a trip', 'Turkestan', '2 people', 'March 14', 'Halal'], check: quoteIs('turkestan', 2, 'halal') },
  { topic: 'booking', q: ['Charyn canyon for my family of 5 on 1 Dec', 'vegetarian'], check: quoteIs('charyn-canyon', 5, 'veg') },
  { topic: 'booking', q: ['Book Burabay', 'just me', 'Saturday 31 Oct', 'halal'], check: quoteIs('burabay', 1, 'halal') },
  // handoff and small talk
  { topic: 'handoff', q: ['talk to a human please'], check: safe },
  { topic: 'handoff', q: ['can I speak to someone?'], check: safe },
  { topic: 'handoff', q: ['Is there mobile internet or eSIM in Saty village?'], check: safe },
  { topic: 'greeting', q: ['namaste'], check: has('namaste') },
];

describe('Tulpar answers typical traveler questions', () => {
  test.each(cases.map((c, i) => [i + 1, c.q.join(' → '), c] as const))('#%i %s', (_i, _q, c) => {
    expect(c.check(chat(c.q))).toBe(true);
  });
});
