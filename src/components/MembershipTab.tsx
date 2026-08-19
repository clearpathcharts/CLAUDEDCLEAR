import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/FirebaseContext';
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  Info,
  Sliders,
} from 'lucide-react';

const LINKS_STORAGE_KEY = 'clearpath_membership_payment_links';

type PaymentLinks = {
  essentialLink: string;
  plusLink: string;
  premiumLink: string;
  ultimateLink: string;
};

function isRealStripePaymentLink(url: string): boolean {
  const u = (url || '').trim();
  if (!u) return false;
  if (/buy\.stripe\.com\/mock_/i.test(u)) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'https:' && parsed.hostname === 'buy.stripe.com';
  } catch {
    return false;
  }
}

function loadStoredLinks(profile: any): PaymentLinks {
  let fromStorage: Partial<PaymentLinks> = {};
  try {
    const raw = localStorage.getItem(LINKS_STORAGE_KEY);
    if (raw) fromStorage = JSON.parse(raw) as Partial<PaymentLinks>;
  } catch {
    /* ignore */
  }
  const pick = (key: keyof PaymentLinks) => {
    const candidate = String(profile?.[key] || fromStorage[key] || '').trim();
    return isRealStripePaymentLink(candidate) ? candidate : '';
  };
  return {
    essentialLink: pick('essentialLink'),
    plusLink: pick('plusLink'),
    premiumLink: pick('premiumLink'),
    ultimateLink: pick('ultimateLink'),
  };
}

type CheckoutTierId = 'pro' | 'proplus' | 'premium' | 'ultimate';
type BillingInterval = 'month' | 'year';

type TierCard = {
  id: 'basic' | CheckoutTierId;
  /** Legacy Payment Link fallback slot (used only when server Stripe is not configured). */
  linkKey?: keyof PaymentLinks;
  name: string;
  monthly: string;
  yearlyPerMonth: string;
  badge: string;
  badgeClass: string;
  blurb: string;
  features: string[];
  cta: string;
  accentClass?: string;
};

type MembershipStatus = {
  active: boolean;
  tier: string | null;
  status: string | null;
  currentPeriodEnd?: string;
  launchTrialEndsAt?: string;
  launchTrialDaysLeft?: number;
};

const TIERS: TierCard[] = [
  {
    id: 'basic',
    linkKey: 'essentialLink',
    name: 'Basic',
    monthly: '$0',
    yearlyPerMonth: '$0',
    badge: 'FREE FOREVER',
    badgeClass: 'bg-zinc-800 text-zinc-400',
    blurb: 'Free access to core charting tools, market dashboards, educational content, and introductory trading analytics.',
    features: ['Basic Charts', 'Community Access', 'Market News', 'Educational Tools'],
    cta: 'Included Free',
  },
  {
    id: 'pro',
    linkKey: 'plusLink',
    name: 'Pro',
    monthly: '$9.95',
    yearlyPerMonth: '$7.95',
    badge: 'POPULAR',
    badgeClass: 'bg-[#06b6d4]/20 text-[#06b6d4]',
    blurb: 'Enhanced charting features, AI-assisted market tools, advanced watchlists, and premium trading resources.',
    features: ['Advanced Watchlists', 'AI Analysis', 'Premium Dashboards', 'Faster Updates'],
    cta: 'Start 15-Day Free Trial',
  },
  {
    id: 'proplus',
    name: 'Pro+',
    monthly: '$19.95',
    yearlyPerMonth: '$15.95',
    badge: 'POWER TRADER',
    badgeClass: 'bg-[#8b5cf6]/20 text-[#a78bfa]',
    blurb: 'Everything in Pro plus deeper analytics, expanded AI tooling, multi-chart layouts, and priority data refresh.',
    features: ['Everything in Pro', 'Multi-Chart Layouts', 'Expanded AI Tooling', 'Priority Refresh'],
    cta: 'Start 15-Day Free Trial',
  },
  {
    id: 'premium',
    linkKey: 'premiumLink',
    name: 'Premium',
    monthly: '$30.95',
    yearlyPerMonth: '$25.95',
    badge: 'PRO-LEVEL',
    badgeClass: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-zinc-950',
    blurb: 'Professional-grade analytics, premium indicators, advanced market intelligence, and expanded research environments.',
    features: ['Institutional Dashboard', 'Advanced Indicators', 'AI Scanner', 'Premium Research'],
    cta: 'Start 15-Day Free Trial',
    accentClass: 'border-[#00FFFF]',
  },
  {
    id: 'ultimate',
    linkKey: 'ultimateLink',
    name: 'Ultimate',
    monthly: '$69.95',
    yearlyPerMonth: '$64.95',
    badge: 'TIER TWO SUITE',
    badgeClass: 'bg-[#ec4899]/20 text-[#ec4899]',
    blurb: 'Tier Two access to advanced AI systems, institutional-style dashboards, premium analytics, and future ecosystem features.',
    features: ['All Features', 'Tier Two AI Systems', 'Advanced Analytics', 'Future Access'],
    cta: 'Start 15-Day Free Trial',
    accentClass: 'border-[#ec4899]',
  },
];

export default function MembershipTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user, userProfile, updateProfile } = useAuth();

  const [isEditLinksOpen, setIsEditLinksOpen] = useState(false);
  const [links, setLinks] = useState<PaymentLinks>(() => loadStoredLinks(userProfile));
  const [draft, setDraft] = useState<PaymentLinks>(() => loadStoredLinks(userProfile));
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [linksSaveStatus, setLinksSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [affiliateReward, setAffiliateReward] = useState<{
    discountPercent: number;
    creditDisplay: string;
    monthSignups: number;
    shareUrl: string;
  } | null>(null);

  const [stripeReady, setStripeReady] = useState(false);
  const [billing, setBilling] = useState<BillingInterval>('month');
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutBanner, setCheckoutBanner] = useState<'success' | 'cancelled' | null>(null);

  useEffect(() => {
    const next = loadStoredLinks(userProfile);
    setLinks(next);
    setDraft(next);
  }, [userProfile]);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/affiliate/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.shareUrl) return;
        setAffiliateReward({
          discountPercent: Number(data.discountPercent) || 0,
          creditDisplay: String(data.creditDisplay || '$0.00'),
          monthSignups: Number(data.monthSignups) || 0,
          shareUrl: String(data.shareUrl || ''),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const fetchMembership = async (): Promise<MembershipStatus | null> => {
    try {
      const res = await fetch('/api/membership/me', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      const status = (data?.membership as MembershipStatus) || null;
      if (status) setMembership(status);
      return status;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/stripe/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setStripeReady(Boolean(data?.configured));
      })
      .catch(() => {});
    void fetchMembership();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Returning from Stripe Checkout (?membership=success|cancelled)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('membership');
    if (outcome !== 'success' && outcome !== 'cancelled') return;
    setCheckoutBanner(outcome);
    params.delete('membership');
    params.delete('tier');
    params.delete('session_id');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);

    if (outcome !== 'success') return;
    // The webhook can land a few seconds after the redirect — poll briefly.
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      void fetchMembership().then((status) => {
        if (status?.active || attempts >= 10) window.clearInterval(timer);
      });
    }, 3000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubscribe = async (tier: TierCard) => {
    if (tier.id === 'basic') return;
    setCheckoutError('');
    setCheckoutTier(tier.id);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier.id, interval: billing }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      const fallbackLink = tier.linkKey ? links[tier.linkKey] : '';
      if (res.status === 401) {
        setCheckoutError('Sign in with your private ClearPath account to start your free trial.');
      } else if (res.status === 503 && isRealStripePaymentLink(fallbackLink)) {
        // Server key not configured — fall back to the pasted Payment Link.
        window.open(fallbackLink, '_blank', 'noopener,noreferrer');
      } else {
        setCheckoutError(String(data?.error || 'Could not start Stripe checkout. Try again.'));
      }
    } catch {
      setCheckoutError('Network error starting checkout. Try again.');
    } finally {
      setCheckoutTier(null);
    }
  };

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLinks(true);
    setLinksSaveStatus('idle');

    const cleaned: PaymentLinks = {
      essentialLink: draft.essentialLink.trim(),
      plusLink: draft.plusLink.trim(),
      premiumLink: draft.premiumLink.trim(),
      ultimateLink: draft.ultimateLink.trim(),
    };

    for (const [key, value] of Object.entries(cleaned) as [keyof PaymentLinks, string][]) {
      if (value && !isRealStripePaymentLink(value)) {
        setLinksSaveStatus('error');
        setIsSavingLinks(false);
        alert(`Invalid Stripe Payment Link for ${key}. Use a real https://buy.stripe.com/... URL (no mock links).`);
        return;
      }
    }

    try {
      localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(cleaned));
      await updateProfile({
        essentialLink: cleaned.essentialLink,
        plusLink: cleaned.plusLink,
        premiumLink: cleaned.premiumLink,
        ultimateLink: cleaned.ultimateLink,
      } as any);
      setLinks(cleaned);
      setLinksSaveStatus('success');
      setTimeout(() => setLinksSaveStatus('idle'), 4000);
    } catch (err) {
      console.error(err);
      setLinksSaveStatus('error');
    } finally {
      setIsSavingLinks(false);
    }
  };

  const isPaid = Boolean(membership?.active);
  const onLaunchTrial = membership?.status === 'launch_trial';
  const tierDisplayName = (id: string | null | undefined) => {
    const t = TIERS.find((x) => x.id === id);
    return t ? t.name.toUpperCase() : (id || 'MEMBER').toUpperCase();
  };
  const memberTierLabel = onLaunchTrial
    ? 'ULTIMATE · LAUNCH GIFT'
    : membership?.active && membership.tier
      ? `CLEARPATH ${tierDisplayName(membership.tier)}`
      : isPaid
        ? 'CLEARPATH MEMBER'
        : 'BASIC TIER';

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-12 text-white font-sans max-w-7xl mx-auto w-full select-none" id="membership_tab_container">

      {checkoutBanner === 'success' && (
        <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-5 py-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400">Free trial started</p>
            <p className="text-sm text-emerald-100 mt-1">
              {membership?.active && membership.status !== 'launch_trial'
                ? `Your ${tierDisplayName(membership.tier)} plan is live — free for 15 days, first bill after the trial.`
                : 'Stripe confirmed your plan — it activates within a few seconds. Your first 15 days are free.'}
            </p>
          </div>
        </div>
      )}
      {checkoutBanner === 'cancelled' && (
        <div className="mb-6 rounded-2xl border border-zinc-700 bg-zinc-900/60 px-5 py-4">
          <p className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">Checkout cancelled</p>
          <p className="text-sm text-zinc-300 mt-1">No charge was made. Pick a plan whenever you are ready.</p>
        </div>
      )}
      {checkoutError && (
        <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-5 py-4">
          <p className="text-[10px] font-mono font-black uppercase tracking-widest text-rose-400">Checkout error</p>
          <p className="text-sm text-rose-100 mt-1">{checkoutError}</p>
        </div>
      )}

      {affiliateReward && (affiliateReward.discountPercent > 0 || affiliateReward.creditDisplay !== '$0.00') && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400">Affiliate rewards applied</p>
            <p className="text-sm text-emerald-100 mt-1">
              {affiliateReward.discountPercent > 0
                ? `${affiliateReward.discountPercent}% off your next paid month`
                : 'Membership discount ready'}
              {affiliateReward.creditDisplay !== '$0.00'
                ? ` · ${affiliateReward.creditDisplay} account credit`
                : ''}
              {` · ${affiliateReward.monthSignups} referral${affiliateReward.monthSignups === 1 ? '' : 's'} this month`}
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('AffiliateNetwork')}
              className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-100 hover:bg-emerald-500/30"
            >
              Open affiliate desk
            </button>
          )}
        </div>
      )}

      <div className="mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black relative overflow-hidden" id="membership_header_banner">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7F00FF]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="space-y-3 relative z-10 text-left">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 text-[10px] font-mono font-black tracking-widest text-[#00FFFF] bg-cyan-400/10 border border-cyan-400/30 rounded-full flex items-center gap-1 uppercase">
              <Crown className="w-3.5 h-3.5" />
              <span>MEMBERSHIP CATALOG</span>
            </span>
            <span className="px-3 py-1 text-[10px] font-mono font-black tracking-widest text-[#FF007F] bg-pink-400/10 border border-pink-400/30 rounded-full uppercase">
              SECURE STRIPE CHECKOUT
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-white">
            CLEAR PATH MEMBERSHIPS
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            Every new member gets <span className="text-cyan-300 font-bold">Ultimate free for 15 days</span> — no card needed.
            Then pick any plan and it's <span className="text-cyan-300 font-bold">free for another 15 days</span>. Your first
            bill only lands after ~30 days, and you can cancel anytime on Stripe.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 shrink-0 w-full lg:w-72 relative z-10 text-left flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">MEMBER STATUS</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
            </div>
            <span className="text-lg font-black font-mono tracking-wide text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFD700]" />
              <span>{memberTierLabel}</span>
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-zinc-500 text-[10px] font-mono">PAYMENT VIA STRIPE</span>
            {onLaunchTrial ? (
              <span className="text-cyan-300 text-[11px] font-bold font-mono uppercase">
                {membership?.launchTrialDaysLeft || 0} DAY{(membership?.launchTrialDaysLeft || 0) === 1 ? '' : 'S'} LEFT FREE
              </span>
            ) : isPaid ? (
              <span className="text-emerald-400 text-[11px] font-bold font-mono uppercase">
                {membership?.status === 'trialing' ? 'FREE TRIAL ACTIVE' : 'PAID MEMBER'}
              </span>
            ) : (
              <span className="text-zinc-500 text-[11px] font-bold font-mono uppercase">FREE · BASIC TIER</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8">
        <div className="flex items-center gap-2 text-xs font-black font-mono tracking-wider uppercase text-cyan-400">
          <Crown className="w-4 h-4" />
          <span>MEMBERSHIP CATALOG</span>
        </div>
        <button
          type="button"
          onClick={() => setIsEditLinksOpen(!isEditLinksOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold font-mono tracking-wider text-pink-400 border border-pink-500/20 rounded-xl transition cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isEditLinksOpen ? 'CLOSE LINK EDITOR' : 'PASTE STRIPE PAYMENT LINKS'}</span>
        </button>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-zinc-950 to-black space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black font-mono text-cyan-400 uppercase tracking-widest">Private Login</h3>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Real access is your email + password via Private Login on the home page.
              Waitlist activation keys are not passwords and will not open your terminal.
            </p>
            <p className="text-zinc-400 text-xs font-mono">
              Signed in as {user?.email || 'member'} — use Private Login if you need to create or recover a password desk.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/?tab=Discovery#PrivateLogin';
              }}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-pink-600 rounded-xl text-xs font-black uppercase tracking-widest"
            >
              Go to Private Login
            </button>
          </div>

          <div className="p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-zinc-950 to-black space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-black font-mono text-indigo-400 uppercase tracking-widest">Identity Verification</h3>
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Pre-register your verification tier now. Payment gateway goes live within 90 days — lock in your tier today.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('GetVerified')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              Pre-Register Identity <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isEditLinksOpen && (
          <div className="p-6 rounded-3xl border border-pink-500/20 bg-gradient-to-r from-zinc-950 to-black text-left space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
              <h3 className="text-sm font-black font-mono text-zinc-100 uppercase tracking-widest">
                Stripe Payment Link Editor
              </h3>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-4xl">
              Paste live Payment Link URLs from <strong>Stripe Dashboard → Product catalog → Payment links</strong>.
              Only <code className="text-cyan-400">https://buy.stripe.com/…</code> URLs are accepted. No API secrets are stored here.
            </p>

            <form onSubmit={handleSaveLinks} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {(
                [
                  ['essentialLink', '1. Basic (free) link'],
                  ['plusLink', '2. Pro ($9.95/mo) link'],
                  ['premiumLink', '3. Premium ($30.95/mo) link'],
                  ['ultimateLink', '4. Ultimate ($69.95/mo) link'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">{label}</label>
                  <input
                    type="url"
                    value={draft[key]}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="https://buy.stripe.com/…"
                    className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder-zinc-700 outline-none focus:border-cyan-500"
                  />
                </div>
              ))}

              <div className="col-span-1 md:col-span-2 pt-2 flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={isSavingLinks}
                  className="py-2.5 px-6 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-xl text-xs font-black font-mono tracking-widest uppercase transition-all shadow-md cursor-pointer shrink-0"
                >
                  {isSavingLinks ? 'SAVING…' : 'SAVE PAYMENT LINKS'}
                </button>
                {linksSaveStatus === 'success' && (
                  <span className="text-emerald-400 font-mono font-bold text-xs">✓ Payment links saved.</span>
                )}
                {linksSaveStatus === 'error' && (
                  <span className="text-rose-400 font-mono font-bold text-xs">✗ Could not save. Check URLs and try again.</span>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="p-5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4 text-left max-w-4xl mx-auto">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
              <h4 className="text-xs font-black font-mono uppercase tracking-widest text-[#00D9FF]">
                30 Days Free — For Everyone
              </h4>
            </div>
            <p className="text-zinc-400 text-[11.5px] leading-relaxed max-w-2xl">
              Days 1–15: full <strong className="text-white">Ultimate</strong> access free, no card required.
              Days 16–30: the plan you choose stays free on a Stripe trial. First charge only after ~30 days —
              cancel anytime before that and pay nothing. ClearPath never collects card numbers; checkout is 100% Stripe.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-zinc-950 shrink-0">
            <button
              type="button"
              onClick={() => setBilling('month')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono transition-all cursor-pointer ${
                billing === 'month' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling('year')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono transition-all cursor-pointer ${
                billing === 'year' ? 'bg-cyan-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Yearly · Save
            </button>
          </div>
        </div>

        <div className="pricing-section rounded-3xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5" id="custom-pricing-section-container">
          {TIERS.map((tier) => {
            const fallbackHref = tier.linkKey ? links[tier.linkKey] : '';
            const fallbackLive = isRealStripePaymentLink(fallbackHref);
            const canCheckout = tier.id !== 'basic' && (stripeReady || fallbackLive);
            const isBusy = checkoutTier === tier.id;
            const isCurrent =
              membership?.active && membership.status !== 'launch_trial' && membership.tier === tier.id;
            const price = billing === 'year' ? tier.yearlyPerMonth : tier.monthly;
            return (
              <div
                key={tier.id}
                className={`pricing-card text-left flex flex-col justify-between relative p-6 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-950 to-black ${tier.accentClass || ''}`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="font-mono tracking-tight font-black text-lg">{tier.name}</h2>
                    <span className={`${tier.badgeClass} text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider whitespace-nowrap`}>
                      {tier.badge}
                    </span>
                  </div>
                  <h3 className="font-mono font-black text-2xl mt-2">
                    {price}
                    <span className="text-xs text-zinc-500 font-normal">/mo</span>
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5 min-h-[14px]">
                    {tier.id === 'basic'
                      ? 'free forever'
                      : billing === 'year'
                        ? 'billed yearly'
                        : 'billed monthly'}
                  </p>
                  <p className="text-zinc-500 text-xs mt-2 line-clamp-3">{tier.blurb}</p>
                  <ul className="list-none space-y-3.5 mt-6 mb-8 text-sm">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-zinc-300">
                        <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-cyan-400" />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  {tier.id === 'basic' ? (
                    <button
                      type="button"
                      disabled
                      className="w-full text-center py-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-xs font-black uppercase tracking-widest text-cyan-300"
                    >
                      {tier.cta}
                    </button>
                  ) : isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full text-center py-3 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-xs font-black uppercase tracking-widest text-emerald-300"
                    >
                      Your Current Plan
                    </button>
                  ) : canCheckout ? (
                    <button
                      type="button"
                      disabled={Boolean(checkoutTier)}
                      onClick={() => void handleSubscribe(tier)}
                      className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-zinc-950 text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.03] cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                    >
                      {isBusy ? 'Opening Stripe…' : tier.cta}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full text-center opacity-50 cursor-not-allowed py-3 rounded-xl border border-white/10 bg-zinc-900 text-xs font-black uppercase tracking-widest text-zinc-400"
                      title="Stripe checkout is not configured yet (set STRIPE_SECRET_KEY on the server)"
                    >
                      Coming soon
                    </button>
                  )}
                  {tier.id !== 'basic' && (
                    <p className="text-[10px] font-mono text-zinc-600 text-center">
                      15 days free · cancel anytime
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-zinc-950/70 p-5 rounded-2xl border border-white/5 text-left text-xs max-w-4xl mx-auto space-y-2">
          <span className="text-[#FFB800] uppercase font-mono font-black text-[10px] tracking-widest flex items-center gap-1">
            <Info className="w-4 h-4" />
            <span>RISK COMPLIANCE & SAFETY ASSURANCES</span>
          </span>
          <p className="text-zinc-400 leading-relaxed">
            ClearPath Trader provides informational, analytical, and advanced AI-assisted research tools solely for educational market intelligence. We do not issue guarantees of profit, financial returns, or automated trading signals. Trading involves substantial risk.
          </p>
        </div>
      </div>
    </div>
  );
}
