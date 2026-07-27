import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Clock, Megaphone, RefreshCw, Send, Sparkles } from 'lucide-react';
import SEO from './SEO';

type SocialPost = {
  id: string;
  platform: string;
  body: string;
  status: string;
  publishMode: string;
  scheduledAt?: string;
  publishedAt?: string;
  lastError?: string;
  title?: string;
  source?: string;
};

type StatusPayload = {
  ok: boolean;
  note?: string;
  config?: {
    dryRun: boolean;
    bufferConfigured: boolean;
    timezone: string;
    slots: string[];
    platforms: string[];
  };
  cadence?: {
    nextSlotsToday: string[];
    state?: { lastSlotKey?: string; lastResult?: string };
  };
  counts?: { total: number; byStatus: Record<string, number> };
};

const SECRET_KEY = 'clearpath_social_os_admin_secret';

function authHeaders(): HeadersInit {
  const secret = sessionStorage.getItem(SECRET_KEY) || '';
  return {
    'Content-Type': 'application/json',
    ...(secret ? { 'x-catalog-admin-secret': secret } : {}),
  };
}

/**
 * Ops console for ClearPath Social OS — daily posts at 5am / 9am / 3pm / 6pm.
 * Path: /ops/social
 */
export default function SocialOsPage() {
  const [secret, setSecret] = useState(() =>
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SECRET_KEY) || '' : ''
  );
  const [unlocked, setUnlocked] = useState(Boolean(secret));
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [platform, setPlatform] = useState('x');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState('clarity_cta');

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch('/api/social-os/status', { headers: authHeaders() }),
        fetch('/api/social-os/posts', { headers: authHeaders() }),
      ]);
      if (!sRes.ok) {
        const err = await sRes.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Status ${sRes.status}`);
      }
      const sJson = (await sRes.json()) as StatusPayload;
      const pJson = (await pRes.json()) as { posts: SocialPost[] };
      setStatus(sJson);
      setPosts(pJson.posts || []);
      setUnlocked(true);
    } catch (e) {
      setUnlocked(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    if (secret) {
      sessionStorage.setItem(SECRET_KEY, secret);
      void refresh();
    }
  }, [secret, refresh]);

  async function createDraft() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/social-os/posts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ platform, body, status: 'draft', publishMode: 'buffer' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Create failed');
      setBody('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function generateTemplate(enqueue: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/social-os/templates/generate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ kind, platform, enqueue, status: 'draft' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Template failed');
      if (!enqueue && json.draft?.body) setBody(json.draft.body);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function queuePost(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/social-os/posts/${id}/queue`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Queue failed');
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function publishNow(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/social-os/posts/${id}/publish`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Publish failed');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runSlotNow() {
    setBusy(true);
    try {
      const res = await fetch('/api/social-os/cadence/run', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Cadence run failed');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#07090c] text-zinc-200 font-sans">
      <SEO
        title="Social OS — ClearPath Trader"
        description="ClearPath site-owned social scheduler. Posts at 5am, 9am, 3pm, and 6pm."
        canonical="https://clearpathtrader.com/ops/social"
      />

      <nav className="border-b border-white/10 px-4 py-4 md:px-8 flex items-center justify-between bg-black/70 backdrop-blur">
        <a href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-300 hover:text-white">
          <ArrowLeft size={14} /> ClearPath Home
        </a>
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
          <Megaphone size={12} className="text-fuchsia-400" /> Social OS
        </span>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-fuchsia-400">Site-owned · no Zapier</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white" style={{ fontFamily: "'Cinzel', serif" }}>
            ClearPath Social OS
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Connected to clearpathtrader.com. Posts automatically at <strong className="text-zinc-200">5:00am, 9:00am, 3:00pm, and 6:00pm</strong> (America/New_York by default) through Buffer profiles for X, LinkedIn, Facebook, and Instagram.
          </p>
        </header>

        {!unlocked && (
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
            <label className="block text-xs uppercase tracking-wider text-zinc-500">Catalog admin secret</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="CATALOG_ADMIN_SECRET"
              className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/50"
            />
            <p className="text-[11px] text-zinc-500">Same secret used for River catalog admin (`x-catalog-admin-secret`).</p>
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </section>
        )}

        {unlocked && status && (
          <>
            <section className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Mode</div>
                <div className="text-lg text-white">{status.config?.dryRun ? 'Dry run' : 'Live Buffer'}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Buffer {status.config?.bufferConfigured ? 'connected' : 'not configured'}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                  <Clock size={11} /> Cadence
                </div>
                <div className="text-lg text-white">{(status.config?.slots || []).join(' · ')}</div>
                <div className="text-xs text-zinc-500 mt-1">{status.config?.timezone}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Queue</div>
                <div className="text-lg text-white">{status.counts?.total || 0} posts</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {Object.entries(status.counts?.byStatus || {})
                    .map(([k, v]) => `${k}:${v}`)
                    .join(' · ') || 'empty'}
                </div>
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void refresh()}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs uppercase tracking-wider hover:bg-white/5"
              >
                <RefreshCw size={12} /> Refresh
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runSlotNow()}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30 px-3 py-2 text-xs uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/30"
              >
                <Send size={12} /> Run next slot now
              </button>
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h2 className="text-sm uppercase tracking-wider text-zinc-400">Create / generate</h2>
              <div className="grid md:grid-cols-2 gap-3">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-sm"
                >
                  {['x', 'linkedin', 'facebook', 'instagram', 'tiktok'].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-sm"
                >
                  {['clarity_cta', 'education_tip', 'founder_story', 'feature_highlight', 'market_lesson'].map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Write a post for ClearPathTrader.com…"
                className="w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !body.trim()}
                  onClick={() => void createDraft()}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs uppercase tracking-wider hover:bg-white/15 disabled:opacity-40"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void generateTemplate(false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs uppercase tracking-wider hover:bg-white/5"
                >
                  <Sparkles size={12} /> Fill from template
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void generateTemplate(true)}
                  className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2 text-xs uppercase tracking-wider text-fuchsia-200"
                >
                  Generate + save draft
                </button>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm uppercase tracking-wider text-zinc-400">Posts</h2>
              {posts.length === 0 && (
                <p className="text-sm text-zinc-500">
                  No posts yet. At each daily slot the OS will auto-generate ClearPath templates if the queue is empty.
                </p>
              )}
              <ul className="space-y-3">
                {posts.map((p) => (
                  <li key={p.id} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider">
                      <span className="text-cyan-300">{p.platform}</span>
                      <span className="text-zinc-500">{p.status}</span>
                      <span className="text-zinc-600">{p.publishMode}</span>
                      {p.source && <span className="text-zinc-600">{p.source}</span>}
                    </div>
                    {p.title && <div className="text-sm text-zinc-300">{p.title}</div>}
                    <pre className="whitespace-pre-wrap text-sm text-zinc-400 font-sans">{p.body}</pre>
                    {p.lastError && <p className="text-xs text-rose-400">{p.lastError}</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {p.status === 'draft' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void queuePost(p.id)}
                          className="text-[11px] uppercase tracking-wider px-2 py-1 rounded border border-white/15 hover:bg-white/5"
                        >
                          Queue
                        </button>
                      )}
                      {(p.status === 'draft' || p.status === 'queued' || p.status === 'failed') && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void publishNow(p.id)}
                          className="text-[11px] uppercase tracking-wider px-2 py-1 rounded border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                        >
                          Publish now
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
