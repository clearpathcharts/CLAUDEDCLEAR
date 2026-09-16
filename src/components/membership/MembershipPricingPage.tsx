import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  Layers3,
  Scale,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/FirebaseContext';
import {
  FIRST_FREE_DAYS,
  LAUNCH_ACCESS_DAYS,
  MEMBERSHIP_PLANS,
  PLAN_TRIAL_DAYS,
  PLATINUM_CENTS,
  SILVER_ADDONS,
  SILVER_BASE_CENTS,
  SILVER_WITH_ALL_ADDONS_CENTS,
  formatMembershipPrice,
  type MembershipPlanPrice,
} from '../../content/membershipPricing';
import './membershipPricing.css';

const PLAN_ACCENT: Record<MembershipPlanPrice['id'], string> = {
  basic: '#00E5FF',
  silver: '#C9D3E0',
  gold: '#FF6A00',
  platinum: '#FF007F',
};

export default function MembershipPricingPage() {
  const { user } = useAuth();
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(
    () => new Set(SILVER_ADDONS.map((addon) => addon.id)),
  );

  const customTotal = useMemo(
    () =>
      SILVER_BASE_CENTS +
      SILVER_ADDONS.reduce(
        (sum, addon) => sum + (selectedAddons.has(addon.id) ? addon.priceCents : 0),
        0,
      ),
    [selectedAddons],
  );

  const toggleAddon = (id: string) => {
    setSelectedAddons((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="membership-pricing">
      <Helmet>
        <title>ClearPath Packages | Membership Preview</title>
        <meta
          name="description"
          content="Compare ClearPath Basic, Silver, Gold, and Platinum packages and preview a custom Silver configuration."
        />
        <link rel="canonical" href="https://clearpathtrader.com/pricing" />
      </Helmet>

      <a href="#membership-main" className="cp-skip-link">
        Skip to packages
      </a>

      <header className="membership-pricing__topbar">
        <a href={user ? '/desk/institutional' : '/'} className="membership-pricing__brand">
          <span className="membership-pricing__brand-mark">CP</span>
          <span>
            <strong>ClearPath Trader</strong>
            <small>Package preview</small>
          </span>
        </a>
        <a href={user ? '/desk/institutional' : '/'} className="membership-quiet-button">
          <ArrowLeft size={16} aria-hidden="true" />
          {user ? 'Institutional desk' : 'Home'}
        </a>
      </header>

      <main id="membership-main">
        <section className="membership-hero" aria-labelledby="membership-title">
          <div>
            <p className="membership-kicker">
              <span aria-hidden="true" />
              ClearPath packages
            </p>
            <h1 id="membership-title">
              Pick your level.
              <br />
              <span>Keep your path.</span>
            </h1>
            <p>
              Start with the market workspace you need today. Compare the founder-provided package sheet or shape a
              custom Silver configuration before choosing the complete Platinum package.
            </p>
            <div className="membership-hero__actions">
              <a href="#packages" className="membership-primary-button">
                Compare packages
                <ChevronDown size={17} aria-hidden="true" />
              </a>
              <a href="#custom-package" className="membership-secondary-button">
                Build custom Silver
              </a>
            </div>
            <div className="membership-trial-callout">
              <Sparkles size={18} aria-hidden="true" />
              <span>
                <strong>Your first {FIRST_FREE_DAYS} days are free.</strong>
                {LAUNCH_ACCESS_DAYS} days of launch access + {PLAN_TRIAL_DAYS} days of plan trial before the first
                charge.*
              </span>
            </div>
          </div>

          <aside className="membership-review-card" aria-label="Pricing review status">
            <div className="membership-review-card__icon">
              <Scale size={34} aria-hidden="true" />
            </div>
            <p>Package review</p>
            <strong>Visual + legal review stage</strong>
            <span>
              Checkout remains disabled. Prices shown reproduce the uploaded package sheet; billing cadence and final
              sales language still require approval.
            </span>
            <div>
              <ShieldCheck size={15} aria-hidden="true" />
              No payment will be collected on this page
            </div>
          </aside>
        </section>

        <section id="packages" className="membership-packages" aria-labelledby="packages-title">
          <div className="membership-section-heading">
            <p className="membership-kicker">
              <span aria-hidden="true" />
              Four ways in
            </p>
            <h2 id="packages-title">Choose your package</h2>
            <p>Package prices from the uploaded founder sheet. Billing period is pending legal and billing approval.</p>
          </div>

          <div className="membership-plan-grid">
            {MEMBERSHIP_PLANS.map((plan) => (
              <article
                className={`membership-plan-card ${plan.featured ? 'membership-plan-card--featured' : ''}`}
                key={plan.id}
                style={{ '--plan-accent': PLAN_ACCENT[plan.id] } as React.CSSProperties}
              >
                {plan.featured ? <span className="membership-plan-card__best">Complete package</span> : null}
                <p className="membership-plan-card__eyebrow">{plan.eyebrow}</p>
                <h3>{plan.name}</h3>
                <div className="membership-plan-card__price">
                  {plan.priceLabel}
                  {plan.priceCents > 0 ? <small>package price*</small> : <small>no charge</small>}
                </div>
                <div className="membership-plan-card__rule" />
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={13} aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" disabled className="membership-plan-card__button">
                  Review only
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="custom-package" className="membership-custom" aria-labelledby="custom-title">
          <div className="membership-custom__copy">
            <p className="membership-kicker">
              <span aria-hidden="true" />
              Silver + add-ons
            </p>
            <h2 id="custom-title">Build a custom package</h2>
            <p>
              Silver is the base. Toggle individual upgrades to see the package total beside the complete Platinum
              option.
            </p>
            <div className="membership-custom__base">
              <Layers3 size={20} aria-hidden="true" />
              <span>
                <strong>Silver base</strong>
                4 charts · 15 indicators · full drawing tools
              </span>
              <b>{formatMembershipPrice(SILVER_BASE_CENTS)}</b>
            </div>
          </div>

          <div className="membership-addon-builder">
            <div className="membership-addon-builder__list">
              {SILVER_ADDONS.map((addon) => {
                const checked = selectedAddons.has(addon.id);
                return (
                  <label key={addon.id} className={checked ? 'is-selected' : ''}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAddon(addon.id)}
                    />
                    <span className="membership-addon-builder__check">
                      {checked ? <Check size={12} aria-hidden="true" /> : null}
                    </span>
                    <span>{addon.name}</span>
                    <strong>{addon.priceLabel}</strong>
                  </label>
                );
              })}
            </div>
            <div className="membership-addon-builder__total">
              <span>
                <small>Custom Silver total</small>
                <strong>{formatMembershipPrice(customTotal)}</strong>
                <small>
                  Silver {formatMembershipPrice(SILVER_BASE_CENTS)} + {selectedAddons.size} add-on
                  {selectedAddons.size === 1 ? '' : 's'}
                </small>
              </span>
              <span className="membership-addon-builder__versus">vs</span>
              <span>
                <small>Platinum package</small>
                <strong>{formatMembershipPrice(PLATINUM_CENTS)}</strong>
                <small>Complete feature set</small>
              </span>
            </div>
            {selectedAddons.size === SILVER_ADDONS.length ? (
              <p className="membership-addon-builder__math">
                <Sparkles size={15} aria-hidden="true" />
                All add-ons: {formatMembershipPrice(SILVER_WITH_ALL_ADDONS_CENTS)} total. Platinum is{' '}
                {formatMembershipPrice(SILVER_WITH_ALL_ADDONS_CENTS - PLATINUM_CENTS)} less.
              </p>
            ) : customTotal > PLATINUM_CENTS ? (
              <p className="membership-addon-builder__math">
                <WandSparkles size={15} aria-hidden="true" />
                Platinum is {formatMembershipPrice(customTotal - PLATINUM_CENTS)} less than this selection.
              </p>
            ) : (
              <p className="membership-addon-builder__math">
                <Bot size={15} aria-hidden="true" />
                Add-ons are calculated from the prices in the uploaded package sheet.
              </p>
            )}
          </div>
        </section>

        <section className="membership-footnote" aria-label="Package review notes">
          <ShieldCheck size={23} aria-hidden="true" />
          <div>
            <strong>*Pricing preview only. Checkout and payment collection remain disabled.</strong>
            <p>
              Package price cadence, taxes, cancellation language, feature delivery status, and final terms must be
              approved before publication or sale. The current Stripe fallback amounts have not been changed.
            </p>
          </div>
        </section>
      </main>

      <footer className="membership-pricing__footer">
        <span>ClearPath Trader</span>
        <span>Package review · no active checkout</span>
      </footer>
    </div>
  );
}

