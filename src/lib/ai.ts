import { tripById } from './kb';
import type { Currency } from './money';
import type { Meal } from './store';
import { departureFor, respond, type ChatMsg, type EngineResult, type Quote, type Slots } from './tulpar';
import { isoDate, parseIso } from './kb';

/**
 * Chat transport. Tries the serverless AI endpoint first (/api/chat, Claude Haiku with the
 * knowledge base); if it is not deployed or has no API key, the offline demo engine answers.
 */
export type Engine = 'claude' | 'demo';
let remoteDisabled = false;

interface RemoteReply {
  reply: string;
  chips?: string[];
  quote?: { tripId: string; date: string; people: number; meal?: Meal } | null;
  handoff?: boolean;
}

export async function ask(
  text: string,
  history: ChatMsg[],
  slots: Slots,
  cur: Currency,
): Promise<EngineResult & { engine: Engine }> {
  if (!remoteDisabled && typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: cur,
          today: isoDate(new Date()),
          messages: [...history, { from: 'user', text }]
            .slice(-12)
            .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })),
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as RemoteReply;
        if (data && typeof data.reply === 'string') {
          let quote: Quote | undefined;
          if (data.quote && tripById(data.quote.tripId)) {
            const trip = tripById(data.quote.tripId)!;
            const d = departureFor(trip, parseIso(data.quote.date));
            quote = { tripId: trip.id, date: isoDate(d), people: Math.max(1, Math.min(20, data.quote.people || 1)), meal: data.quote.meal ?? 'any' };
          }
          const msg: ChatMsg = {
            id: `r${Date.now()}`,
            from: 'bot',
            text: data.reply,
            chips: data.chips?.slice(0, 4),
            quote,
            handoff: data.handoff,
          };
          return { slots, messages: [msg], engine: 'claude' };
        }
      }
      remoteDisabled = true; // 404 / 501 (no key) -> stop trying for this session
    } catch {
      remoteDisabled = true;
    }
  }
  // Small delay so the typing indicator is visible, like a real chat.
  await new Promise((r) => setTimeout(r, 450 + Math.random() * 350));
  return { ...respond(text, slots, cur), engine: 'demo' };
}
