import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";

// Shown until the API answers (and if it can't be reached), so the page
// always says what, when and where.
export const EVENT_DEFAULTS = {
  name: "CODM Campus Showdown",
  entryFeeGhs: 50,
  prizeGhs: 3000,
  teamSize: 5,
  maxTeams: 32,
  mode: "Multiplayer 5v5",
  startsAt: "2026-11-21T17:00:00Z",
  registrationClosesAt: "2026-11-21T15:00:00Z",
  venue: "UMaT Campus, Tarkwa",
  registrationOpen: true,
  teamsRegistered: 0,
  teamSlotsLeft: 32,
  confirmedTeams: 0,
  players: 0,
  paidPlayers: 0,
  contacts: {
    organiser: ["0257445431", "0532900914"],
    moderator: "0553088594",
    whatsappGroup: "https://chat.whatsapp.com/Jia9EajDqIOBd8sE2uz0xe",
  },
};

export function useEvent() {
  const [event, setEvent] = useState(EVENT_DEFAULTS);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const ctrl = new AbortController();
    api("/event", { auth: false, signal: ctrl.signal })
      .then(({ event: e }) => { setEvent({ ...EVENT_DEFAULTS, ...e }); setLive(true); })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);
  return { event, live };
}

// Adds .in to the element once it scrolls into view (entrances).
const REVEAL_OPTS = { threshold: 0.18 };
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!("IntersectionObserver" in window)) { el.classList.add("in"); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add("in"); io.disconnect(); }
    }, REVEAL_OPTS);
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function useCountdown(iso) {
  const target = new Date(iso).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, target - now);
  return {
    done: ms === 0,
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}

// Calls `load` now and every `ms` while the tab is visible (no polling from
// hidden tabs, and an immediate refresh when the visitor comes back).
export function usePolling(load, ms) {
  useEffect(() => {
    let timer;
    const tick = () => { if (!document.hidden) load(); };
    const start = () => { clearInterval(timer); timer = setInterval(tick, ms); };
    const onVisible = () => { if (!document.hidden) { load(); start(); } };
    load();
    start();
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [load, ms]);
}
