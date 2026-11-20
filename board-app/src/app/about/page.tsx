export const metadata = {
  title: "About & FAQ",
};

export default function AboutPage() {
  return (
    <div className="container">
      <div className="page-head">
        <h1>About ClearPath Trader</h1>
        <p>
          Clear Path Markets Science Corp. builds an analysis-first educational financial markets
          platform — charts that adapt to people, not the other way around.
        </p>
      </div>

      <section className="lesson" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Manifesto (excerpt)</h2>
        <p style={{ color: "var(--text-muted)", whiteSpace: "pre-line" }}>
          {`Some people see patterns.
Some people need structure.
Some people learn visually.
Some people become overwhelmed by cluttered screens, endless indicators, and information overload.

ClearPath Markets Science was built around a different idea:

Financial education should adapt to people — not the other way around.

Before risking capital, understand the system.
Knowledge before execution. Understanding before risk. Clarity before decisions.`}
        </p>
      </section>

      <section className="faq" style={{ paddingBottom: "2.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-display)" }}>FAQ</h2>
        <details open>
          <summary>Is ClearPath Trader a brokerage?</summary>
          <p>
            No. It is not a broker-dealer, does not hold customer funds, and does not execute
            trades. It is an educational analysis platform.
          </p>
        </details>
        <details>
          <summary>Will you connect to brokers?</summary>
          <p>
            Optional broker connect is a future product path. It is not available in this board
            demo and is not claimed as live.
          </p>
        </details>
        <details>
          <summary>What are the four desks?</summary>
          <p>
            Institutional, Fundamental, Retail, and Neurodivergent — one chart site with layouts
            and tone tuned for different learners. Neurodivergent emphasizes calmer sensory UI.
          </p>
        </details>
        <details>
          <summary>What is live vs demo in this Cursor app?</summary>
          <p>
            Navigation, desks, paper candles, education teasers, membership comparison, and
            per-viewer watchlist/desk preference (Postgres when provisioned) are working. Live
            Twelve Data / FMP / Stripe / Ava voice are out of scope here and stay on production
            Cloud Run / clearpathtrader.com.
          </p>
        </details>
        <details>
          <summary>Who is this demo for?</summary>
          <p>
            Founder board meeting: a shareable hosted link to ask “What do you want to do with
            this?” Android/Capacitor wrap of clearpathtrader.com is a separate later vote.
          </p>
        </details>
      </section>
    </div>
  );
}
