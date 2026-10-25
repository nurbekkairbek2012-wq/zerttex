// Shared server logic for the Tulpar AI concierge (used by the Vercel and Netlify functions).
// The model may only answer from the approved knowledge base below; anything else goes to a human.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const kb = require('./knowledge.json');

const MODEL = process.env.TULPAR_MODEL || 'claude-haiku-5-5';

function systemPrompt(currency, today) {
  const rate = kb.rates[currency] || 1;
  const fmt = (kzt) => (currency === 'KZT' ? `${kzt} KZT` : `${Math.round(kzt / rate)} ${currency}`);
  const trips = kb.trips
    .map(
      (t) =>
        `- id=${t.id} | ${t.name} | ${t.days} days from ${t.start} | ${fmt(t.priceKZT)} per person all inclusive | departs weekdays ${t.departures.join(',')} (0=Sun) | season: ${t.season} | difficulty: ${t.difficulty} | included: ${t.included
          .map((k) => kb.inclusionLabels[k])
          .join('; ')} | not included: ${t.notIncluded.join('; ')} | highlights: ${t.highlights.join('; ')}`,
    )
    .join('\n');
  return `You are Tulpar, the booking assistant of ${kb.company.name}, a tour company in Astana, Kazakhstan (founded ${kb.company.founded}, ${kb.company.guides} local guides).
Your users are mostly travelers from India. Write short, warm, plain English (max 90 words). Never invent facts, prices, dates or policies: use ONLY the data below. If you don't know, offer a human from the team (set "handoff": true).
Today is ${today}. Show prices in ${currency}.

TRIPS
${trips}

POLICIES
${Object.entries(kb.policies)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

BOOKING
When the traveler has chosen a trip, a date and the number of people, return a quote object so the app can show a payment link. Ask for missing details one at a time. Ask about food preference (veg, jain, halal, any) once before quoting.

OUTPUT
Reply with JSON only: {"reply": string, "chips": string[] (0-4 short suggested replies), "quote": {"tripId": string, "date": "YYYY-MM-DD", "people": number, "meal": "veg"|"jain"|"halal"|"any"} | null, "handoff": boolean}`;
}

export async function handleChat(body) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { status: 501, json: { error: 'AI is not configured on this deployment (ANTHROPIC_API_KEY missing). The app uses the offline demo engine.' } };

  const currency = ['INR', 'USD', 'KZT'].includes(body?.currency) ? body.currency : 'INR';
  const today = typeof body?.today === 'string' ? body.today.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length) return { status: 400, json: { error: 'No user message' } };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 600, system: systemPrompt(currency, today), messages }),
  });
  if (!res.ok) return { status: 502, json: { error: `Upstream error ${res.status}` } };
  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || '').join('').trim();
  try {
    const start = text.indexOf('{');
    const parsed = JSON.parse(text.slice(start, text.lastIndexOf('}') + 1));
    return { status: 200, json: { reply: String(parsed.reply || ''), chips: parsed.chips || [], quote: parsed.quote || null, handoff: !!parsed.handoff } };
  } catch {
    return { status: 200, json: { reply: text, chips: [], quote: null, handoff: false } };
  }
}
