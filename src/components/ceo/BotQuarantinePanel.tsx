import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  Lock,
  RefreshCw,
  ShieldAlert,
  Unlock,
  Code2,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';
import { auth } from '../../firebase';

type QuarantineStatus = 'active' | 'expired' | 'lifted';

type BotQuarantineRecord = {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  handle?: string;
  ipAddress?: string;
  reason: string;
  quarantinedCode: string;
  detectionSignals: string[];
  source: 'auto' | 'manual';
  channel?: string;
  createdAt: string;
  expiresAt: string;
  liftedAt?: string;
  liftedBy?: string;
  status: QuarantineStatus;
  featuresAllowed: true;
  communityCommsLocked: boolean;
};

type ListPayload = {
  ok: boolean;
  records: BotQuarantineRecord[];
  counts: { active: number; expired: number; lifted: number; total: number };
};

async function founderHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const current = auth.currentUser;
  if (current) {
    const token = await current.getIdToken(false);
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function BotQuarantinePanel() {
  const [filter, setFilter] = useState<QuarantineStatus | 'all'>('active');
  const [payload, setPayload] = useState<ListPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [manualUid, setManualUid] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualHandle, setManualHandle] = useState('');
  const [manualReason, setManualReason] = useState('Manual CEO quarantine — bot / automation abuse');
  const [manualCode, setManualCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await founderHeaders();
      const res = await fetch(`/api/admin/bot-quarantine?status=${filter}&limit=100`, {
        headers,
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || body.message || `Load failed (${res.status})`);
      }
      setPayload(body as ListPayload);
    } catch (err: any) {
      setError(err?.message || 'Could not load bot quarantine queue.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const lift = async (id: string) => {
    setBusyId(id);
    setSuccessMsg(null);
    try {
      const headers = await founderHeaders();
      const res = await fetch(`/api/admin/bot-quarantine/${encodeURIComponent(id)}/lift`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Lift failed');
      setSuccessMsg(`Lifted quarantine ${id} — community comms restored.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to lift quarantine.');
    } finally {
      setBusyId(null);
    }
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setError(null);
    try {
      const headers = await founderHeaders();
      const res = await fetch('/api/admin/bot-quarantine', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          uid: manualUid.trim() || undefined,
          email: manualEmail.trim() || undefined,
          handle: manualHandle.trim() || undefined,
          reason: manualReason.trim(),
          quarantinedCode: manualCode,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Quarantine failed');
      setSuccessMsg(
        `Account ${body.record?.uid} locked from community/group chat for 90 days. Other features stay available.`
      );
      setManualCode('');
      setFilter('active');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Manual quarantine failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const counts = payload?.counts;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl text-white font-black uppercase tracking-widest flex items-center gap-3">
            <Bot className="text-amber-400" size={26} />
            Bot Quarantine
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-3xl leading-relaxed">
            When someone tries to inject or load a bot into groups/communities, we identify their
            account, quarantine the payload, and lock community communication for 90 days. They keep
            charts, education, and every other feature — they just cannot post in rooms or community
            feeds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-mono uppercase tracking-widest font-black hover:bg-amber-500/20 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active locks', value: counts?.active ?? '—', color: 'text-amber-300 border-amber-500/30' },
          { label: 'Expired', value: counts?.expired ?? '—', color: 'text-zinc-300 border-zinc-500/30' },
          { label: 'Lifted', value: counts?.lifted ?? '—', color: 'text-emerald-300 border-emerald-500/30' },
          { label: 'Total events', value: counts?.total ?? '—', color: 'text-cyan-300 border-cyan-500/30' },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border bg-black/40 px-4 py-3 ${card.color}`}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{card.label}</p>
            <p className="mt-1 text-2xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      {successMsg && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form
        onSubmit={submitManual}
        className="rounded-xl border border-red-500/25 bg-red-950/20 p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-red-400">
          <ShieldAlert size={18} />
          <h3 className="text-sm font-black uppercase tracking-widest">Manual quarantine</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Paste the bot payload and identify the account. Applies a 90-day community-comms lock
          immediately.
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">User UID</span>
            <input
              value={manualUid}
              onChange={(e) => setManualUid(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white font-mono"
              placeholder="firebase / private uid"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Email</span>
            <input
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white font-mono"
              placeholder="optional"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Chat handle</span>
            <input
              value={manualHandle}
              onChange={(e) => setManualHandle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white font-mono"
              placeholder="if no uid"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Reason</span>
          <input
            value={manualReason}
            onChange={(e) => setManualReason(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Quarantined code / payload
          </span>
          <textarea
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            required
            rows={4}
            className="w-full rounded-lg border border-red-500/20 bg-black/70 px-3 py-2 text-sm text-red-100 font-mono"
            placeholder="Paste the bot script, webhook, or injection attempt…"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !manualCode.trim() || (!manualUid.trim() && !manualHandle.trim())}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50"
        >
          <Lock size={14} />
          {submitting ? 'Locking…' : 'Quarantine + 90-day community lock'}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {(['active', 'all', 'lifted', 'expired'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest font-black border ${
              filter === key
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading && !payload ? (
          <p className="text-zinc-500 text-sm font-mono">Loading quarantine queue…</p>
        ) : !payload?.records?.length ? (
          <div className="rounded-xl border border-white/10 bg-black/30 px-6 py-10 text-center text-zinc-500 text-sm">
            No quarantine records for this filter.
          </div>
        ) : (
          payload.records.map((rec) => {
            const open = expandedId === rec.id;
            return (
              <div
                key={rec.id}
                className="rounded-xl border border-white/10 bg-black/40 overflow-hidden"
              >
                <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          rec.status === 'active'
                            ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                            : rec.status === 'lifted'
                              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                              : 'border-zinc-500/40 text-zinc-400'
                        }`}
                      >
                        {rec.status}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                        {rec.source}
                      </span>
                      {rec.channel && (
                        <span className="text-[9px] font-mono text-cyan-500/80">{rec.channel}</span>
                      )}
                    </div>
                    <p className="text-white font-mono text-sm flex items-center gap-2 truncate">
                      <User size={14} className="text-zinc-500 shrink-0" />
                      {rec.displayName || rec.handle || rec.email || rec.uid}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500 truncate">UID {rec.uid}</p>
                    <p className="text-xs text-zinc-400">{rec.reason}</p>
                    <div className="flex flex-wrap gap-3 text-[10px] font-mono text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {rec.status === 'active'
                          ? `${daysLeft(rec.expiresAt)}d left · until ${new Date(rec.expiresAt).toLocaleDateString()}`
                          : `Created ${new Date(rec.createdAt).toLocaleString()}`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-500/80">
                        Features allowed
                      </span>
                      {rec.communityCommsLocked && rec.status === 'active' && (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <Lock size={12} /> Comms locked
                        </span>
                      )}
                    </div>
                    {rec.detectionSignals?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {rec.detectionSignals.map((sig) => (
                          <span
                            key={sig}
                            className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10"
                          >
                            {sig}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : rec.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono uppercase tracking-widest font-black"
                    >
                      <Code2 size={12} />
                      {open ? 'Hide code' : 'View quarantined code'}
                    </button>
                    {rec.status === 'active' && (
                      <button
                        type="button"
                        disabled={busyId === rec.id}
                        onClick={() => void lift(rec.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono uppercase tracking-widest font-black disabled:opacity-50"
                      >
                        <Unlock size={12} />
                        {busyId === rec.id ? 'Lifting…' : 'Lift early'}
                      </button>
                    )}
                  </div>
                </div>
                {open && (
                  <pre className="border-t border-white/10 bg-black/70 p-4 text-[11px] font-mono text-red-200/90 overflow-x-auto whitespace-pre-wrap break-all max-h-64">
                    {rec.quarantinedCode || '(empty)'}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
