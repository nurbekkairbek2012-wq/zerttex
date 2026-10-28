// Shared server logic for the Tulpar AI concierge (used by the Vercel and Netlify functions).
// The model may only answer from the approved knowledge base below; anything else goes to a human.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const kb = require('./knowledge.json');

const MODEL = process.env.TULPAR_MODEL || 'claude-haiku-5-5';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Languages the site can be switched to. Tulpar answers in the chosen one unless the traveler writes in another.
const LANGS = {
  en: 'English',
  hi: 'Hindi, written in Devanagari script',
  ru: 'Russian',
  kk: 'Kazakh, written in Kazakh Cyrillic script (with letters ә ғ қ ң ө ұ ү һ і)',
};

function systemPrompt(currency, today, lang = 'en') {
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
Your users are mostly travelers from India. Write short, warm, plain language (max 90 words).
LANGUAGE: the site is set to ${LANGS[lang] || LANGS.en}. Write "reply" and "chips" in that language. If the traveler's last message is clearly written in a different language, answer in the traveler's language instead. Keep trip names, prices and dates exact. Never invent facts, prices, dates or policies: use ONLY the data below. If you don't know, offer a human from the team (set "handoff": true).
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

function parseReply(text, engine) {
  try {
    const start = text.indexOf('{');
    const parsed = JSON.parse(text.slice(start, text.lastIndexOf('}') + 1));
    return {
      reply: String(parsed.reply || ''),
      chips: Array.isArray(parsed.chips) ? parsed.chips.map(String).slice(0, 4) : [],
      quote: parsed.quote && typeof parsed.quote === 'object' ? parsed.quote : null,
      handoff: !!parsed.handoff,
      engine,
    };
  } catch {
    return { reply: text, chips: [], quote: null, handoff: false, engine };
  }
}

async function askGemini(key, system, messages) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
        maxOutputTokens: 1024,
        // Flash models think by default; for short chat replies that only adds delay (Netlify functions time out at 10 s).
        ...(/flash/.test(GEMINI_MODEL) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      },
    }),
  });
  if (!res.ok) return { status: 502, json: { error: `Upstream error ${res.status}` } };
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
  if (!text) return { status: 502, json: { error: 'Empty answer from Gemini' } };
  return { status: 200, json: parseReply(text, 'gemini') };
}

async function askClaude(key, system, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 600, system, messages }),
  });
  if (!res.ok) return { status: 502, json: { error: `Upstream error ${res.status}` } };
  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || '').join('').trim();
  return { status: 200, json: parseReply(text, 'claude') };
}

// Keys live only in the hosting provider's environment variables, never in the code or the browser.
export async function handleChat(body) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (!geminiKey && !claudeKey)
    return { status: 501, json: { error: 'AI is not configured on this deployment (GEMINI_API_KEY missing). The app uses the offline demo engine.' } };

  const currency = ['INR', 'USD', 'KZT'].includes(body?.currency) ? body.currency : 'INR';
  const lang = Object.hasOwn(LANGS, body?.lang) ? body.lang : 'en';
  const today = typeof body?.today === 'string' ? body.today.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length) return { status: 400, json: { error: 'No user message' } };

  const system = systemPrompt(currency, today, lang);
  return geminiKey ? askGemini(geminiKey, system, messages) : askClaude(claudeKey, system, messages);
}
