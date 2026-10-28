import { useT } from '../lib/i18n';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bot, CheckCircle2, CreditCard, Globe2, MessageSquare, Send, Users, X } from 'lucide-react';
import { useState } from 'react';
import { CountUp, useToast } from '../components/Motion';
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
  const tx = useT();
  const max = Math.max(...weekly);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <figure className="chart">
      <figcaption>{tx("Foreign travelers booked per week, pilot weeks 1–12")}</figcaption>
      <svg viewBox="0 0 360 160" role="img" aria-label={`${tx('Weekly foreign travelers:')} ${weekly.join(', ')}`}>
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1="28" x2="356" y1={140 - f * 120} y2={140 - f * 120} stroke="var(--line)" strokeWidth="1" />
        ))}
        <text x="22" y="144" className="axis" textAnchor="end">0</text>
        <text x="22" y="24" className="axis" textAnchor="end">{max}</text>
        {weekly.map((v, i) => {
          const h = (v / max) * 120;
          const x = 34 + i * 27;
          return (
            <motion.g
              key={i}
              initial={{ scaleY: 0, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'bottom', transformBox: 'fill-box' }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
              <rect x={x - 3} y="10" width="27" height="135" fill="transparent" />
              <path d={`M${x} 140 V${140 - h + 4} q0 -4 4 -4 h13 q4 0 4 4 V140 Z`} fill={hover === null || hover === i ? 'var(--lake)' : 'var(--lake-soft)'} />
              <text x={x + 10.5} y="155" className="axis" textAnchor="middle">{i + 1}</text>
              {hover === i && (
                <g>
                  <rect x={Math.min(x - 24, 290)} y={140 - h - 30} width="70" height="22" rx="6" fill="var(--ink)" />
                  <text x={Math.min(x - 24, 290) + 35} y={140 - h - 15} textAnchor="middle" className="tip">{tx("Week")}{' '}{i + 1}: {v}
                  </text>
                </g>
              )}
            </motion.g>
          );
        })}
      </svg>
    </figure>
  );
}

export default function Operator() {
  const tx = useT();
  const { bookings, currency } = useStore();
  const toast = useToast();
  const [queue, setQueue] = useState(handoffs);
  const [replying, setReplying] = useState<(typeof handoffs)[number] | null>(null);
  const [reply, setReply] = useState('');
  const templates = [
    'Yes! Charyn has an accessible viewpoint and our van has a ramp. I will reserve the front seats for you.',
    'For groups of 10 or more we give 10% off. Shall I prepare a quote for 14 students?',
    'Yes, the Caravanserai hotel has a prayer room, and Turkestan has several mosques next to the route.',
  ];
  const send = () => {
    if (!replying || !reply.trim()) return;
    setQueue((q) => q.filter((h) => h.who !== replying.who));
    toast(tx('Reply sent on WhatsApp. Tulpar has the conversation history.'));
    setReplying(null);
    setReply('');
  };
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
          <h1>{tx("Team dashboard")}</h1>
          <p className="muted">{tx("What the Saryarqa Routes team sees every morning. Sample pilot data; your own test bookings appear in the table.")}</p>
        </div>
        <Link to="/" className="btn btn--ghost btn--sm">{tx("Open the traveler site")}</Link>
      </div>

      <div className="goal">
        <div className="goal__text">
          <Globe2 aria-hidden="true" />
          <div>
            <strong>{foreignNow}{tx("% of this month’s travelers came from abroad")}</strong>
            <span className="muted">{tx("Goal:")}{' '}{goal}{tx("% within 24 months (2025 baseline: 4%)")}</span>
          </div>
        </div>
        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={foreignNow} aria-label={tx("Share of foreign travelers")}>
          <motion.div className="meter__fill" initial={{ width: 0 }} animate={{ width: `${foreignNow}%` }} transition={{ duration: 1.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} />
          <div className="meter__goal" style={{ left: `${goal}%` }}>
            <span>{tx("Goal")}{' '}{goal}%</span>
          </div>
          <div className="meter__base" style={{ left: '4%' }} />
        </div>
      </div>

      <div className="tiles">
        <div className="tile">
          <MessageSquare aria-hidden="true" />
          <span>{tx("Chat to paid booking")}</span>
          <strong><CountUp to={12.4} decimals={1} suffix="%" /></strong>
          <small>{tx("51 of 412 conversations")}</small>
        </div>
        <div className="tile">
          <Bot aria-hidden="true" />
          <span>{tx("Answered by Tulpar alone")}</span>
          <strong><CountUp to={78} suffix="%" /></strong>
          <small>{tx("22% handed to the team")}</small>
        </div>
        <div className="tile">
          <CreditCard aria-hidden="true" />
          <span>{tx("Foreign card success")}</span>
          <strong><CountUp to={91} suffix="%" /></strong>
          <small>{tx("Target 90% or higher")}</small>
        </div>
        <div className="tile">
          <Users aria-hidden="true" />
          <span>{tx("Foreign travelers, 12 weeks")}</span>
          <strong><CountUp to={weekly.reduce((a, b) => a + b, 0)} /></strong>
          <small>{money(weekly.reduce((a, b) => a + b, 0) * 66000, currency)}{' '}{tx("revenue")}</small>
        </div>
      </div>

      <div className="ops__grid">
        <div className="panel">
          <BarChart />
        </div>
        <div className="panel">
          <figure className="chart">
            <figcaption>{tx("Booking funnel, last 30 days")}</figcaption>
            <ul className="funnel">
              {funnel.map((f) => (
                <li key={f.label}>
                  <motion.div className="funnel__bar" initial={{ width: 0 }} whileInView={{ width: `${(f.v / funnel[0].v) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} title={`${tx(f.label)}: ${f.v}`} />
                  <span className="funnel__label">{tx(f.label)}</span>
                  <b>{f.v}</b>
                </li>
              ))}
            </ul>
          </figure>
        </div>
      </div>

      <div className="ops__grid">
        <div className="panel">
          <h2>{tx("Waiting for a person")}</h2>
          <ul className="handoffs">
            <AnimatePresence>
            {queue.length === 0 && (
              <motion.li key="empty" className="handoffs__empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckCircle2 size={18} aria-hidden="true" />{' '}{tx("Inbox zero. Every traveler has an answer.")}</motion.li>
            )}
            {queue.map((h, i) => (
              <motion.li key={h.who} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80, height: 0 }} transition={{ delay: i * 0.05 }}>
                <AlertCircle size={18} aria-hidden="true" />
                <div>
                  <strong>{tx(h.q)}</strong>
                  <span className="muted">
                    {h.who}{tx(", waiting")}{' '}{h.wait}
                  </span>
                </div>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => (setReplying(h), setReply(tx(templates[handoffs.indexOf(h)] ?? '')))}>{tx("Reply")}</button>
              </motion.li>
            ))}
            </AnimatePresence>
          </ul>
        </div>
        <div className="panel">
          <h2>{tx("Next departures")}</h2>
          <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{tx("Trip")}</th>
                <th>{tx("Date")}</th>
                <th>{tx("Seats")}</th>
                <th>{tx("Guide")}</th>
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
      </div>

      <div className="panel">
        <h2>{tx("Latest bookings")}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{tx("Code")}</th>
                <th>{tx("Lead traveler")}</th>
                <th>{tx("Country")}</th>
                <th>{tx("Trip")}</th>
                <th>{tx("People")}</th>
                <th>{tx("Food")}</th>
                <th>{tx("Channel")}</th>
                <th>{tx("Paid")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className={r.mine ? 'is-mine' : ''}>
                  <td>{r.mine ? <Link to={`/pass/${r.code}`}>{r.code}</Link> : r.code}</td>
                  <td>{r.name}</td>
                  <td>{tx(r.country)}</td>
                  <td>{tripById(r.trip)?.name}</td>
                  <td>{r.people}</td>
                  <td>{tx(mealLabel[r.meal])}</td>
                  <td>{tx(r.ch)}</td>
                  <td>
                    {money(r.paid, currency)} / {money(r.total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bookings.length > 0 && <p className="muted">{tx("Highlighted rows are bookings you made in this browser (")}{fmtDate(parseIso(bookings[0].date))}{' '}{tx("is the next one).")}</p>}
      </div>
      <AnimatePresence>
        {replying && (
          <motion.div className="modal" role="dialog" aria-modal="true" aria-label={tx("Reply to traveler")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReplying(null)}>
            <motion.div className="modal__box" initial={{ y: 40, scale: 0.92 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <button type="button" className="icon-btn modal__close" onClick={() => setReplying(null)} aria-label={tx("Close")}>
                <X />
              </button>
              <h3>{tx("Reply on WhatsApp")}</h3>
              <p className="muted">{replying.who}</p>
              <div className="msg msg--user">
                <div className="msg__bubble">
                  <p>{tx(replying.q)}</p>
                </div>
              </div>
              <label className="reply-box">{tx("Your answer (Tulpar suggested a draft)")}<textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />
              </label>
              <button type="button" className="btn btn--primary" onClick={send} disabled={!reply.trim()}>
                <Send size={16} aria-hidden="true" />{' '}{tx("Send reply")}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
