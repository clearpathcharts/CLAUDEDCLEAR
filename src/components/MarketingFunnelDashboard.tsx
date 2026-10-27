import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Film, Image, RefreshCw, Users } from 'lucide-react';
import tierContentCatalog from '../../data/marketing/tier-content-catalog.json';

type TierId = 'basic' | 'silver' | 'gold' | 'platinum';

type TierAnalytics = {
  tier: TierId;
  visits: number;
  ctas: number;
  signups: number;
  trials: number;
  conversions: number;
  signupRate: number | null;
  conversionRate: number | null;
  lifetimeMembers: number;
  goal: number;
  goalProgress: number;
  completedGoals: number;
};

type MarketingAnalytics = {
  ok: true;
  from: string;
  to: string;
  storage: 'firestore' | 'local' | 'unavailable';
  externalMetrics: { status: 'DATA UNAVAILABLE'; detail: string };
  totals: {
    visits: number;
    ctas: number;
    signups: number;
    trials: number;
    conversions: number;
    signupRate: number | null;
    conversionRate: number | null;
  };
  tiers: TierAnalytics[];
  campaignCycle: {
    goal: number;
    lifetimeMembers: number;
    currentCycle: number;
    completedCycles: number;
    progress: number;
  };
};

function pct(value: number, max: number): string {
  if (!max) return '0%';
  return `${Math.min(100, Math.max(0, (value / max) * 100))}%`;
}

function rate(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)}%`;
}

function tierLabel(tier: TierId): string {
  return tier === 'basic' ? 'Free / Basic' : tier[0].toUpperCase() + tier.slice(1);
}

export default function MarketingFunnelDashboard({
  getHeaders,
}: {
  getHeaders: () => Promise<Record<string, string>>;
}) {
  const [analytics, setAnalytics] = useState<MarketingAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getHeadersRef = useRef(getHeaders);

  useEffect(() => {
    getHeadersRef.current = getHeaders;
  }, [getHeaders]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeadersRef.current();
      const response = await fetch('/api/admin/marketing/analytics', {
        headers,
        credentials: 'include',
      });
      if (!response.ok) {
        const failed = await response.json().catch(() => ({}));
        throw new Error(failed.message || failed.error || `Analytics failed (${response.status})`);
      }
      const body = await response.json();
      setAnalytics(body as MarketingAnalytics);
    } catch (loadError: any) {
      setError(loadError?.message || 'Marketing analytics unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8" data-marketing-funnel-dashboard>
      <section className="rounded-xl border border-violet-400/25 bg-violet-500/[0.05] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="m-0 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-violet-100">
              <Users size={17} /> 100,000-member campaign cycle
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Four 25,000-member tier funnels. The visible cycle restarts at 100,000; lifetime history is preserved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-zinc-200 hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {analytics ? (
          <>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="m-0 text-3xl font-black text-white">
                  {analytics.campaignCycle.currentCycle.toLocaleString()}
                  <span className="text-base font-medium text-zinc-500">
                    {' '}/ {analytics.campaignCycle.goal.toLocaleString()}
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Lifetime attributed members: {analytics.campaignCycle.lifetimeMembers.toLocaleString()} · completed
                  cycles: {analytics.campaignCycle.completedCycles}
                </p>
              </div>
              <span className="font-mono text-xs text-violet-200">{analytics.campaignCycle.progress}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-400 transition-[width]"
                style={{ width: pct(analytics.campaignCycle.currentCycle, analytics.campaignCycle.goal) }}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {analytics.tiers.map((tier) => {
                const catalogTier = tierContentCatalog.tiers.find((item) => item.id === tier.tier);
                return (
                  <article key={tier.tier} className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="m-0 text-sm font-black text-white">{tierLabel(tier.tier)}</h4>
                      <span className="font-mono text-[10px] text-zinc-500">
                        milestone {tier.completedGoals + 1}
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-black" style={{ color: catalogTier?.accent || '#ffffff' }}>
                      {tier.goalProgress.toLocaleString()}
                      <span className="text-xs font-medium text-zinc-500"> / {tier.goal.toLocaleString()}</span>
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/60">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: pct(tier.goalProgress, tier.goal),
                          backgroundColor: catalogTier?.accent || '#ffffff',
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-600">
                      lifetime {tier.lifetimeMembers.toLocaleString()}
                    </p>
                  </article>
                );
              })}
            </div>
          </>
        ) : loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading first-party funnel data…</p>
        ) : null}
      </section>

      <section>
        <h3 className="m-0 text-sm font-black uppercase tracking-widest text-white">First-party conversion funnel</h3>
        <p className="mt-1 text-xs text-zinc-500">
          ClearPath records tracked site visits, plan actions, verified registrations, Stripe trials, and first paid conversions.
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-black/45 text-[10px] uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-3">Target tier</th>
                <th className="px-4 py-3">Visits</th>
                <th className="px-4 py-3">Plan actions</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Trials</th>
                <th className="px-4 py-3">Paid conversions</th>
                <th className="px-4 py-3">Visit → member</th>
                <th className="px-4 py-3">Member → paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {(analytics?.tiers || []).map((tier) => (
                <tr key={tier.tier} className="bg-black/20">
                  <td className="px-4 py-3 font-bold text-white">{tierLabel(tier.tier)}</td>
                  <td className="px-4 py-3 text-zinc-300">{tier.visits.toLocaleString()}</td>
                  <td className="px-4 py-3 text-zinc-300">{tier.ctas.toLocaleString()}</td>
                  <td className="px-4 py-3 text-zinc-300">{tier.signups.toLocaleString()}</td>
                  <td className="px-4 py-3 text-zinc-300">{tier.trials.toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-300">{tier.conversions.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-zinc-400">{rate(tier.signupRate)}</td>
                  <td className="px-4 py-3 font-mono text-zinc-400">{rate(tier.conversionRate)}</td>
                </tr>
              ))}
              {!analytics && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-600">
                    {loading ? 'Loading…' : 'No analytics response.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {analytics ? (
          <p className="mt-2 text-[11px] text-zinc-600">
            Storage: {analytics.storage} · reporting window {analytics.from} through {analytics.to}
          </p>
        ) : null}
        <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/[0.05] px-3 py-2 text-xs text-amber-100/80">
          <strong>Platform reach:</strong> {analytics?.externalMetrics.status || 'DATA UNAVAILABLE'} —{' '}
          {analytics?.externalMetrics.detail ||
            'Metricool reach, impressions, watch time, and saves are not connected to ClearPath yet.'}
        </p>
      </section>

      <section>
        <h3 className="m-0 text-sm font-black uppercase tracking-widest text-white">Tier creative catalog</h3>
        <p className="mt-1 text-xs text-zinc-500">
          One finished poster plus two production-ready video scripts per funnel. Export through Metricool after founder review.
        </p>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          {tierContentCatalog.tiers.map((tier) => (
            <article key={tier.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
              <div className="grid sm:grid-cols-[180px_1fr]">
                <img
                  src={tier.poster.assetUrl}
                  alt={tier.poster.alt}
                  className="h-full min-h-[230px] w-full bg-black object-cover"
                />
                <div className="p-4">
                  <p className="m-0 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: tier.accent }}>
                    {tier.label} funnel
                  </p>
                  <h4 className="mt-2 text-lg font-black text-white">{tier.poster.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">{tier.promise}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={tier.poster.assetUrl}
                      download
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-200 hover:bg-white/5"
                    >
                      <Download size={12} /> Poster SVG
                    </a>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
                      <Image size={12} /> 1080 × 1350
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 border-t border-white/10 p-4">
                {tier.videos.map((video) => (
                  <details key={video.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <summary className="cursor-pointer text-sm font-bold text-zinc-200">
                      <span className="inline-flex items-center gap-2">
                        <Film size={14} style={{ color: tier.accent }} /> {video.durationSeconds}s · {video.hook}
                      </span>
                    </summary>
                    <div className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-400">
                      <p className="m-0">
                        <strong className="text-zinc-200">Voiceover:</strong> {video.voiceover}
                      </p>
                      <ol className="m-0 list-decimal space-y-1 pl-5">
                        {video.beats.map((beat) => (
                          <li key={beat}>{beat}</li>
                        ))}
                      </ol>
                      <p className="m-0 text-cyan-200">CTA: {video.cta}</p>
                    </div>
                  </details>
                ))}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-zinc-600">{tierContentCatalog.requiredDisclaimer}</p>
      </section>
    </div>
  );
}
