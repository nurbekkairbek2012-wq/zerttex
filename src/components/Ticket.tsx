import { plural, useT } from '../lib/i18n';
import {
  BedDouble, Bus, GlassWater, Languages, Plane, Share2, ShieldCheck, Smartphone, Ticket as TicketIcon, UtensilsCrossed, X,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmtDate, guides, inclusionLabels, parseIso, tripById, type Trip } from '../lib/kb';
import { money } from '../lib/money';
import { mealLabel, useStore, type Meal } from '../lib/store';
import { coverOf } from '../lib/photos';
import { OrnamentBand } from './Art';
import { Photo } from './Photo';

export const inclusionIcon: Record<string, LucideIcon> = {
  transport: Bus,
  guide: Languages,
  fees: TicketIcon,
  stay: BedDouble,
  meals: UtensilsCrossed,
  water: GlassWater,
  insurance: ShieldCheck,
  pass: Smartphone,
  flight: Plane,
};

export function InclusionList({ trip, compact = false }: { trip: Trip; compact?: boolean }) {
  return (
    <ul className={`incl ${compact ? 'incl--compact' : ''}`}>
      {trip.included.map((k) => {
        const Icon = inclusionIcon[k] ?? ShieldCheck;
        return (
          <li key={k}>
            <Icon size={compact ? 15 : 18} aria-hidden="true" />
            <span>{inclusionLabels[k]}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function NotIncludedList({ trip }: { trip: Trip }) {
  return (
    <ul className="incl incl--not">
      {trip.notIncluded.map((k) => (
        <li key={k}>
          <X size={16} aria-hidden="true" />
          <span>{k}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The Clear-Price Trip Card: the one object a traveler sees in chat, on the web and in
 * WhatsApp group shares. Same layout everywhere: what, when, who, everything included, one total.
 */
export function TripTicket({
  tripId, date, people, meal, variant = 'full', actions = true, source = 'web',
}: {
  tripId: string; date?: string; people?: number; meal?: Meal; variant?: 'full' | 'chat'; actions?: boolean; source?: 'web' | 'chat';
}) {
  const tx = useT();
  const { currency } = useStore();
  const trip = tripById(tripId);
  if (!trip) return null;
  const n = people ?? 1;
  const total = trip.priceKZT * n;
  const deposit = Math.round(total * 0.2);
  const g = guides[trip.guide];
  const q = new URLSearchParams({ ...(date ? { date } : {}), people: String(n), ...(meal ? { meal } : {}), ch: source });
  // Group decisions happen in WhatsApp groups: share the same card as text with a booking link.
  const base = typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol) ? `${window.location.origin}${window.location.pathname}` : '';
  const shareText = [
    `${trip.name}, ${tx('{n} days from {place}', { n: trip.days, place: trip.start })}${date ? `, ${fmtDate(parseIso(date), { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}`,
    `${plural(n, '{n} traveler', '{n} travelers')}: ${tx('{price} total, all included', { price: money(total, currency) })} (${trip.included.map((k) => inclusionLabels[k].split(',')[0].toLowerCase()).join(', ')}).`,
    base ? `${tx('Book or split the cost:')} ${base}#/book/${trip.id}?${q.toString()}&mode=split` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <article className={`ticket ticket--${variant}`} aria-label={tx('Clear-price card for {trip}', { trip: trip.name })}>
      <div className="ticket__stub">
        <Photo id={coverOf(trip.id)} width={960} sizes="420px" className="ticket__art" />
        <div className="ticket__title">
          <h3>{trip.name}</h3>
          <p>
            {trip.days}{' '}{tx("days from")}{' '}{trip.start}
            {date ? `, ${fmtDate(parseIso(date), { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}
          </p>
        </div>
      </div>
      <OrnamentBand className="ticket__band" color="#F4B400" />
      <div className="ticket__body">
        <dl className="ticket__facts">
          <div>
            <dt>{tx("Travelers")}</dt>
            <dd>{n}</dd>
          </div>
          <div>
            <dt>{tx("Food")}</dt>
            <dd>{meal ? tx(mealLabel[meal]) : tx('Veg options daily')}</dd>
          </div>
          <div>
            <dt>{tx("Guide")}</dt>
            <dd>{g?.name}</dd>
          </div>
        </dl>
        <InclusionList trip={trip} compact />
        <div className="ticket__total">
          <div>
            <span className="ticket__total-label">{tx("Total, all included")}</span>
            <strong>{money(total, currency)}</strong>
            {currency !== 'KZT' && <span className="ticket__kzt">{tx("charged as")}{' '}{money(total, 'KZT')}</span>}
          </div>
          {actions && (
            <div className="ticket__actions">
              <Link className="btn btn--primary" to={`/book/${trip.id}?${q.toString()}&mode=deposit`}>{tx("Pay 20% now (")}{money(deposit, currency)})
              </Link>
              <Link className="btn btn--ghost" to={`/book/${trip.id}?${q.toString()}&mode=full`}>{tx("Pay in full")}</Link>
              <a className="btn btn--link ticket__share" href={waHref} target="_blank" rel="noreferrer">
                <Share2 size={16} aria-hidden="true" />{' '}{tx("Share to group chat")}</a>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
