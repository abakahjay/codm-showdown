import { useEffect, useMemo, useState } from "react";
import { api, cedis, downloadCsv, formatDate } from "../lib/api.js";
import Bracket from "../components/Bracket.jsx";

// datetime-local value in Ghana time (UTC+0)
const toLocal = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

function AdminBracket({ confirmedTeams }) {
  const [bracket, setBracket] = useState(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => api("/bracket", { auth: false }).then((d) => setBracket(d.bracket)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const run = async (fn) => {
    setBusy(true); setError("");
    try { setBracket((await fn()).bracket); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const patch = (m, body) => run(() => api(`/admin/bracket/matches/${m.id}`, { method: "PATCH", body }));

  const controls = (m) => {
    if (m.bye) return null;
    return (
      <div className="bt-admin">
        {m.ready && m.teamA && <button disabled={busy} onClick={() => patch(m, { winnerTeamId: m.teamA.id })}>{m.teamA.name} won</button>}
        {m.ready && m.teamB && <button disabled={busy} onClick={() => patch(m, { winnerTeamId: m.teamB.id })}>{m.teamB.name} won</button>}
        {m.winner && <button className="undo" disabled={busy} onClick={() => patch(m, { winnerTeamId: null })}>Undo result</button>}
        {!m.winner && (
          <>
            <input type="datetime-local" aria-label="Match time (Ghana time)" defaultValue={toLocal(m.startsAt)} onBlur={(e) => e.target.value !== toLocal(m.startsAt) && patch(m, { startsAt: e.target.value ? `${e.target.value}:00Z` : null })} />
            <input placeholder="Lobby / map" aria-label="Lobby or map" defaultValue={m.note || ""} maxLength={80} onBlur={(e) => e.target.value !== (m.note || "") && patch(m, { note: e.target.value || null })} />
          </>
        )}
      </div>
    );
  };

  return (
    <section className="panel" style={{ marginTop: 32 }} aria-labelledby="admin-bracket">
      <h2 id="admin-bracket">Knockout bracket</h2>
      {error && <p className="alert" role="alert" style={{ marginBottom: 16 }}>{error}</p>}
      {bracket === null && (
        <>
          <p className="muted">{confirmedTeams} confirmed team{confirmedTeams === 1 ? "" : "s"} (5 paid players). Drawing the bracket locks all teams, so do it when registration is done.</p>
          <div className="actions">
            <button className="btn" disabled={busy || confirmedTeams < 2} onClick={() => window.confirm(`Draw the bracket with ${confirmedTeams} confirmed teams? Teams lock after this.`) && run(() => api("/admin/bracket/generate", { method: "POST", body: {} }))}>Draw the bracket</button>
          </div>
        </>
      )}
      {bracket && (
        <>
          <p className="muted">Click the winner of each match; it moves to the next round. Times are Ghana time. Undo works while the next round is still undecided.</p>
          <div style={{ marginTop: 20 }}><Bracket bracket={bracket} admin={controls} /></div>
          <div className="actions">
            <button className="btn btn--quiet" disabled={busy} onClick={() => window.prompt('Type RESET to delete the bracket and all results') === "RESET" && run(() => api("/admin/bracket", { method: "DELETE", body: { confirm: "RESET" } }))}>Reset bracket</button>
          </div>
        </>
      )}
    </section>
  );
}

export default function Admin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const load = () => api("/admin/overview").then(setData).catch((e) => setError(e.message));
  const setPaid = (m, paid) => {
    if (!window.confirm(paid ? `Record a cash payment of the entry fee for ${m.fullName}?` : `Remove the cash payment for ${m.fullName}?`)) return;
    api(`/admin/players/${m.id}/paid`, { method: "PATCH", body: { paid } }).then(setData).catch((e) => setError(e.message));
  };
  useEffect(() => { load(); }, []);

  const teams = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data.teams;
    return data.teams.filter((t) => t.name.toLowerCase().includes(s) || t.members.some((m) => `${m.ign} ${m.fullName} ${m.phone} ${m.codmUid}`.toLowerCase().includes(s)));
  }, [data, q]);

  if (error) return <main className="app"><h1 className="app-title">Admin</h1><p className="alert" style={{ marginTop: 24 }}>{error}</p></main>;
  if (!data) return <main className="app"><h1 className="app-title">Admin</h1><div className="spinner" style={{ marginTop: 24 }} /></main>;

  const t = data.totals;
  return (
    <main className="app">
      <h1 className="app-title">Registrations</h1>
      <div className="stat-row">
        <div className="stat"><b>{t.teams}/{data.event.maxTeams}</b>Teams</div>
        <div className="stat"><b>{t.confirmedTeams}</b>Confirmed teams</div>
        <div className="stat"><b>{t.players}</b>Players</div>
        <div className="stat"><b>{t.paidPlayers}</b>Paid players</div>
        <div className="stat"><b>{cedis(t.collectedGhs)}</b>Collected (before Paystack fees)</div>
      </div>
      <div className="actions">
        <button className="btn" onClick={() => downloadCsv().catch((e) => setError(e.message))}>Download team sheet (CSV)</button>
        <button className="btn btn--quiet" onClick={load}>Refresh</button>
      </div>
      <AdminBracket confirmedTeams={t.confirmedTeams} />
      <div className="field" style={{ maxWidth: 420, marginTop: 32 }}>
        <label htmlFor="search">Search team, player, phone or UID</label>
        <input id="search" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {teams.map((team) => (
        <section className="panel" key={team.id} style={{ marginTop: 16 }} aria-label={team.name}>
          <h2 style={{ marginBottom: 6 }}>{team.name}{team.tag ? ` [${team.tag}]` : ""}</h2>
          <p className={team.confirmed ? "status--ok" : "muted"}>{team.confirmed ? "Confirmed" : `${team.memberCount}/${data.event.teamSize} joined · ${team.paidCount} paid`} · code {team.inviteCode}</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>IGN</th><th>Name</th><th>UID</th><th>Phone</th><th>Paid</th><th>Channel</th></tr></thead>
              <tbody>
                {team.members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.ign}{m.isCaptain ? " (C)" : ""}</td><td>{m.fullName}</td><td>{m.codmUid}</td>
                    <td><a className="link" href={`tel:${m.phone}`}>{m.phone}</a></td>
                    <td>{m.paid ? formatDate(m.paidAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "No"}</td>
                    <td>{m.paymentChannel || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {data.playersWithoutTeam.length > 0 && (
        <section className="panel" style={{ marginTop: 16 }}>
          <h2>Players without a team</h2>
          <p className="muted" style={{ marginBottom: 8 }}>Unpaid players can't join a team. Record a cash payment here if someone paid you directly.</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>IGN</th><th>Name</th><th>UID</th><th>Phone</th><th>Paid</th><th></th></tr></thead>
              <tbody>
                {data.playersWithoutTeam.map((m) => (
                  <tr key={m.id}><td>{m.ign}</td><td>{m.fullName}</td><td>{m.codmUid}</td><td><a className="link" href={`tel:${m.phone}`}>{m.phone}</a></td><td>{m.paid ? `Yes · ${m.paymentChannel || ""}` : "No"}</td><td>{!m.paid ? <button className="icon-btn" onClick={() => setPaid(m, true)}>Record cash payment</button> : (m.paymentChannel || "").startsWith("Cash") ? <button className="icon-btn" onClick={() => setPaid(m, false)}>Undo cash</button> : null}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
