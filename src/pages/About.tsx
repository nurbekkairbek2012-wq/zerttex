import { useT } from '../lib/i18n';
import { Link } from 'react-router-dom';
import { OrnamentBand } from '../components/Art';
import { CountUp, Reveal, SplitText } from '../components/Motion';
import { Photo } from '../components/Photo';
import { commonsPage, photos, type PhotoId } from '../lib/photos';
import { motion } from 'framer-motion';

// One page for the jury: how this prototype answers Case 1, with the numbers from the report.
const problems = [
  { said: '“It is unclear how to book.”', fix: 'Tulpar books inside the chat: question, price card, payment link, Trip Pass.', to: '/chat', cta: 'Try the chat' },
  { said: '“I do not know what is included.”', fix: 'Clear-Price Trip Card: every inclusion, food choice and one total in rupees.', to: '/trips/kolsai-kaindy', cta: 'Open a trip' },
  { said: '“My foreign card does not work.”', fix: 'Hosted bank payment with 3-D Secure, Apple Pay, Google Pay, deposit or split, plus a tip for Indian cards.', to: '/book/charyn-canyon?people=2&meal=veg&mode=deposit', cta: 'See checkout' },
  { said: '“I am not sure the company is trustworthy.”', fix: 'Verified company page, guide video intros, verified reviews, refund promise, live trip link for family.', to: '/trust', cta: 'See trust page' },
];

const numbers: [number, string, string, string, number?][] = [
  [146000, '', '', 'Indian tourists in Kazakhstan in 2024, +87% vs 2023 (Kazakh Tourism)'],
  [86, '', '%', 'of online adults in India message a business every week (Kantar for Meta)'],
  [19.9, '', ' M ₸', 'MVP and first-year launch cost, inside the 20 M ₸ budget', 1],
  [22, 'Month ', '', 'payback in the base case; month 34 if results are 30% worse'],
  [30.8, '', '%', 'foreign share of travelers in month 24 (goal: 30%)', 1],
  [50, '', ' / 50', 'test questions answered correctly by the demo engine; 16 / 20 on unseen questions'],
];

const weeks = [
  ['1–2', 'Interviews, wireframes, bank and Meta applications'],
  ['3–4', 'Booking core: trips, seats, 3 currencies, admin'],
  ['5–6', 'Payments, deposit and split links, Trip Pass'],
  ['7–8', 'Tulpar on WhatsApp with Gemini, handoff inbox'],
  ['9–10', 'Trust layer, security and privacy review'],
  ['11–12', 'Beta with 30 Indian students, pilot ads in India'],
];

export default function About() {
  const tx = useT();
  return (
    <div className="about">
      <section className="section narrow">
        <SplitText key={tx('About this prototype')} text={tx('About this prototype')} />
        <p className="lead">{tx("Saryarqa Go is team РыбаЕж’s answer to Zerttex Hackathon 2026, Case 1: help Saryarqa Routes, a small Astana tour company, reach 30% foreign travelers in 24 months. We chose young travelers from India and built the booking experience around the chat they already use.")}</p>
      </section>

      <section className="section narrow">
        <h2>{tx("Four complaints, four fixes")}</h2>
        <div className="fixes">
          {problems.map((p) => (
            <motion.div key={p.said} className="fix" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -6 }}>
              <p className="fix__said">{tx(p.said)}</p>
              <p>{tx(p.fix)}</p>
              <Link to={p.to} className="btn btn--ghost btn--sm">
                {tx(p.cta)}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section about-numbers">
        <OrnamentBand className="trust-strip__band" color="#F4B400" />
        <div className="trust-strip__inner">
          <h2>{tx("The case in six numbers")}</h2>
          <dl className="numbers">
            {numbers.map(([n, pre, suf, l, dec]) => (
              <div key={l}>
                <dt>
                  <CountUp to={n} prefix={pre ? tx(pre) : pre} suffix={suf} decimals={dec ?? 0} />
                </dt>
                <dd>{tx(l)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section narrow">
        <h2>{tx("The 12-week MVP")}</h2>
        <ol className="weeks">
          {weeks.map(([w, t]) => (
            <li key={w}>
              <span>{tx("Weeks")}{' '}{w}</span>
              <p>{tx(t)}</p>
            </li>
          ))}
        </ol>
        <p className="muted">{tx("This prototype already covers the MVP scope with simulated payments. The chat runs on a rule-based demo engine and switches to Google Gemini when a GEMINI_API_KEY is set on the server (the key never reaches the browser). Saryarqa Routes is the fictional company from the case; reviews, licence and dashboard figures here are sample data.")}</p>
      </section>

      <section className="section narrow">
        <h2>{tx("Team РыбаЕж")}</h2>
        <p>{tx("Kaiyrbek Nurbek, Zhomart Yerkainar, Kozhakhmet Aldiyar, Alexey Abdunnur. Astana, October 2026.")}</p>
        <div className="hero__cta">
          <Link to="/chat" className="btn btn--primary">{tx("Book a trip in the chat")}</Link>
          <Link to="/operator" className="btn btn--ghost">{tx("Open the team dashboard")}</Link>
        </div>
      </section>
      <section className="section narrow" id="credits">
        <Reveal>
          <h2>{tx("Photo credits")}</h2>
          <p className="muted">{tx("All photos are real and come from Wikimedia Commons under free licences. Thank you to the photographers.")}</p>
          <ul className="credits">
            {(Object.keys(photos) as PhotoId[]).map((id) => (
              <li key={id}>
                <Photo id={id} width={500} sizes="72px" />
                <span>
                  <b>{tx(photos[id].place)}</b>: {tx(photos[id].alt)}. {photos[id].author}, {photos[id].license}.{' '}
                  <a href={commonsPage(id)} target="_blank" rel="noreferrer">{tx("Source")}</a>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </div>
  );
}
