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
          Founder package comparison. Stripe checkout lives on production clearpathtrader.com.
        </p>
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
            <a className="btn btn-ghost" href="https://clearpathtrader.com/" rel="noopener noreferrer">
              Open plans on ClearCloud
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
