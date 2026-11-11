import { Link } from "react-router-dom";
import Bracket, { UpNext } from "../components/Bracket.jsx";
import { useBracket } from "./Home.jsx";

export default function BracketPage() {
  const bracket = useBracket();
  return (
    <main className="app">
      <h1 className="app-title">{bracket?.champion ? `${bracket.champion.name} win` : "Knockout bracket"}</h1>
      <p className="app-sub">Single elimination. Results update every 30 seconds.</p>
      {bracket === undefined && <div className="spinner" style={{ marginTop: 32 }} aria-label="Loading" />}
      {bracket === null && <p className="alert alert--info" style={{ marginTop: 32, maxWidth: 560 }}>The draw hasn't happened yet. It's made when registration closes. <Link className="link" to="/#teams">See the teams so far</Link></p>}
      {bracket && (<>
        {bracket.upNext.length > 0 && (<><h2 className="sub-head">Up next</h2><UpNext bracket={bracket} /></>)}
        <div style={{ marginTop: 40 }}><Bracket bracket={bracket} /></div>
      </>)}
    </main>
  );
}
