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
    const onScroll = () => setTone(window.scrollY > 40 ? "solid" : "hero");
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onHome]);

  const home = (hash) => (onHome ? hash : `/${hash}`);

  return (
    <header className="site-header" data-tone={tone}>
      <Link to="/" className="wordmark" aria-label="CODM Campus Showdown, home">CODM Showdown</Link>
      <nav className={`nav${open ? " open" : ""}`} aria-label="Main">
        <button className="menu-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Menu"}</button>
        <div className="nav-links">
          <a href={home("#teams")}>Squads</a>
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
