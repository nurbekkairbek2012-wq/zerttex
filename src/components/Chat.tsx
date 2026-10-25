import { Headset, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../lib/chat';
import { tripById } from '../lib/kb';
import { money } from '../lib/money';
import { useStore } from '../lib/store';
import type { ChatMsg } from '../lib/tulpar';
import { coverOf } from '../lib/photos';
import { Shanyrak } from './Art';
import { AnimatePresence, motion } from 'framer-motion';
import { Photo } from './Photo';
import { TripTicket } from './Ticket';

const navChips: Record<string, string> = {
  'Open the Trust page': '/trust',
  'Meet the guides': '/trust#guides',
};

function Bubble({ m, onChip, live }: { m: ChatMsg; onChip: (c: string) => void; live: boolean }) {
  const { currency } = useStore();
  return (
    <motion.div
      className={`msg msg--${m.from}`}
      initial={{ opacity: 0, y: 18, scale: 0.94, x: m.from === 'user' ? 30 : -30 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      <div className="msg__bubble">
        {m.text.split('\n').map((line, i) => (
          <p key={i}>{line || ' '}</p>
        ))}
      </div>
      {m.handoff && (
        <div className="msg__handoff">
          <Headset size={16} aria-hidden="true" /> A team member has been notified and will join this chat.
        </div>
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
                  {t.days} days, {money(t.priceKZT, currency)}
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
        <div className="chips" role="group" aria-label="Suggested replies">
          {m.chips.map((c) => (
            <button key={c} type="button" className="chip" onClick={() => onChip(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function ChatThread({ autoFocus = false }: { autoFocus?: boolean }) {
  const { messages, typing, send } = useChat();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { consumeSeed, chatSeed } = useStore();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (chatSeed) {
      const s = consumeSeed();
      if (s) void send(s);
    }
  }, [chatSeed, consumeSeed, send]);

  const onChip = (c: string) => {
    if (navChips[c]) navigate(navChips[c]);
    else void send(c);
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
            <div className="msg__bubble msg__typing" aria-label="Tulpar is typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form className="composer" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="chat-input">
          Message Tulpar
        </label>
        <input
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask anything, e.g. Charyn for 3 people on 15 Nov"
          autoComplete="off"
          autoFocus={autoFocus}
        />
        <button type="submit" className="composer__send" aria-label="Send message" disabled={!text.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export function ChatHeader({ onClose }: { onClose?: () => void }) {
  const { engine, reset } = useChat();
  return (
    <div className="chat-head">
      <div className="chat-head__avatar">
        <Shanyrak size={22} />
      </div>
      <div className="chat-head__who">
        <strong>Tulpar</strong>
        <span>{engine === 'claude' ? 'AI assistant, replies instantly' : 'Replies instantly (demo engine)'}</span>
      </div>
      <button type="button" className="icon-btn" onClick={reset} aria-label="Start a new conversation">
        <RotateCcw size={18} />
      </button>
      {onClose && (
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close chat">
          <X size={20} />
        </button>
      )}
    </div>
  );
}

export function ChatWidget() {
  const { chatOpen, setChatOpen } = useStore();
  const { pathname } = useLocation();
  if (pathname.startsWith('/chat') || pathname.startsWith('/operator')) return null;
  return (
    <>
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            className="chat-pop"
            role="dialog"
            aria-label="Chat with Tulpar"
            initial={{ opacity: 0, y: 60, scale: 0.85, originX: 1, originY: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <ChatHeader onClose={() => setChatOpen(false)} />
            <ChatThread autoFocus />
          </motion.div>
        )}
      </AnimatePresence>
      {!chatOpen && (
        <motion.button
          type="button"
          className="chat-fab"
          onClick={() => setChatOpen(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        >
          <span className="chat-fab__ring" aria-hidden="true" />
          <MessageCircle size={20} aria-hidden="true" />
          <span>Ask Tulpar</span>
        </motion.button>
      )}
    </>
  );
}
