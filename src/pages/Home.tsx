import { BadgeCheck, CreditCard, MapPinned, MessageCircle, ShieldCheck, Star, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OrnamentBand, TripArt } from '../components/Art';
import { PhoneDemo } from '../components/PhoneDemo';
import { company, policies, trips } from '../lib/kb';
import { money } from '../lib/money';
import { useStore } from '../lib/store';

const sampleReviews = [
  { name: 'Priya, Pune', trip: 'Kolsai & Kaindy Lakes', text: 'We booked on WhatsApp at midnight and had the full plan in five minutes. The guesthouse made vegetarian food every day.' },
  { name: 'Rohan, Delhi', trip: 'Charyn Canyon', text: 'My card worked first time after I switched on international payments. Our parents followed the trip live from home.' },
  { name: 'Ananya, Bengaluru', trip: 'Turkestan Silk Road', text: 'Everything in the price card was exactly what we got. No surprise fees at the park gates.' },
];

const faqs = [
  { q: 'Do Indian citizens need a visa?', a: policies.visa },
  { q: 'Will my Indian card work?', a: `${policies.payments} ${policies.indianCards}` },
  { q: 'Is vegetarian food available?', a: policies.food },
  { q: 'What if I need to cancel?', a: `${policies.cancellation} ${policies.weather}` },
  { q: 'How do I get to Almaty?', a: policies.flights },
];

export default function Home() {
  const { currency, openChatWith } = useStore();
  return (
    <>
      <section className="hero">
        <div className="hero__copy">
          <h1>Kazakhstan’s canyons and mountain lakes, booked in one chat.</h1>
          <p className="lead">
            Ask Tulpar on WhatsApp or here. You get one clear price card with everything included, pay with your own card, and receive a Trip Pass your family can follow live.
          </p>
          <div className="hero__cta">
            <button type="button" className="btn btn--primary btn--lg" onClick={() => openChatWith('Show me the trips')}>
              <MessageCircle size={20} aria-hidden="true" /> Plan my trip with Tulpar
            </button>
            <a className="btn btn--ghost btn--lg" href="#trips">
              Browse trips
            </a>
          </div>
          <ul className="hero__proof">
            <li>
              <BadgeCheck size={18} aria-hidden="true" /> Licensed tour operator since {company.founded}
            </li>
            <li>
              <CreditCard size={18} aria-hidden="true" /> Visa, Mastercard, Apple Pay, Google Pay
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden="true" /> Free cancellation up to 72 hours
            </li>
          </ul>
        </div>
        <div className="hero__demo">
          <PhoneDemo />
        </div>
      </section>

      <section className="section" id="trips">
        <div className="section__head">
          <h2>Five routes, prices with everything in</h2>
          <p>Per person, in {currency === 'INR' ? 'rupees' : currency === 'USD' ? 'US dollars' : 'tenge'}. Transport, English-speaking guide, stay, meals and park fees are always included.</p>
        </div>
        <div className="trips">
          {trips.map((t, i) => (
            <Link key={t.id} to={`/trips/${t.id}`} className={`trip-card ${i === 0 ? 'trip-card--wide' : ''}`}>
              <TripArt scene={t.scene} className="trip-card__art" title={t.name} />
              <div className="trip-card__body">
                <div className="trip-card__top">
                  <h3>{t.name}</h3>
                  <span className="trip-card__price">{money(t.priceKZT, currency)}</span>
                </div>
                <p>{t.tagline}</p>
                <p className="trip-card__meta">
                  {t.days} days from {t.start}. {t.season}.
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section how">
        <div className="section__head">
          <h2>How booking works</h2>
          <p>Three steps, about five minutes, in the app you already use.</p>
        </div>
        <ol className="steps">
          <li>
            <span className="steps__n">1</span>
            <h3>Ask in your own words</h3>
            <p>“Charyn for 3 people on 15 Nov, vegetarian.” Tulpar answers in seconds, day or night, from the company’s verified trip data.</p>
          </li>
          <li>
            <span className="steps__n">2</span>
            <h3>Get one clear price card</h3>
            <p>Date, guide, food, every inclusion and the total in rupees. Share it to your group chat and let friends pay their own share.</p>
          </li>
          <li>
            <span className="steps__n">3</span>
            <h3>Pay with your card, get a Trip Pass</h3>
            <p>Secure 3-D Secure payment through a licensed Kazakhstan bank. Your Trip Pass has the guide’s contact, pickup time and a live link for family.</p>
          </li>
        </ol>
      </section>

      <section className="section trust-strip">
        <OrnamentBand className="trust-strip__band" color="#F4B400" />
        <div className="trust-strip__inner">
          <h2>Built to answer “can I trust them?”</h2>
          <div className="trust-grid">
            <div>
              <BadgeCheck aria-hidden="true" />
              <h3>Verified company</h3>
              <p>Licence, insurance and real company details on one page, checked by our team.</p>
            </div>
            <div>
              <Video aria-hidden="true" />
              <h3>Meet your guide first</h3>
              <p>Every guide has a profile and a one-minute video intro before you pay.</p>
            </div>
            <div>
              <Star aria-hidden="true" />
              <h3>Reviews only from travelers</h3>
              <p>Only people who completed a trip can review it, so ratings can’t be bought.</p>
            </div>
            <div>
              <MapPinned aria-hidden="true" />
              <h3>Live trip sharing</h3>
              <p>Parents at home see where the group is, from pickup to drop-off.</p>
            </div>
          </div>
          <Link to="/trust" className="btn btn--sun">
            See all trust checks
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>What travelers say</h2>
          <p>Sample reviews for the prototype, showing how verified reviews will appear.</p>
        </div>
        <div className="reviews">
          {sampleReviews.map((r) => (
            <figure key={r.name} className="review">
              <div className="review__stars" role="img" aria-label="5 out of 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" aria-hidden="true" />
                ))}
              </div>
              <blockquote>{r.text}</blockquote>
              <figcaption>
                {r.name}, {r.trip} <span className="verified">Verified trip</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section faq">
        <div className="section__head">
          <h2>Questions travelers from India ask first</h2>
        </div>
        <div className="faq__list">
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section cta-band">
        <h2>Tell Tulpar where you want to go.</h2>
        <p>It knows every route, date and price, and hands over to a person whenever you want.</p>
        <button type="button" className="btn btn--sun btn--lg" onClick={() => openChatWith('Hi')}>
          <MessageCircle size={20} aria-hidden="true" /> Start the chat
        </button>
      </section>
    </>
  );
}
