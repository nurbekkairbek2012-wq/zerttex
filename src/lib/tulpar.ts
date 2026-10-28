/**
 * Tulpar — the booking concierge.
 *
 * This file is the offline "demo engine": a small intent + slot-filling engine that
 * answers only from the approved knowledge base (shared/knowledge.json) and can take a
 * traveler from a question to a priced quote. In production the same contract is served
 * by /api/chat (Claude Haiku with the knowledge base as context); the UI falls back to
 * this engine when the API is not configured, so the demo always works.
 */
import { company, fmtDate, guides, inclusionLabels, isoDate, parseIso, policies, tripById, trips, tripsEn, upcomingDepartures, type Trip } from './kb';
import { plural, tr } from './i18n';

// Chips are sent back to this engine when tapped, so they stay in English (the chat shows them translated).
const enShort = (id: string) => tripsEn.find((x) => x.id === id)!.short;
const enDay = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
import { money, type Currency } from './money';
import type { Meal } from './store';

export interface Quote {
  tripId: string;
  date: string;
  people: number;
  meal: Meal;
}

export interface ChatMsg {
  id: string;
  from: 'user' | 'bot';
  text: string;
  chips?: string[];
  trips?: string[];
  quote?: Quote;
  handoff?: boolean;
  /** What the chat shows for a user message when it differs from what the engine got (translated chips). */
  shown?: string;
}

export interface Slots {
  tripId?: string;
  people?: number;
  date?: string;
  meal?: Meal;
  booking: boolean;
  askedMeal: boolean;
  last?: Quote;
  wanted?: string;
}

export const emptySlots = (): Slots => ({ booking: false, askedMeal: false });

let counter = 0;
const id = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;
const bot = (text: string, extra: Partial<ChatMsg> = {}): ChatMsg => ({ id: id(), from: 'bot', text, ...extra });
export const userMsg = (text: string): ChatMsg => ({ id: id(), from: 'user', text });

export const welcome = (): ChatMsg =>
  bot(
    tr("Hi, I'm {assistant}, the trip assistant of {company}. I can show you trips, explain exactly what's included, and book seats for you in this chat. Where would you like to go?", { assistant: tr(company.assistant), company: company.name }),
    { chips: ['Show me the trips', 'Kolsai lakes for 2 next Friday', 'Is it safe to pay?', 'Do I need a visa?'] },
  );

// ---------- parsing ----------

// Specific names first, generic words ("lakes", "canyon") second.
const tripWords: [RegExp, string][] = [
  [/\b(week|7[- ]?days?|seven days|great kazakhstan|everything|all of them)\b/, 'great-steppe'],
  [/\b(burabay|borovoe|borovoye|okzhetpes)\b/, 'burabay'],
  [/\b(turkestan|turkistan|yasawi|yassawi|silk road|sauran)\b/, 'turkestan'],
  [/\b(charyn|sharyn|valley of castles)\b/, 'charyn-canyon'],
  [/\b(kolsai|kolsay|kaindy|kayindy|saty)\b/, 'kolsai-kaindy'],
  [/\b(lakes?|mountain lake)\b/, 'kolsai-kaindy'],
  [/\b(canyons?)\b/, 'charyn-canyon'],
  [/\b(heritage|mausoleum|history)\b/, 'turkestan'],
  [/\b(pine|forest)\b/, 'burabay'],
];

const numberWords: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
// Whole words only, so "friends" is not Friday and "decide" is not December.
const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const WEEKDAY_RE = '(sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday)?|fri(?:day)?|sat(?:urday)?)';
const monthIndex = (m: string) => months.indexOf(m.slice(0, 3));

function findTrip(t: string): string | undefined {
  for (const [re, tripId] of tripWords) if (re.test(t)) return tripId;
  return undefined;
}

function findPeople(t: string): number | undefined {
  const num = '(\\d{1,2}|' + Object.keys(numberWords).join('|') + ')';
  const toN = (s: string) => (/^\d+$/.test(s) ? Number(s) : numberWords[s]);
  const patterns = [
    new RegExp(`${num}\\s*(people|persons?|pax|adults?|of us|friends|travell?ers|guests|seats?|tickets?)`),
    new RegExp(`\\bfor\\s+${num}\\b(?!\\s*(days?|nights?|am|pm|th|st|nd|rd|\\/|\\.|nov|dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct))`),
    new RegExp(`\\bwe(?:'re| are)\\s+${num}\\b`),
    new RegExp(`\\bfamily of\\s+${num}\\b`),
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (m) {
      const n = toN(m[1]);
      if (n && n > 0 && n <= 20) return n;
    }
  }
  if (/\b(couple|two of us|me and my (wife|husband|partner|girlfriend|boyfriend))\b/.test(t)) return 2;
  if (/\b(solo|alone|just me|only me|myself)\b/.test(t)) return 1;
  if (/^\s*\d{1,2}\s*$/.test(t)) return Number(t.trim());
  return undefined;
}

function findDate(t: string, now = new Date()): Date | undefined {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const add = (n: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + n);
  if (/\btomorrow\b/.test(t)) return add(1);
  if (/\bday after tomorrow\b/.test(t)) return add(2);
  if (/\b(this weekend|weekend)\b/.test(t)) return add((6 - today.getDay() + 7) % 7 || 7);
  if (/\bnext week\b/.test(t)) return add(7 - today.getDay() + 1);
  if (/\bnext month\b/.test(t)) return new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const inDays = t.match(/\bin\s+(\d{1,2})\s+days?\b/);
  if (inDays) return add(Number(inDays[1]));

  // "15 nov", "nov 15", "15th of november"
  const dm = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?${MONTH_RE}\\b`));
  const md = t.match(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  const mOnly = t.match(new RegExp(`\\b(?:in|during)\\s+${MONTH_RE}\\b`));
  let day: number | undefined;
  let mon: number | undefined;
  if (dm) [day, mon] = [Number(dm[1]), monthIndex(dm[2])];
  else if (md) [day, mon] = [Number(md[2]), monthIndex(md[1])];
  else if (mOnly) [day, mon] = [1, monthIndex(mOnly[1])];
  // "15/11" or "15.11"
  const num = t.match(/\b(\d{1,2})[./](\d{1,2})\b/);
  if (day === undefined && num) [day, mon] = [Number(num[1]), Number(num[2]) - 1];
  if (day !== undefined && mon !== undefined && mon >= 0 && mon < 12 && day >= 1 && day <= 31) {
    let d = new Date(today.getFullYear(), mon, day);
    if (d < today) d = new Date(today.getFullYear() + 1, mon, day);
    return d;
  }
  // weekday names, "next friday"
  const wd = t.match(new RegExp(`\\b(next\\s+|this\\s+)?${WEEKDAY_RE}\\b`));
  if (wd) {
    const target = weekdays.indexOf(wd[2].slice(0, 3));
    let diff = (target - today.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    return add(diff);
  }
  return undefined;
}

function findMeal(t: string): Meal | undefined {
  if (/\bjain\b/.test(t)) return 'jain';
  if (/\b(veg|vegetarian|veggie|vegan|no meat|pure veg)\b/.test(t)) return 'veg';
  if (/\bhalal\b/.test(t)) return 'halal';
  if (/\b(no preference|anything|non[- ]?veg|any food|i eat everything)\b/.test(t)) return 'any';
  return undefined;
}

/** First departure on or after the requested date. */
export function departureFor(trip: Trip, wanted: Date): Date {
  const list = upcomingDepartures(trip, 80);
  return list.find((d) => d >= wanted) ?? list[0];
}

// ---------- answers ----------

function tripLine(t: Trip, cur: Currency) {
  return tr('{trip}: {n} days from {place}, {price} per person, all inclusive', { trip: t.name, n: t.days, place: t.start, price: money(t.priceKZT, cur) });
}

function inclusionsText(t: Trip) {
  const inc = t.included.map((k) => `✓ ${inclusionLabels[k]}`).join('\n');
  const not = t.notIncluded.map((k) => `✗ ${k}`).join('\n');
  return `${tr('Included in {trip}:', { trip: t.name })}\n${inc}\n\n${tr('Not included:')}\n${not}`;
}

type Intent =
  | 'greet' | 'human' | 'list' | 'price' | 'included' | 'food' | 'visa' | 'flight' | 'payment' | 'refund'
  | 'season' | 'trust' | 'difficulty' | 'pack' | 'split' | 'hindi' | 'book' | 'thanks' | 'dates' | 'deposit'
  | 'upi' | 'weatherPolicy' | 'group' | 'guideInfo' | 'insurance' | 'stay' | 'changes' | 'unknown';

const intents: [Intent, RegExp][] = [
  ['upi', /\b(upi|gpay india|phonepe|paytm|bhim)\b/],
  ['weatherPolicy', /\b(rain|rains|raining|storm|snowfall|bad weather|road (is )?closed|park (is )?closed)\b/],
  ['group', /\b(group size|how many people (are )?in (a|the|one) group|big group|private (trip|tour)|only us)\b/],
  ['guideInfo', /\b(guide|guides|english speaking|english-speaking)\b/],
  ['insurance', /\b(insurance|insured|medical cover)\b/],
  ['stay', /\b(stay|hotel|accommodation|sleep|night|yurt|guesthouse|guest house|room)\b/],
  ['changes', /\b(change|move|shift) (the |my |our )?(date|dates|trip|booking)\b/],
  ['human', /\b(human|person|someone|agent|manager|operator|call me|speak to|talk to (a|the|your) (team|person|human))\b/],
  ['hindi', /\b(hindi|हिंदी|namaste|namaskar)\b/],
  ['refund', /\b(refund|cancel|cancellation|money back|reschedule)\b/],
  ['deposit', /\b(deposit|advance|pay later|in parts|instal+ments?)\b/],
  ['payment', /\b(pay|payment|card|visa card|mastercard|upi|apple pay|google pay|rupay|currency|rupees?|inr|declined|fail)\b/],
  ['trust', /\b(safe|trust|legit|scam|real company|licen[cs]e|reviews?|fake|reliable|secure)\b/],
  ['visa', /\b(visa|passport|entry|immigration|registration)\b/],
  ['flight', /\b(flights?|fly|airport|airline|indigo|air astana|get to (almaty|astana|kazakhstan)|reach (almaty|astana|kazakhstan)|from (delhi|mumbai|bengaluru|bangalore|india))\b/],
  ['unknown', /\b(e-?sim|sim card|wi-?fi|internet|mobile data|atm|exchange money|currency exchange|power socket|adapter)\b/],
  ['food', /\b(food|meals?|veg|vegetarian|jain|halal|eat|lunch|dinner|breakfast)\b/],
  ['included', /\b(include|included|includes|inclusion|what do i get|what's in|whats in|cover)\b/],
  ['price', /\b(price|cost|how much|expensive|cheap|budget|rate|fee)\b/],
  ['season', /\b(weather|season|best time|when to go|cold|snow|temperature|month)\b/],
  ['difficulty', /\b(difficult|hard|easy|fitness|kids?|children|elderly|parents|walk|hike|trek)\b/],
  ['pack', /\b(pack|bring|wear|clothes|shoes)\b/],
  ['split', /\b(split|friends pay|each pay|share the cost|group payment)\b/],
  ['dates', /\b(dates?|when|available|availability|departures?|schedule|seats)\b/],
  ['book', /\b(book|reserve|booking|want to go|plan|let's go|lets go|sign up|join)\b/],
  ['list', /\b(trips|tours|options|show me|what do you have|places|destinations|itinerar)\b/],
  ['thanks', /\b(thanks|thank you|great|perfect|awesome|cool)\b/],
  ['greet', /\b(hi|hello|hey|salam|good (morning|evening|afternoon))\b/],
];

function detectIntents(t: string): Intent[] {
  return intents.filter(([, re]) => re.test(t)).map(([i]) => i);
}

export interface EngineResult {
  slots: Slots;
  messages: ChatMsg[];
}

export function respond(text: string, prev: Slots, cur: Currency, now = new Date()): EngineResult {
  const t = text.toLowerCase().trim();
  let slots: Slots = { ...prev };
  const out: ChatMsg[] = [];

  if (/\bchange (the )?date\b/.test(t) && prev.last) {
    const trp = tripById(prev.last.tripId)!;
    slots = { ...emptySlots(), booking: true, tripId: trp.id, people: prev.last.people, meal: prev.last.meal, askedMeal: true };
    return {
      slots,
      messages: [bot(tr('Sure. Pick another {trip} departure:', { trip: trp.name }), { chips: upcomingDepartures(trp, 4).map(enDay) })],
    };
  }

  const tripId = findTrip(t);
  const people = findPeople(t);
  const date = findDate(t, now);
  const meal = findMeal(t);
  const found = detectIntents(t);
  const has = (i: Intent) => found.includes(i);

  if (tripId) slots.tripId = tripId;
  if (people) slots.people = people;
  if (meal) slots.meal = meal;
  if (date) slots.wanted = isoDate(date);
  if (date && slots.tripId) {
    const trip = tripById(slots.tripId)!;
    slots.date = isoDate(departureFor(trip, date));
  } else if (date) {
    slots.date = isoDate(date);
  }
  // Trip chosen after the date: snap the remembered date to that trip's departures.
  if (tripId && !date && slots.wanted && slots.date) {
    slots.date = isoDate(departureFor(tripById(tripId)!, new Date(slots.wanted)));
  }

  const bookingSignal = has('book') || (!!slots.tripId && (!!people || !!date || (prev.booking && !!meal)));
  if (bookingSignal) slots.booking = true;

  const trip = slots.tripId ? tripById(slots.tripId) : undefined;

  // --- informational intents answer first; booking continues after ---
  // Topics outside the approved knowledge base: never guess, hand over to a person.
  if (has('unknown') && !has('payment') && !has('upi')) {
    out.push(bot(tr("Good question. I only answer from information our team has checked, and I don't have that yet, so I've asked a person from our team to reply here. Usually under 10 minutes between 8:00 and 23:00 Astana time."), { handoff: true }));
    return { slots, messages: out };
  }
  if (has('human')) {
    out.push(bot(tr("I'll bring in a person from our Astana team. Average reply time is under 10 minutes from 8:00 to 23:00 Astana time. Meanwhile I'm still here if you have questions."), { handoff: true }));
    return { slots, messages: out };
  }
  if (has('hindi')) {
    out.push(bot(tr("Namaste! This offline demo understands questions in simple English. With the AI mode on, you can chat fully in Hindi: switch the site to हिन्दी at the top."), { chips: ['Show me the trips', 'What is included?'] }));
  }
  if (has('greet') && found.length === 1 && !tripId && !people && !date) {
    out.push(welcome());
    return { slots, messages: out };
  }
  if (has('thanks') && found.length === 1 && !slots.booking) {
    out.push(bot(tr('Happy to help. Anything else about the trip?'), { chips: ['Show me the trips', 'Talk to a person'] }));
    return { slots, messages: out };
  }
  if (has('list') && !trip) {
    out.push(bot(`${tr('Here are our trips. Prices are per person and include transport, guide, stay, meals and park fees:')}\n${trips.map((x) => `• ${tripLine(x, cur)}`).join('\n')}`, { trips: trips.map((x) => x.id), chips: ['Kolsai lakes for 2 next Friday', 'Which is easiest for parents?'] }));
  }
  if (has('price')) {
    const forGroup = trip && slots.people && slots.people > 1 ? ` ${tr('For {n} travelers: {price} in total.', { n: slots.people, price: money(trip.priceKZT * slots.people, cur) })}` : '';
    if (trip) out.push(bot(`${tripLine(trip, cur)}.${forGroup} ${tr('No extra fees at checkout.')} ${policies.deposit}`, { chips: ['What is included?', `Book ${enShort(trip.id)}`] }));
    else out.push(bot(`${tr('Per person, all inclusive:')}\n${trips.map((x) => `• ${tripLine(x, cur)}`).join('\n')}`, { chips: ['What is included?', 'How do I pay?'] }));
  }
  if (has('included')) {
    const x = trip ?? tripById('kolsai-kaindy')!;
    out.push(bot(inclusionsText(x), { chips: [`Book ${enShort(x.id)}`, 'Vegetarian food?'] }));
  }
  if (has('deposit')) out.push(bot(`${policies.deposit} ${policies.cancellation}`));
  if (has('food') && !(prev.booking && meal)) out.push(bot(`${policies.food} ${tr('Our guesthouse hosts cook a vegetarian menu every day (rice, lentil soup, vegetable plov, salads, bread and fruit).')}`));
  if (has('visa')) out.push(bot(policies.visa, { chips: ['Flights from India', 'Show me the trips'] }));
  if (has('flight')) out.push(bot(`${policies.flights} ${tr('Flights are not included, so you can use your own airline miles. We pick you up from your hotel or the airport.')}`));
  if (has('upi')) out.push(bot(`${policies.upi}\n\n${tr('Tip for Indian cards:')} ${policies.indianCards.replace(tr('Indian bank cards: '), '')}`));
  if (has('payment') && !has('upi')) out.push(bot(`${policies.payments}\n\n${tr('Tip for Indian cards:')} ${policies.indianCards.replace(tr('Indian bank cards: '), '')}`, { chips: ['Can I pay a deposit?', 'Split with friends'] }));
  if (has('refund')) out.push(bot(`${policies.cancellation} ${policies.weather} ${policies.promise}`));
  if (has('trust')) out.push(bot(`${tr('Fair question. {company} has run trips since {year} with {guides} local guides and {travelers} travelers in 2025. Every guide has a verified profile and video intro, only travelers who actually went can leave reviews, and payments go through a licensed Kazakhstan bank with 3-D Secure.', { company: company.name, year: company.founded, guides: company.guides, travelers: company.travelers2025.toLocaleString('en-US') })} ${policies.promise}`, { chips: ['Open the Trust page', 'Meet the guides'] }));
  if (has('weatherPolicy')) out.push(bot(`${policies.weather} ${policies.promise}`));
  if (has('changes') && !prev.last) out.push(bot(`${policies.changes} ${policies.cancellation}`));
  if (has('group')) out.push(bot(trip ? `${trip.name}: ${trip.groupSize}. ${policies.groups.split('. ').slice(1).join('. ')}` : policies.groups));
  if (has('insurance')) out.push(bot(policies.insurance));
  if (has('guideInfo') && !has('included')) {
    const g = trip ? guides[trip.guide] : undefined;
    out.push(bot(g ? `${tr('Your guide on {trip} is {name}: {years} years guiding, speaks {langs}.', { trip: trip!.name, name: g.name, years: g.years, langs: g.langs })} ${g.bio} ${tr('You can watch a one-minute video intro on the trip page before you pay.')}` : tr('Every group has an English-speaking local guide with a checked ID and first-aid certificate. Each guide has a profile and a one-minute video intro on the trip page.'), { chips: ['Meet the guides'] }));
  }
  if (has('stay') && !has('visa') && !has('included')) {
    const x = trip;
    out.push(bot(x ? tr('On {trip} you stay in {places}. Rooms are twin share; a single room costs extra.', { trip: x.name, places: tripsEn.find((e) => e.id === x.id)!.itinerary.map((d) => d.text).join(' ').match(/(guesthouse|yurt eco-camp|resort|Caravanserai)/gi)?.filter((v, i, a) => a.indexOf(v) === i).map((v) => tr(v)).join(tr(' and ')) ?? tr('comfortable local places') }) : tr('Nights are in family guesthouses (Kolsai), a yurt eco-camp (Charyn), the Caravanserai complex (Turkestan) or a lakeside resort (Burabay). Rooms are twin share and included in the price.')));
  }
  if (has('season') && !has('weatherPolicy')) {
    if (trip) out.push(bot(tr('Best season for {trip}: {season}.', { trip: trip.name, season: trip.season })));
    else out.push(bot(trips.map((x) => `• ${x.name}: ${x.season}`).join('\n')));
  }
  if (has('difficulty')) {
    if (trip) out.push(bot(`${trip.name}: ${trip.difficulty}. ${trip.groupSize}.`));
    else out.push(bot(tr('Easiest for parents and kids: Burabay Lakes and Turkestan Silk Road (flat, short walks). Kolsai has longer optional hikes.'), { chips: ['Burabay for 4', 'Turkestan for 3'] }));
  }
  if (has('pack')) out.push(bot(tr('Bring comfortable walking shoes, a warm layer (mountain evenings are cool even in summer), sunscreen, a power bank and your passport. We provide water.')));
  if (has('split')) out.push(bot(`${policies.split} ${tr('Choose "Split with friends" at checkout and each person gets their own payment link.')}`, slots.last ? { quote: slots.last } : {}));
  if (has('dates') && trip && !slots.date) {
    const ds = upcomingDepartures(trip, 4).map((d) => fmtDate(d)).join(', ');
    out.push(bot(tr('Next {trip} departures: {dates}. Which one suits you?', { trip: trip.name, dates: ds }), { chips: upcomingDepartures(trip, 3).map(enDay) }));
    return { slots, messages: out };
  }

  // --- trip mentioned without a question: describe it ---
  if (tripId && !slots.booking && out.length === 0) {
    const trp = tripById(tripId)!;
    out.push(bot(`${trp.name}: ${trp.tagline}\n${tr('{n} days from {place}, {price} per person all inclusive. Highlights: {list}.', { n: trp.days, place: trp.start, price: money(trp.priceKZT, cur), list: trp.highlights.slice(0, 3).join(', ') })}`, { trips: [trp.id], chips: [`Book ${enShort(trp.id)}`, 'What is included?', 'Dates'] }));
    return { slots, messages: out };
  }

  // --- booking: fill the slots, then quote ---
  if (slots.booking) {
    if (!slots.tripId) {
      out.push(bot(tr('Which trip would you like to book?'), { chips: tripsEn.map((x) => x.name), trips: trips.map((x) => x.id) }));
      return { slots, messages: out };
    }
    const trp = tripById(slots.tripId)!;
    const ackParts: string[] = [];
    if (people && !tripId) ackParts.push(plural(people, '{n} traveler', '{n} travelers'));
    if (meal && prev.booking) ackParts.push(tr(meal === 'any' ? 'no food preference' : meal === 'veg' ? 'veg meals' : meal === 'jain' ? 'jain meals' : 'halal meals'));
    const ack = ackParts.length ? `${tr('Noted: {list}.', { list: ackParts.join(', ') })} ` : tripId ? `${tr('Great choice.')} ` : '';
    if (!slots.date) {
      out.push(bot(`${ack}${tr('When would you like to go? {trip} departs {days}.', { trip: trp.name, days: trp.departures.map((d) => tr(['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][d])).join(tr(' and ')) })}`, { chips: upcomingDepartures(trp, 3).map(enDay) }));
      return { slots, messages: out };
    }
    if (!slots.people) {
      out.push(bot(`${ack}${tr('How many travelers?')}`, { chips: ['Just me', '2 people', '4 people', '6 people'] }));
      return { slots, messages: out };
    }
    if (!slots.meal && !slots.askedMeal) {
      slots.askedMeal = true;
      out.push(bot(tr('Any food preference for the group? Every trip has vegetarian meals.'), { chips: ['Vegetarian', 'Jain', 'Halal', 'No preference'] }));
      return { slots, messages: out };
    }
    const q: Quote = { tripId: trp.id, date: slots.date, people: slots.people, meal: slots.meal ?? 'any' };
    const total = trp.priceKZT * q.people;
    const dep = parseIso(q.date);
    const wantedNote = slots.wanted && slots.wanted !== q.date ? ` ${tr('(the nearest departure to your date)')}` : '';
    out.push(
      bot(
        tr("Here is your quote: {trip}, {date}{note}, {who}. Total {price}, nothing extra to pay later. I'm holding the seats for 30 minutes.", { trip: trp.name, date: fmtDate(dep, { weekday: 'long', day: 'numeric', month: 'long' }), note: wantedNote, who: plural(q.people, '{n} traveler', '{n} travelers'), price: money(total, cur) }),
        { quote: q, chips: ['Change date', 'Split with friends', 'Talk to a person'] },
      ),
    );
    return { slots: { ...emptySlots(), last: q }, messages: out };
  }

  if (out.length === 0) {
    out.push(
      bot(tr("I can help you choose a trip, check dates, explain what's included, and book. For anything else, a person from our team can take over."), {
        chips: ['Show me the trips', 'Is it safe to pay?', 'Talk to a person'],
      }),
    );
  }
  return { slots, messages: out };
}
