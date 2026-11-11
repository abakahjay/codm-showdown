import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { api, cedis, formatDate } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useCountdown, useEvent, usePolling, useReveal } from "../lib/hooks.js";
import Footer from "../components/Footer.jsx";
import Bracket, { UpNext } from "../components/Bracket.jsx";
import WhatsAppJoin from "../components/WhatsAppJoin.jsx";
import heroPhone from "../assets/photos/hero_phone.jpg";
import arena from "../assets/photos/arena_crowd.jpg";
import pcGamer from "../assets/photos/pc_gamer.jpg";
import "./home.css";

const tel = (n) => `tel:+233${n.slice(1)}`;
const pretty = (n) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
const pad = (n) => String(n).padStart(2, "0");

export function useBracket() {
  const [bracket, setBracket] = useState(undefined);
  const load = useCallback(() => api("/bracket", { auth: false })
    .then((d) => setBracket(d.bracket))
    .catch(() => setBracket((b) => (b === undefined ? null : b))), []);
  usePolling(load, 30000);
  return bracket;
}

function Countdown({ iso }) {
  const c = useCountdown(iso);
  if (c.done) return <p className="cd-closed">Registration closed</p>;
  return (
    <div className="cd" role="timer" aria-label={`${c.days} days ${c.hours} hours ${c.minutes} minutes left`}>
      {[["Days", c.days], ["Hrs", c.hours], ["Min", c.minutes], ["Sec", c.seconds]].map(([label, v]) => (
        <div key={label} className="cd-cell"><b>{pad(v)}</b><span>{label}</span></div>
      ))}
    </div>
  );
}

function Hero({ event }) {
  const { player } = useAuth();
  const day = formatDate(event.startsAt, { weekday: "short", day: "numeric", month: "short" });
  const time = formatDate(event.startsAt, { hour: "numeric", minute: "2-digit", hour12: true });
  const taken = event.teamsRegistered;
  const pct = Math.min(100, Math.round((taken / event.maxTeams) * 100));
  return (
    <section className="h-hero" id="top" aria-labelledby="hero-title">
      <img className="h-hero__bg" src={heroPhone} alt="" width="1800" height="1183" fetchpriority="high" />
      <div className="h-hero__scrim" />
      <div className="h-hero__inner">
        <div className="h-hero__copy">
          <p className="h-kicker"><span className="dot" /> Registration open · UMaT, Tarkwa</p>
          <h1 id="hero-title" className="h-title">
            <span>CODM</span>
            <span>Campus</span>
            <span className="accent">Showdown</span>
          </h1>
          <p className="h-lede">The Call of Duty: Mobile 5v5 tournament for UMaT. Build your squad of five, pay {cedis(event.entryFeeGhs)} each, and fight through the bracket for <strong>{cedis(event.prizeGhs)} cash</strong>.</p>
          <div className="h-ctas">
            <Link className="btn btn--lg" to={player ? "/dashboard" : "/register"}>{player ? "Go to my team" : `Register · ${cedis(event.entryFeeGhs)}`}</Link>
            <a className="btn btn--ghost btn--lg" href={event.contacts.whatsappGroup} target="_blank" rel="noopener noreferrer">Join the WhatsApp group</a>
          </div>
          <dl className="h-facts">
            <div><dt>Date</dt><dd>{day}</dd></div>
            <div><dt>Kick-off</dt><dd>{time}</dd></div>
            <div><dt>Mode</dt><dd>5v5 MP</dd></div>
            <div><dt>Entry</dt><dd>{cedis(event.entryFeeGhs)}</dd></div>
          </dl>
        </div>

        <aside className="h-card hud" aria-label="Prize and registration status">
          <p className="h-card__label">Winner takes</p>
          <p className="h-card__prize">{cedis(event.prizeGhs)}</p>
          <p className="h-card__sub">Cash to the champion squad</p>
          <div className="h-card__rule" />
          <p className="h-card__label">Registration closes in</p>
          <Countdown iso={event.registrationClosesAt} />
          <div className="slots-bar" aria-label={`${taken} of ${event.maxTeams} team slots taken`}>
            <div className="slots-bar__fill" style={{ width: `${Math.max(pct, 3)}%` }} />
          </div>
          <p className="h-card__slots"><b>{event.teamSlotsLeft}</b> of {event.maxTeams} team slots left · {event.confirmedTeams} confirmed</p>
        </aside>
      </div>
    </section>
  );
}

function Ticker({ event }) {
  const items = ["5v5 Multiplayer", `${cedis(event.prizeGhs)} cash prize`, `${cedis(event.entryFeeGhs)} per player`, "Phones, tablets & controllers allowed", `${event.maxTeams} team slots`, "UMaT · Tarkwa", "Single elimination"];
  const row = [...items, ...items];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">{row.map((t, i) => <span key={i}>{t}<i>✦</i></span>)}</div>
    </div>
  );
}

function Steps({ event }) {
  const ref = useReveal();
  const steps = [
    ["Create your account", "Name, phone, in-game name and CODM UID. Takes under a minute."],
    [`Pay ${cedis(event.entryFeeGhs)}`, "MoMo or card through Paystack. Paying is what registers you."],
    ["Squad up", "The captain creates the team and shares a 6-letter invite code with four paid friends."],
    ["Drop in", "Five paid players = confirmed. The draw puts you in the knockout bracket."],
  ];
  return (
    <section className="h-sec" ref={ref} aria-labelledby="steps-title">
      <div className="h-sec__head">
        <h2 id="steps-title" className="rise">Four steps to the lobby</h2>
        <p className="rise" style={{ "--i": 1 }}>Registration is done on your phone in about five minutes.</p>
      </div>
      <ol className="steps4">
        {steps.map(([t, d], i) => (
          <li key={t} className="step hud rise" style={{ "--i": i + 1 }}>
            <span className="step__n">0{i + 1}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PrizeFormat({ event }) {
  const ref = useReveal();
  return (
    <section className="h-split" ref={ref} aria-labelledby="format-title">
      <figure className="h-split__media">
        <img src={arena} alt="An audience watching a live esports match on a big screen" width="1600" height="900" loading="lazy" />
        <figcaption>Match day · Saturday {formatDate(event.startsAt, { day: "numeric", month: "long" })}</figcaption>
      </figure>
      <div className="h-split__copy">
        <h2 id="format-title" className="rise">Winner takes {cedis(event.prizeGhs)}</h2>
        <p className="rise" style={{ "--i": 1 }}>One knockout bracket, drawn at random when registration closes. Win and you move on, lose and you're out, until one squad is left standing.</p>
        <ul className="checks rise" style={{ "--i": 2 }}>
          <li><b>Multiplayer 5v5</b> squads of five</li>
          <li><b>Single elimination</b> with byes if needed</li>
          <li><b>Phone or tablet</b>, Bluetooth controllers allowed</li>
          <li><b>No emulators, PCs or hacks</b>: instant disqualification</li>
          <li><b>{formatDate(event.startsAt, { hour: "numeric", minute: "2-digit", hour12: true })} kick-off</b>, arrive 30 min early</li>
        </ul>
        <Link className="link rise" style={{ "--i": 3 }} to="/terms">Read the full rules</Link>
      </div>
    </section>
  );
}

function Slots({ team, size }) {
  return (
    <div className="pips" aria-label={`${team.memberCount} of ${size} players`}>
      {Array.from({ length: size }, (_, i) => <span key={i} className={`pip${i < team.memberCount ? " pip--on" : ""}`} />)}
    </div>
  );
}

function Teams({ event }) {
  const ref = useReveal();
  const [teams, setTeams] = useState(null);
  const [error, setError] = useState(false);
  const load = useCallback(() => api("/teams", { auth: false })
    .then((d) => { setTeams(d.teams); setError(false); })
    .catch(() => setError(true)), []);
  usePolling(load, 45000);
  const size = event.teamSize;
  return (
    <section className="h-sec h-sec--panel" id="teams" ref={ref} aria-labelledby="teams-title">
      <div className="h-sec__head h-sec__head--row">
        <div>
          <h2 id="teams-title" className="rise">The squads</h2>
          <p className="rise" style={{ "--i": 1 }}>Live from registration. A squad is confirmed when all five players have paid.</p>
        </div>
        <div className="stat-pair rise" style={{ "--i": 2 }}>
          <div><b>{event.teamsRegistered}</b><span>registered</span></div>
          <div><b>{event.confirmedTeams}</b><span>confirmed</span></div>
          <div><b>{event.teamSlotsLeft}</b><span>slots left</span></div>
        </div>
      </div>
      {teams === null && !error && <p className="muted">Loading squads…</p>}
      {error && teams === null && <p className="muted">The board is offline for a moment. Registration still works.</p>}
      {teams && teams.length === 0 && (
        <div className="empty hud">
          <h3>No squads yet</h3>
          <p>Be the first team on the board.</p>
          <Link className="btn" to="/register">Register your squad</Link>
        </div>
      )}
      {teams && teams.length > 0 && (
        <ul className="squads">
          {teams.map((t) => (
            <li key={t.id} className={`squad hud${t.confirmed ? " squad--ok" : ""}`}>
              <div className="squad__top">
                <h3>{t.name}{t.tag && <small>[{t.tag}]</small>}</h3>
                <span className={`badge${t.confirmed ? " badge--ok" : ""}`}>{t.confirmed ? "Confirmed" : `${t.spotsLeft} open`}</span>
              </div>
              <Slots team={t} size={size} />
              <p className="squad__players">{t.players.join(" · ")}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BracketSection({ event }) {
  const ref = useReveal();
  const bracket = useBracket();
  return (
    <section className="h-sec" id="bracket" ref={ref} aria-labelledby="bracket-title">
      <div className="h-sec__head">
        <h2 id="bracket-title" className="rise">{bracket?.champion ? `${bracket.champion.name} are champions` : "The knockout"}</h2>
        <p className="rise" style={{ "--i": 1 }}>
          {bracket ? "Who plays next, and every result as it comes in." : `The draw happens when registration closes. Every confirmed squad goes into one bracket, and the last team standing takes ${cedis(event.prizeGhs)}.`}
        </p>
      </div>
      {bracket && bracket.upNext.length > 0 && (<><h3 className="mini-head">Up next</h3><UpNext bracket={bracket} /></>)}
      {bracket && <div style={{ marginTop: 32 }}><Bracket bracket={bracket} /></div>}
      {bracket === null && (
        <div className="bracket-ghost" aria-hidden="true">
          {[8, 4, 2, 1].map((n, r) => (
            <div key={r} className="bg-col">{Array.from({ length: n }, (_, i) => <div key={i} className="bg-match"><span /><span /></div>)}</div>
          ))}
        </div>
      )}
      {bracket && <p style={{ marginTop: 24 }}><Link className="link" to="/bracket">Open the full bracket</Link></p>}
    </section>
  );
}

function Entry({ event }) {
  const ref = useReveal();
  const { player } = useAuth();
  const day = formatDate(event.startsAt, { weekday: "long", day: "numeric", month: "long" });
  return (
    <section className="h-sec" id="entry" ref={ref} aria-labelledby="entry-title">
      <div className="h-sec__head">
        <h2 id="entry-title" className="rise">Your entry ticket</h2>
        <p className="rise" style={{ "--i": 1 }}>One payment, one player, one slot. No subscription, no hidden fees.</p>
      </div>
      <div className="ticket-wrap rise" style={{ "--i": 2 }}>
        <div className="ticket">
          <div className="ticket__main">
            <h3>One player,<br />one slot</h3>
            <div className="ticket__lines">
              <span>{day}, 5:00 PM</span>
              <span>{event.venue}</span>
              <span>MoMo or card via Paystack</span>
              <span>Paying registers you</span>
            </div>
          </div>
          <span className="ticket__perf" aria-hidden="true" />
          <div className="ticket__stub">
            <div>
              <p className="price">{cedis(event.entryFeeGhs)}</p>
              <p className="per">per player</p>
            </div>
            <Link className="btn btn--ink btn--block" to={player ? "/dashboard" : "/register"}>{player ? (player.paid ? "You're registered" : "Pay now") : "Register"}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Who can play?", "UMaT students aged 16+ with their own Call of Duty: Mobile account. Bring your student ID on the day."],
  ["What devices are allowed?", "Phones and tablets. A Bluetooth controller paired to your device is fine. Emulators and PCs are not allowed."],
  ["How do I pay, and is it safe?", "Through Paystack, Ghana's licensed payment provider: MTN MoMo, Telecel Cash, AirtelTigo Money or card. We never see your PIN or card number."],
  ["Can someone else pay for me?", "Yes. You pay from your own account, but any MoMo number or card can be used on the Paystack page."],
  ["What if a teammate drops out?", "The captain removes them and shares the invite code with a replacement. Your payment stays with you if you switch teams. Teams lock when the bracket is drawn."],
  ["How does the bracket work?", "When registration closes, every confirmed squad is drawn at random into one single-elimination bracket. If the number of teams isn't a power of two, some get a bye into round two. Results update live on this site."],
  ["Refunds", "Not refunded once fixtures are published. If the event is cancelled, everyone is refunded in full."],
];

function Faq() {
  return (
    <section className="h-sec" id="faq" aria-labelledby="faq-title">
      <div className="h-sec__head">
        <h2 id="faq-title">Questions</h2>
        <p>Still stuck? Call an organiser or ask in the WhatsApp group.</p>
      </div>
      <div className="faq">
        {FAQ.map(([q, a], i) => (
          <details key={q} className="faq__item" open={i === 0}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ event }) {
  const { player } = useAuth();
  const c = event.contacts;
  return (
    <section className="h-final" aria-labelledby="final-title">
      <img className="h-final__bg" src={pcGamer} alt="" width="1400" height="933" loading="lazy" />
      <div className="h-final__scrim" />
      <div className="h-final__inner">
        <div>
          <h2 id="final-title">Your squad. {cedis(event.prizeGhs)}. One night.</h2>
          <p>Slots are limited to {event.maxTeams} teams. Register now and lock yours in.</p>
          <div className="h-ctas">
            <Link className="btn btn--lg" to={player ? "/dashboard" : "/register"}>{player ? "Go to my team" : "Register now"}</Link>
          </div>
          <ul className="contacts">
            <li><span>Organiser</span><a href={tel(c.organiser[0])}>{pretty(c.organiser[0])}</a></li>
            <li><span>Organiser</span><a href={tel(c.organiser[1])}>{pretty(c.organiser[1])}</a></li>
            <li><span>Group moderator</span><a href={tel(c.moderator)}>{pretty(c.moderator)}</a></li>
          </ul>
        </div>
        <div className="h-final__wa hud"><WhatsAppJoin url={c.whatsappGroup} compact /></div>
      </div>
    </section>
  );
}

export default function Home() {
  const { event } = useEvent();
  return (
    <main className="home">
      <Hero event={event} />
      <Ticker event={event} />
      <Steps event={event} />
      <PrizeFormat event={event} />
      <Teams event={event} />
      <BracketSection event={event} />
      <Entry event={event} />
      <Faq />
      <FinalCta event={event} />
      <Footer event={event} />
    </main>
  );
}
