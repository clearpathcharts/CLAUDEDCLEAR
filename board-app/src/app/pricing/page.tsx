import { PLANS } from "@/lib/pricing";

export const metadata = {
  title: "Memberships",
};

export default function PricingPage() {
  return (
    <div className="container">
      <div className="page-head">
        <h1>Memberships</h1>
        <p>
          Founder package comparison for board review. Checkout is intentionally disabled in this
          Cursor board demo — Stripe lives on production clearpathtrader.com.
        </p>
      </div>

      <div className="demo-banner" style={{ border: "1px solid var(--line)", marginBottom: "1.25rem" }}>
        <div className="container" style={{ width: "100%", margin: 0, maxWidth: "none" }}>
          Board demo note: membership buttons do not charge. Use this sheet to discuss packaging —
          not to sell in-room.
        </div>
      </div>

      <div className="plan-grid" style={{ paddingBottom: "2.5rem" }}>
        {PLANS.map((plan) => (
          <article key={plan.id} className={`plan${plan.featured ? " featured" : ""}`}>
            <div className="eyebrow">{plan.eyebrow}</div>
            <h3>{plan.name}</h3>
            <div className="price">
              {plan.priceLabel}
              {plan.priceLabel !== "Free" ? <span style={{ fontSize: "0.85rem" }}>/mo</span> : null}
            </div>
            <ul>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button type="button" className="btn btn-ghost" disabled aria-disabled="true">
              Checkout disabled (board demo)
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
