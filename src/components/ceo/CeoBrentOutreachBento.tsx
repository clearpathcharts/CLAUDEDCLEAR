import React, { useCallback, useEffect, useState } from 'react';
import { Mail, RefreshCw, ExternalLink } from 'lucide-react';

type GetHeaders = () => Promise<Record<string, string>> | Record<string, string>;

type SendRow = {
  id: string;
  sentAt: string;
  dayKey: string;
  from: string;
  to: string;
  investorId: string;
  investorName: string;
  subject: string;
  bodyText: string;
};

type DayBucket = {
  dayKey: string;
  count: number;
  sends: SendRow[];
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * CEO-only bento: every Brent outreach email sent through /communications,
 * grouped by Pacific day — who it went to and what was said.
 */
export default function CeoBrentOutreachBento({ getHeaders }: { getHeaders: GetHeaders }) {
  const [days, setDays] = useState<DayBucket[]>([]);
  const [todayKey, setTodayKey] = useState('');
  const [totalSends, setTotalSends] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/communications/sent-log?limitDays=30', {
        credentials: 'include',
        headers,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
      setDays(Array.isArray(body.days) ? body.days : []);
      setTodayKey(String(body.todayKey || ''));
      setTotalSends(Number(body.totalSends) || 0);
    } catch (err: any) {
      setError(err?.message || 'Could not load Brent send log');
      setDays([]);
    } finally {
      setBusy(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = days.find((d) => d.dayKey === todayKey) || null;
  const earlier = days.filter((d) => d.dayKey !== todayKey);

  return (
    <section
      data-ceo-brent-outreach-bento
      className="mb-8 rounded-2xl border border-cyan-400/30 bg-[#071018] p-4 sm:p-6 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 text-[10px] font-mono uppercase tracking-[0.35em] text-cyan-300/80">
            Brent · CCO accountability
          </p>
          <h2 className="m-0 mt-1 text-lg sm:text-xl font-black uppercase tracking-wide text-white flex items-center gap-2">
            <Mail size={18} className="text-cyan-300" aria-hidden />
            Outreach emails sent
          </h2>
          <p className="m-0 mt-2 text-sm text-zinc-400 max-w-3xl">
            Every investor note Brent sends through the website Communications desk is logged here by Pacific day —
            recipient, subject, and full message — so you can see the work without opening his mailbox.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/communications"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono uppercase tracking-widest border border-white/15 text-zinc-200 hover:border-cyan-300/50 hover:text-cyan-100"
          >
            Open desk <ExternalLink size={12} aria-hidden />
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono uppercase tracking-widest border border-cyan-400/40 text-cyan-100 hover:bg-cyan-400/10 disabled:opacity-50"
          >
            <RefreshCw size={12} className={busy ? 'animate-spin' : ''} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
        <span className="border border-white/10 px-2 py-1">Today {todayKey || '—'}</span>
        <span className="border border-white/10 px-2 py-1">Today sent {today?.count ?? 0}</span>
        <span className="border border-white/10 px-2 py-1">Logged total {totalSends}</span>
      </div>

      {error ? (
        <p className="m-0 text-sm text-amber-200 border border-amber-400/40 bg-amber-400/10 px-3 py-2">{error}</p>
      ) : null}

      {!error && totalSends === 0 ? (
        <div className="border border-dashed border-white/15 px-4 py-8 text-center text-sm text-zinc-500">
          No outreach emails recorded yet. When Brent hits <span className="text-cyan-200">Send from Brent</span> on
          /communications (with SMTP live), each send appears in this bento the same day.
        </div>
      ) : null}

      {today ? (
        <div>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300">Today · {today.dayKey}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {today.sends.map((send) => (
              <SendBentoCard
                key={send.id}
                send={send}
                expanded={expandedId === send.id}
                onToggle={() => setExpandedId((id) => (id === send.id ? null : send.id))}
              />
            ))}
          </div>
        </div>
      ) : null}

      {earlier.map((day) => (
        <div key={day.dayKey}>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
            {day.dayKey} · {day.count} sent
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {day.sends.map((send) => (
              <SendBentoCard
                key={send.id}
                send={send}
                expanded={expandedId === send.id}
                onToggle={() => setExpandedId((id) => (id === send.id ? null : send.id))}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function SendBentoCard({
  send,
  expanded,
  onToggle,
}: {
  send: SendRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="border border-white/10 bg-black/40 p-3 sm:p-4 flex flex-col gap-2 min-h-[140px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 text-[10px] font-mono uppercase tracking-wider text-zinc-500">{formatWhen(send.sentAt)}</p>
          <h3 className="m-0 mt-1 text-sm font-bold text-white truncate">{send.investorName || 'Investor'}</h3>
        </div>
        <span className="shrink-0 text-[9px] font-mono uppercase tracking-wider text-cyan-300/80 border border-cyan-400/30 px-1.5 py-0.5">
          Sent
        </span>
      </div>
      <p className="m-0 text-xs text-cyan-100 break-all">
        <span className="text-zinc-500">To </span>
        {send.to}
      </p>
      <p className="m-0 text-xs text-zinc-300 line-clamp-2">{send.subject}</p>
      <button
        type="button"
        onClick={onToggle}
        className="mt-auto self-start text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white"
      >
        {expanded ? 'Hide message' : 'What was said'}
      </button>
      {expanded ? (
        <pre className="m-0 mt-1 max-h-56 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-300 border border-white/10 bg-black/50 p-2">
          {send.bodyText}
        </pre>
      ) : null}
    </article>
  );
}
