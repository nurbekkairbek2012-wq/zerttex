import { CreditCard, Info, Lock, ShieldCheck, Smartphone, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TripTicket } from '../components/Ticket';
import { fmtDate, isoDate, parseIso, tripById, upcomingDepartures } from '../lib/kb';
import { money } from '../lib/money';
import { makeCode, useStore, type Booking, type Meal, type PayMode } from '../lib/store';

type Step = 'details' | 'pay' | 'otp' | 'processing';

export default function Book() {
  const { id } = useParams();
  const trip = tripById(id);
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { currency, addBooking } = useStore();

  const firstDate = trip ? isoDate(upcomingDepartures(trip, 1)[0]) : '';
  const date = sp.get('date') || firstDate;
  const people = Math.max(1, Math.min(20, Number(sp.get('people')) || 1));
  const [meal, setMeal] = useState<Meal>((sp.get('meal') as Meal) || 'veg');
  const [mode, setMode] = useState<PayMode>((sp.get('mode') as PayMode) || 'deposit');
  const [method, setMethod] = useState<'card' | 'apple' | 'google'>('card');
  const [step, setStep] = useState<Step>('details');
  const [lead, setLead] = useState({ name: '', email: '', phone: '+91 ', country: 'India' });
  const [friends, setFriends] = useState<string[]>(() => Array.from({ length: Math.max(0, people - 1) }, () => ''));
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  if (!trip) {
    return (
      <section className="section narrow">
        <h1>This trip is not available</h1>
        <Link to="/" className="btn btn--primary">
          Choose another trip
        </Link>
      </section>
    );
  }

  const total = trip.priceKZT * people;
  const share = Math.round(total / people);
  const dueNow = mode === 'full' ? total : mode === 'deposit' ? Math.round(total * 0.2) : share;

  const submitDetails = (e: FormEvent) => {
    e.preventDefault();
    if (lead.name.trim().length < 2) return setError('Enter the lead traveler’s full name as in the passport.');
    if (!/^\S+@\S+\.\S+$/.test(lead.email)) return setError('Enter an email address, for example name@gmail.com.');
    if (lead.phone.replace(/\D/g, '').length < 10) return setError('Enter a WhatsApp number with country code, for example +91 98765 43210.');
    setError('');
    setStep('pay');
  };

  const pay = (e: FormEvent) => {
    e.preventDefault();
    setStep('otp');
  };

  const confirmOtp = (e: FormEvent) => {
    e.preventDefault();
    if (otp.trim() !== '123456') return setError('The code is not correct. In this demo the bank code is 123456.');
    setError('');
    setStep('processing');
    const code = makeCode();
    const booking: Booking = {
      code,
      tripId: trip.id,
      date,
      people,
      meal,
      lead,
      payMode: mode,
      totalKZT: total,
      paidKZT: dueNow,
      createdAt: new Date().toISOString(),
      channel: sp.get('ch') === 'chat' ? 'chat' : 'web',
      split:
        mode === 'split'
          ? [{ name: lead.name || 'You', amountKZT: share, paid: true }, ...friends.map((f, i) => ({ name: f || `Friend ${i + 1}`, amountKZT: share, paid: false }))]
          : undefined,
    };
    setTimeout(() => {
      addBooking(booking);
      navigate(`/pass/${code}?new=1`);
    }, 1400);
  };

  return (
    <section className="checkout">
      <div className="checkout__main">
        <p className="crumbs">
          <Link to={`/trips/${trip.id}`}>{trip.name}</Link> / Booking
        </p>
        <h1>Book {trip.name}</h1>
        <ol className="progress" aria-label="Booking steps">
          <li className={step === 'details' ? 'is-on' : 'is-done'}>Travelers</li>
          <li className={step === 'pay' ? 'is-on' : step === 'details' ? '' : 'is-done'}>Payment</li>
          <li className={step === 'otp' || step === 'processing' ? 'is-on' : ''}>Confirm</li>
        </ol>

        {step === 'details' && (
          <form className="form" onSubmit={submitDetails} noValidate>
            <h2>Lead traveler</h2>
            <div className="form__grid">
              <label>
                Full name as in passport
                <input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} autoComplete="name" required />
              </label>
              <label>
                Email for the Trip Pass
                <input type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} autoComplete="email" required />
              </label>
              <label>
                WhatsApp number
                <input type="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} autoComplete="tel" required />
              </label>
              <label>
                Country
                <select value={lead.country} onChange={(e) => setLead({ ...lead, country: e.target.value })}>
                  {['India', 'United Arab Emirates', 'Nepal', 'Sri Lanka', 'United Kingdom', 'Other'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <h2>Food for the group</h2>
            <div className="seg">
              {(['veg', 'jain', 'halal', 'any'] as Meal[]).map((m) => (
                <button key={m} type="button" className={meal === m ? 'is-on' : ''} onClick={() => setMeal(m)} aria-pressed={meal === m}>
                  {m === 'veg' ? 'Vegetarian' : m === 'jain' ? 'Jain' : m === 'halal' ? 'Halal' : 'No preference'}
                </button>
              ))}
            </div>
            <p className="hint">
              <Info size={16} aria-hidden="true" /> We need passport details only after payment, for hotel registration (eQonaq). You can add them later in the Trip Pass.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn--primary btn--lg">
              Continue to payment
            </button>
          </form>
        )}

        {step === 'pay' && (
          <form className="form" onSubmit={pay}>
            <h2>How do you want to pay?</h2>
            <div className="paymodes" role="radiogroup" aria-label="Payment plan">
              <button type="button" role="radio" aria-checked={mode === 'deposit'} className={`paymode ${mode === 'deposit' ? 'is-on' : ''}`} onClick={() => setMode('deposit')}>
                <strong>Pay 20% now</strong>
                <span>{money(Math.round(total * 0.2), currency)} today, the rest 48 hours before the trip</span>
              </button>
              <button type="button" role="radio" aria-checked={mode === 'full'} className={`paymode ${mode === 'full' ? 'is-on' : ''}`} onClick={() => setMode('full')}>
                <strong>Pay in full</strong>
                <span>{money(total, currency)} today, nothing later</span>
              </button>
              {people > 1 && (
                <button type="button" role="radio" aria-checked={mode === 'split'} className={`paymode ${mode === 'split' ? 'is-on' : ''}`} onClick={() => setMode('split')}>
                  <strong>
                    <Users size={16} aria-hidden="true" /> Split with friends
                  </strong>
                  <span>
                    You pay {money(share, currency)}, each friend gets a link for their share
                  </span>
                </button>
              )}
            </div>

            {mode === 'split' && (
              <div className="split">
                <p>Names of the friends who will get a payment link (optional):</p>
                {friends.map((f, i) => (
                  <label key={i}>
                    Friend {i + 1}
                    <input value={f} onChange={(e) => setFriends(friends.map((x, j) => (j === i ? e.target.value : x)))} />
                  </label>
                ))}
                <p className="hint">Seats are held for 24 hours while friends pay.</p>
              </div>
            )}

            <h2>Payment method</h2>
            <div className="methods" role="radiogroup" aria-label="Payment method">
              <button type="button" role="radio" aria-checked={method === 'card'} className={`method ${method === 'card' ? 'is-on' : ''}`} onClick={() => setMethod('card')}>
                <CreditCard size={18} aria-hidden="true" /> Card
              </button>
              <button type="button" role="radio" aria-checked={method === 'apple'} className={`method ${method === 'apple' ? 'is-on' : ''}`} onClick={() => setMethod('apple')}>
                <Smartphone size={18} aria-hidden="true" /> Apple Pay
              </button>
              <button type="button" role="radio" aria-checked={method === 'google'} className={`method ${method === 'google' ? 'is-on' : ''}`} onClick={() => setMethod('google')}>
                <Smartphone size={18} aria-hidden="true" /> Google Pay
              </button>
            </div>

            {method === 'card' && (
              <div className="card-form">
                <p className="demo-note">
                  Demo mode: no real payment is made. Use the test card below and do not enter real card details.
                </p>
                <div className="form__grid">
                  <label className="span-2">
                    Card number
                    <input value="4242 4242 4242 4242" readOnly inputMode="numeric" />
                  </label>
                  <label>
                    Expiry
                    <input value="12 / 29" readOnly />
                  </label>
                  <label>
                    CVC
                    <input value="123" readOnly />
                  </label>
                </div>
              </div>
            )}

            <div className="india-tip">
              <strong>Paying with an Indian card?</strong>
              <p>
                New Indian cards have international and online use switched off by default (RBI rules). Open your bank app, turn on “international transactions” and “online”, then pay. It takes about 30 seconds.
              </p>
            </div>

            <button type="submit" className="btn btn--primary btn--lg btn--block">
              <Lock size={18} aria-hidden="true" /> Pay {money(dueNow, currency)}
            </button>
            <p className="secure">
              <ShieldCheck size={16} aria-hidden="true" /> Secured by a licensed Kazakhstan acquiring bank with 3-D Secure. Charged as {money(dueNow, 'KZT')}; your bank converts with no extra fee from us. Card details never reach Saryarqa Routes.
            </p>
            <button type="button" className="btn btn--link" onClick={() => setStep('details')}>
              Back to traveler details
            </button>
          </form>
        )}

        {(step === 'otp' || step === 'processing') && (
          <form className="form bank" onSubmit={confirmOtp}>
            <div className="bank__head">
              <Lock size={18} aria-hidden="true" /> Your bank: 3-D Secure check
            </div>
            {step === 'otp' ? (
              <>
                <p>
                  Your bank sent a one-time code to {lead.phone.trim() || 'your phone'} to confirm a payment of {money(dueNow, 'KZT')} to SARYARQA ROUTES, ASTANA.
                </p>
                <label>
                  One-time code (demo: 123456)
                  <input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" autoComplete="one-time-code" autoFocus />
                </label>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <button type="submit" className="btn btn--primary btn--lg">
                  Confirm payment
                </button>
              </>
            ) : (
              <div className="processing" role="status">
                <span className="spinner" aria-hidden="true" /> Confirming with your bank and issuing your Trip Pass…
              </div>
            )}
          </form>
        )}
      </div>

      <aside className="checkout__side">
        <TripTicket tripId={trip.id} date={date} people={people} meal={meal} actions={false} />
        <div className="summary">
          <div>
            <span>Departure</span>
            <b>{fmtDate(parseIso(date), { weekday: 'long', day: 'numeric', month: 'long' })}</b>
          </div>
          <div>
            <span>Due today</span>
            <b>{money(dueNow, currency)}</b>
          </div>
          <div>
            <span>Free cancellation until</span>
            <b>{fmtDate(new Date(parseIso(date).getTime() - 3 * 864e5), { day: 'numeric', month: 'long' })}</b>
          </div>
        </div>
      </aside>
    </section>
  );
}
