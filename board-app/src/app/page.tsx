import Link from "next/link";
import { DESKS, type DeskId } from "@/lib/desks";
import { LiveHomeChart } from "@/components/LiveHomeChart";

export default function HomePage() {
  return (
    <>
      <LiveHomeChart />

      <section className="hero" aria-label="ClearPath Trader hero">
        <div className="hero-plane" aria-hidden="true" />
        <div className="container hero-content">
          <p className="hero-brand">Clear Path Trader</p>
          <h1>One chart site. Four desks. Knowledge before execution.</h1>
          <p>
            Analysis-first educational markets platform from Clear Path Markets Science Corp. —
            desks, education, and Your World Connected after login.{" "}
            <span className="not-brokerage">(NOT A BROKERAGE.)</span>
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/charts">
              Enter the desks
            </Link>
            <Link className="btn btn-ghost" href="/ywc">
              Your World Connected
            </Link>
            <Link className="btn btn-ghost" href="/about">
              Why not a broker
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Four desks, one market</h2>
          <p className="lede">
            Same instruments — Institutional, Fundamental, Retail, and Neurodivergent layouts for
            how people actually learn.
          </p>
          <div className="desk-grid">
            {(Object.keys(DESKS) as DeskId[]).map((id) => (
              <Link key={id} href={`/charts?desk=${id}`} className="desk-tile">
                <div className="eyebrow">{DESKS[id].short}</div>
                <h3>{DESKS[id].title}</h3>
                <p>{DESKS[id].tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Everything from ClearCloud</h2>
          <p className="lede">
            Live charts via clearpathtrader.com. Education, memberships, member dashboard, and
            Your World Connected — the same product world after login.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/education">
              Education
            </Link>
            <Link className="btn btn-ghost" href="/ywc">
              Your World Connected
            </Link>
            <Link className="btn btn-ghost" href="/pricing">
              Memberships
            </Link>
            <Link className="btn btn-ghost" href="/dashboard">
              Member dashboard
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
