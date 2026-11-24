import { Fragment, useEffect, useMemo, useState } from "react";
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
  // Funding a refund from the organiser's MoMo: { paymentId, reference, status, text, otp }
  const [fund, setFund] = useState(null);

  const load = () => api("/admin/refunds").then((d) => { setData(d); setError(""); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  // Keep the list fresh while refunds are on their way.
  const active = !!data && (data.running || data.rows.some((r) => ["requesting", "pending", "processing"].includes(r.refundStatus)));
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!fund?.reference || fund.status !== "pending") return undefined;
    const started = Date.now();
    const id = setInterval(async () => {
      try {
        const r = await api(`/admin/refunds/fund/${fund.reference}`);
        if (r.status === "pending") {
          if (Date.now() - started > 4 * 60 * 1000) setFund((f) => ({ ...f, status: "failed", text: "No approval came through in 4 minutes. If you approved it, wait a minute and press Refund again; otherwise try again." }));
          return;
        }
        setFund((f) => ({ ...f, status: r.status === "success" ? "done" : "failed", text: r.message || (r.status === "success" ? "Done." : "The MoMo payment didn't go through.") }));
        load();
        onChanged?.();
      } catch (e) {
        setFund((f) => ({ ...f, status: "failed", text: e.message }));
      }
    }, 4000);
    return () => clearInterval(id);
  }, [fund?.reference, fund?.status]);

  const fundRefund = async (row) => {
    const amount = cedis2(row.amountGhs);
    if (!window.confirm(`Paystack has no unpaid-out money to take this refund from.\n\nPay ${amount} from your own MoMo into Paystack to cover it? A prompt will appear on your phone: type your PIN there. Once it goes through, ${row.player.fullName} is refunded ${cedis2(row.amountGhs)} automatically.`)) return;
    setFund({ paymentId: row.paymentId, status: "starting", text: "Sending the prompt to your phone…" });
    setError(""); setNotice("");
    try {
      const r = await api(`/admin/players/${row.player.id}/refund/fund`, { method: "POST", body: {} });
      if (r.status === "success" || r.refunded !== undefined) { setFund({ paymentId: row.paymentId, status: r.refunded === false ? "failed" : "done", text: r.message }); load(); onChanged?.(); return; }
      setFund({ paymentId: row.paymentId, reference: r.reference, status: r.status === "send_otp" ? "otp" : "pending", text: r.displayText });
    } catch (e) {
      setFund({ paymentId: row.paymentId, status: "failed", text: e.message });
    }
  };

  const fundAll = async () => {
    const total = cedis2(owedTotal);
    if (!window.confirm(`Pay ${total} from your own MoMo into Paystack and refund everyone?\n\nA prompt for ${total} will appear on your phone: type your PIN there. Once it goes through, the tournament is cancelled for good and each player who paid online gets GH₵50 back. Paystack keeps its 1.95% fee on what you pay in.`)) return;
    setFund({ paymentId: "all", status: "starting", text: "Sending the prompt to your phone…" });
    setError(""); setNotice("");
    try {
      const r = await api("/admin/refunds/all/fund", { method: "POST", body: { confirm: data.confirmPhrase, reason: reason.trim() || data.cancelReason || "" } });
      if (r.status === "success" || r.refunded !== undefined) { setFund({ paymentId: "all", status: r.refunded === false ? "failed" : "done", text: r.message }); load(); onChanged?.(); return; }
      setFund({ paymentId: "all", reference: r.reference, status: r.status === "send_otp" ? "otp" : "pending", text: `${r.displayText} (${r.count} refund${r.count === 1 ? "" : "s"})` });
      setPhrase("");
    } catch (e) {
      setFund({ paymentId: "all", status: "failed", text: e.message });
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      const r = await api(`/admin/refunds/fund/${fund.reference}/otp`, { method: "POST", body: { otp: fund.otp || "" } });
      setFund((f) => ({ ...f, status: "pending", text: r.displayText }));
    } catch (err) {
      setFund((f) => ({ ...f, text: err.message }));
    }
  };

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
      : `Refund ${amount} to ${p.fullName} (${p.ign}) through Paystack?\n\nIt goes back to the MoMo wallet or card they paid with in 3 to 10 working days. Only the entry is refunded: Paystack keeps the GH₵1 fee the player paid. The money comes out of payouts Paystack hasn't sent you yet. They will be marked unpaid and taken out of their team. This can't be undone.`;
    if (!window.confirm(text)) return;
    setBusyId(row.paymentId); setError(""); setNotice("");
    try {
      const res = await api(`/admin/players/${p.id}/refund`, { method: "POST", body: { confirm: true } });
      setNotice(res.message);
      onChanged?.();
    } catch (e) {
      setError(e.message);
      if (row.method !== "cash" && /Paystack refused the refund/i.test(e.message)) {
        setBusyId(null);
        await load();
        fundRefund(row);
        return;
      }
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

  const fundPanel = (f) => (
    <div className="fund-panel" role="status" aria-live="polite">
      {(f.status === "pending" || f.status === "starting") && <div className="spinner" />}
      <p>{f.text}</p>
      {f.status === "otp" && (
        <form onSubmit={sendOtp} className="fund-otp">
          <label htmlFor="fund-otp">Code sent to your phone</label>
          <input id="fund-otp" inputMode="numeric" autoComplete="one-time-code" value={f.otp || ""} onChange={(e) => setFund({ ...f, otp: e.target.value })} />
          <button className="btn btn--sm" type="submit">Submit code</button>
        </form>
      )}
      {(f.status === "done" || f.status === "failed") && <button className="btn btn--quiet btn--sm" onClick={() => setFund(null)}>Close</button>}
    </div>
  );

  if (!data) {
    return (
      <section className="panel" style={{ marginTop: 32 }} aria-labelledby="admin-refunds">
        <h2 id="admin-refunds">Refunds</h2>
        {error ? <p className="alert" style={{ marginTop: 12 }}>{error}</p> : <div className="spinner" style={{ marginTop: 12 }} />}
      </section>
    );
  }

  const t = data.totals;
  const owedTotal = data.rows.filter((r) => r.method !== "cash" && (!r.refundStatus || r.refundStatus === "failed")).reduce((sum, r) => sum + r.amountGhs, 0);
  const fundingAll = fund?.paymentId === "all" ? fund : null;
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
              <thead><tr><th>Player</th><th>Phone</th><th>Entry</th><th>Method</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const canRefund = r.player && (!r.refundStatus || r.refundStatus === "failed");
                  const funding = fund?.paymentId === r.paymentId ? fund : null;
                  return (
                    <Fragment key={r.paymentId}>
                    <tr>
                      <td>{r.player ? <>{r.player.ign}<span className="muted"> · {r.player.fullName}</span></> : <span className="muted">Deleted player</span>}</td>
                      <td>{r.player && <a className="link" href={`tel:${r.player.phone}`}>{r.player.phone}</a>}</td>
                      <td>{cedis2(r.amountGhs)}</td>
                      <td>{r.method === "cash" ? "Cash" : r.channel || "Paystack"}</td>
                      <td><StatusCell row={r} /></td>
                      <td>
                        {canRefund && (
                          <button className="btn btn--quiet btn--sm" disabled={busyId === r.paymentId || allBusy || !!funding} onClick={() => refundOne(r)}>
                            {busyId === r.paymentId ? "Refunding…" : r.method === "cash" ? "Record cash refund" : r.refundStatus === "failed" ? "Try again" : `Refund ${cedis2(r.amountGhs)}`}
                          </button>
                        )}
                        {canRefund && r.method !== "cash" && r.refundStatus === "failed" && !funding && (
                          <button className="btn btn--sm" style={{ marginLeft: 8 }} onClick={() => fundRefund(r)}>Pay {cedis2(r.amountGhs)} from my MoMo &amp; refund</button>
                        )}
                      </td>
                    </tr>
                    {funding && (
                      <tr className="edit-row">
                        <td colSpan={6}>{fundPanel(funding)}</td>
                      </tr>
                    )}
                    </Fragment>
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
          <li><b>{t.onlineRefunded}/{t.onlinePayments}</b> online payments refunded ({cedis2(t.onlineGhs)} in entry fees)</li>
          {t.onlineFailed > 0 && <li className="status--bad"><b>{t.onlineFailed}</b> failed: see the reasons above, then try again</li>}
          <li><b>{t.cashToHandBack}</b> cash payment{t.cashToHandBack === 1 ? "" : "s"} to hand back yourself ({cedis2(t.cashGhs)}), then record each one above</li>
        </ul>
        <p className="muted" style={{ margin: "10px 0 16px" }}>
          Refunds send back the GH₵50 entry; the GH₵1 Paystack fee each player paid is not returned. Refunds come out of payouts Paystack hasn't sent you yet. If you've already been paid out, Paystack may refuse with a balance message: use the MoMo button below (or on a player's row) to pay the money back in from your phone.
        </p>
        {data.running && <p className="alert alert--info" role="status" style={{ marginBottom: 12 }}>Sending refunds to Paystack now…</p>}
        {fundingAll && <div style={{ marginBottom: 12 }}>{fundPanel(fundingAll)}</div>}
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
            <div className="actions">
              <button className="btn btn--danger" type="submit" disabled={!phraseOk || !reasonOk || allBusy || data.running || !!fundingAll}>
                {allBusy ? "Starting…" : data.cancelled ? `Retry ${t.onlineToRefund} refund${t.onlineToRefund === 1 ? "" : "s"}` : `Cancel and refund ${t.onlineToRefund} player${t.onlineToRefund === 1 ? "" : "s"}`}
              </button>
              {owedTotal > 0 && (
                <button className="btn" type="button" onClick={fundAll} disabled={!phraseOk || !reasonOk || allBusy || data.running || !!fundingAll}>
                  Pay {cedis2(owedTotal)} from my MoMo &amp; refund everyone
                </button>
              )}
            </div>
            <p className="muted" style={{ margin: 0 }}>Use the MoMo button when Paystack has already paid everything out to you: a prompt on your phone puts the money back in, then everyone is refunded.</p>
          </form>
        )}
      </section>
    </>
  );
}
