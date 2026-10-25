import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { departureFor } from '../lib/tulpar';
import { fmtDate, tripById } from '../lib/kb';
import { money } from '../lib/money';
import { useStore } from '../lib/store';
import { Shanyrak } from './Art';
import { Photo } from './Photo';
import { InclusionList } from './Ticket';

/** The hero: a booking happening inside one chat, played once on load. */
export function PhoneDemo() {
  const { currency } = useStore();
  const trip = tripById('kolsai-kaindy')!;
  const today = new Date();
  const nextFri = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (((5 - today.getDay() + 7) % 7) || 7));
  const dep = departureFor(trip, nextFri);
  const total = trip.priceKZT * 2;
  const deposit = Math.round(total * 0.2);

  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [step, setStep] = useState(reduce ? 6 : 0);

  // Plays the booking, holds the result, then replays it in a loop.
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (reduce) return;
    setStep(0);
    const times = [700, 1800, 3200, 4600, 5600, 6800];
    const timers = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
    timers.push(setTimeout(() => setRound((r) => r + 1), 12500));
    return () => timers.forEach(clearTimeout);
  }, [reduce, round]);

  return (
    <div className="phone" aria-label="Example: booking a trip in a chat">
      <div className="phone__notch" />
      <div className="phone__head">
        <div className="chat-head__avatar">
          <Shanyrak size={18} />
        </div>
        <div>
          <strong>Saryarqa Routes</strong>
          <span>Tulpar, booking assistant</span>
        </div>
      </div>
      <div className="phone__body">
        {step >= 1 && (
          <div className="msg msg--user pop">
            <div className="msg__bubble">
              <p>Hi! Two of us want to see Kolsai lakes next Friday. We are vegetarian.</p>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="msg msg--bot">
            <div className="msg__bubble msg__typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        {step >= 2 && (
          <div className="msg msg--bot pop">
            <div className="msg__bubble">
              <p>
                Lovely choice. Here is everything for {fmtDate(dep, { weekday: 'short', day: 'numeric', month: 'short' })}, 2 travelers, vegetarian meals:
              </p>
            </div>
            <div className="demo-card">
              <Photo id="kaindy" width={500} sizes="320px" className="demo-card__art" />
              <div className="demo-card__body">
                <strong>{trip.name}, 3 days</strong>
                <InclusionList trip={{ ...trip, included: trip.included.slice(0, 5) }} compact />
                <div className="demo-card__total">
                  <span>Total, all included</span>
                  <b>{money(total, currency)}</b>
                </div>
              </div>
            </div>
          </div>
        )}
        {step >= 3 && (
          <div className="msg msg--user pop">
            <div className="msg__bubble">
              <p>Can I pay with my Indian card?</p>
            </div>
          </div>
        )}
        {step >= 4 && (
          <div className="msg msg--bot pop">
            <div className="msg__bubble">
              <p>Yes: Visa, Mastercard, Apple Pay or Google Pay. Pay 20% now to hold the seats, the rest before the trip.</p>
            </div>
          </div>
        )}
        {step >= 5 && (
          <div className="msg msg--user pop">
            <div className="msg__bubble msg__bubble--action">
              <p>Pay 20% now ({money(deposit, currency)})</p>
            </div>
          </div>
        )}
        {step >= 6 && (
          <div className="demo-paid pop">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Seats booked. Trip Pass sent to your phone.</span>
          </div>
        )}
      </div>
    </div>
  );
}
