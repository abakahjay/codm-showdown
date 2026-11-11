import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import WhatsAppJoin from "../components/WhatsAppJoin.jsx";

// Paystack sends the player back here with ?reference=…&trxref=…
// The server asks Paystack itself before marking anything paid.
export default function PaymentReturn() {
  const [params] = useSearchParams();
  const { setPlayer } = useAuth();
  const reference = params.get("reference") || params.get("trxref") || "";
  const [state, setState] = useState({ status: "checking", message: "" });

  useEffect(() => {
    if (!reference) { setState({ status: "error", message: "No payment reference was returned." }); return; }
    let tries = 0;
    let timer;
    const check = async () => {
      tries += 1;
      try {
        const d = await api(`/payments/verify/${encodeURIComponent(reference)}`);
        setPlayer(d.player);
        if (d.success) return setState({ status: "paid", message: "" });
        // MoMo approvals can take a moment to land: check a few more times.
        if (tries < 6) { timer = setTimeout(check, 5000); return undefined; }
        return setState({ status: "pending", message: "Paystack hasn't confirmed this payment yet. If you approved it on your phone, refresh in a minute." });
      } catch (err) {
        return setState({ status: "error", message: err.message });
      }
    };
    check();
    return () => clearTimeout(timer);
  }, [reference, setPlayer]);

  return (
    <main className="app">
      {state.status === "checking" && (<><h1 className="app-title">Checking payment</h1><p className="app-sub">Confirming with Paystack. Keep this page open.</p><div className="spinner" style={{ marginTop: 32 }} aria-label="Checking" /></>)}
      {state.status === "paid" && (<><h1 className="app-title">You're in</h1><p className="app-sub">Your GH₵50 entry is paid, so you're registered. Next: create your team or join one with your captain's invite code. Paystack is emailing your receipt.</p><section className="panel" style={{ marginTop: 24 }}><WhatsAppJoin /></section></>)}
      {state.status === "pending" && (<><h1 className="app-title">Not confirmed yet</h1><p className="app-sub">{state.message}</p></>)}
      {state.status === "error" && (<><h1 className="app-title">Payment problem</h1><p className="app-sub">{state.message} Nothing extra was charged. Try again from your team page, or message the moderator.</p></>)}
      {state.status !== "checking" && (
        <div className="actions" style={{ marginTop: 32 }}>
          <Link className="btn" to="/dashboard">Go to my team</Link>
          {state.status === "pending" && <button className="btn btn--quiet" onClick={() => window.location.reload()}>Check again</button>}
        </div>
      )}
    </main>
  );
}
