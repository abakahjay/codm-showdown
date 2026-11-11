import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { api, cedis, formatDate } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useCountdown, useEvent, usePolling, useReveal } from "../lib/hooks.js";
import Footer from "../components/Footer.jsx";
import Bracket, { UpNext } from "../components/Bracket.jsx";
import heroPhone from "../assets/photos/hero_phone.jpg";
import arena from "../assets/photos/arena_crowd.jpg";
import pcGamer from "../assets/photos/pc_gamer.jpg";
import flyer from "../assets/photos/flyer.jpg";
import WhatsAppJoin from "../components/WhatsAppJoin.jsx";

const tel = (n) => `tel:+233${n.slice(1)}`;
const pretty = (n) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;

function Hero({ event }) {
  const { player } = useAuth();
  const day = formatDate(event.startsAt, { weekday: "short", day: "numeric", month: "short" });
  const time = formatDate(event.startsAt, { hour: "numeric", minute: "2-digit", hour12: true });
  return (
    <section className="hero" data-chapter="dark" id="top" aria-labelledby="hero-title">
      <div className="hero__top" />
      <div className="hero__bottom" data-chapter="orange">
        <div className="hero__meta">
          <div className="fact"><b>{day}</b><span>{time} · {event.venue}</span></div>
          <div className="fact"><b>{cedis(event.prizeGhs)}</b><span>Cash to the winning team</span></div>
          <div className="fact"><b>{cedis(event.entryFeeGhs)}</b><span>Entry per player</span></div>
          <div className="fact"><b>5v5</b><span>{event.teamSlotsLeft} of {event.maxTeams} team slots left</span></div>
          <div className="hero__cta">
            <Link className="btn" to={player ? "/dashboard" : "/register"}>{player ? "Go to my team" : "Register your team"}</Link>
          </div>
          <p className="hero__lede">A Call of Duty: Mobile Multiplayer tournament for UMaT students. Register, build a squad of five, pay with MoMo and play for the cash.</p>
        </div>
      </div>
      <div className="hero__title">
        <h1 id="hero-title">
          <span className="sr-only">CODM 5v5 Showdown</span>
          <span className="ink ink--top" aria-hidden="true">CODM 5v5<br />Showdown</span>
          <span className="ink ink--bottom" aria-hidden="true">CODM 5v5<br />Showdown</span>
        </h1>
      </div>
    </section>
  );
}

function About({ event }) {
  const ref = useReveal();
  return (
    <section className="chapter chapter--sand" data-chapter="sand" ref={ref} aria-labelledby="about-title">
      <h2 id="about-title" className="rise">One evening, five-man squads</h2>
      <div className="statement rise" style={{ "--i": 1 }}>
        <p>
          The CODM Campus Showdown puts the best <span className="hl hl--ink">Call of Duty: Mobile</span> squads at UMaT
          against each other on <span className="hl hl--gold">Saturday 21 November at 5:00 PM</span>. Teams are five players,
          the mode is <span className="hl hl--paper">Multiplayer 5v5</span>, and matches are played on your own phone on the
          campus Wi-Fi or your data. Entry is <span className="hl hl--gold">{cedis(event.entryFeeGhs)} per player</span>, paid
          on this site with MoMo or card.
        </p>
        <p>
          Paying your GH₵50 is what registers you, and a team is confirmed once it has five paid players. Only {event.maxTeams} teams get a slot, so the captain
          should register early and share the invite code in the group chat. The winning squad takes
          <span className="hl hl--orange"> {cedis(event.prizeGhs)} in cash</span>.{" "}
          <a className="hl hl--ink link" href="#entry">Get your squad in.</a>
        </p>
      </div>
    </section>
  );
}

function PhotoChapter() {
  const ref = useReveal();
  return (
    <section className="photo-chapter" data-chapter="dark" ref={ref} aria-labelledby="phone-title">
      <figure>
        <img src={heroPhone} width="1800" height="1183" alt="A player holding a phone sideways, mid-match in a mobile shooter" loading="lazy" />
      </figure>
      <div className="copy">
        <h2 id="phone-title" className="rise">Phone or tablet</h2>
        <p className="rise" style={{ "--i": 1 }}>
          Play on your phone or tablet, with a controller paired to it if you like. No emulators or PCs.
          Arrive 30 minutes early, fully charged, with CODM updated and the in-game name you registered.
        </p>
      </div>
    </section>
  );
}

function Slots({ team, size }) {
  return (
    <div className="slots" aria-label={`${team.memberCount} of ${size} players joined, ${team.paidCount} paid`}>
      {Array.from({ length: size }, (_, i) => (
        <span key={i} className={`slot${i < team.paidCount ? " slot--paid" : i < team.memberCount ? " slot--joined" : ""}`} />
      ))}
    </div>
  );
}

function Countdown({ iso }) {
  const c = useCountdown(iso);
  if (c.done) return <span>Registration closed</span>;
  return <span>{c.days}d {c.hours}h {String(c.minutes).padStart(2, "0")}m {String(c.seconds).padStart(2, "0")}s</span>;
}

function TeamBoard({ event }) {
  const ref = useReveal();
  const [teams, setTeams] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => api("/teams", { auth: false })
    .then((d) => { setTeams(d.teams); setError(false); })
    .catch(() => setError(true)), []);
  usePolling(load, 45000); // the board refreshes itself while the tab is open

  const size = event.teamSize;
  return (
    <section className="chapter chapter--olive" id="teams" data-chapter="olive" ref={ref} aria-labelledby="teams-title">
      <div className="board-head">
        <h2 id="teams-title" className="rise">The teams so far</h2>
        <div className="board-stats rise" style={{ "--i": 1 }}>
          <div><b>{event.teamsRegistered}/{event.maxTeams}</b><span>Team slots taken</span></div>
          <div><b>{event.confirmedTeams}</b><span>Teams confirmed</span></div>
          <div><b><Countdown iso={event.registrationClosesAt} /></b><span>Until registration closes</span></div>
        </div>
      </div>
      <div className="legend rise" style={{ "--i": 2 }}>
        <span><i style={{ background: "var(--gold)" }} />Paid</span>
        <span><i style={{ background: "var(--sand)" }} />Joined, not paid</span>
        <span><i style={{ background: "var(--ink-2)" }} />Open slot</span>
      </div>
      {teams === null && !error && <div className="board-empty"><p className="board-empty__big">Loading…</p></div>}
      {error && teams === null && (
        <div className="board-empty"><p className="board-empty__big">Board offline</p><p>Refresh in a minute. Registration still works.</p></div>
      )}
      {teams && teams.length === 0 && (
        <div className="board-empty"><p className="board-empty__big">No teams yet</p><p>Yours could be first. <Link className="link" to="/register">Register and create your team</Link></p></div>
      )}
      {teams && teams.length > 0 && (
        <ol className="board" aria-label="Registered teams">
          {teams.map((t, i) => (
            <li key={t.id} className="team-row rise in" style={{ "--i": Math.min(i, 8) }}>
              <div>
                <h3>{t.name}{t.tag && <small>[{t.tag}]</small>}</h3>
                <p className="players">{t.players.join(" · ")}</p>
              </div>
              <Slots team={t} size={size} />
              <p className={`status${t.confirmed ? " status--ok" : ""}`}>
                {t.confirmed ? "Confirmed" : `${t.spotsLeft} spot${t.spotsLeft === 1 ? "" : "s"} open`}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function useBracket() {
  const [bracket, setBracket] = useState(undefined);
  const load = useCallback(() => api("/bracket", { auth: false })
    .then((d) => setBracket(d.bracket))
    .catch(() => setBracket((b) => (b === undefined ? null : b))), []);
  usePolling(load, 30000);
  return bracket;
}

function BracketChapter({ event }) {
  const ref = useReveal();
  const bracket = useBracket();
  return (
    <section className="chapter chapter--dark" id="bracket" data-chapter="dark" ref={ref} aria-labelledby="bracket-title">
      <div className="board-head">
        <h2 id="bracket-title" className="rise">{bracket?.champion ? "Champions" : "The knockout"}</h2>
        {bracket?.champion
          ? <p className="champion rise" style={{ "--i": 1 }}>{bracket.champion.name} take {cedis(event.prizeGhs)}</p>
          : <p className="rise muted" style={{ "--i": 1, maxWidth: "46ch" }}>
              {bracket ? "Single elimination: win and you move right, lose and you're out. The board updates as results come in." : `The draw happens when registration closes. Every confirmed team goes into one knockout bracket, drawn at random, and the winners play on until one squad takes ${cedis(event.prizeGhs)}.`}
            </p>}
      </div>
      {bracket && bracket.upNext.length > 0 && (<>
        <h3 className="sub-head rise" style={{ "--i": 2 }}>Up next</h3>
        <UpNext bracket={bracket} />
      </>)}
      {bracket && <div className="rise in" style={{ marginTop: 48 }}><Bracket bracket={bracket} /></div>}
      {bracket === null && (
        <div className="board-empty"><p className="board-empty__big">Draw pending</p><p>{event.confirmedTeams} team{event.confirmedTeams === 1 ? "" : "s"} confirmed so far. Fixtures appear here and in the WhatsApp group.</p></div>
      )}
      {bracket && <p style={{ marginTop: 32 }}><Link className="link" to="/bracket">Open the full bracket</Link></p>}
    </section>
  );
}

function HowItWorks() {
  const ref = useReveal();
  const steps = [
    ["Sign up", "Your name, phone, in-game name and CODM UID. Takes a minute."],
    ["Pay", "GH₵50 with MoMo or card. Paying is what registers you for the tournament."],
    ["Squad up", "The captain creates the team and gets a 6-letter invite code. Four paid friends join with it."],
    ["Play", "Five players and your team is confirmed. The knockout draw puts you in the bracket."],
  ];
  return (
    <section className="chapter chapter--gold" data-chapter="gold" ref={ref} aria-labelledby="how-title">
      <h2 id="how-title" className="rise">From sign-up to lobby</h2>
      <div className="steps">
        {steps.map(([title, text], i) => (
          <div key={title} className="rise" style={{ "--i": i + 1 }}>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Ticket({ event }) {
  const ref = useReveal();
  const { player } = useAuth();
  const day = formatDate(event.startsAt, { weekday: "long", day: "numeric", month: "long" });
  return (
    <section className="chapter chapter--dark" id="entry" data-chapter="dark" ref={ref} aria-labelledby="entry-title">
      <h2 id="entry-title" className="rise">Your entry ticket</h2>
      <div className="ticket-wrap rise" style={{ "--i": 1 }}>
        <div className="ticket">
          <div className="ticket__main">
            <h3>One player,<br />one slot</h3>
            <div className="ticket__lines">
              <span>{day}, 5:00 PM</span>
              <span>{event.venue}</span>
              <span>Pay with MoMo or card</span>
              <span>Paying registers you; then join a team</span>
            </div>
          </div>
          <span className="ticket__perf" aria-hidden="true" />
          <div className="ticket__stub">
            <div>
              <p className="price">{cedis(event.entryFeeGhs)}</p>
              <p className="per">per player</p>
            </div>
            <Link className="btn btn--ink btn--block" to={player ? "/dashboard" : "/register"}>{player ? (player.paid ? "You're paid" : "Pay now") : "Register"}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Who can play?", ["UMaT students with their own Call of Duty: Mobile account. Bring your student ID on the day; the organisers may check it."]],
  ["What is the format?", ["Multiplayer 5v5 in squads of five, single elimination. When registration closes, every confirmed team is drawn at random into one knockout bracket, shown live on this site with who plays next. If the number of teams isn't a power of two, some teams get a bye into round two."]],
  ["How do I pay, and is it safe?", ["Payment runs through Paystack, Ghana's licensed payment provider. You choose MTN MoMo, Telecel Cash, AirtelTigo Money or a card on Paystack's own page; we never see your PIN or card number. Your slot turns gold the moment Paystack confirms it."]],
  ["Can someone else pay for me?", ["Yes. Each player pays for their own slot from their own account, but on the Paystack page any MoMo number or card can be used, so a friend or parent can pay for you."]],
  ["What if a teammate drops out?", ["The captain removes them and shares the invite code with a replacement. If you have already paid and leave a team, your payment stays with you and you can join another team."]],
  ["Refunds", ["Entry fees are not refunded once fixtures are published. If the event is cancelled, every paid player is refunded in full to the account they paid with."]],
  ["Rules on the day", ["Phones and tablets only, and a Bluetooth controller paired to your device is allowed. No hacks, no emulators or PCs, no account sharing. Arrive 30 minutes early. A team that is not in its lobby 10 minutes after its match time forfeits that match. The organisers' decision on disputes is final."]],
];

function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title">
      <div className="faq-head" data-chapter="orange"><h2 id="faq-title">Rules and questions</h2></div>
      {FAQ.map(([q, a]) => (
        <div className="band" key={q} data-chapter="paper">
          <h3>{q}</h3>
          <div>{a.map((p) => <p key={p}>{p}</p>)}</div>
        </div>
      ))}
    </section>
  );
}

function Contact({ event }) {
  const ref = useReveal();
  const c = event.contacts;
  const pics = [arena, pcGamer, heroPhone, flyer];
  return (
    <section className="chapter chapter--orange" data-chapter="orange" ref={ref} aria-labelledby="contact-title">
      <div className="strip-viewport" aria-hidden="true">
        <div className="strip">
          {[...pics, ...pics, ...pics, ...pics].map((src, i) => <img key={i} src={src} alt="" width="260" height="170" decoding="async" />)}
        </div>
      </div>
      <div className="contact-grid">
        <div>
          <h2 id="contact-title" className="rise">Questions? Call us</h2>
          <div className="contact-cells rise" style={{ "--i": 1 }}>
            <a className="cell" href={tel(c.organiser[0])}><b>{pretty(c.organiser[0])}</b><span>Organiser</span></a>
            <a className="cell" href={tel(c.organiser[1])}><b>{pretty(c.organiser[1])}</b><span>Organiser</span></a>
            <a className="cell cell--inverse" href={tel(c.moderator)}><b>{pretty(c.moderator)}</b><span>WhatsApp group moderator</span></a>
          </div>
        </div>
        <div className="rise wa-on-orange" style={{ "--i": 2 }}>
          <WhatsAppJoin url={c.whatsappGroup} compact />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { event } = useEvent();
  return (
    <main>
      <Hero event={event} />
      <About event={event} />
      <PhotoChapter />
      <TeamBoard event={event} />
      <BracketChapter event={event} />
      <HowItWorks />
      <Ticket event={event} />
      <Faq />
      <Contact event={event} />
      <Footer event={event} />
    </main>
  );
}
