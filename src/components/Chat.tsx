import { Headset, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../lib/chat';
import { tripById } from '../lib/kb';
import { money } from '../lib/money';
import { useStore } from '../lib/store';
import type { ChatMsg } from '../lib/tulpar';
import { coverOf } from '../lib/photos';
import { Shanyrak } from './Art';
import { AnimatePresence, animate, motion, useDragControls, useMotionValue } from 'framer-motion';
import { tr, useLang, useT, type Lang } from '../lib/i18n';
import { fmtDate, tripsEn } from '../lib/kb';
import { Photo } from './Photo';
import { TripTicket } from './Ticket';

const navChips: Record<string, string> = {
  'Open the Trust page': '/trust',
  'Meet the guides': '/trust#guides',
};

const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Chips stay in English for the engine; this is what the traveler sees. */
export function chipLabel(c: string, lang: Lang): string {
  if (lang === 'en') return c;
  const date = c.match(/^(\w+) (\d{1,2}) (\w{3})$/);
  if (date && EN_DAYS.includes(date[1]) && EN_MONTHS.includes(date[3])) {
    const now = new Date();
    let d = new Date(now.getFullYear(), EN_MONTHS.indexOf(date[3]), Number(date[2]));
    if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)) d = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
    return fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' });
  }
  const book = c.match(/^Book (.+)$/);
  if (book) {
    const trip = tripsEn.find((x) => x.short === book[1] || x.name === book[1]);
    return tr('Book {trip}', { trip: trip ? tr(trip.short, undefined, lang) : book[1] }, lang);
  }
  return tr(c, undefined, lang);
}

function Bubble({ m, onChip, live }: { m: ChatMsg; onChip: (c: string) => void; live: boolean }) {
  const tx = useT();
  const { lang } = useLang();
  const { currency } = useStore();
  return (
    <motion.div
      className={`msg msg--${m.from}`}
      initial={{ opacity: 0, y: 18, scale: 0.94, x: m.from === 'user' ? 30 : -30 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      <div className="msg__bubble">
        {(m.shown ?? m.text).split('\n').map((line, i) => (
          <p key={i}>{line || ' '}</p>
        ))}
      </div>
      {m.handoff && (
        <div className="msg__handoff">
          <Headset size={16} aria-hidden="true" />{' '}{tx("A team member has been notified and will join this chat.")}</div>
      )}
      {m.trips && m.trips.length > 0 && (
        <div className="msg__trips">
          {m.trips.map((id) => {
            const t = tripById(id)!;
            return (
              <Link key={id} to={`/trips/${id}`} className="mini-trip">
                <Photo id={coverOf(t.id)} width={500} sizes="150px" className="mini-trip__art" />
                <span className="mini-trip__name">{t.name}</span>
                <span className="mini-trip__meta">
                  {tx('{n} days', { n: t.days })}, {money(t.priceKZT, currency)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
      {m.quote && (
        <motion.div className="msg__quote" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}>
          <TripTicket tripId={m.quote.tripId} date={m.quote.date} people={m.quote.people} meal={m.quote.meal} variant="chat" source="chat" />
        </motion.div>
      )}
      {live && m.chips && m.chips.length > 0 && (
        <div className="chips" role="group" aria-label={tx("Suggested replies")}>
          {m.chips.map((c) => (
            <button key={c} type="button" className="chip" onClick={() => onChip(c)}>
              {chipLabel(c, lang)}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function ChatThread({ autoFocus = false }: { autoFocus?: boolean }) {
  const tx = useT();
  const { messages, typing, send } = useChat();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { consumeSeed, chatSeed } = useStore();
  const { lang } = useLang();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (chatSeed) {
      const s = consumeSeed();
      if (s) void send(s, chipLabel(s, lang));
    }
  }, [chatSeed, consumeSeed, send, lang]);

  const onChip = (c: string) => {
    if (navChips[c]) navigate(navChips[c]);
    else void send(c, chipLabel(c, lang));
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = text;
    setText('');
    void send(v);
  };
  const lastBot = [...messages].reverse().find((m) => m.from === 'bot');

  return (
    <div className="thread">
      <div className="thread__scroll" aria-live="polite">
        {messages.map((m) => (
          <Bubble key={m.id} m={m} onChip={onChip} live={m === lastBot && !typing} />
        ))}
        {typing && (
          <div className="msg msg--bot">
            <div className="msg__bubble msg__typing" aria-label={tx("Tulpar is typing")}>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form className="composer" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="chat-input">{tx("Message Tulpar")}</label>
        <input
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tx("Ask anything, e.g. Charyn for 3 people on 15 Nov")}
          autoComplete="off"
          autoFocus={autoFocus}
        />
        <button type="submit" className="composer__send" aria-label={tx("Send message")} disabled={!text.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export function ChatHeader({ onClose, onPointerDown }: { onClose?: () => void; onPointerDown?: (e: ReactPointerEvent) => void }) {
  const tx = useT();
  const { engine, reset } = useChat();
  const t = useT();
  return (
    <div className={`chat-head ${onPointerDown ? 'chat-head--drag' : ''}`} onPointerDown={onPointerDown}>
      <div className="chat-head__avatar">
        <Shanyrak size={22} />
      </div>
      <div className="chat-head__who">
        <strong>{tx("Tulpar")}</strong>
        <span>{engine === 'gemini' ? t('Connected to Gemini') : engine === 'claude' ? t('AI assistant, replies instantly') : t('Replies instantly (demo engine)')}</span>
      </div>
      <button type="button" className="icon-btn" onClick={reset} aria-label={tx("Start a new conversation")}>
        <RotateCcw size={18} />
      </button>
      {onClose && (
        <button type="button" className="icon-btn" onClick={onClose} aria-label={tx("Close chat")}>
          <X size={20} />
        </button>
      )}
    </div>
  );
}

// ---------- draggable dock: the button and the chat window snap to one of 7 spots ----------
export type Spot = 'tl' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br';
const SPOTS: Spot[] = ['tl', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'];
const SPOT_KEY = 'sg.chatSpot';
const EDGE = 20;

function loadSpot(): Spot {
  try {
    const v = localStorage.getItem(SPOT_KEY) as Spot | null;
    return v && SPOTS.includes(v) ? v : 'br';
  } catch {
    return 'br';
  }
}
function saveSpot(s: Spot) {
  try {
    localStorage.setItem(SPOT_KEY, s);
  } catch {
    /* storage unavailable: keep it in memory */
  }
}

/** Lowest y the dock may use: just under the sticky site header. */
function topLimit() {
  const nav = document.querySelector('.nav');
  const bottom = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 64;
  return bottom + 12;
}

/** Top-left corner of an element of size w×h placed at a spot. */
function spotXY(spot: Spot, w: number, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const edge = vw <= 520 ? 12 : EDGE;
  const top = Math.min(topLimit(), Math.max(edge, vh - h - edge));
  const left = edge;
  const right = Math.max(edge, vw - w - edge);
  const bottom = Math.max(top, vh - h - edge);
  const midY = Math.max(top, Math.min(bottom, (vh - h) / 2));
  const midX = Math.max(edge, (vw - w) / 2);
  switch (spot) {
    case 'tl': return { x: left, y: top };
    case 'tr': return { x: right, y: top };
    case 'ml': return { x: left, y: midY };
    case 'mr': return { x: right, y: midY };
    case 'bl': return { x: left, y: bottom };
    case 'bc': return { x: midX, y: bottom };
    default: return { x: right, y: bottom };
  }
}

function nearestSpot(cx: number, cy: number, w: number, h: number): Spot {
  let best: Spot = 'br';
  let bestD = Infinity;
  for (const s of SPOTS) {
    const p = spotXY(s, w, h);
    const d = Math.hypot(p.x + w / 2 - cx, p.y + h / 2 - cy);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

function useNarrow() {
  const q = '(max-width: 520px)';
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setNarrow(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return narrow;
}

/** Ghost outlines of every spot while dragging; the one it will snap to is highlighted. */
function SpotGuides({ size, active }: { size: { w: number; h: number }; active: Spot | null }) {
  if (!active) return null;
  return (
    <div className="dock-guides" aria-hidden="true">
      {SPOTS.map((s) => {
        const p = spotXY(s, size.w, size.h);
        return <span key={s} className={`dock-guide ${s === active ? 'is-on' : ''}`} style={{ left: p.x, top: p.y, width: size.w, height: size.h }} />;
      })}
    </div>
  );
}

/** A fixed element that can be dragged and snaps to the nearest spot on release. */
function Dock({
  spot,
  setSpot,
  enabled,
  handle,
  className,
  children,
  onDragState,
}: {
  spot: Spot;
  setSpot: (s: Spot) => void;
  enabled: boolean;
  handle?: ReturnType<typeof useDragControls>;
  className: string;
  children: ReactNode;
  onDragState?: (dragging: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<Spot | null>(null);
  const placed = useRef(false);

  const place = useCallback(
    (s: Spot, smooth: boolean) => {
      const el = ref.current;
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize({ w, h });
      const p = spotXY(s, w, h);
      if (smooth) {
        void animate(x, p.x, { type: 'spring', stiffness: 420, damping: 34 });
        void animate(y, p.y, { type: 'spring', stiffness: 420, damping: 34 });
      } else {
        x.set(p.x);
        y.set(p.y);
      }
    },
    [x, y],
  );

  useLayoutEffect(() => {
    if (!enabled) return;
    place(spot, placed.current);
    placed.current = true;
  }, [spot, enabled, place]);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    const re = () => place(spot, false);
    // The header shrinks after the demo bar scrolls away, the size changes when text changes language.
    const ro = typeof ResizeObserver !== 'undefined' && el ? new ResizeObserver(re) : null;
    if (ro && el) ro.observe(el);
    window.addEventListener('resize', re);
    window.addEventListener('scroll', re, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', re);
      window.removeEventListener('scroll', re);
    };
  }, [spot, enabled, place]);

  const center = () => {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
  };

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <>
      <SpotGuides size={size} active={hover} />
      <motion.div
        ref={ref}
        className={`dock ${className} ${hover ? 'is-dragging' : ''}`}
        style={{ x, y }}
        drag
        dragListener={!handle}
        dragControls={handle}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => {
          const c = center();
          setHover(nearestSpot(c.cx, c.cy, c.w, c.h));
          onDragState?.(true);
        }}
        onDrag={() => {
          const c = center();
          setHover(nearestSpot(c.cx, c.cy, c.w, c.h));
        }}
        onDragEnd={() => {
          const c = center();
          const s = nearestSpot(c.cx, c.cy, c.w, c.h);
          setHover(null);
          setSpot(s);
          place(s, true);
          onDragState?.(false);
        }}
      >
        {children}
      </motion.div>
    </>
  );
}

export function ChatWidget() {
  const { chatOpen, setChatOpen } = useStore();
  const { pathname } = useLocation();
  const t = useT();
  const narrow = useNarrow();
  const [spot, setSpotState] = useState<Spot>(loadSpot);
  const setSpot = useCallback((s: Spot) => {
    setSpotState(s);
    saveSpot(s);
  }, []);
  const controls = useDragControls();
  const dragged = useRef(false);
  const onDragState = useCallback((d: boolean) => {
    if (d) dragged.current = true;
    // A click event follows the pointer release; ignore that one.
    else setTimeout(() => (dragged.current = false), 0);
  }, []);
  if (pathname.startsWith('/chat') || pathname.startsWith('/operator')) return null;
  const side = spot.endsWith('l') ? 0 : spot === 'bc' ? 0.5 : 1;
  const vert = spot.startsWith('t') ? 0 : spot.startsWith('m') ? 0.5 : 1;
  return (
    <>
      <AnimatePresence>
        {chatOpen && (
          <Dock key="pop" spot={spot} setSpot={setSpot} enabled={!narrow} handle={controls} className="dock--pop">
            <motion.div
              className="chat-pop"
              role="dialog"
              aria-label={t('Chat with Tulpar')}
              initial={{ opacity: 0, scale: 0.85, originX: side, originY: vert }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            >
              <ChatHeader
                onClose={() => setChatOpen(false)}
                onPointerDown={
                  narrow
                    ? undefined
                    : (e) => {
                        // Buttons in the header keep working; anywhere else on it starts a drag.
                        if ((e.target as HTMLElement).closest('button')) return;
                        controls.start(e);
                      }
                }
              />
              <ChatThread autoFocus />
            </motion.div>
          </Dock>
        )}
      </AnimatePresence>
      {!chatOpen && (
        <Dock key="fab" spot={spot} setSpot={setSpot} enabled className="dock--fab" onDragState={onDragState}>
          <motion.button
            type="button"
            className="chat-fab"
            onClick={() => {
              if (!dragged.current) setChatOpen(true);
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            title={t('Drag me anywhere')}
          >
            <span className="chat-fab__ring" aria-hidden="true" />
            <MessageCircle size={20} aria-hidden="true" />
            <span>{t('Ask Tulpar')}</span>
          </motion.button>
        </Dock>
      )}
    </>
  );
}
