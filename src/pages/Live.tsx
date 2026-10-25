import { motion } from 'framer-motion';
import { BatteryMedium, Pause, Phone, Play, Radio } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Photo } from '../components/Photo';
import { tripPhotos } from '../lib/photos';
import { Link, useParams } from 'react-router-dom';
import { fmtDate, guides, parseIso, tripById, trips } from '../lib/kb';
import { useStore } from '../lib/store';

/** Family view: where the group is right now. In production fed by the guide app's GPS check-ins. */
export default function Live() {
  const { code } = useParams();
  const { bookings } = useStore();
  const b = bookings.find((x) => x.code === code);
  const trip = tripById(b?.tripId) ?? trips[0];
  const g = guides[trip.guide];
  const [progress, setProgress] = useState(5);
  const [playing, setPlaying] = useState(true);
  // Auto-plays the trip: the group's dot travels the route like real GPS check-ins.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 0.5)), 80);
    return () => clearInterval(id);
  }, [playing]);
  const gallery = tripPhotos[trip.id] ?? ['kolsai'];

  const stops = useMemo(() => {
    const s = [{ t: '07:00', label: `Picked up: ${trip.pickup}` }];
    trip.itinerary.forEach((d) => s.push({ t: `Day ${d.day}`, label: d.title }));
    s.push({ t: 'End', label: `Drop-off in ${trip.start}` });
    return s;
  }, [trip]);

  const current = Math.min(stops.length - 1, Math.floor((progress / 100) * stops.length));
  // A simple route path; the traveler dot moves along it with the slider.
  const pathD = 'M30 200 C90 120 150 210 210 140 S330 60 370 110';
  const t = progress / 100;
  const bez = (p0: number, p1: number, p2: number, p3: number, x: number) =>
    (1 - x) ** 3 * p0 + 3 * (1 - x) ** 2 * x * p1 + 3 * (1 - x) * x ** 2 * p2 + x ** 3 * p3;
  const seg = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const pos =
    t < 0.5
      ? { x: bez(30, 90, 150, 210, seg), y: bez(200, 120, 210, 140, seg) }
      : { x: bez(210, 270, 330, 370, seg), y: bez(140, 70, 60, 110, seg) };

  return (
    <section className="live">
      <div className="live__head">
        <span className="live__badge">
          <Radio size={16} aria-hidden="true" /> Live
        </span>
        <h1>{b ? `${b.lead.name.split(' ')[0]}’s group` : 'Sample group'}: {trip.name}</h1>
        <p className="muted">
          {b ? fmtDate(parseIso(b.date), { weekday: 'long', day: 'numeric', month: 'long' }) : 'Demo trip'}. This page is for family and friends at home; no app or login needed.
        </p>
      </div>
      <div className="live__grid">
        <div className="live__map">
          <svg viewBox="0 0 400 260" role="img" aria-label="Route map with the group's position">
            <rect width="400" height="260" rx="20" fill="#DCEBEE" />
            <path d="M0 230 C80 210 140 240 220 220 S340 200 400 215 V260 H0Z" fill="#CFE3DF" />
            <path d="M260 60 l30 -40 l30 40z M300 70 l24 -32 l24 32z" fill="#A9C2CC" />
            <path d={pathD} fill="none" stroke="#15233F" strokeWidth="3" strokeDasharray="6 7" strokeLinecap="round" />
            {[
              [30, 200],
              [210, 140],
              [370, 110],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="7" fill="#fff" stroke="#15233F" strokeWidth="3" />
            ))}
            <path d={pathD} fill="none" stroke="#0B7C86" strokeWidth="4" strokeLinecap="round" pathLength={100} strokeDasharray={`${progress} 100`} />
            <circle cx={pos.x} cy={pos.y} r="16" fill="#0B7C86" opacity=".18">
              <animate attributeName="r" values="10;26;10" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".35;0;.35" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={pos.x} cy={pos.y} r="9" fill="#0B7C86" stroke="#fff" strokeWidth="3" />
          </svg>
          <div className="live__controls">
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setPlaying(!playing)}>
              {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />} {playing ? 'Pause' : 'Play trip'}
            </button>
          </div>
          <label className="live__sim">
            Simulate trip time
            <input type="range" min={0} max={100} value={progress} onChange={(e) => (setPlaying(false), setProgress(Number(e.target.value)))} />
          </label>
        </div>
        <div className="live__side">
          <motion.div className="live__now" key={current} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="live__photo">
              <Photo id={gallery[current % gallery.length]} width={960} sizes="420px" />
            </div>
            <span className="muted">Now</span>
            <strong>{stops[current].label}</strong>
            <span className="muted">Last check-in by {g.name}, a few minutes ago</span>
          </motion.div>
          <ol className="live__timeline">
            {stops.map((s, i) => (
              <li key={i} className={i < current ? 'is-done' : i === current ? 'is-now' : ''}>
                <span>{s.t}</span>
                <p>{s.label}</p>
              </li>
            ))}
          </ol>
          <div className="live__guide">
            <div>
              <strong>{g.name}</strong>
              <span className="muted">Guide, speaks {g.langs}</span>
            </div>
            <span className="live__battery">
              <BatteryMedium size={16} aria-hidden="true" /> Guide phone online
            </span>
            <a className="btn btn--ghost btn--sm" href="tel:+77000000000">
              <Phone size={16} aria-hidden="true" /> Call the 24/7 line
            </a>
          </div>
          {b && (
            <Link to={`/pass/${b.code}`} className="btn btn--link">
              Back to the Trip Pass
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
