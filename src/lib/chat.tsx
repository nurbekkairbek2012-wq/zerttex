import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLang } from './i18n';
import { ask, type Engine } from './ai';
import { useStore } from './store';
import { emptySlots, userMsg, welcome, type ChatMsg, type Slots } from './tulpar';

interface ChatState {
  messages: ChatMsg[];
  typing: boolean;
  engine: Engine;
  /** text goes to the engine; display (optional) is what the user bubble shows, e.g. a translated chip. */
  send: (text: string, display?: string) => Promise<void>;
  reset: () => void;
}

const Ctx = createContext<ChatState | null>(null);

/** One conversation shared by the floating widget and the full chat page. */
export function ChatProvider({ children }: { children: ReactNode }) {
  const { currency } = useStore();
  const [messages, setMessages] = useState<ChatMsg[]>(() => [welcome()]);
  const [typing, setTyping] = useState(false);
  const [engine, setEngine] = useState<Engine>('demo');
  const slots = useRef<Slots>(emptySlots());
  const history = useRef<ChatMsg[]>(messages);

  const send = useCallback(
    async (text: string, display?: string) => {
      const clean = text.trim();
      if (!clean) return;
      const u = { ...userMsg(clean), shown: display?.trim() || undefined };
      history.current = [...history.current, u];
      setMessages(history.current);
      setTyping(true);
      try {
        const res = await ask(clean, history.current.slice(0, -1), slots.current, currency);
        slots.current = res.slots;
        setEngine(res.engine);
        history.current = [...history.current, ...res.messages];
        setMessages(history.current);
      } finally {
        setTyping(false);
      }
    },
    [currency],
  );

  // A new language: if the traveler hasn't written yet, greet again in that language.
  const { lang } = useLang();
  useEffect(() => {
    if (history.current.length === 1 && history.current[0].from === 'bot') {
      history.current = [welcome()];
      setMessages(history.current);
    }
  }, [lang]);

  const reset = useCallback(() => {
    slots.current = emptySlots();
    history.current = [welcome()];
    setMessages(history.current);
  }, []);

  const value = useMemo(() => ({ messages, typing, engine, send, reset }), [messages, typing, engine, send, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChat() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useChat must be used inside ChatProvider');
  return c;
}
