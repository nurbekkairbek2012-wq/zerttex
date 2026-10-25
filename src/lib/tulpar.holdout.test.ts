/**
 * Hold-out set: 20 differently worded questions written AFTER the engine was tuned on
 * tulpar.test.ts, and not used to change the engine. The score is reported as-is.
 */
import { describe, expect, test } from 'vitest';
import { emptySlots, respond, type ChatMsg, type Slots } from './tulpar';

const NOW = new Date(2026, 9, 25);
function chat(turns: string[]) {
  let slots: Slots = emptySlots();
  let last: ChatMsg[] = [];
  for (const t of turns) {
    const r = respond(t, slots, 'INR', NOW);
    slots = r.slots;
    last = r.messages;
  }
  return { text: last.map((m) => m.text).join('\n').toLowerCase(), quote: last.find((m) => m.quote)?.quote, handoff: last.some((m) => m.handoff) };
}
type R = ReturnType<typeof chat>;
const has = (...w: string[]) => (r: R) => w.every((x) => r.text.includes(x.toLowerCase()));

export const holdout: { q: string[]; check: (r: R) => boolean }[] = [
  { q: ['hey, is a visa needed if I hold an Indian passport'], check: has('14 days') },
  { q: ['what does the burabay package cost per person'], check: has('₹11,368') },
  { q: ['are meals covered on the charyn trip?'], check: has('meals') },
  { q: ['is pure veg food possible in the guesthouse'], check: has('vegetarian') },
  { q: ['my hdfc debit card does not work abroad, help'], check: has('international') },
  { q: ['is there a refund if I cancel 5 days before'], check: has('72 hours') },
  { q: ['what is the best season for turkestan'], check: has('march to may') },
  { q: ['is kolsai ok for a 60 year old'], check: (r) => r.text.includes('8 km') || r.text.includes('easiest') },
  { q: ['how do I know you are not a scam'], check: has('since 2020') },
  { q: ['two of us want charyn on 21st november, we eat everything'], check: (r) => r.quote?.tripId === 'charyn-canyon' && r.quote.people === 2 },
  { q: ['reserve kolsai for six people next monday', 'jain'], check: (r) => r.quote?.tripId === 'kolsai-kaindy' && r.quote.people === 6 && r.quote.meal === 'jain' },
  { q: ['can my friends pay separately'], check: has('split') },
  { q: ['do you take google pay'], check: has('google pay') },
  { q: ['which tours do you offer'], check: (r) => r.text.includes('kolsai') && r.text.includes('burabay') },
  { q: ['is the guide fluent in english'], check: has('english') },
  { q: ['what to wear in october in the mountains'], check: (r) => r.text.includes('warm') || r.text.includes('shoes') },
  { q: ['is there an ATM in Saty'], check: (r) => r.handoff },
  { q: ['i need to speak with your manager'], check: (r) => r.handoff },
  { q: ['what if snowfall closes the road to kolsai'], check: has('refund 100%') },
  { q: ['how long is the drive from almaty to kolsai'], check: (r) => r.handoff || r.text.includes('chilik') || r.text.includes('hour') },
];

// Benchmark, not a pass/fail list: the rule-based demo engine scored 16/20 (80%) on first run
// (misses: total price phrased as "package cost", "60 year old", "21st november" date format,
// drive time). This gap is why the MVP uses an LLM grounded in the same knowledge base (target 90%+).
describe('Hold-out benchmark (not used for tuning)', () => {
  test('demo engine answers at least 75% of unseen questions', () => {
    const results = holdout.map((c) => c.check(chat(c.q)));
    const score = results.filter(Boolean).length;
    const missed = holdout.filter((_, i) => !results[i]).map((c) => c.q.join(' → '));
    console.log(`Hold-out score: ${score}/${holdout.length}. Missed: ${missed.join(' | ')}`);
    expect(score / holdout.length).toBeGreaterThanOrEqual(0.75);
  });
});
