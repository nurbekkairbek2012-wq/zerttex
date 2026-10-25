import { AlertCircle, Bot, CreditCard, Globe2, MessageSquare, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtDate, guides, parseIso, seatsLeft, tripById, trips, upcomingDepartures } from '../lib/kb';
import { money } from '../lib/money';
import { mealLabel, useStore } from '../lib/store';

// Sample pilot data (illustrative) for the operator view.
const weekly = [2, 3, 5, 4, 7, 9, 8, 11, 13, 12, 15, 17];
const funnel = [
  { label: 'Conversations started', v: 412 },
  { label: 'Asked about price or dates', v: 290 },
  { label: 'Received a price card', v: 168 },
  { label: 'Paid (deposit or full)', v: 51 },
];
const sampleRows = [
  { code: 'SG-7KQ2M', name: 'Priya Sharma', country: 'India', trip: 'kolsai-kaindy', people: 2, meal: 'veg' as const, ch: 'WhatsApp', paid: 31600, total: 158000 },
  { code: 'SG-H4D9X', name: 'Rohan Mehta', country: 'India', trip: 'charyn-canyon', people: 4, meal: 'jain' as const, ch: 'Web', paid: 232000, total: 232000 },
  { code: 'SG-2PW8N', name: 'Aisha Khan', country: 'UAE', trip: 'turkestan', people: 3, meal: 'halal' as const, ch: 'Instagram', paid: 43200, total: 216000 },
  { code: 'SG-M3Z6T', name: 'Vikram Rao', country: 'India', trip: 'burabay', people: 2, meal: 'veg' as const, ch: 'WhatsApp', paid: 108000, total: 108000 },
];
const handoffs = [
  { who: '+91 98•• ••• 210', q: 'Can my mother use a wheelchair at Charyn?', wait: '4 min' },
  { who: '+91 70•• ••• 884', q: 'Group of 14 students in December, discount?', wait: '9 min' },
  { who: '+971 50•• ••• 31', q: 'Is there a prayer room in Turkestan hotel?', wait: '12 min' },
];

function BarChart() {
  const max = Math.max(...weekly);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <figure className="chart">
      <figcaption>Foreign travelers booked per week, pilot weeks 1–12</figcaption>
      <svg viewBox="0 0 360 160" role="img" aria-label={`Weekly foreign travelers: ${weekly.join(', ')}`}>
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1="28" x2="356" y1={140 - f * 120} y2={140 - f * 120} stroke="var(--line)" strokeWidth="1" />
        ))}
        <text x="22" y="144" className="axis" textAnchor="end">0</text>
        <text x="22" y="24" className="axis" textAnchor="end">{max}</text>
        {weekly.map((v, i) => {
          const h = (v / max) * 120;
          const x = 34 + i * 27;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
              <rect x={x - 3} y="10" width="27" height="135" fill="transparent" />
              <path d={`M${x} 140 V${140 - h + 4} q0 -4 4 -4 h13 q4 0 4 4 V140 Z`} fill={hover === null || hover === i ? 'var(--lake)' : 'var(--lake-soft)'} />
              <text x={x + 10.5} y="155" className="axis" textAnchor="middle">{i + 1}</text>
              {hover === i && (
                <g>
                  <rect x={Math.min(x - 24, 290)} y={140 - h - 30} width="70" height="22" rx="6" fill="var(--ink)" />
                  <text x={Math.min(x - 24, 290) + 35} y={140 - h - 15} textAnchor="middle" className="tip">
                    Week {i + 1}: {v}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export default function Operator() {
  const { bookings, currency } = useStore();
  const foreignNow = 18;
  const goal = 30;
  const departures = trips.slice(0, 4).map((t) => {
    const d = upcomingDepartures(t, 1)[0];
    const left = seatsLeft(t, d);
    return { t, d, sold: t.seatsBase - left, cap: t.seatsBase };
  });
  const rows = [
    ...bookings.map((b) => ({ code: b.code, name: b.lead.name, country: b.lead.country, trip: b.tripId, people: b.people, meal: b.meal, ch: b.channel === 'chat' ? 'Chat' : 'Web', paid: b.paidKZT, total: b.totalKZT, mine: true })),
    ...sampleRows.map((r) => ({ ...r, mine: false })),
  ];

  return (
    <section className="ops">
      <div className="ops__head">
        <div>
          <h1>Team dashboard</h1>
          <p className="muted">What the Saryarqa Routes team sees every morning. Sample pilot data; your own test bookings appear in the table.</p>
        </div>
        <Link to="/" className="btn btn--ghost btn--sm">
          Open the traveler site
        </Link>
      </div>

      <div className="goal">
        <div className="goal__text">
          <Globe2 aria-hidden="true" />
          <div>
            <strong>{foreignNow}% of this month’s travelers came from abroad</strong>
            <span className="muted">Goal: {goal}% within 24 months (2025 baseline: 4%)</span>
          </div>
        </div>
        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={foreignNow} aria-label="Share of foreign travelers">
          <div className="meter__fill" style={{ width: `${foreignNow}%` }} />
          <div className="meter__goal" style={{ left: `${goal}%` }}>
            <span>Goal {goal}%</span>
          </div>
          <div className="meter__base" style={{ left: '4%' }} />
        </div>
      </div>

      <div className="tiles">
        <div className="tile">
          <MessageSquare aria-hidden="true" />
          <span>Chat to paid booking</span>
          <strong>12.4%</strong>
          <small>51 of 412 conversations</small>
        </div>
        <div className="tile">
          <Bot aria-hidden="true" />
          <span>Answered by Tulpar alone</span>
          <strong>78%</strong>
          <small>22% handed to the team</small>
        </div>
        <div className="tile">
          <CreditCard aria-hidden="true" />
          <span>Foreign card success</span>
          <strong>91%</strong>
          <small>Target 90% or higher</small>
        </div>
        <div className="tile">
          <Users aria-hidden="true" />
          <span>Foreign travelers, 12 weeks</span>
          <strong>{weekly.reduce((a, b) => a + b, 0)}</strong>
          <small>{money(weekly.reduce((a, b) => a + b, 0) * 66000, currency)} revenue</small>
        </div>
      </div>

      <div className="ops__grid">
        <div className="panel">
          <BarChart />
        </div>
        <div className="panel">
          <figure className="chart">
            <figcaption>Booking funnel, last 30 days</figcaption>
            <ul className="funnel">
              {funnel.map((f) => (
                <li key={f.label}>
                  <div className="funnel__bar" style={{ width: `${(f.v / funnel[0].v) * 100}%` }} title={`${f.label}: ${f.v}`} />
                  <span className="funnel__label">{f.label}</span>
                  <b>{f.v}</b>
                </li>
              ))}
            </ul>
          </figure>
        </div>
      </div>

      <div className="ops__grid">
        <div className="panel">
          <h2>Waiting for a person</h2>
          <ul className="handoffs">
            {handoffs.map((h) => (
              <li key={h.who}>
                <AlertCircle size={18} aria-hidden="true" />
                <div>
                  <strong>{h.q}</strong>
                  <span className="muted">
                    {h.who}, waiting {h.wait}
                  </span>
                </div>
                <button type="button" className="btn btn--ghost btn--sm">
                  Reply
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h2>Next departures</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Trip</th>
                <th>Date</th>
                <th>Seats</th>
                <th>Guide</th>
              </tr>
            </thead>
            <tbody>
              {departures.map(({ t, d, sold, cap }) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{fmtDate(d)}</td>
                  <td>
                    {sold}/{cap}
                  </td>
                  <td>{guides[t.guide].name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Latest bookings</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Lead traveler</th>
                <th>Country</th>
                <th>Trip</th>
                <th>People</th>
                <th>Food</th>
                <th>Channel</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className={r.mine ? 'is-mine' : ''}>
                  <td>{r.mine ? <Link to={`/pass/${r.code}`}>{r.code}</Link> : r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.country}</td>
                  <td>{tripById(r.trip)?.name}</td>
                  <td>{r.people}</td>
                  <td>{mealLabel[r.meal]}</td>
                  <td>{r.ch}</td>
                  <td>
                    {money(r.paid, currency)} / {money(r.total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bookings.length > 0 && <p className="muted">Highlighted rows are bookings you made in this browser ({fmtDate(parseIso(bookings[0].date))} is the next one).</p>}
      </div>
    </section>
  );
}
