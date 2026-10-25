import { CalendarPlus, CheckCircle2, Copy, MapPinned, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { OrnamentBand, TripArt } from '../components/Art';
import { QR } from '../components/QR';
import { fmtDate, guides, parseIso, tripById } from '../lib/kb';
import { money } from '../lib/money';
import { mealLabel, useStore } from '../lib/store';

function shareUrl(path: string) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#${path}`;
}

export default function Pass() {
  const { code } = useParams();
  const [sp] = useSearchParams();
  const { bookings, currency, updateBooking } = useStore();
  const b = bookings.find((x) => x.code === code);
  const [copied, setCopied] = useState('');

  if (!b) {
    return (
      <section className="section narrow">
        <h1>Trip Pass not found on this device</h1>
        <p>Trip Passes in this prototype are saved in your browser. Open the link from the device you booked on, or make a new booking.</p>
        <Link to="/" className="btn btn--primary">
          See trips
        </Link>
      </section>
    );
  }
  const trip = tripById(b.tripId)!;
  const g = guides[trip.guide];
  const dep = parseIso(b.date);
  const remaining = b.totalKZT - b.paidKZT;
  const liveLink = shareUrl(`/live/${b.code}`);

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  };

  const ics = () => {
    const d = b.date.replace(/-/g, '');
    const end = new Date(dep.getTime() + trip.days * 864e5);
    const e = `${end.getFullYear()}${String(end.getMonth() + 1).padStart(2, '0')}${String(end.getDate()).padStart(2, '0')}`;
    const body = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Saryarqa Go//EN', 'BEGIN:VEVENT',
      `UID:${b.code}@saryarqa.go`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${e}`,
      `SUMMARY:${trip.name} (${b.code})`, `LOCATION:${trip.pickup}`,
      `DESCRIPTION:Guide ${g.name}. Trip Pass ${b.code}. Live link for family: ${liveLink}`, 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${b.code}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const waText = encodeURIComponent(`We're going to ${trip.name} on ${fmtDate(dep, { day: 'numeric', month: 'long' })}! Follow our trip live: ${liveLink}`);

  return (
    <section className="pass-page">
      {sp.get('new') && (
        <div className="success" role="status">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <strong>Payment confirmed. Your seats are booked.</strong>
            <p>We sent this Trip Pass to {b.lead.email || 'your email'} and WhatsApp. Your guide will message you the day before.</p>
          </div>
        </div>
      )}

      <article className="pass">
        <div className="pass__top">
          <TripArt scene={trip.scene} className="pass__art" />
          <div className="pass__title">
            <span>Trip Pass</span>
            <h1>{trip.name}</h1>
            <p>{fmtDate(dep, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <OrnamentBand className="pass__band" color="#F4B400" />
        <div className="pass__grid">
          <div className="pass__qr">
            <QR value={shareUrl(`/pass/${b.code}`)} label={`QR code for Trip Pass ${b.code}`} />
            <strong className="pass__code">{b.code}</strong>
            <span className="muted">Show this to your guide at pickup</span>
          </div>
          <dl className="pass__facts">
            <div>
              <dt>Lead traveler</dt>
              <dd>{b.lead.name}</dd>
            </div>
            <div>
              <dt>Travelers</dt>
              <dd>{b.people}</dd>
            </div>
            <div>
              <dt>Food</dt>
              <dd>{mealLabel[b.meal]}</dd>
            </div>
            <div>
              <dt>Pickup</dt>
              <dd>{trip.pickup}</dd>
            </div>
            <div>
              <dt>Guide</dt>
              <dd>
                {g.name}, {g.langs.split(',')[0]}
              </dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd>
                {money(b.paidKZT, currency)} of {money(b.totalKZT, currency)}
              </dd>
            </div>
            {remaining > 0 && (
              <div>
                <dt>Left to pay</dt>
                <dd>
                  {money(remaining, currency)} by {fmtDate(new Date(dep.getTime() - 2 * 864e5), { day: 'numeric', month: 'short' })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {b.split && (
          <div className="pass__split">
            <h2>Split payment</h2>
            <ul>
              {b.split.map((s, i) => (
                <li key={i}>
                  <span>{s.name}</span>
                  <span>{money(s.amountKZT, currency)}</span>
                  {s.paid ? (
                    <span className="paid">Paid</span>
                  ) : (
                    <span className="split__actions">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => copy(shareUrl(`/book/${trip.id}?date=${b.date}&people=1&mode=full`), `link${i}`)}>
                        {copied === `link${i}` ? 'Link copied' : 'Copy pay link'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--link btn--sm"
                        onClick={() =>
                          updateBooking(b.code, {
                            split: b.split!.map((x, j) => (j === i ? { ...x, paid: true } : x)),
                            paidKZT: b.paidKZT + s.amountKZT,
                          })
                        }
                      >
                        Mark as paid (demo)
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pass__actions">
          <Link to={`/live/${b.code}`} className="btn btn--primary">
            <MapPinned size={18} aria-hidden="true" /> Open live trip view
          </Link>
          <button type="button" className="btn btn--ghost" onClick={() => copy(liveLink, 'live')}>
            <Copy size={18} aria-hidden="true" /> {copied === 'live' ? 'Copied' : 'Copy link for family'}
          </button>
          <a className="btn btn--ghost" href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer">
            <Share2 size={18} aria-hidden="true" /> Share on WhatsApp
          </a>
          <button type="button" className="btn btn--ghost" onClick={ics}>
            <CalendarPlus size={18} aria-hidden="true" /> Add to calendar
          </button>
          <Link to="/chat" className="btn btn--link">
            <MessageCircle size={18} aria-hidden="true" /> Questions? Ask Tulpar
          </Link>
        </div>
      </article>
    </section>
  );
}
