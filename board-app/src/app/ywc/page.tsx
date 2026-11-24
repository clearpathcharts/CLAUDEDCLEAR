import Link from "next/link";

const CLEARPATH = "https://clearpathtrader.com";

export default function YourWorldConnectedPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "40rem" }}>
        <p className="eyebrow">ClearCloud · inside the app</p>
        <h1>Your World Connected</h1>
        <p className="lede">
          After login, the same Clear Path Trader world you know on clearpathtrader.com —
          charts, desks, education, magazines, social, and a live chart on one screen.
        </p>
        <p>
          <span className="not-brokerage">(NOT A BROKERAGE.)</span>
        </p>
        <div className="cta-row" style={{ marginTop: "1.5rem" }}>
          <a className="btn btn-primary" href={`${CLEARPATH}/`} rel="noopener noreferrer">
            Open ClearCloud
          </a>
          <Link className="btn btn-ghost" href="/education">
            Education
          </Link>
          <Link className="btn btn-ghost" href="/charts">
            Desks &amp; charts
          </Link>
        </div>
      </div>
    </section>
  );
}
