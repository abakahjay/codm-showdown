import { Link } from "react-router-dom";

const CONTACT = "0257445431 or 0532900914 (organiser), 0553088594 (WhatsApp group moderator)";

export function Privacy() {
  return (
    <main className="app legal">
      <h1 className="app-title">Privacy</h1>
      <p className="app-sub">What we collect for the CODM Campus Showdown, and why. Last updated 11 November 2026.</p>
      <h2>What we collect</h2>
      <p>When you register: your full name, email, Ghana mobile number, CODM in-game name and UID, and a password (stored only as a one-way hash). When you pay: whether you paid, when, and how (for example "MTN MoMo"). Paystack handles the payment itself; we never see your MoMo PIN or card number.</p>
      <h2>Why</h2>
      <p>To run the tournament: confirm who is registered and paid, build teams and the bracket, and contact you about your matches. The public board and bracket show only team names, clan tags and in-game names.</p>
      <h2>Who sees it</h2>
      <p>The organisers. Your teammates see your name, in-game name and a partly hidden phone number. Paystack receives your email and payment details to process the entry fee. We do not sell your data, run ads or use tracking or session-recording tools.</p>
      <h2>How long</h2>
      <p>Until the tournament results are final and any refunds are settled, then at most 90 days. Ask us to delete your account sooner at {CONTACT}.</p>
      <h2>Your rights</h2>
      <p>Under Ghana's Data Protection Act, 2012 (Act 843) you can ask to see, correct or delete your data. Contact {CONTACT}.</p>
      <p style={{ marginTop: 32 }}><Link className="link" to="/terms">Terms and rules</Link></p>
    </main>
  );
}

export function Terms() {
  return (
    <main className="app legal">
      <h1 className="app-title">Terms and rules</h1>
      <p className="app-sub">By registering you agree to these. Last updated 11 November 2026.</p>
      <h2>Who can enter</h2>
      <p>UMaT students aged 16 or older with their own Call of Duty: Mobile account. One account per person; the organisers may check student ID on the day.</p>
      <h2>Entry fee and refunds</h2>
      <p>GH₵50 per player, paid once through Paystack (or in cash to an organiser, who records it). Paying is what registers you. It is a one-off payment, not a subscription. Fees are not refunded once fixtures are published. If the event is cancelled, every paid player is refunded in full.</p>
      <h2>Teams and format</h2>
      <p>Teams of five paid players, Multiplayer 5v5, single elimination. When registration closes, confirmed teams are drawn at random into one knockout bracket and teams are locked. The winning team receives GH₵3,000 in cash, shared as the team decides.</p>
      <h2>Fair play</h2>
      <p>Phones and tablets only; a Bluetooth controller paired to your device is allowed. No hacks, emulators, PCs or account sharing. A team not in its lobby 10 minutes after its match time forfeits that match. Cheating or abuse means disqualification without refund. The organisers' decision on disputes is final.</p>
      <h2>Not affiliated</h2>
      <p>This is an independent student event. It is not sponsored, endorsed or run by Activision, TiMi Studios or Garena; Call of Duty is their trademark.</p>
      <h2>Contact</h2>
      <p>{CONTACT}.</p>
      <p style={{ marginTop: 32 }}><Link className="link" to="/privacy">Privacy</Link></p>
    </main>
  );
}
