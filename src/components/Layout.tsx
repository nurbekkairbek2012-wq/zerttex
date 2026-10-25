import { Menu, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { company } from '../lib/kb';
import type { Currency } from '../lib/money';
import { useStore } from '../lib/store';
import { Shanyrak } from './Art';
import { ChatWidget } from './Chat';
import { ScrollProgress } from './Motion';

function CurrencySwitch() {
  const { currency, setCurrency } = useStore();
  const opts: Currency[] = ['INR', 'USD', 'KZT'];
  return (
    <div className="cur" role="radiogroup" aria-label="Currency">
      {opts.map((c) => (
        <button key={c} type="button" role="radio" aria-label={c} aria-checked={currency === c} className={currency === c ? 'is-on' : ''} onClick={() => setCurrency(c)}>
          <span className="cur__long">{c === 'INR' ? '₹ INR' : c === 'USD' ? '$ USD' : '₸ KZT'}</span>
          <span className="cur__short" aria-hidden="true">{c === 'INR' ? '₹' : c === 'USD' ? '$' : '₸'}</span>
        </button>
      ))}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { setChatOpen } = useStore();
  const { hash } = useLocation();
  useEffect(() => {
    setOpen(false);
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    // Wait for the page transition, then scroll to the section named in the link.
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 650);
    return () => clearTimeout(t);
  }, [pathname, hash]);
  const isOperator = pathname.startsWith('/operator');

  return (
    <div className="app">
      <ScrollProgress />
      <div className="demo-bar">
        Hackathon prototype by team РыбаЕж. {company.name} is the fictional company from the Zerttex 2026 case; payments and data here are simulated.
      </div>
      <header className="nav">
        <Link to="/" className="brand" aria-label="Saryarqa Go home">
          <Shanyrak />
          <span className="brand__name">
            Saryarqa <b>Go</b>
          </span>
        </Link>
        <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/" end>
            Trips
          </NavLink>
          <NavLink to="/trust">Why trust us</NavLink>
          <NavLink to="/chat">Chat with Tulpar</NavLink>
          <NavLink to="/operator">For the team</NavLink>
          <NavLink to="/about">About the project</NavLink>
        </nav>
        <div className="nav__right">
          {!isOperator && <CurrencySwitch />}
          <button type="button" className="btn btn--primary btn--sm nav__cta" onClick={() => setChatOpen(true)}>
            Plan my trip
          </button>
          <button type="button" className="icon-btn nav__burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">{children}</main>
      {!isOperator && (
        <footer className="foot">
          <div className="foot__brand">
            <Shanyrak />
            <div>
              <strong>Saryarqa Go</strong>
              <p>
                The booking assistant of {company.name}, Astana. Guided trips since {company.founded}.
              </p>
            </div>
          </div>
          <div className="foot__cols">
            <div>
              <h3 className="foot__h">Trips</h3>
              <Link to="/trips/kolsai-kaindy">Kolsai & Kaindy Lakes</Link>
              <Link to="/trips/charyn-canyon">Charyn Canyon</Link>
              <Link to="/trips/turkestan">Turkestan Silk Road</Link>
              <Link to="/trips/burabay">Burabay Lakes</Link>
            </div>
            <div>
              <h3 className="foot__h">Booking</h3>
              <Link to="/trust#promise">Refunds and cancellation</Link>
              <Link to="/trust#payments">Paying from India</Link>
              <Link to="/trust#privacy">Your data</Link>
              <Link to="/chat">Ask Tulpar</Link>
              <Link to="/about">About the project</Link>
              <Link to="/about#credits">Photo credits</Link>
            </div>
          </div>
          <p className="foot__fine">
            Prototype for Zerttex Hackathon 2026, Case 1. Prices are shown at National Bank of Kazakhstan rates of 25 Oct 2026. Sample reviews and bookings are illustrative. Photos: Wikimedia Commons contributors (see Photo credits).
          </p>
        </footer>
      )}
      <ChatWidget />
    </div>
  );
}
