import { LANGS, useLang, useT } from '../lib/i18n';
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
  const tx = useT();
  const { currency, setCurrency } = useStore();
  const opts: Currency[] = ['INR', 'USD', 'KZT'];
  return (
    <div className="cur" role="radiogroup" aria-label={tx("Currency")}>
      {opts.map((c) => (
        <button key={c} type="button" role="radio" aria-label={c} aria-checked={currency === c} className={currency === c ? 'is-on' : ''} onClick={() => setCurrency(c)}>
          <span className="cur__long">{c === 'INR' ? '₹ INR' : c === 'USD' ? '$ USD' : '₸ KZT'}</span>
          <span className="cur__short" aria-hidden="true">{c === 'INR' ? '₹' : c === 'USD' ? '$' : '₸'}</span>
        </button>
      ))}
    </div>
  );
}

function LangSwitch() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="cur lang" role="radiogroup" aria-label={t('Language')}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          role="radio"
          lang={l.id}
          aria-label={l.name}
          title={l.name}
          aria-checked={lang === l.id}
          className={lang === l.id ? 'is-on' : ''}
          onClick={() => void setLang(l.id)}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const tx = useT();
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
      <div className="demo-bar">{tx("Hackathon prototype by team РыбаЕж.")}{' '}{company.name}{' '}{tx("is the fictional company from the Zerttex 2026 case; payments and data here are simulated.")}</div>
      <header className="nav">
        <Link to="/" className="brand" aria-label={tx("Saryarqa Go home")}>
          <Shanyrak />
          <span className="brand__name">{tx("Saryarqa")}{' '}<b>{tx("Go")}</b>
          </span>
        </Link>
        <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label={tx("Main")}>
          <NavLink to="/" end>{tx("Trips")}</NavLink>
          <NavLink to="/trust">{tx("Why trust us")}</NavLink>
          <NavLink to="/chat">{tx("Chat with Tulpar")}</NavLink>
          <NavLink to="/operator">{tx("For the team")}</NavLink>
          <NavLink to="/about">{tx("About the project")}</NavLink>
        </nav>
        <div className="nav__right">
          <LangSwitch />
          {!isOperator && <CurrencySwitch />}
          <button type="button" className="btn btn--primary btn--sm nav__cta" onClick={() => setChatOpen(true)}>{tx("Plan my trip")}</button>
          <button type="button" className="icon-btn nav__burger" aria-label={open ? tx('Close menu') : tx('Open menu')} aria-expanded={open} onClick={() => setOpen(!open)}>
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
              <strong>{tx("Saryarqa Go")}</strong>
              <p>{tx("The booking assistant of")}{' '}{company.name}{tx(", Astana. Guided trips since")}{' '}{company.founded}.
              </p>
            </div>
          </div>
          <div className="foot__cols">
            <div>
              <h3 className="foot__h">{tx("Trips")}</h3>
              <Link to="/trips/kolsai-kaindy">{tx("Kolsai & Kaindy Lakes")}</Link>
              <Link to="/trips/charyn-canyon">{tx("Charyn Canyon")}</Link>
              <Link to="/trips/turkestan">{tx("Turkestan Silk Road")}</Link>
              <Link to="/trips/burabay">{tx("Burabay Lakes")}</Link>
            </div>
            <div>
              <h3 className="foot__h">{tx("Booking")}</h3>
              <Link to="/trust#promise">{tx("Refunds and cancellation")}</Link>
              <Link to="/trust#payments">{tx("Paying from India")}</Link>
              <Link to="/trust#privacy">{tx("Your data")}</Link>
              <Link to="/chat">{tx("Ask Tulpar")}</Link>
              <Link to="/about">{tx("About the project")}</Link>
              <Link to="/about#credits">{tx("Photo credits")}</Link>
            </div>
          </div>
          <p className="foot__fine">{tx("Prototype for Zerttex Hackathon 2026, Case 1. Prices are shown at National Bank of Kazakhstan rates of 25 Oct 2026. Sample reviews and bookings are illustrative. Photos: Wikimedia Commons contributors (see Photo credits).")}</p>
        </footer>
      )}
      <ChatWidget />
    </div>
  );
}
