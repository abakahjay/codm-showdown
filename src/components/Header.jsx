import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

// The header takes the colours of the chapter under it ([data-chapter] on each
// section of the home page). App screens are always dark.
export default function Header() {
  const { player } = useAuth();
  const { pathname } = useLocation();
  const [tone, setTone] = useState("dark");
  const [open, setOpen] = useState(false);
  const onHome = pathname === "/";

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!onHome) { setTone("dark"); return undefined; }
    const sections = [...document.querySelectorAll("[data-chapter]")];
    if (!sections.length || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setTone(e.target.dataset.chapter); });
    }, { rootMargin: "-36px 0px -95% 0px" });
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [onHome]);

  const home = (hash) => (onHome ? hash : `/${hash}`);

  return (
    <header className="site-header" data-tone={tone}>
      <Link to="/" className="wordmark" aria-label="CODM Campus Showdown, home">CODM Showdown</Link>
      <nav className={`nav${open ? " open" : ""}`} aria-label="Main">
        <button className="menu-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Menu"}</button>
        <div className="nav-links">
          <a href={home("#teams")}>Teams</a>
          <Link to="/bracket">Bracket</Link>
          <a href={home("#entry")}>Entry</a>
          <a href={home("#faq")}>FAQ</a>
          {player?.role === "admin" && <Link to="/admin">Admin</Link>}
          {!player && <Link to="/login">Log in</Link>}
        </div>
        {player
          ? <Link className="btn" to="/dashboard">My team</Link>
          : <Link className="btn" to="/register">Register</Link>}
      </nav>
    </header>
  );
}
