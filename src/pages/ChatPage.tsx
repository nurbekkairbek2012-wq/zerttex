import { Bot, Instagram, MessageCircle, UserRound } from 'lucide-react';
import { ChatHeader, ChatThread } from '../components/Chat';
import { useChat } from '../lib/chat';

export default function ChatPage() {
  const { engine } = useChat();
  return (
    <section className="chat-page">
      <div className="chat-page__panel">
        <ChatHeader />
        <ChatThread autoFocus />
      </div>
      <aside className="chat-page__info">
        <h1>Tulpar, the booking assistant</h1>
        <p>The same assistant answers on WhatsApp, Instagram Direct and this website, so a conversation can start anywhere and end with a paid booking.</p>
        <ul className="plain icons">
          <li>
            <MessageCircle aria-hidden="true" /> WhatsApp Business: the main channel for travelers from India
          </li>
          <li>
            <Instagram aria-hidden="true" /> Instagram Direct: for people who find us through Reels and ads
          </li>
          <li>
            <Bot aria-hidden="true" /> Answers only from the company’s approved trip data, prices and policies
          </li>
          <li>
            <UserRound aria-hidden="true" /> Hands over to a person on request or when unsure
          </li>
        </ul>
        <div className="engine-note">
          <strong>{engine === 'claude' ? 'Connected to Claude' : 'Demo engine'}</strong>
          <p>
            {engine === 'claude'
              ? 'Replies come from Claude Haiku through the /api/chat function, limited to the knowledge base.'
              : 'This deployment runs the offline intent engine. Add an ANTHROPIC_API_KEY on Vercel or Netlify and the same chat switches to Claude.'}
          </p>
        </div>
        <p className="muted">Try: “Kolsai lakes for 2 next Friday”, “is it safe to pay?”, “Turkestan in March for my parents”, “talk to a person”.</p>
      </aside>
    </section>
  );
}
