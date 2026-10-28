import { useT } from '../lib/i18n';
import { Bot, Instagram, MessageCircle, UserRound } from 'lucide-react';
import { ChatHeader, ChatThread } from '../components/Chat';
import { useChat } from '../lib/chat';

export default function ChatPage() {
  const tx = useT();
  const { engine } = useChat();
  return (
    <section className="chat-page">
      <div className="chat-page__panel">
        <ChatHeader />
        <ChatThread autoFocus />
      </div>
      <aside className="chat-page__info">
        <h1>{tx("Tulpar, the booking assistant")}</h1>
        <p>{tx("The same assistant answers on WhatsApp, Instagram Direct and this website, so a conversation can start anywhere and end with a paid booking.")}</p>
        <ul className="plain icons">
          <li>
            <MessageCircle aria-hidden="true" />{' '}{tx("WhatsApp Business: the main channel for travelers from India")}</li>
          <li>
            <Instagram aria-hidden="true" />{' '}{tx("Instagram Direct: for people who find us through Reels and ads")}</li>
          <li>
            <Bot aria-hidden="true" />{' '}{tx("Answers only from the company’s approved trip data, prices and policies")}</li>
          <li>
            <UserRound aria-hidden="true" />{' '}{tx("Hands over to a person on request or when unsure")}</li>
        </ul>
        <div className="engine-note">
          <strong>{engine === 'gemini' ? tx('Connected to Gemini') : engine === 'claude' ? tx('Connected to Claude') : tx('Demo engine')}</strong>
          <p>
            {engine === 'gemini'
              ? tx('Replies come from Google Gemini through the /api/chat function, limited to the knowledge base. The API key is kept on the server only.')
              : engine === 'claude'
                ? tx('Replies come from Claude Haiku through the /api/chat function, limited to the knowledge base.')
                : tx('This deployment runs the offline intent engine. Add GEMINI_API_KEY in the Netlify environment variables and the same chat switches to Gemini.')}
          </p>
        </div>
        <p className="muted">{tx("Try: “Kolsai lakes for 2 next Friday”, “is it safe to pay?”, “Turkestan in March for my parents”, “talk to a person”.")}</p>
      </aside>
    </section>
  );
}
