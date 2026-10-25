import { Headset, MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../lib/chat';
import { tripById } from '../lib/kb';
import { money } from '../lib/money';
import { useStore } from '../lib/store';
import type { ChatMsg } from '../lib/tulpar';
import { Shanyrak, TripArt } from './Art';
import { TripTicket } from './Ticket';

const navChips: Record<string, string> = {
  'Open the Trust page': '/trust',
  'Meet the guides': '/trust#guides',
};

function Bubble({ m, onChip, live }: { m: ChatMsg; onChip: (c: string) => void; live: boolean }) {
  const { currency } = useStore();
  return (
    <div className={`msg msg--${m.from}`}>
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
                <TripArt scene={t.scene} className="mini-trip__art" />
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
        <div className="msg__quote">
          <TripTicket tripId={m.quote.tripId} date={m.quote.date} people={m.quote.people} meal={m.quote.meal} variant="chat" source="chat" />
        </div>
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
    </div>
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
      {chatOpen && (
        <div className="chat-pop" role="dialog" aria-label="Chat with Tulpar">
          <ChatHeader onClose={() => setChatOpen(false)} />
          <ChatThread autoFocus />
        </div>
      )}
      {!chatOpen && (
        <button type="button" className="chat-fab" onClick={() => setChatOpen(true)}>
          <MessageCircle size={20} aria-hidden="true" />
          <span>Ask Tulpar</span>
        </button>
      )}
    </>
  );
}
