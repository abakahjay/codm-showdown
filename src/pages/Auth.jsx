import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function Field({ label, hint, ...props }) {
  return (
    <div className="field">
      <label htmlFor={props.id}>{label}</label>
      <input {...props} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Register() {
  const { player, signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", ign: "", codmUid: "", password: "", acceptTerms: false, ageConfirmed: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (player) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api("/auth/signup", { method: "POST", body: form, auth: false });
      signIn(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app">
      <h1 className="app-title">Register to play</h1>
      <p className="app-sub">One account per player. After this you can create your team or join one with an invite code, then pay your GH₵50 entry.</p>
      <form className="form" onSubmit={submit} noValidate>
        {error && <p className="alert" role="alert">{error}</p>}
        <Field id="fullName" label="Full name" autoComplete="name" value={form.fullName} onChange={set("fullName")} required maxLength={60} />
        <div className="row2">
          <Field id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required maxLength={120} hint="Your Paystack receipt goes here" />
          <Field id="phone" label="Phone (MoMo)" type="tel" inputMode="tel" autoComplete="tel" placeholder="024 123 4567" value={form.phone} onChange={set("phone")} required maxLength={20} />
        </div>
        <div className="row2">
          <Field id="ign" label="In-game name" value={form.ign} onChange={set("ign")} required maxLength={20} hint="Exactly as it shows in CODM" />
          <Field id="codmUid" label="CODM UID" inputMode="numeric" value={form.codmUid} onChange={set("codmUid")} required maxLength={20} hint="Profile → the number under your name" />
        </div>
        <Field id="password" label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required minLength={8} hint="At least 8 characters, with letters and numbers" />
        <label className="check">
          <input type="checkbox" checked={form.acceptTerms} onChange={set("acceptTerms")} />
          <span>I agree to the <Link className="link" to="/terms" target="_blank">terms, rules and refund policy</Link> and the <Link className="link" to="/privacy" target="_blank">privacy notice</Link>, and I'm a UMaT student.</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={form.ageConfirmed} onChange={set("ageConfirmed")} />
          <span>I am 16 years old or older.</span>
        </label>
        <button className="btn btn--block" disabled={busy}>{busy ? "Creating your account…" : "Create my account"}</button>
        <p className="muted">Already registered? <Link className="link" to="/login">Log in</Link></p>
      </form>
    </main>
  );
}

export function Login() {
  const { player, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const next = location.state?.from || "/dashboard";
  if (player) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      signIn(await api("/auth/login", { method: "POST", body: { identifier, password }, auth: false }));
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app">
      <h1 className="app-title">Log in</h1>
      <p className="app-sub">Use the email or phone number you registered with.</p>
      <form className="form" onSubmit={submit}>
        {error && <p className="alert" role="alert">{error}</p>}
        <Field id="identifier" label="Email or phone" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required maxLength={120} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn btn--block" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
        <p className="muted">New here? <Link className="link" to="/register">Create an account</Link>. Forgot your password? Message the moderator on WhatsApp.</p>
      </form>
    </main>
  );
}
