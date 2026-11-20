import Link from "next/link";
import { DESKS, type DeskId } from "@/lib/desks";

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-label="ClearPath Trader hero">
        <div className="hero-plane" aria-hidden="true" />
        <div className="container hero-content">
          <p className="hero-brand">ClearPath Trader</p>
          <h1>One chart site. Four desks. Knowledge before execution.</h1>
          <p>
            Analysis-first educational markets platform from Clear Path Markets Science Corp. —
            not a brokerage, does not hold customer funds.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/charts">
              Enter the desks
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
          <h2>Built for the board question</h2>
          <p className="lede">
            This Cursor-hosted app is a faithful product demo: working charts, desk switcher,
            education teaser, memberships comparison, and a member dashboard stub. Production live
            feeds and Stripe checkout remain on clearpathtrader.com.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/education">
              Sample lessons
            </Link>
            <Link className="btn btn-ghost" href="/pricing">
              Membership sheet
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
