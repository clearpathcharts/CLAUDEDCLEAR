import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/FirebaseContext';
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  ExternalLink,
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

type TierCard = {
  id: keyof PaymentLinks;
  name: string;
  price: string;
  badge: string;
  badgeClass: string;
  blurb: string;
  features: string[];
  cta: string;
  accentClass?: string;
};

const TIERS: TierCard[] = [
  {
    id: 'essentialLink',
    name: 'Tier One',
    price: '$0.00',
    badge: 'FREE ENTRY',
    badgeClass: 'bg-zinc-800 text-zinc-400',
    blurb: 'Free access to core charting tools, market dashboards, educational content, and introductory trading analytics.',
    features: ['Basic Charts', 'Community Access', 'Market News', 'Educational Tools'],
    cta: 'Get Started',
  },
  {
    id: 'plusLink',
    name: 'Plus',
    price: '$9.99',
    badge: 'POPULAR',
    badgeClass: 'bg-[#06b6d4]/20 text-[#06b6d4]',
    blurb: 'Enhanced charting features, AI-assisted market tools, advanced watchlists, and premium trading resources.',
    features: ['Advanced Watchlists', 'AI Analysis', 'Premium Dashboards', 'Faster Updates'],
    cta: 'Subscribe',
  },
  {
    id: 'premiumLink',
    name: 'Premium',
    price: '$25.99',
    badge: 'PRO-LEVEL',
    badgeClass: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-zinc-950',
    blurb: 'Professional-grade analytics, premium indicators, advanced market intelligence, and expanded research environments.',
    features: ['Institutional Dashboard', 'Advanced Indicators', 'AI Scanner', 'Premium Research'],
    cta: 'Subscribe',
    accentClass: 'border-[#00FFFF]',
  },
  {
    id: 'ultimateLink',
    name: 'Ultimate',
    price: '$100',
    badge: 'TIER TWO SUITE',
    badgeClass: 'bg-[#ec4899]/20 text-[#ec4899]',
    blurb: 'Tier Two access to advanced AI systems, institutional-style dashboards, premium analytics, and future ecosystem features.',
    features: ['All Features', 'Tier Two AI Systems', 'Advanced Analytics', 'Future Access'],
    cta: 'Subscribe',
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

  const [wlFirstName, setWlFirstName] = useState(userProfile?.displayName?.split(' ')[0] || '');
  const [wlCountry, setWlCountry] = useState('');
  const [wlExperience] = useState('Beginner');
  const [wlSubmitting, setWlSubmitting] = useState(false);
  const [wlError, setWlError] = useState('');
  const [wlSuccess, setWlSuccess] = useState<{ activationKey: string; emailSent: boolean } | null>(null);

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

  const waitlistCountries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Japan', 'Singapore', 'Switzerland', 'United Arab Emirates',
    'South Africa', 'Nigeria', 'India', 'Brazil', 'New Zealand', 'Other',
  ];

  const handleWaitlistPreregister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setWlError('');
    setWlSubmitting(true);
    try {
      const { submitWaitlistRegistration } = await import('../api/registrations');
      const result = await submitWaitlistRegistration({
        firstName: wlFirstName.trim() || userProfile?.displayName || 'Member',
        emailAddress: user.email,
        country: wlCountry.trim(),
        experienceLevel: wlExperience,
        uid: user.uid,
      });
      setWlSuccess({ activationKey: result.activationKey, emailSent: result.emailSent });
    } catch (err: unknown) {
      setWlError(err instanceof Error ? err.message : 'Waitlist registration failed.');
    } finally {
      setWlSubmitting(false);
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
        setWlError('');
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

  const isPaid = userProfile?.vipStatus === 'vip_pro' || Boolean(userProfile?.subscriptionActive);

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-12 text-white font-sans max-w-7xl mx-auto w-full select-none" id="membership_tab_container">

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
              STRIPE PAYMENT LINKS
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-white">
            CLEAR PATH MEMBERSHIPS
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            Choose a plan below. Paid tiers check out on Stripe Payment Links — paste your live buy.stripe.com URLs in the link editor when you are ready.
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
              <span>{isPaid ? 'CLEARPATH ULTIMATE' : 'STUDENT TIER'}</span>
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-zinc-500 text-[10px] font-mono">PAYMENT VIA STRIPE</span>
            {isPaid ? (
              <span className="text-emerald-400 text-[11px] font-bold font-mono uppercase">PAID MEMBER</span>
            ) : (
              <span className="text-zinc-500 text-[11px] font-bold font-mono uppercase">UNPAID · USE CATALOG</span>
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
              <h3 className="text-sm font-black font-mono text-cyan-400 uppercase tracking-widest">Soft Launch Waitlist</h3>
            </div>
            {wlSuccess ? (
              <div className="space-y-3 text-center py-4">
                <Check className="w-8 h-8 text-cyan-400 mx-auto" />
                <p className="text-xs text-zinc-300">
                  {wlSuccess.emailSent ? 'Confirmed! Check your email for your activation key.' : 'Registered! Save your activation key:'}
                </p>
                <code className="text-lg font-black text-pink-400 font-mono block">{wlSuccess.activationKey}</code>
              </div>
            ) : (
              <form onSubmit={handleWaitlistPreregister} className="space-y-3">
                <p className="text-zinc-500 text-xs">Lock in your free soft launch account ({user?.email}).</p>
                {wlError && <p className="text-red-400 text-xs font-mono">{wlError}</p>}
                <input
                  type="text"
                  value={wlFirstName}
                  onChange={(e) => setWlFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full bg-black/60 border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-mono"
                />
                <select
                  value={wlCountry}
                  onChange={(e) => setWlCountry(e.target.value)}
                  required
                  className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-mono"
                >
                  <option value="">Select country...</option>
                  {waitlistCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={wlSubmitting || !wlCountry}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-pink-600 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {wlSubmitting ? 'Registering...' : 'Pre-Register for Soft Launch'}
                </button>
              </form>
            )}
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
                  ['essentialLink', '1. Tier One (free) link'],
                  ['plusLink', '2. Plus ($9.99/mo) link'],
                  ['premiumLink', '3. Premium ($25.99/mo) link'],
                  ['ultimateLink', '4. Ultimate ($100/mo) link'],
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
                Checkout on Stripe
              </h4>
            </div>
            <p className="text-zinc-400 text-[11.5px] leading-relaxed max-w-2xl">
              ClearPath does not collect card numbers. Paid memberships clear on Stripe Payment Links once you paste live URLs above.
            </p>
          </div>
          <a
            href="https://dashboard.stripe.com/payment-links"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono transition-all"
          >
            <span>Open Stripe Payment Links</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="pricing-section rounded-3xl" id="custom-pricing-section-container">
          {TIERS.map((tier) => {
            const href = links[tier.id];
            const live = isRealStripePaymentLink(href);
            return (
              <div
                key={tier.id}
                className={`pricing-card text-left flex flex-col justify-between relative ${tier.accentClass || ''}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="font-mono tracking-tight font-black">{tier.name}</h2>
                    <span className={`${tier.badgeClass} text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider`}>
                      {tier.badge}
                    </span>
                  </div>
                  <h3 className="font-mono font-black">
                    {tier.price}
                    <span className="text-xs text-zinc-500 font-normal">/mo</span>
                  </h3>
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
                  {live ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center transition-all duration-300 hover:scale-[1.03] block"
                    >
                      {tier.cta}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full text-center opacity-50 cursor-not-allowed py-3 rounded-xl border border-white/10 bg-zinc-900 text-xs font-black uppercase tracking-widest text-zinc-400"
                      title="Paste a live Stripe Payment Link in the editor above"
                    >
                      Coming soon — add Stripe link
                    </button>
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
