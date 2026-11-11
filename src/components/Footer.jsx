import { Link } from "react-router-dom";
import { EVENT_DEFAULTS } from "../lib/hooks.js";

const tel = (n) => `tel:+233${n.slice(1)}`;
const pretty = (n) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;

export default function Footer({ event = EVENT_DEFAULTS }) {
  const c = event.contacts || EVENT_DEFAULTS.contacts;
  return (
    <footer className="site-footer" data-chapter="dark">
      <div className="footer-name" aria-hidden="true">Showdown</div>
      <div className="footer-row">
        <div className="footer-places">
          <a href={c.whatsappGroup} target="_blank" rel="noopener noreferrer">WhatsApp group</a>
          {c.organiser.map((n) => <a key={n} href={tel(n)}>{pretty(n)}</a>)}
          <a href={tel(c.moderator)}>{pretty(c.moderator)} · moderator</a>
        </div>
        <div className="footer-links">
          <Link to="/register">Register</Link>
          <Link to="/login">Log in</Link>
          <a href="/#teams">Teams</a>
          <a href="/#entry">Entry fee</a>
          <a href="/#faq">Rules and FAQ</a>
          <Link to="/dashboard">My team</Link>
          <Link to="/bracket">Bracket</Link>
          <Link to="/terms">Terms and rules</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>
      <div className="footer-legal">
        <p>An independent student event at UMaT, Tarkwa. Not affiliated with or endorsed by Activision or TiMi Studios; Call of Duty is their trademark.</p>
        <p>Photos: Unsplash · Payments by Paystack</p>
        <a className="link" href="#top">Back to top</a>
      </div>
    </footer>
  );
}
