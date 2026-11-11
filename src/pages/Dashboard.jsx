import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, cedis, formatDate } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useEvent } from "../lib/hooks.js";
import WhatsAppJoin from "../components/WhatsAppJoin.jsx";

function PaymentPanel({ player, event }) {
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Coming back from Paystack with the Back button restores this page from the
  // browser's back-forward cache, frozen on "Opening Paystack…". Reset the
  // button and re-check the payment (they may have paid before going back).
  useEffect(() => {
    const onReturn = (e) => {
      if (e.type === "pageshow" && !e.persisted) return;
      if (e.type === "visibilitychange" && document.hidden) return;
      setBusy(false);
      refresh();
    };
    window.addEventListener("pageshow", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      window.removeEventListener("pageshow", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [refresh]);

  const pay = async () => {
    setBusy(true);
    setError("");
    try {
      const { authorizationUrl } = await api("/payments/initialize", {
        method: "POST",
        body: { callbackUrl: `${window.location.origin}/payment/return` },
      });
      window.location.assign(authorizationUrl); // Paystack's hosted checkout
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="me-title">
      <h2 id="me-title">{player.ign}</h2>
      <dl className="kv">
        <dt>Name</dt><dd>{player.fullName}</dd>
        <dt>CODM UID</dt><dd>{player.codmUid}</dd>
        <dt>Phone</dt><dd>{player.phone}</dd>
        <dt>Email</dt><dd>{player.email}</dd>
      </dl>
      {player.paid ? (
        <div className="paid-box">
          <b>Registered</b>
          <p>{cedis(event.entryFeeGhs)} via {player.paymentChannel || "Paystack"} on {formatDate(player.paidAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.</p>
        </div>
      ) : (
        <div className="pay-box">
          <b>{cedis(event.entryFeeGhs)}</b>
          <p>Pay to register for the tournament. MoMo or card, on Paystack's secure page.</p>
          {error && <p className="alert" role="alert" style={{ marginTop: 12 }}>{error}</p>}
          <p style={{ fontSize: 15, marginTop: 8 }}>One-off payment, not a subscription. Not refunded once fixtures are published; fully refunded if the event is cancelled. <Link className="link" to="/terms">Terms</Link></p>
          <button className="btn btn--ink btn--block" onClick={pay} disabled={busy || !event.registrationOpen}>
            {busy ? "Opening Paystack…" : event.registrationOpen ? `Pay ${cedis(event.entryFeeGhs)} now` : "Registration closed"}
          </button>
        </div>
      )}
    </section>
  );
}

function NoTeam({ onTeam, open, paid }) {
  const [tab, setTab] = useState("join");
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try { onTeam((await fn()).team); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <section className="panel" aria-labelledby="team-title">
      <h2 id="team-title">Your team</h2>
      <p className="muted" style={{ marginBottom: 20 }}>You're not in a team yet. Join your captain's team with their invite code, or create a team and be the captain.</p>
      {!paid && <p className="alert alert--info">Pay your entry first: paying is what registers you. Then you can create or join a team here.</p>}
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "join"} onClick={() => setTab("join")}>Join with a code</button>
        <button role="tab" aria-selected={tab === "create"} onClick={() => setTab("create")}>Create a team</button>
      </div>
      {error && <p className="alert" role="alert" style={{ marginBottom: 16 }}>{error}</p>}
      {!open && <p className="alert alert--info">Registration is closed.</p>}
      {open && paid && tab === "join" && (
        <form className="form" style={{ marginTop: 0 }} onSubmit={(e) => { e.preventDefault(); run(() => api("/teams/join", { method: "POST", body: { inviteCode: code } })); }}>
          <div className="field">
            <label htmlFor="code">Invite code</label>
            <input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={6} placeholder="e.g. K7Q2XM" autoCapitalize="characters" autoComplete="off" />
          </div>
          <button className="btn btn--block" disabled={busy || code.length !== 6}>{busy ? "Joining…" : "Join team"}</button>
        </form>
      )}
      {open && paid && tab === "create" && (
        <form className="form" style={{ marginTop: 0 }} onSubmit={(e) => { e.preventDefault(); run(() => api("/teams", { method: "POST", body: { name, tag: tag || undefined } })); }}>
          <div className="row2">
            <div className="field">
              <label htmlFor="tname">Team name</label>
              <input id="tname" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="e.g. Tarkwa Phantoms" />
              <span className="hint">3 to 24 characters. It shows on the public board.</span>
            </div>
            <div className="field">
              <label htmlFor="ttag">Clan tag (optional)</label>
              <input id="ttag" value={tag} onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={5} placeholder="TPX" />
            </div>
          </div>
          <button className="btn btn--block" disabled={busy || name.trim().length < 3}>{busy ? "Creating…" : "Create team"}</button>
        </form>
      )}
    </section>
  );
}

function TeamPanel({ team, me, size, open, onTeam }) {
  const isCaptain = team.captainId === me.id;
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = async (key, fn, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(key);
    setError("");
    try { onTeam((await fn()).team); } catch (err) { setError(err.message); } finally { setBusy(""); }
  };

  const shareText = `Join my CODM Campus Showdown team "${team.name}" on ${window.location.origin}/register. Invite code: ${team.inviteCode}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(team.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* not allowed */ }
  };

  const empty = Array.from({ length: Math.max(0, size - team.members.length) });
  return (
    <section className="panel" aria-labelledby="team-title">
      <h2 id="team-title">{team.name}{team.tag ? ` [${team.tag}]` : ""}</h2>
      <p className={`team-status${team.confirmed ? " status--ok" : ""}`}>
        {team.confirmed ? "Confirmed: all five paid. See you on Saturday." : `${team.memberCount} of ${size} joined · ${team.paidCount} of ${size} paid`}
      </p>
      {error && <p className="alert" role="alert" style={{ marginTop: 12 }}>{error}</p>}

      {team.memberCount < size && (
        <div className="invite">
          <div>
            <p className="muted">Invite code</p>
            <code>{team.inviteCode}</code>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="btn btn--quiet" onClick={copy}>{copied ? "Copied" : "Copy code"}</button>
            <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
          </div>
        </div>
      )}

      <ul className="roster" aria-label="Team members">
        {team.members.map((m) => (
          <li key={m.id}>
            <div className="who">
              <b>{m.ign}{m.isCaptain ? " · captain" : ""}</b>
              <span>{m.fullName} · {m.phone}</span>
            </div>
            <span className={`pill ${m.paid ? "pill--paid" : "pill--due"}`}>{m.paid ? "Paid" : "Not paid"}</span>
            {isCaptain && open && m.id !== me.id ? (
              <button className="icon-btn" disabled={!!busy} onClick={() => run(`rm-${m.id}`, () => api(`/teams/mine/members/${m.id}`, { method: "DELETE" }), `Remove ${m.ign} from the team?`)}>Remove</button>
            ) : <span />}
          </li>
        ))}
        {empty.map((_, i) => <li key={`e${i}`} className="empty"><div className="who"><b>Open slot</b><span>Share the invite code</span></div><span /><span /></li>)}
      </ul>

      {open && (
        <div className="actions">
          {isCaptain && team.memberCount < size && (
            <button className="btn btn--quiet" disabled={!!busy} onClick={() => run("code", () => api("/teams/mine/invite-code", { method: "POST" }), "Make a new invite code? The old one will stop working.")}>New invite code</button>
          )}
          <button className="btn btn--quiet" disabled={!!busy} onClick={() => run("leave", () => api("/teams/leave", { method: "POST" }), isCaptain && team.memberCount > 1 ? "Leave the team? The next player becomes captain. Your payment stays with you." : "Leave this team? Your payment stays with you.")}>Leave team</button>
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const { player, signOut, refresh } = useAuth();
  const { event } = useEvent();
  const navigate = useNavigate();
  const [team, setTeam] = useState(undefined);

  const loadTeam = useCallback(() => api("/teams/mine").then((d) => setTeam(d.team)).catch(() => setTeam(null)), []);
  useEffect(() => { loadTeam(); }, [loadTeam]);

  const onTeam = (t) => { setTeam(t); refresh(); };

  return (
    <main className="app">
      <h1 className="app-title">Hi, {player.fullName.split(" ")[0]}</h1>
      <p className="app-sub">
        {player.paid ? "You're registered." : `Step one: pay your ${cedis(event.entryFeeGhs)} entry to register. Then create or join a team.`} Matches start {formatDate(event.startsAt, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true })} at {event.venue}.
      </p>
      <div className="dash">
        <PaymentPanel player={player} event={event} />
        {team === undefined && <section className="panel"><div className="spinner" aria-label="Loading your team" /></section>}
        {team === null && <NoTeam onTeam={onTeam} open={event.registrationOpen} paid={player.paid} />}
        {team && <TeamPanel team={team} me={player} size={event.teamSize} open={event.registrationOpen} onTeam={onTeam} />}
      </div>
      <section className="panel" style={{ marginTop: 16 }} aria-label="WhatsApp group"><WhatsAppJoin url={event.contacts.whatsappGroup} /></section>
      <div className="actions" style={{ marginTop: 32 }}>
        <button className="btn btn--quiet" onClick={() => { signOut(); navigate("/"); }}>Log out</button>
      </div>
    </main>
  );
}
