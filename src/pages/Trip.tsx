import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Expand, MapPin, Minus, Pause, Play, Plus, Share2, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Reveal, SplitText, useToast } from '../components/Motion';
import { Photo } from '../components/Photo';
import { InclusionList, NotIncludedList } from '../components/Ticket';
import { fmtDate, guides, isoDate, seatsLeft, tripById, upcomingDepartures } from '../lib/kb';
import { money } from '../lib/money';
import { photos, tripPhotos, type PhotoId } from '../lib/photos';
import { mealLabel, useStore, type Meal } from '../lib/store';

/** Full-screen photo viewer with arrows, keyboard and swipe-like transitions. */
function Lightbox({ list, index, onClose, onMove }: { list: PhotoId[]; index: number; onClose: () => void; onMove: (d: number) => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onMove(1);
      if (e.key === 'ArrowLeft') onMove(-1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose, onMove]);
  const id = list[index];
  return (
    <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <button type="button" className="icon-btn lightbox__close" onClick={onClose} aria-label="Close photo viewer">
        <X />
      </button>
      <button type="button" className="icon-btn lightbox__nav lightbox__prev" onClick={(e) => (e.stopPropagation(), onMove(-1))} aria-label="Previous photo">
        <ChevronLeft />
      </button>
      <AnimatePresence mode="wait">
        <motion.figure key={id} className="lightbox__fig" initial={{ opacity: 0, scale: 0.9, x: 60 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95, x: -60 }} transition={{ duration: 0.4 }} onClick={(e) => e.stopPropagation()}>
          <Photo id={id} width={1920} sizes="90vw" eager />
          <figcaption>
            {photos[id].alt}. Photo: {photos[id].author}, {photos[id].license}, Wikimedia Commons. ({index + 1}/{list.length})
          </figcaption>
        </motion.figure>
      </AnimatePresence>
      <button type="button" className="icon-btn lightbox__nav lightbox__next" onClick={(e) => (e.stopPropagation(), onMove(1))} aria-label="Next photo">
        <ChevronRight />
      </button>
    </motion.div>
  );
}

/** Guide intro: a 12-second Ken Burns slideshow of the route with the guide's words as subtitles. */
function GuideIntro({ list, name, lines, onClose }: { list: PhotoId[]; name: string; lines: string[]; onClose: () => void }) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const total = 12;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((v) => (v >= total ? 0 : +(v + 0.1).toFixed(1))), 100);
    return () => clearInterval(id);
  }, [playing]);
  const slide = Math.min(list.length - 1, Math.floor((t / total) * list.length));
  const line = lines[Math.min(lines.length - 1, Math.floor((t / total) * lines.length))];
  return (
    <motion.div className="modal" role="dialog" aria-modal="true" aria-label={`Video intro from ${name}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal__box modal__box--video" initial={{ scale: 0.85, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-btn modal__close" onClick={onClose} aria-label="Close video">
          <X />
        </button>
        <div className="video">
          <AnimatePresence>
            <motion.div key={list[slide]} className="video__frame" initial={{ opacity: 0, scale: 1.18 }} animate={{ opacity: 1, scale: 1.02 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 0.8 }, scale: { duration: total / list.length + 1, ease: 'linear' } }}>
              <Photo id={list[slide]} width={1280} sizes="640px" eager />
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p key={line} className="video__sub" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {line}
            </motion.p>
          </AnimatePresence>
          <div className="video__bar">
            <button type="button" className="icon-btn" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div className="video__track">
              <div className="video__fill" style={{ width: `${(t / total) * 100}%` }} />
            </div>
            <span>0:{String(Math.floor(t)).padStart(2, '0')} / 0:{total}</span>
          </div>
        </div>
        <h3>{name}</h3>
        <p className="muted">Preview of the one-minute video intro each guide records before the launch.</p>
      </motion.div>
    </motion.div>
  );
}

export default function TripPage() {
  const { id } = useParams();
  const trip = tripById(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { currency, openChatWith } = useStore();
  const dates = useMemo(() => (trip ? upcomingDepartures(trip, 8) : []), [trip]);
  const [date, setDate] = useState(() => (dates[0] ? isoDate(dates[0]) : ''));
  const [people, setPeople] = useState(2);
  const [meal, setMeal] = useState<Meal>('veg');
  const [video, setVideo] = useState(false);
  const [lb, setLb] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);

  if (!trip) {
    return (
      <section className="section narrow">
        <h1>We couldn’t find that trip</h1>
        <p>It may have been renamed. See all trips on the home page.</p>
        <Link className="btn btn--primary" to="/">
          Show all trips
        </Link>
      </section>
    );
  }
  const g = guides[trip.guide];
  const list = tripPhotos[trip.id] ?? ['kolsai'];
  const total = trip.priceKZT * people;
  const selected = dates.find((d) => isoDate(d) === date);
  const left = selected ? seatsLeft(trip, selected) : trip.seatsBase;

  const share = async () => {
    const url = window.location.href;
    const text = `${trip.name}: ${trip.days} days from ${trip.start}, ${money(trip.priceKZT, currency)} per person, all included.`;
    try {
      if (navigator.share) await navigator.share({ title: trip.name, text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast('Link copied. Paste it in your group chat.');
      }
    } catch {
      /* share sheet closed */
    }
  };

  return (
    <>
      <section className="trip-hero2" ref={heroRef}>
        <motion.div className="trip-hero2__bg" style={{ y, scale }}>
          <Photo id={list[0]} eager width={1920} sizes="100vw" />
        </motion.div>
        <div className="hero2__shade" />
        <div className="trip-hero2__copy">
          <p className="crumbs crumbs--light">
            <Link to="/">Trips</Link> / {trip.region}
          </p>
          <SplitText text={trip.name} className="trip-hero2__title" />
          <motion.p className="hero2__lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            {trip.tagline}
          </motion.p>
          <motion.ul className="facts facts--glass" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.08, delayChildren: 0.8 } } }}>
            {[
              [Clock, `${trip.days} days`],
              [MapPin, `From ${trip.start}`],
              [Users, trip.groupSize],
              [CalendarDays, trip.season],
            ].map(([I, txt]) => {
              const Icon = I as typeof Clock;
              return (
                <motion.li key={txt as string} variants={{ h: { opacity: 0, y: 16 }, s: { opacity: 1, y: 0 } }}>
                  <Icon size={18} aria-hidden="true" /> {txt as string}
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
        <span className="hero2__credit">
          Photo: {photos[list[0]].author}, {photos[list[0]].license}
        </span>
      </section>

      <section className="gallery" data-n={Math.min(5, list.length)}>
        {list.slice(0, 5).map((pid, i) => (
          <motion.button
            key={pid}
            type="button"
            className={`gallery__item ${i === 0 ? 'gallery__item--big' : ''}`}
            onClick={() => setLb(i)}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6 }}
            whileHover={{ scale: 1.03 }}
            aria-label={`Open photo: ${photos[pid].alt}`}
          >
            <Photo id={pid} width={960} sizes="(max-width: 700px) 50vw, 33vw" />
            {i === Math.min(4, list.length - 1) && (
              <span className="gallery__all">
                <Expand size={16} aria-hidden="true" /> {list.length} photos
              </span>
            )}
          </motion.button>
        ))}
      </section>

      <div className="trip-layout">
        <div className="trip-main">
          <Reveal className="block">
            <h2>Highlights</h2>
            <ul className="highlights">
              {trip.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <p className="muted">Fitness: {trip.difficulty}.</p>
          </Reveal>

          <Reveal className="block">
            <h2>Day by day</h2>
            <ol className="days days--timeline">
              {trip.itinerary.map((d, i) => (
                <motion.li key={d.day} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <span className="days__n">Day {d.day}</span>
                  <div>
                    <h3>{d.title}</h3>
                    <p>{d.text}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </Reveal>

          <Reveal className="block incl-block">
            <div>
              <h2>Included in the price</h2>
              <InclusionList trip={trip} />
            </div>
            <div>
              <h2>Not included</h2>
              <NotIncludedList trip={trip} />
              <p className="muted">Pickup: {trip.pickup}.</p>
            </div>
          </Reveal>

          <Reveal className="block guide">
            <h2>Your guide</h2>
            <div className="guide__card">
              <motion.button type="button" className="guide__video" onClick={() => setVideo(true)} aria-label={`Play video intro from ${g.name}`} whileHover={{ scale: 1.03 }}>
                <Photo id={list[1] ?? list[0]} width={500} sizes="220px" className="guide__thumb" />
                <span className="guide__play">
                  <span className="pulse-ring" />
                  <Play size={22} fill="currentColor" aria-hidden="true" />
                </span>
              </motion.button>
              <div>
                <h3>{g.name}</h3>
                <p className="muted">
                  {g.years} years guiding, {g.trips} trips. Speaks {g.langs}.
                </p>
                <p>{g.bio}</p>
                <span className="verified">ID and first-aid certificate checked</span>
              </div>
            </div>
          </Reveal>
        </div>

        <motion.aside className="book-panel" aria-label="Book this trip" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.7 }}>
          <div className="book-panel__price">
            <strong>{money(trip.priceKZT, currency)}</strong> <span>per person, all included</span>
          </div>
          <fieldset>
            <legend>Departure</legend>
            <div className="date-grid">
              {dates.map((d) => {
                const v = isoDate(d);
                return (
                  <motion.button key={v} type="button" className={`date ${v === date ? 'is-on' : ''}`} onClick={() => setDate(v)} aria-pressed={v === date} whileTap={{ scale: 0.9 }}>
                    <span>{fmtDate(d, { weekday: 'short' })}</span>
                    <b>{fmtDate(d, { day: 'numeric', month: 'short' })}</b>
                  </motion.button>
                );
              })}
            </div>
            <p className={`seats ${left <= 4 ? 'seats--low' : ''}`}>
              {left <= 4 && <span className="dot dot--red" />} {left} seats left on this date
            </p>
          </fieldset>
          <fieldset>
            <legend>Travelers</legend>
            <div className="stepper">
              <button type="button" className="icon-btn" onClick={() => setPeople(Math.max(1, people - 1))} aria-label="One traveler less">
                <Minus size={18} />
              </button>
              <AnimatePresence mode="popLayout">
                <motion.output key={people} initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} aria-live="polite">
                  {people}
                </motion.output>
              </AnimatePresence>
              <button type="button" className="icon-btn" onClick={() => setPeople(Math.min(left, people + 1))} aria-label="One traveler more">
                <Plus size={18} />
              </button>
            </div>
          </fieldset>
          <fieldset>
            <legend>Food for the group</legend>
            <div className="seg">
              {(['veg', 'jain', 'halal', 'any'] as Meal[]).map((m) => (
                <button key={m} type="button" className={meal === m ? 'is-on' : ''} onClick={() => setMeal(m)} aria-pressed={meal === m}>
                  {mealLabel[m]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="book-panel__total">
            <span>Total for {people}</span>
            <AnimatePresence mode="popLayout">
              <motion.strong key={total + currency} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                {money(total, currency)}
              </motion.strong>
            </AnimatePresence>
          </div>
          <motion.button
            type="button"
            className="btn btn--primary btn--block btn--lg"
            onClick={() => navigate(`/book/${trip.id}?date=${date}&people=${people}&meal=${meal}&mode=deposit`)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Continue to payment
          </motion.button>
          <p className="book-panel__note">Pay 20% now or in full. Free cancellation up to 72 hours before departure.</p>
          <div className="book-panel__row">
            <button type="button" className="btn btn--ghost" onClick={() => openChatWith(`Tell me more about ${trip.name}`)}>
              Ask Tulpar
            </button>
            <button type="button" className="btn btn--ghost" onClick={share}>
              <Share2 size={16} aria-hidden="true" /> Share
            </button>
          </div>
        </motion.aside>
      </div>

      <AnimatePresence>
        {lb !== null && <Lightbox list={list} index={lb} onClose={() => setLb(null)} onMove={(d) => setLb((i) => ((i ?? 0) + d + list.length) % list.length)} />}
      </AnimatePresence>
      <AnimatePresence>
        {video && (
          <GuideIntro
            list={list}
            name={g.name}
            onClose={() => setVideo(false)}
            lines={[`Salem! I’m ${g.name.split(' ')[0]}.`, g.bio, `I’ll meet you at ${trip.pickup.toLowerCase()}.`, 'Message me on WhatsApp any time before we go!']}
          />
        )}
      </AnimatePresence>
    </>
  );
}
