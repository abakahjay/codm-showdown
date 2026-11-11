import qr from "../assets/whatsapp-qr.png";
import { EVENT_DEFAULTS } from "../lib/hooks.js";

// The tournament WhatsApp group: tap the button on a phone, scan the code from a laptop.
export default function WhatsAppJoin({ url = EVENT_DEFAULTS.contacts.whatsappGroup, compact = false }) {
  return (
    <div className={`wa${compact ? " wa--compact" : ""}`}>
      <a href={url} target="_blank" rel="noopener noreferrer" className="wa-qr" aria-label="Join the WhatsApp group">
        <img src={qr} alt="QR code to join the tournament WhatsApp group" width="160" height="160" decoding="async" />
      </a>
      <div className="wa-copy">
        <h3>Join the WhatsApp group</h3>
        <p>Fixtures, lobby codes and match-day updates go out here first.</p>
        <a className="btn wa-btn" href={url} target="_blank" rel="noopener noreferrer">Open WhatsApp group</a>
        <p className="wa-link"><a className="link" href={url} target="_blank" rel="noopener noreferrer">{url.replace(/^https:\/\//, "")}</a></p>
      </div>
    </div>
  );
}
