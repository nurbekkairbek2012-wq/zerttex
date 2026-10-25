import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { BadgeCheck, ChevronDown, CreditCard, MapPinned, MessageCircle, Minus, Plus, ShieldCheck, Star, Video } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { OrnamentBand } from '../components/Art';
import { CountUp, Marquee, Reveal, SplitText, TiltCard } from '../components/Motion';
import { PhoneDemo } from '../components/PhoneDemo';
import { Photo } from '../components/Photo';
import { company, policies, trips } from '../lib/kb';
import { money } from '../lib/money';
import { coverOf, photos, type PhotoId } from '../lib/photos';
import { useStore } from '../lib/store';

const sampleReviews = [
  { name: 'Priya, Pune', trip: 'Kolsai & Kaindy Lakes', text: 'We booked on WhatsApp at midnight and had the full plan in five minutes. The guesthouse made vegetarian food every day.' },
  { name: 'Rohan, Delhi', trip: 'Charyn Canyon', text: 'My card worked first time after I switched on international payments. Our parents followed the trip live from home.' },
  { name: 'Ananya, Bengaluru', trip: 'Turkestan Silk Road', text: 'Everything in the price card was exactly what we got. No surprise fees at the park gates.' },
  { name: 'Karan, Mumbai', trip: 'Burabay Lakes', text: 'Split the payment between four friends with links. Nobody had to chase anyone for money.' },
  { name: 'Sneha, Hyderabad', trip: 'Great Kazakhstan Week', text: 'The guide sent a video before the trip, so meeting her at the airport felt like meeting a friend.' },
];

const faqs = [
  { q: 'Do Indian citizens need a visa?', a: policies.visa },
  { q: 'Will my Indian card work?', a: `${policies.payments} ${policies.indianCards}` },
  { q: 'Is vegetarian food available?', a: policies.food },
  { q: 'What if I need to cancel?', a: `${policies.cancellation} ${policies.weather}` },
  { q: 'How do I get to Almaty?', a: policies.flights },
];

const strip: PhotoId[] = ['charyn', 'kaindy', 'yasawi', 'burabay', 'bigAlmaty', 'kolsai2', 'sauran', 'charyn3', 'yurt', 'shymbulak'];

type Filter = 'all' | 'short' | 'three' | 'week' | 'almaty' | 'astana';
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All trips' },
  { id: 'short', label: 'Weekend, 2 days' },
  { id: 'three', label: '3 days' },
  { id: 'week', label: 'A full week' },
  { id: 'almaty', label: 'From Almaty' },
  { id: 'astana', label: 'From Astana' },
];

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq__item ${open ? 'is-open' : ''}`}>
      <button type="button" className="faq__q" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="faq__icon">
          {open ? <Minus size={20} /> : <Plus size={20} />}
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="faq__a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }}>
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const { currency, openChatWith } = useStore();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '60%']);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [filter, setFilter] = useState<Filter>('all');
  const shown = useMemo(
    () =>
      trips.filter((t) =>
        filter === 'all' ? true : filter === 'short' ? t.days === 2 : filter === 'three' ? t.days === 3 : filter === 'week' ? t.days >= 7 : filter === 'almaty' ? t.start === 'Almaty' : t.start === 'Astana',
      ),
    [filter],
  );
  const stepsRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress: stepsProgress } = useScroll({ target: stepsRef, offset: ['start 85%', 'end 60%'] });

  const scrollToTrips = () => document.getElementById('trips')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <section className="hero2" ref={heroRef}>
        <motion.div className="hero2__bg" style={{ y: bgY }}>
          <Photo id="kolsai" eager sizes="100vw" width={1920} className="hero2__photo" />
        </motion.div>
        <div className="hero2__shade" />
        <motion.div className="hero2__inner" style={{ y: textY, opacity: fade }}>
          <div className="hero2__copy">
            <motion.p className="hero2__pill" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <span className="dot" /> Now booking on WhatsApp for travelers from India
            </motion.p>
            <SplitText text="Kazakhstan’s canyons and mountain lakes, booked in one chat." className="hero2__title" delay={0.3} />
            <motion.p className="hero2__lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }}>
              Ask Tulpar on WhatsApp or here. Get one clear price card with everything included, pay with your own card, and send your family a live Trip Pass.
            </motion.p>
            <motion.div className="hero__cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3, duration: 0.8 }}>
              <motion.button type="button" className="btn btn--sun btn--lg" onClick={() => openChatWith('Show me the trips')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <MessageCircle size={20} aria-hidden="true" /> Plan my trip with Tulpar
              </motion.button>
              <motion.button type="button" className="btn btn--glass btn--lg" onClick={scrollToTrips} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                Browse trips
              </motion.button>
            </motion.div>
            <motion.dl className="hero2__stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
              <div>
                <dt>
                  <CountUp to={146000} suffix="+" />
                </dt>
                <dd>Indian travelers came in 2024</dd>
              </div>
              <div>
                <dt>
                  <CountUp to={14} suffix=" days" />
                </dt>
                <dd>visa-free for Indians</dd>
              </div>
              <div>
                <dt>
                  <CountUp to={3.5} decimals={1} suffix=" h" />
                </dt>
                <dd>direct flight from Delhi</dd>
              </div>
              <div>
                <dt>
                  <CountUp to={5} suffix=" min" />
                </dt>
                <dd>to a confirmed booking</dd>
              </div>
            </motion.dl>
          </div>
          <motion.div
            className="hero2__phone"
            initial={{ opacity: 0, rotateY: -35, rotateX: 10, x: 120 }}
            animate={{ opacity: 1, rotateY: -12, rotateX: 4, x: 0 }}
            transition={{ delay: 0.5, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformPerspective: 1200 }}
          >
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
              <PhoneDemo />
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.button type="button" className="hero2__scroll" onClick={scrollToTrips} aria-label="Scroll to trips" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
          <ChevronDown />
        </motion.button>
        <span className="hero2__credit">Photo: Kolsai Lake, {photos.kolsai.author}, {photos.kolsai.license}</span>
      </section>

      <Marquee speed={55}>
        {strip.map((id) => (
          <div className="strip__item" key={id}>
            <Photo id={id} sizes="260px" width={500} />
            <span>{photos[id].place}</span>
          </div>
        ))}
      </Marquee>

      <section className="section" id="trips">
        <Reveal className="section__head">
          <h2>Five routes, prices with everything in</h2>
          <p>Per person, in {currency === 'INR' ? 'rupees' : currency === 'USD' ? 'US dollars' : 'tenge'}. Transport, English-speaking guide, stay, meals and park fees are always included.</p>
        </Reveal>
        <div className="filters" role="group" aria-label="Filter trips">
          {filters.map((f) => (
            <button key={f.id} type="button" className={`filter ${filter === f.id ? 'is-on' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {filter === f.id && <motion.span layoutId="filter-pill" className="filter__pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="filter__label">{f.label}</span>
            </button>
          ))}
        </div>
        <motion.div layout className="trips2">
          <AnimatePresence mode="popLayout">
            {shown.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 60, scale: 0.92 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={i === 0 && filter === 'all' ? 'trips2__wide' : ''}
              >
                <TiltCard className="tcard">
                  <Link to={`/trips/${t.id}`} className="tcard__link">
                    <Photo id={coverOf(t.id)} sizes="(max-width: 700px) 100vw, 50vw" width={960} className="tcard__photo" />
                    <div className="tcard__shade" />
                    <span className="tcard__days">{t.days} days</span>
                    <div className="tcard__body">
                      <h3>{t.name}</h3>
                      <p>{t.tagline}</p>
                      <div className="tcard__foot">
                        <span>From {t.start}</span>
                        <strong>{money(t.priceKZT, currency)}</strong>
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <section className="section how">
        <Reveal className="section__head">
          <h2>How booking works</h2>
          <p>Three steps, about five minutes, in the app you already use.</p>
        </Reveal>
        <ol className="steps steps--anim" ref={stepsRef}>
          <svg className="steps__line" viewBox="0 0 1000 4" preserveAspectRatio="none" aria-hidden="true">
            <motion.line x1="0" y1="2" x2="1000" y2="2" stroke="var(--sun)" strokeWidth="4" style={{ pathLength: stepsProgress }} />
          </svg>
          {[
            ['Ask in your own words', '“Charyn for 3 people on 15 Nov, vegetarian.” Tulpar answers in seconds, day or night, from the company’s verified trip data.'],
            ['Get one clear price card', 'Date, guide, food, every inclusion and the total in rupees. Share it to your group chat and let friends pay their own share.'],
            ['Pay with your card, get a Trip Pass', 'Secure 3-D Secure payment through a licensed Kazakhstan bank. The Trip Pass has the guide’s contact, pickup time and a live link for family.'],
          ].map(([h, p], i) => (
            <motion.li key={h} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.18, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              <motion.span className="steps__n" initial={{ scale: 0, rotate: -90 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.18, type: 'spring', stiffness: 260, damping: 14 }}>
                {i + 1}
              </motion.span>
              <h3>{h}</h3>
              <p>{p}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="band">
        <motion.div className="band__bg" initial={{ scale: 1.25 }} whileInView={{ scale: 1 }} viewport={{ once: false }} transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}>
          <Photo id="charyn" sizes="100vw" width={1920} />
        </motion.div>
        <div className="band__shade" />
        <div className="band__inner">
          <SplitText as="h2" text="Delhi to the Valley of Castles: one flight, one chat." className="band__title" />
          <Reveal delay={0.4}>
            <Link to="/trips/charyn-canyon" className="btn btn--sun btn--lg">
              See the Charyn trip
            </Link>
          </Reveal>
        </div>
        <span className="hero2__credit">Photo: Charyn Canyon, {photos.charyn.author}, {photos.charyn.license}</span>
      </section>

      <section className="section trust-strip">
        <OrnamentBand className="trust-strip__band" color="#F4B400" />
        <div className="trust-strip__inner">
          <SplitText as="h2" text="Built to answer “can I trust them?”" />
          <dl className="trust-nums">
            <div>
              <dt>
                <CountUp to={company.founded} duration={1.6} group={false} />
              </dt>
              <dd>running trips since</dd>
            </div>
            <div>
              <dt>
                <CountUp to={company.guides} />
              </dt>
              <dd>local guides with checked IDs</dd>
            </div>
            <div>
              <dt>
                <CountUp to={company.travelers2025} />
              </dt>
              <dd>travelers in 2025</dd>
            </div>
            <div>
              <dt>
                <CountUp to={72} suffix=" h" />
              </dt>
              <dd>free cancellation window</dd>
            </div>
          </dl>
          <div className="trust-grid">
            {[
              [BadgeCheck, 'Verified company', 'Licence, insurance and real company details on one page, checked by our team.'],
              [Video, 'Meet your guide first', 'Every guide has a profile and a one-minute video intro before you pay.'],
              [Star, 'Reviews only from travelers', 'Only people who completed a trip can review it, so ratings can’t be bought.'],
              [MapPinned, 'Live trip sharing', 'Parents at home see where the group is, from pickup to drop-off.'],
            ].map(([Icon, h, p], i) => {
              const I = Icon as typeof BadgeCheck;
              return (
                <motion.div key={h as string} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.7 }} whileHover={{ y: -6 }}>
                  <motion.span className="trust-grid__icon" whileHover={{ rotate: 12, scale: 1.15 }}>
                    <I aria-hidden="true" />
                  </motion.span>
                  <h3>{h as string}</h3>
                  <p>{p as string}</p>
                </motion.div>
              );
            })}
          </div>
          <Link to="/trust" className="btn btn--sun">
            See all trust checks
          </Link>
          <ul className="hero__proof hero__proof--dark">
            <li>
              <CreditCard size={18} aria-hidden="true" /> Visa, Mastercard, Apple Pay, Google Pay
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden="true" /> 3-D Secure through a licensed Kazakhstan bank
            </li>
          </ul>
        </div>
      </section>

      <section className="section reviews2">
        <Reveal className="section__head">
          <h2>What travelers say</h2>
          <p>Sample reviews for the prototype, showing how verified reviews will appear.</p>
        </Reveal>
      </section>
      <Marquee speed={70}>
        {sampleReviews.map((r) => (
          <figure key={r.name} className="review review--strip">
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
      </Marquee>

      <section className="section faq">
        <Reveal className="section__head">
          <h2>Questions travelers from India ask first</h2>
        </Reveal>
        <div className="faq__list">
          {faqs.map((f) => (
            <Faq key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      <section className="cta2">
        <div className="cta2__bg">
          <Photo id="yurt" sizes="100vw" width={1920} />
        </div>
        <div className="cta2__shade" />
        <Reveal className="cta2__inner">
          <h2>Tell Tulpar where you want to go.</h2>
          <p>It knows every route, date and price, and hands over to a person whenever you want.</p>
          <motion.button type="button" className="btn btn--sun btn--lg pulse" onClick={() => openChatWith('Hi')} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
            <MessageCircle size={20} aria-hidden="true" /> Start the chat
          </motion.button>
        </Reveal>
      </section>
    </>
  );
}
