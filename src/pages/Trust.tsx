import { useT } from '../lib/i18n';
import { BadgeCheck, CreditCard, Database, RefreshCcw, Star } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Reveal } from '../components/Motion';
import { Photo } from '../components/Photo';
import { coverOf } from '../lib/photos';
import { company, guides, policies, trips } from '../lib/kb';

export default function Trust() {
  const tx = useT();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash]);

  return (
    <div className="trust">
      <section className="section narrow">
        <h1>{tx("Why you can trust")}{' '}{company.name}</h1>
        <p className="lead">{tx("A small company you have never heard of should prove itself before you pay. Here is everything we show every traveler, in one place.")}</p>
      </section>

      <Reveal className="section narrow trust-sec" id="company">
        <BadgeCheck className="trust-sec__icon" aria-hidden="true" />
        <div>
          <h2>{tx("The company")}</h2>
          <dl className="kv">
            <div>
              <dt>{tx("Registered in")}</dt>
              <dd>{tx("Astana, Kazakhstan, since")}{' '}{company.founded}</dd>
            </div>
            <div>
              <dt>{tx("Team")}</dt>
              <dd>
                {company.staff}{' '}{tx("staff and about")}{' '}{company.guides}{' '}{tx("local guides")}</dd>
            </div>
            <div>
              <dt>{tx("Travelers in 2025")}</dt>
              <dd>{company.travelers2025.toLocaleString('en-US')}</dd>
            </div>
            <div>
              <dt>{tx("Licence")}</dt>
              <dd>{tx(company.licence)}</dd>
            </div>
            <div>
              <dt>{tx("Insurance")}</dt>
              <dd>{tx(company.insurance)}</dd>
            </div>
          </dl>
        </div>
      </Reveal>

      <Reveal className="section narrow trust-sec" id="promise">
        <RefreshCcw className="trust-sec__icon" aria-hidden="true" />
        <div>
          <h2>{tx("Saryarqa Promise")}</h2>
          <ul className="plain">
            <li>{policies.cancellation}</li>
            <li>{policies.weather}</li>
            <li>{policies.promise}</li>
            <li>{policies.deposit}</li>
          </ul>
        </div>
      </Reveal>

      <Reveal className="section narrow trust-sec" id="payments">
        <CreditCard className="trust-sec__icon" aria-hidden="true" />
        <div>
          <h2>{tx("Paying from India")}</h2>
          <ul className="plain">
            <li>{policies.payments}</li>
            <li>{tx("Every card payment is confirmed by your own bank with 3-D Secure (a one-time code), so nobody can use your card without you.")}</li>
            <li>{tx("Payments are processed by a licensed Kazakhstan acquiring bank on a hosted, PCI DSS compliant page. Saryarqa Routes never sees or stores your card number.")}</li>
            <li>{tx("No dynamic currency conversion and no card fee from us. The rupee price is an estimate at the National Bank of Kazakhstan rate.")}</li>
            <li>{policies.indianCards}</li>
          </ul>
        </div>
      </Reveal>

      <Reveal className="section narrow trust-sec" id="privacy">
        <Database className="trust-sec__icon" aria-hidden="true" />
        <div>
          <h2>{tx("Your data")}</h2>
          <ul className="plain">
            <li>{policies.privacy}</li>
            <li>{tx("Booking data is stored on servers in Kazakhstan, as the Law of the Republic of Kazakhstan on Personal Data and Their Protection requires.")}</li>
            <li>{tx("We ask for consent before we save anything, use it only for your trip, and delete it on request. This also follows India’s Digital Personal Data Protection Act, 2023.")}</li>
            <li>{tx("Passport details are requested only after payment, for the hotel’s legal guest registration (eQonaq).")}</li>
            <li>{tx("Chats with Tulpar are used to answer you and to improve answers; they are never sold or used for ads.")}</li>
          </ul>
        </div>
      </Reveal>

      <Reveal className="section narrow trust-sec" id="reviews">
        <Star className="trust-sec__icon" aria-hidden="true" />
        <div>
          <h2>{tx("Reviews you can believe")}</h2>
          <p>{tx("Only travelers with a completed Trip Pass can leave a review, one per booking. We publish every review, including bad ones, and reply to each. Reviews are also mirrored to Google Maps and Tripadvisor so you can compare.")}</p>
        </div>
      </Reveal>

      <section className="section" id="guides">
        <div className="section__head">
          <h2>{tx("Meet the guides")}</h2>
          <p>{tx("Each guide’s ID, first-aid certificate and language level are checked before they lead a group.")}</p>
        </div>
        <div className="guides">
          {Object.entries(guides).map(([gid, g]) => {
            const t = trips.find((x) => x.guide === gid)!;
            return (
              <motion.article key={gid} className="guide-card" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -6 }}>
                <Photo id={coverOf(t.id)} width={500} sizes="140px" className="guide-card__art" />
                <div>
                  <h3>{g.name}</h3>
                  <p className="muted">
                    {g.years}{' '}{tx("years,")}{' '}{g.trips}{' '}{tx("trips.")}{' '}{g.langs}.
                  </p>
                  <p>{g.bio}</p>
                  <span className="verified">{tx("Verified guide")}</span>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
