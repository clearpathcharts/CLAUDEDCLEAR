import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Check, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/FirebaseContext';
import {
  FIRST_FREE_DAYS,
  LAUNCH_ACCESS_DAYS,
  MEMBERSHIP_PLANS,
  PLAN_TRIAL_DAYS,
  type MembershipPlanId,
  type MembershipPlanPrice,
} from '../../content/membershipPricing';
import { StripePlansBuyButton } from './StripePlansBuyButton';
import './membershipPricing.css';

const PLAN_ACCENT: Record<MembershipPlanPrice['id'], string> = {
  basic: '#00E5FF',
  silver: '#C9D3E0',
  gold: '#FF6A00',
  platinum: '#FF007F',
};

function readOfferedPlan(): MembershipPlanId {
  if (typeof window === 'undefined') return 'basic';
  try {
    const q = new URLSearchParams(window.location.search).get('package');
    if (q === 'basic' || q === 'silver' || q === 'gold' || q === 'platinum') return q;
  } catch {
    /* ignore */
  }
  return 'basic';
}

export default function MembershipPricingPage() {
  const { user } = useAuth();
  const [offeredId, setOfferedId] = useState<MembershipPlanId>(readOfferedPlan);
  const offered = useMemo(
    () => MEMBERSHIP_PLANS.find((plan) => plan.id === offeredId) ?? MEMBERSHIP_PLANS[0],
    [offeredId],
  );

  const choosePlan = (id: MembershipPlanId) => {
    setOfferedId(id);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('package', id);
      window.history.replaceState({ ...window.history.state }, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="membership-pricing">
      <Helmet>
        <title>ClearPath Packages | Choose what you pay for</title>
        <meta
          name="description"
          content="Choose Basic, Silver, Gold, or Platinum. You only see and unlock the features in the package you pay for."
        />
        <link rel="canonical" href="https://clearpathtrader.com/pricing" />
        <script async src="https://js.stripe.com/v3/buy-button.js" />
      </Helmet>

      <a href="#membership-main" className="cp-skip-link">
        Skip to packages
      </a>

      <header className="membership-pricing__topbar">
        <a href={user ? '/desk/institutional' : '/'} className="membership-pricing__brand">
          <span className="membership-pricing__brand-mark">CP</span>
          <span>
            <strong>ClearPath Trader</strong>
            <small>Package offer</small>
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
              <span>Pay for that path only.</span>
            </h1>
            <p>
              Choose one package. This page shows only that package&apos;s features. After payment, desks unlock that
              same list — not Gold or Platinum extras you did not buy.
            </p>
            <div className="membership-hero__actions">
              <a href="#packages" className="membership-primary-button">
                Choose a package
                <ChevronDown size={17} aria-hidden="true" />
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

          <aside className="membership-review-card" aria-label="Package checkout">
            <div className="membership-review-card__icon">
              <ShieldCheck size={34} aria-hidden="true" />
            </div>
            <p>Stripe checkout</p>
            <strong>Pay for the package you selected</strong>
            <span>
              The Buy Button on this page is the Stripe checkout issued for ClearPath packages. Your desk then shows
              only that package&apos;s features.
            </span>
            <div>
              <ShieldCheck size={15} aria-hidden="true" />
              You only unlock what you pay for
            </div>
          </aside>
        </section>

        <section id="packages" className="membership-packages" aria-labelledby="packages-title">
          <div className="membership-section-heading">
            <p className="membership-kicker">
              <span aria-hidden="true" />
              One package at a time
            </p>
            <h2 id="packages-title">Choose your package</h2>
            <p>Select Basic, Silver, Gold, or Platinum. Only that package&apos;s features stay on screen.</p>
          </div>

          <div className="membership-plan-picker" role="tablist" aria-label="Package choices">
            {MEMBERSHIP_PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                role="tab"
                aria-selected={plan.id === offered.id}
                className={`membership-plan-picker__tab ${plan.id === offered.id ? 'is-active' : ''}`}
                style={{ '--plan-accent': PLAN_ACCENT[plan.id] } as React.CSSProperties}
                onClick={() => choosePlan(plan.id)}
              >
                <strong>{plan.name}</strong>
                <span>{plan.priceLabel}</span>
              </button>
            ))}
          </div>

          <article
            className={`membership-plan-card membership-plan-card--offer ${offered.featured ? 'membership-plan-card--featured' : ''}`}
            data-testid="offered-package"
            data-package={offered.id}
            style={{ '--plan-accent': PLAN_ACCENT[offered.id] } as React.CSSProperties}
          >
            {offered.featured ? <span className="membership-plan-card__best">Complete package</span> : null}
            <p className="membership-plan-card__eyebrow">{offered.eyebrow}</p>
            <h3>{offered.name}</h3>
            <div className="membership-plan-card__price">
              {offered.priceLabel}
              {offered.priceCents > 0 ? <small>package price*</small> : <small>no charge</small>}
            </div>
            <div className="membership-plan-card__rule" />
            <p className="membership-plan-card__included">Included in {offered.name}</p>
            <ul>
              {offered.features.map((feature) => (
                <li key={feature}>
                  <Check size={13} aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {offered.id === 'basic' ? (
              <a href={user ? '/desk/institutional' : '/'} className="membership-plan-card__button membership-plan-card__button--link">
                Continue with Basic
              </a>
            ) : user ? (
              <StripePlansBuyButton planId={offered.id} uid={user.uid} />
            ) : (
              <a href="/" className="membership-plan-card__button membership-plan-card__button--link">
                Private Login to buy {offered.name}
              </a>
            )}
          </article>
        </section>

        <section className="membership-footnote" aria-label="Package notes">
          <ShieldCheck size={23} aria-hidden="true" />
          <div>
            <strong>*You only receive the features listed on the package you pay for.</strong>
            <p>
              Basic is free. Silver, Gold, and Platinum use the Stripe Buy Button on this page. After checkout, the
              signed-in desk unlocks that package — not a higher tier.
            </p>
          </div>
        </section>
      </main>

      <footer className="membership-pricing__footer">
        <span>ClearPath Trader</span>
        <span>Stripe package checkout · one package per member</span>
      </footer>
    </div>
  );
}
