import { CalendarDays, Clock, MapPin, Minus, Play, Plus, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TripArt } from '../components/Art';
import { InclusionList, NotIncludedList } from '../components/Ticket';
import { fmtDate, guides, isoDate, seatsLeft, tripById, upcomingDepartures } from '../lib/kb';
import { money } from '../lib/money';
import { mealLabel, useStore, type Meal } from '../lib/store';

export default function TripPage() {
  const { id } = useParams();
  const trip = tripById(id);
  const navigate = useNavigate();
  const { currency, openChatWith } = useStore();
  const dates = useMemo(() => (trip ? upcomingDepartures(trip, 8) : []), [trip]);
  const [date, setDate] = useState(() => (dates[0] ? isoDate(dates[0]) : ''));
  const [people, setPeople] = useState(2);
  const [meal, setMeal] = useState<Meal>('veg');
  const [video, setVideo] = useState(false);

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
  const total = trip.priceKZT * people;
  const selected = dates.find((d) => isoDate(d) === date);
  const left = selected ? seatsLeft(trip, selected) : trip.seatsBase;

  return (
    <>
      <section className="trip-hero">
        <TripArt scene={trip.scene} className="trip-hero__art" title={trip.name} />
        <div className="trip-hero__copy">
          <p className="crumbs">
            <Link to="/">Trips</Link> / {trip.region}
          </p>
          <h1>{trip.name}</h1>
          <p className="lead">{trip.tagline}</p>
          <ul className="facts">
            <li>
              <Clock size={18} aria-hidden="true" /> {trip.days} days
            </li>
            <li>
              <MapPin size={18} aria-hidden="true" /> From {trip.start}
            </li>
            <li>
              <Users size={18} aria-hidden="true" /> {trip.groupSize}
            </li>
            <li>
              <CalendarDays size={18} aria-hidden="true" /> {trip.season}
            </li>
          </ul>
        </div>
      </section>

      <div className="trip-layout">
        <div className="trip-main">
          <section className="block">
            <h2>Highlights</h2>
            <ul className="highlights">
              {trip.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <p className="muted">Fitness: {trip.difficulty}.</p>
          </section>

          <section className="block">
            <h2>Day by day</h2>
            <ol className="days">
              {trip.itinerary.map((d) => (
                <li key={d.day}>
                  <span className="days__n">Day {d.day}</span>
                  <div>
                    <h3>{d.title}</h3>
                    <p>{d.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="block incl-block">
            <div>
              <h2>Included in the price</h2>
              <InclusionList trip={trip} />
            </div>
            <div>
              <h2>Not included</h2>
              <NotIncludedList trip={trip} />
              <p className="muted">Pickup: {trip.pickup}.</p>
            </div>
          </section>

          <section className="block guide">
            <h2>Your guide</h2>
            <div className="guide__card">
              <button type="button" className="guide__video" onClick={() => setVideo(true)} aria-label={`Play video intro from ${g.name}`}>
                <TripArt scene={trip.scene} className="guide__thumb" />
                <span className="guide__play">
                  <Play size={22} fill="currentColor" aria-hidden="true" />
                </span>
              </button>
              <div>
                <h3>{g.name}</h3>
                <p className="muted">
                  {g.years} years guiding, {g.trips} trips. Speaks {g.langs}.
                </p>
                <p>{g.bio}</p>
                <span className="verified">ID and first-aid certificate checked</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="book-panel" aria-label="Book this trip">
          <div className="book-panel__price">
            <strong>{money(trip.priceKZT, currency)}</strong> <span>per person, all included</span>
          </div>
          <fieldset>
            <legend>Departure</legend>
            <div className="date-grid">
              {dates.map((d) => {
                const v = isoDate(d);
                return (
                  <button key={v} type="button" className={`date ${v === date ? 'is-on' : ''}`} onClick={() => setDate(v)} aria-pressed={v === date}>
                    <span>{fmtDate(d, { weekday: 'short' })}</span>
                    <b>{fmtDate(d, { day: 'numeric', month: 'short' })}</b>
                  </button>
                );
              })}
            </div>
            <p className={`seats ${left <= 4 ? 'seats--low' : ''}`}>{left} seats left on this date</p>
          </fieldset>
          <fieldset>
            <legend>Travelers</legend>
            <div className="stepper">
              <button type="button" className="icon-btn" onClick={() => setPeople(Math.max(1, people - 1))} aria-label="One traveler less">
                <Minus size={18} />
              </button>
              <output aria-live="polite">{people}</output>
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
            <strong>{money(total, currency)}</strong>
          </div>
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => navigate(`/book/${trip.id}?date=${date}&people=${people}&meal=${meal}&mode=deposit`)}>
            Continue to payment
          </button>
          <p className="book-panel__note">Pay 20% now or in full. Free cancellation up to 72 hours before departure.</p>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => openChatWith(`Tell me more about ${trip.name}`)}>
            Ask Tulpar about this trip
          </button>
        </aside>
      </div>

      {video && (
        <div className="modal" role="dialog" aria-modal="true" aria-label={`Video intro from ${g.name}`} onClick={() => setVideo(false)}>
          <div className="modal__box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="icon-btn modal__close" onClick={() => setVideo(false)} aria-label="Close video">
              <X />
            </button>
            <div className="modal__video">
              <TripArt scene={trip.scene} className="modal__art" />
              <p className="modal__caption">Video intro, 60 seconds (filmed in the full launch)</p>
            </div>
            <h3>{g.name}</h3>
            <p>
              “Salem! I’m {g.name.split(' ')[0]}. {g.bio} I’ll meet you at {trip.pickup.toLowerCase()} and stay with the group the whole trip. Message me any time on WhatsApp before we go.”
            </p>
          </div>
        </div>
      )}
    </>
  );
}
