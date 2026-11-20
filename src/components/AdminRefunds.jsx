import { useEffect, useMemo, useState } from "react";
import { api, cedis2, formatDate } from "../lib/api.js";

// Admin refunds: one player at a time, or cancel the tournament and refund everyone.
// The backend (FullBackendd controllers/codmRefunds.js) talks to Paystack; this page
// never marks anything refunded itself.

const STATUS = {
  requesting: ["Sending to Paystack…", "muted"],
  pending: ["Refund pending at Paystack", "status--ok"],
  processing: ["Refund processing", "status--ok"],
  processed: ["Refunded", "status--ok"],
  "needs-attention": ["Needs attention in Paystack", "status--warn"],
  failed: ["Refund failed", "status--bad"],
  manual: ["Cash handed back", "status--ok"],
};
const when = (iso) => formatDate(iso, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function StatusCell({ row }) {
  if (!row.refundStatus) return <span className="muted">Paid {when(row.paidAt)}</span>;
  const [label, cls] = STATUS[row.refundStatus] || [row.refundStatus, "muted"];
  return (
    <span className={cls}>
      {label}
      {row.refundError && <span className="refund-error">{row.refundError}</span>}
    </span>
  );
}

export default function AdminRefunds({ onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [q, setQ] = useState("");
  const [reason, setReason] = useState("");
  const [phrase, setPhrase] = useState("");
  const [allBusy, setAllBusy] = useState(false);

  const load = () => api("/admin/refunds").then((d) => { setData(d); setError(""); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  // Keep the list fresh while refunds are on their way.
  const active = !!data && (data.running || data.rows.some((r) => ["requesting", "pending", "processing"].includes(r.refundStatus)));
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, [active]);

  const rows = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    return s ? data.rows.filter((r) => `${r.player?.ign} ${r.player?.fullName} ${r.player?.phone} ${r.player?.email} ${r.reference}`.toLowerCase().includes(s)) : data.rows;
  }, [data, q]);

  const refundOne = async (row) => {
    const p = row.player;
    const amount = cedis2(row.amountGhs);
    const text = row.method === "cash"
      ? `${p.fullName} (${p.ign}) paid ${amount} in cash.\n\nHave you handed the cash back? This records the refund, marks them unpaid and takes them out of their team.`
      : `Refund ${amount} to ${p.fullName} (${p.ign}) through Paystack?\n\nIt goes back to the MoMo wallet or card they paid with in 3 to 10 working days. Paystack keeps its fee, and the money comes out of payouts Paystack hasn't sent you yet. They will be marked unpaid and taken out of their team. This can't be undone.`;
    if (!window.confirm(text)) return;
    setBusyId(row.paymentId); setError(""); setNotice("");
    try {
      const res = await api(`/admin/players/${p.id}/refund`, { method: "POST", body: { confirm: true } });
      setNotice(res.message);
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
      load();
    }
  };

  const refundAll = async (e) => {
    e.preventDefault();
    if (!window.confirm(data.cancelled ? "Retry every refund that hasn't gone through?" : "Cancel the tournament and refund every player now? Registration, payments and team changes stop for good.")) return;
    setAllBusy(true); setError(""); setNotice("");
    try {
      const res = await api("/admin/refunds/all", { method: "POST", body: { confirm: data.confirmPhrase, reason: reason.trim() || data.cancelReason || "" } });
      setData(res);
      setNotice("Refunds are being sent to Paystack one by one. This list updates by itself.");
      setPhrase("");
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setAllBusy(false);
    }
  };

  if (!data) {
    return (
      <section className="panel" style={{ marginTop: 32 }} aria-labelledby="admin-refunds">
        <h2 id="admin-refunds">Refunds</h2>
        {error ? <p className="alert" style={{ marginTop: 12 }}>{error}</p> : <div className="spinner" style={{ marginTop: 12 }} />}
      </section>
    );
  }

  const t = data.totals;
  const phraseOk = phrase.trim().toUpperCase() === data.confirmPhrase;
  const reasonOk = data.cancelled || reason.trim().length >= 3;

  return (
    <>
      <section className="panel" style={{ marginTop: 32 }} aria-labelledby="admin-refunds">
        <h2 id="admin-refunds">Refund a player</h2>
        <p className="muted" style={{ margin: "6px 0 12px" }}>
          Online payments go back through Paystack to the MoMo wallet or card the player used (3 to 10 working days). Cash payments: hand the cash back, then record it here. A refunded player is marked unpaid and leaves their team.
        </p>
        {notice && <p className="alert alert--ok" role="status" style={{ marginBottom: 12 }}>{notice}</p>}
        {error && <p className="alert" role="alert" style={{ marginBottom: 12 }}>{error}</p>}
        <div className="field" style={{ maxWidth: 420 }}>
          <label htmlFor="refund-search">Search player, phone, email or reference</label>
          <input id="refund-search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {rows.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>{data.rows.length ? "No payment matches that search." : "No one has paid yet."}</p>
        ) : (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table>
              <thead><tr><th>Player</th><th>Phone</th><th>Paid</th><th>Method</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const canRefund = r.player && (!r.refundStatus || r.refundStatus === "failed");
                  return (
                    <tr key={r.paymentId}>
                      <td>{r.player ? <>{r.player.ign}<span className="muted"> · {r.player.fullName}</span></> : <span className="muted">Deleted player</span>}</td>
                      <td>{r.player && <a className="link" href={`tel:${r.player.phone}`}>{r.player.phone}</a>}</td>
                      <td>{cedis2(r.amountGhs)}</td>
                      <td>{r.method === "cash" ? "Cash" : r.channel || "Paystack"}</td>
                      <td><StatusCell row={r} /></td>
                      <td>
                        {canRefund && (
                          <button className="btn btn--quiet btn--sm" disabled={busyId === r.paymentId || allBusy} onClick={() => refundOne(r)}>
                            {busyId === r.paymentId ? "Refunding…" : r.method === "cash" ? "Record cash refund" : r.refundStatus === "failed" ? "Try again" : `Refund ${cedis2(r.amountGhs)}`}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel danger-zone" style={{ marginTop: 32 }} aria-labelledby="admin-cancel">
        <h2 id="admin-cancel">{data.cancelled ? "Tournament cancelled" : "Cancel the tournament and refund everyone"}</h2>
        {data.cancelled ? (
          <p style={{ margin: "6px 0 12px" }}>
            Cancelled {when(data.cancelledAt)} by {data.cancelledBy}. Reason shown to players: “{data.cancelReason}”
          </p>
        ) : (
          <p style={{ margin: "6px 0 12px" }}>
            Only if the event can't go ahead. This closes registration, payments and team changes for good, tells every player on the site, and refunds every online payment through Paystack.
          </p>
        )}
        <ul className="refund-summary">
          <li><b>{t.onlineRefunded}/{t.onlinePayments}</b> online payments refunded ({cedis2(t.onlineGhs)} paid in total)</li>
          {t.onlineFailed > 0 && <li className="status--bad"><b>{t.onlineFailed}</b> failed: see the reasons above, then try again</li>}
          <li><b>{t.cashToHandBack}</b> cash payment{t.cashToHandBack === 1 ? "" : "s"} to hand back yourself ({cedis2(t.cashGhs)}), then record each one above</li>
        </ul>
        <p className="muted" style={{ margin: "10px 0 16px" }}>
          Paystack keeps its 1.95% fee on refunds, so each one costs you about GH₵1.00 extra, and refunds come out of payouts Paystack hasn't sent you yet. If you've already been paid out, Paystack may refuse with a balance message; contact Paystack support to fund it.
        </p>
        {data.running && <p className="alert alert--info" role="status" style={{ marginBottom: 12 }}>Sending refunds to Paystack now…</p>}
        {(!data.cancelled || t.onlineToRefund > 0) && (
          <form onSubmit={refundAll} className="cancel-form">
            {!data.cancelled && (
              <div className="field">
                <label htmlFor="cancel-reason">Reason players will see</label>
                <textarea id="cancel-reason" rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The venue is no longer available. Everyone gets their money back." />
              </div>
            )}
            <div className="field">
              <label htmlFor="cancel-phrase">Type <b>{data.confirmPhrase}</b> to confirm</label>
              <input id="cancel-phrase" value={phrase} onChange={(e) => setPhrase(e.target.value)} autoComplete="off" />
            </div>
            <button className="btn btn--danger" type="submit" disabled={!phraseOk || !reasonOk || allBusy || data.running}>
              {allBusy ? "Starting…" : data.cancelled ? `Retry ${t.onlineToRefund} refund${t.onlineToRefund === 1 ? "" : "s"}` : `Cancel and refund ${t.onlineToRefund} player${t.onlineToRefund === 1 ? "" : "s"}`}
            </button>
          </form>
        )}
      </section>
    </>
  );
}
