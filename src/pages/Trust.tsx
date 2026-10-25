import { BadgeCheck, CreditCard, Database, RefreshCcw, Star } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TripArt } from '../components/Art';
import { company, guides, policies, trips } from '../lib/kb';

export default function Trust() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash]);

  return (
    <div className="trust">
      <section className="section narrow">
        <h1>Why you can trust {company.name}</h1>
        <p className="lead">
          A small company you have never heard of should prove itself before you pay. Here is everything we show every traveler, in one place.
        </p>
      </section>

      <section className="section narrow trust-sec" id="company">
        <BadgeCheck className="trust-sec__icon" aria-hidden="true" />
        <div>
          <h2>The company</h2>
          <dl className="kv">
            <div>
              <dt>Registered in</dt>
              <dd>Astana, Kazakhstan, since {company.founded}</dd>
            </div>
            <div>
              <dt>Team</dt>
              <dd>
                {company.staff} staff and about {company.guides} local guides
              </dd>
            </div>
            <div>
              <dt>Travelers in 2025</dt>
              <dd>{company.travelers2025.toLocaleString('en-US')}</dd>
            </div>
            <div>
              <dt>Licence</dt>
              <dd>{company.licence}</dd>
            </div>
            <div>
              <dt>Insurance</dt>
              <dd>{company.insurance}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section narrow trust-sec" id="promise">
        <RefreshCcw className="trust-sec__icon" aria-hidden="true" />
        <div>
          <h2>Saryarqa Promise</h2>
          <ul className="plain">
            <li>{policies.cancellation}</li>
            <li>{policies.weather}</li>
            <li>{policies.promise}</li>
            <li>{policies.deposit}</li>
          </ul>
        </div>
      </section>

      <section className="section narrow trust-sec" id="payments">
        <CreditCard className="trust-sec__icon" aria-hidden="true" />
        <div>
          <h2>Paying from India</h2>
          <ul className="plain">
            <li>{policies.payments}</li>
            <li>Every card payment is confirmed by your own bank with 3-D Secure (a one-time code), so nobody can use your card without you.</li>
            <li>Payments are processed by a licensed Kazakhstan acquiring bank on a hosted, PCI DSS compliant page. Saryarqa Routes never sees or stores your card number.</li>
            <li>No dynamic currency conversion and no card fee from us. The rupee price is an estimate at the National Bank of Kazakhstan rate.</li>
            <li>{policies.indianCards}</li>
          </ul>
        </div>
      </section>

      <section className="section narrow trust-sec" id="privacy">
        <Database className="trust-sec__icon" aria-hidden="true" />
        <div>
          <h2>Your data</h2>
          <ul className="plain">
            <li>{policies.privacy}</li>
            <li>Booking data is stored on servers in Kazakhstan, as the Law of the Republic of Kazakhstan on Personal Data and Their Protection requires.</li>
            <li>We ask for consent before we save anything, use it only for your trip, and delete it on request. This also follows India’s Digital Personal Data Protection Act, 2023.</li>
            <li>Passport details are requested only after payment, for the hotel’s legal guest registration (eQonaq).</li>
            <li>Chats with Tulpar are used to answer you and to improve answers; they are never sold or used for ads.</li>
          </ul>
        </div>
      </section>

      <section className="section narrow trust-sec" id="reviews">
        <Star className="trust-sec__icon" aria-hidden="true" />
        <div>
          <h2>Reviews you can believe</h2>
          <p>Only travelers with a completed Trip Pass can leave a review, one per booking. We publish every review, including bad ones, and reply to each. Reviews are also mirrored to Google Maps and Tripadvisor so you can compare.</p>
        </div>
      </section>

      <section className="section" id="guides">
        <div className="section__head">
          <h2>Meet the guides</h2>
          <p>Each guide’s ID, first-aid certificate and language level are checked before they lead a group.</p>
        </div>
        <div className="guides">
          {Object.entries(guides).map(([gid, g]) => {
            const t = trips.find((x) => x.guide === gid)!;
            return (
              <article key={gid} className="guide-card">
                <TripArt scene={t.scene} className="guide-card__art" />
                <div>
                  <h3>{g.name}</h3>
                  <p className="muted">
                    {g.years} years, {g.trips} trips. {g.langs}.
                  </p>
                  <p>{g.bio}</p>
                  <span className="verified">Verified guide</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
