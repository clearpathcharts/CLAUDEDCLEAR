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
            Optional broker connect is a future product path. It is not claimed as live here.
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
          <summary>What is live on this app?</summary>
          <p>
            Navigation, desks, live charts via clearpathtrader.com, education, memberships,
            Your World Connected, and member dashboard. Full ClearCloud (Stripe / Ava voice)
            remains on clearpathtrader.com.
          </p>
        </details>
        <details>
          <summary>Who is this for?</summary>
          <p>
            Traders and learners using Clear Path Trader — analysis-first desks, education, and
            Your World Connected. {" "}
            <span className="not-brokerage">(NOT A BROKERAGE.)</span>
          </p>
        </details>
      </section>
    </div>
  );
}
