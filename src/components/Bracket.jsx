import { formatDate } from "../lib/api.js";

const when = (iso) => (iso ? formatDate(iso, { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true }) : null);

function TeamLine({ team, match }) {
  if (!team) return <div className="bt-team bt-team--tbd">{match.round === 0 && match.bye ? "Bye" : "To be decided"}</div>;
  const won = match.winner === team.id;
  const lost = match.winner && !won;
  return (
    <div className={`bt-team${won ? " bt-team--won" : ""}${lost ? " bt-team--lost" : ""}`}>
      <span className="bt-name">{team.name}{team.tag && <small> [{team.tag}]</small>}</span>
      {won && <span className="bt-mark">{match.score || "Won"}</span>}
    </div>
  );
}

export function MatchCard({ match, admin }) {
  return (
    <div className={`bt-match${match.ready ? " bt-match--ready" : ""}`}>
      <TeamLine team={match.teamA} match={match} />
      <TeamLine team={match.teamB} match={match} />
      {(match.startsAt || match.note || match.bye) && (
        <p className="bt-meta">{match.bye ? "Goes through with a bye" : [when(match.startsAt), match.note].filter(Boolean).join(" · ")}</p>
      )}
      {admin && admin(match)}
    </div>
  );
}

export default function Bracket({ bracket, admin }) {
  return (
    <div className="bt-scroll" role="region" aria-label="Knockout bracket" tabIndex={0}>
      <div className="bt" style={{ "--rounds": bracket.rounds.length }}>
        {bracket.rounds.map((r) => (
          <div className="bt-round" key={r.round}>
            <h3 className="bt-round-name">{r.name}</h3>
            <div className="bt-col">
              {r.matches.map((m) => <MatchCard key={m.id} match={m} admin={admin} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UpNext({ bracket }) {
  if (!bracket?.upNext?.length) return null;
  return (
    <ol className="upnext" aria-label="Next matches">
      {bracket.upNext.map((m) => (
        <li key={m.id}>
          <span className="upnext-round">{m.roundName}{m.startsAt ? ` · ${when(m.startsAt)}` : ""}{m.note ? ` · ${m.note}` : ""}</span>
          <b>{m.teamA.name}</b>
          <span className="upnext-vs">vs</span>
          <b>{m.teamB.name}</b>
        </li>
      ))}
    </ol>
  );
}
