import React, { useEffect, useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Users,
  Trophy,
  Gift,
  Link2,
  RefreshCw,
  ArrowLeft,
  Percent,
  Wallet,
} from 'lucide-react';

type AffiliateDesk = {
  code: string;
  shareUrl: string;
  successfulReferrals: number;
  monthSignups: number;
  discountPercent: number;
  creditCents: number;
  creditDisplay: string;
  rewardTiers: { min: number; discountPercent: number; label: string }[];
  paidCreditRule: string;
  ledger: {
    id: string;
    type: string;
    amountCents: number;
    note: string;
    createdAt: string;
  }[];
  referred: { uid: string; joinedAt: string; codeUsed?: string }[];
  recentClicks: { id: string; at: string; code: string }[];
  monthKey: string;
};

type LeaderRow = {
  uid: string;
  code: string;
  monthSignups: number;
  lifetimeReferrals: number;
  discountPercent: number;
};

/**
 * ClearPath Affiliate Desk — real API-backed referral + rewards management.
 */
export default function AffiliateDashboard({
  profile: _profile,
  onBack,
}: {
  profile: any;
  onBack: () => void;
}) {
  const [desk, setDesk] = useState<AffiliateDesk | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, boardRes] = await Promise.all([
        fetch('/api/affiliate/me', { credentials: 'include' }),
        fetch('/api/affiliate/leaderboard', { credentials: 'include' }),
      ]);
      if (!meRes.ok) {
        const body = await meRes.json().catch(() => ({}));
        throw new Error(body.error || `Affiliate desk unavailable (${meRes.status})`);
      }
      const me = await meRes.json();
      setDesk(me as AffiliateDesk);
      if (boardRes.ok) {
        const board = await boardRes.json();
        setLeaders(Array.isArray(board.leaders) ? board.leaders : []);
      }
    } catch (e: unknown) {
      setDesk(null);
      setError(e instanceof Error ? e.message : 'Failed to load affiliate desk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const copyLink = async () => {
    if (!desk?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(desk.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = desk.shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-full w-full bg-[#050508] text-white p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400/80">
              Affiliate rewards
            </p>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-wide">
              Bring friends. Earn membership rewards.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400 leading-relaxed">
              Share your ClearPath link. When friends create an account, you climb the monthly
              discount ladder. When they upgrade to a paid plan, you earn 20% of their first month
              as account credit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </div>
        </div>

        {loading && !desk ? (
          <div className="flex h-40 items-center justify-center font-mono text-xs uppercase tracking-widest text-zinc-500">
            Loading affiliate desk…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-6 text-sm text-rose-200">
            {error}
            <p className="mt-2 text-xs text-zinc-500">
              Sign in with a private ClearPath account to unlock your referral link.
            </p>
          </div>
        ) : desk ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Percent className="h-4 w-4 text-emerald-400" />}
                label="This month discount"
                value={`${desk.discountPercent}%`}
                hint={`${desk.monthSignups} signup${desk.monthSignups === 1 ? '' : 's'} in ${desk.monthKey}`}
              />
              <StatCard
                icon={<Wallet className="h-4 w-4 text-amber-400" />}
                label="Account credit"
                value={desk.creditDisplay}
                hint="Applied toward paid membership"
              />
              <StatCard
                icon={<Users className="h-4 w-4 text-cyan-400" />}
                label="Lifetime referrals"
                value={String(desk.successfulReferrals)}
                hint="Friends who created accounts"
              />
              <StatCard
                icon={<Link2 className="h-4 w-4 text-fuchsia-400" />}
                label="Your code"
                value={desk.code}
                hint="Use in /r/CODE links"
              />
            </div>

            <section className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5">
              <div className="mb-3 flex items-center gap-2 text-cyan-300">
                <Share2 className="h-4 w-4" />
                <h2 className="text-sm font-black uppercase tracking-widest">Your share link</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="flex-1 break-all rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-xs text-cyan-200 sm:text-sm">
                  {desk.shareUrl}
                </code>
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-3 text-xs font-black uppercase tracking-widest text-black hover:brightness-110"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center gap-2 text-amber-300">
                <Gift className="h-4 w-4" />
                <h2 className="text-sm font-black uppercase tracking-widest">Reward ladder</h2>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {desk.rewardTiers.map((tier) => {
                  const earned = desk.monthSignups >= tier.min;
                  return (
                    <li
                      key={tier.min}
                      className={`rounded-xl border px-4 py-3 text-sm ${
                        earned
                          ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100'
                          : 'border-white/10 bg-black/30 text-zinc-400'
                      }`}
                    >
                      {tier.label}
                      {earned ? ' · unlocked' : ''}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-zinc-500">{desk.paidCreditRule}</p>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center gap-2 text-yellow-300">
                  <Trophy className="h-4 w-4" />
                  <h2 className="text-sm font-black uppercase tracking-widest">
                    Top sharers · {desk.monthKey}
                  </h2>
                </div>
                {leaders.length === 0 ? (
                  <p className="text-xs text-zinc-500">No referrals yet this month — be first.</p>
                ) : (
                  <ol className="space-y-2">
                    {leaders.slice(0, 10).map((row, i) => (
                      <li
                        key={row.uid}
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 px-3 py-2 text-xs"
                      >
                        <span className="font-mono text-zinc-400">
                          #{i + 1} · {row.code}
                          {row.code === desk.code ? ' · you' : ''}
                        </span>
                        <span className="font-bold text-white">
                          {row.monthSignups} · {row.discountPercent}% off
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-zinc-300">
                  Recent activity
                </h2>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {desk.ledger.length === 0 && desk.recentClicks.length === 0 ? (
                    <p className="text-xs text-zinc-500">No activity yet. Share your link to start.</p>
                  ) : (
                    <>
                      {desk.ledger.slice(0, 15).map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-[11px] text-zinc-300"
                        >
                          <div className="font-mono text-[9px] uppercase text-zinc-500">
                            {entry.type.replace(/_/g, ' ')} · {new Date(entry.createdAt).toLocaleString()}
                          </div>
                          <div>{entry.note}</div>
                          {entry.amountCents > 0 && (
                            <div className="text-amber-300">
                              +${(entry.amountCents / 100).toFixed(2)} credit
                            </div>
                          )}
                        </div>
                      ))}
                      {desk.recentClicks.slice(0, 8).map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-[11px] text-zinc-500"
                        >
                          Link click · {new Date(c.at).toLocaleString()}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </section>
            </div>

            {desk.referred.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-zinc-300">
                  Friends who joined
                </h2>
                <ul className="space-y-1 font-mono text-[11px] text-zinc-400">
                  {desk.referred.map((r) => (
                    <li key={r.uid} className="flex justify-between border-b border-white/5 py-2">
                      <span>{r.uid.slice(0, 14)}…</span>
                      <span>{new Date(r.joinedAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-1 text-[10px] text-zinc-500">{hint}</div>
    </div>
  );
}
