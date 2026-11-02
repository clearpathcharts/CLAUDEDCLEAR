import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Film,
  Globe,
  Image as ImageIcon,
  Megaphone,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';

type GetHeaders = () => Promise<Record<string, string>>;

type Asset = {
  id: string;
  title: string;
  kind: 'image' | 'video';
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  url: string;
  publicRead: boolean | null;
  source: 'marketing' | 'video-library';
};

type Post = {
  id: string;
  assetId: string;
  assetKind: 'image' | 'video';
  mediaUrl: string;
  assetTitle: string;
  platform: string;
  tier: string;
  caption: string;
  hashtags: string[];
  trackedLink: string;
  status: 'draft' | 'approved' | 'posted' | 'archived';
  postedUrl: string | null;
  createdAt: string;
  postedAt: string | null;
};

type Destination = {
  platform: string;
  label: string;
  mode: 'manual';
  keywords: string[];
  counts: { draft: number; approved: number; posted: number };
  lastPostedAt: string | null;
  lastPostedUrl: string | null;
};

type Ping = {
  at: string;
  trigger: 'startup' | 'manual';
  submitted: number;
  ok: boolean;
  skipped: string | null;
  results: { endpoint: string; status: number }[];
};

type FunnelTotals = { visits: number; ctas: number; signups: number; trials: number; conversions: number };

type Overview = {
  generatedAt: string;
  storage: {
    assets: { configured: boolean; bucket: string | null; reason?: string };
    outbox: 'firestore' | 'local' | 'unavailable';
    outboxError: string | null;
    libraryError: string | null;
  };
  limits: { contentTypes: string[]; imageMaxBytes: number; videoMaxBytes: number };
  assets: { total: number; images: number; videos: number };
  outbox: { total: number; byStatus: Record<string, number> };
  destinations: Destination[];
  publishing: { mode: string; detail: string; metricool: string };
  funnel: { ok: boolean; from?: string; to?: string; storage?: string; totals?: FunnelTotals; error?: string };
  externalReach: { status: string; detail: string };
  sitemap: { totalUrls: number; index: string; sections: Array<{ id: string; label: string; file: string; count: number }> };
  searchEngines: {
    indexNowKey: boolean;
    priorityUrls: number;
    pings: Ping[];
    google: { status: string; detail: string };
  };
};

type SitemapPage = {
  total: number;
  page: number;
  pages: number;
  rows: Array<{ path: string; url: string; section: string; lastmod: string }>;
};

type UploadRow = { key: string; name: string; percent: number; state: 'uploading' | 'finishing' | 'done' | 'error'; message?: string };

const TIERS = [
  { id: 'basic', label: 'Free / Basic' },
  { id: 'silver', label: 'Silver' },
  { id: 'gold', label: 'Gold' },
  { id: 'platinum', label: 'Platinum' },
];

const STATUS_TABS: Array<Post['status']> = ['draft', 'approved', 'posted', 'archived'];

const EXT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
};

function fileType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return EXT_TYPES[ext] || '';
}

function formatBytes(n: number): string {
  if (!n) return '0 MB';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

function putWithProgress(uploadUrl: string, file: File, contentType: string, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Bucket refused the upload (${xhr.status}).`));
    xhr.onerror = () => reject(new Error('The browser could not reach the bucket.'));
    xhr.send(file);
  });
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function Bento({
  title,
  icon,
  accent = 'text-fuchsia-200',
  className = '',
  right,
  children,
  ...rest
}: {
  title: string;
  icon?: React.ReactNode;
  accent?: string;
  className?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`rounded-xl border border-white/10 bg-black/25 p-4 ${className}`} {...rest}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className={`m-0 flex items-center gap-2 text-sm font-black uppercase tracking-widest ${accent}`}>
          {icon}
          {title}
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Unavailable({ label = 'DATA UNAVAILABLE', detail }: { label?: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300">
      <span className="font-mono font-black uppercase tracking-widest text-zinc-400">{label}</span>
      {detail ? <p className="m-0 mt-1 leading-relaxed">{detail}</p> : null}
    </div>
  );
}

const BTN =
  'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-3 text-xs font-black uppercase tracking-widest disabled:opacity-40';

export default function MarketingDepartment({ getHeaders }: { getHeaders: GetHeaders }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const headers = await getHeaders();
      const res = await fetch(`/api/ceo/marketing${path}`, {
        ...init,
        headers: { ...headers, 'Content-Type': 'application/json', ...(init.headers as Record<string, string> | undefined) },
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Request failed (${res.status})`);
      return body;
    },
    [getHeaders]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, lib, box] = await Promise.all([
        api('/overview'),
        api('/assets').catch(() => ({ assets: [] })),
        api('/outbox').catch(() => ({ posts: [] })),
      ]);
      setOverview(ov as Overview);
      setAssets((lib as { assets: Asset[] }).assets || []);
      setPosts((box as { posts: Post[] }).posts || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load the Marketing Department.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const flash = (text: string) => {
    setNote(text);
    window.setTimeout(() => setNote((current) => (current === text ? null : current)), 5000);
  };

  // ── uploads ───────────────────────────────────────────────────────────────
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const patchUpload = (key: string, patch: Partial<UploadRow>) =>
    setUploads((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const handleFiles = async (list: FileList | null) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    const rows = files.map((f, i) => ({ key: `${Date.now()}-${i}`, name: f.name, percent: 0, state: 'uploading' as const }));
    setUploads((prev) => [...rows, ...prev].slice(0, 12));
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]!;
      const key = rows[i]!.key;
      try {
        const contentType = fileType(file);
        const session = await api('/assets/upload-url', {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            contentType,
            sizeBytes: file.size,
            title: files.length === 1 ? uploadTitle.trim() || undefined : undefined,
          }),
        });
        await putWithProgress(session.uploadUrl, file, contentType, (percent) => patchUpload(key, { percent }));
        patchUpload(key, { state: 'finishing', percent: 100 });
        await api(`/assets/${session.id}/finalize`, { method: 'POST', body: '{}' });
        patchUpload(key, { state: 'done', message: 'Saved to the library.' });
      } catch (err: any) {
        patchUpload(key, { state: 'error', message: err?.message || 'Upload failed.' });
      }
    }
    setUploadTitle('');
    await refresh();
  };

  // ── planning ──────────────────────────────────────────────────────────────
  const channels = overview?.destinations.map((d) => d.platform) || [];
  const [planFor, setPlanFor] = useState<Asset | null>(null);
  const [planTier, setPlanTier] = useState('basic');
  const [planPlatforms, setPlanPlatforms] = useState<string[]>([]);
  const [planning, setPlanning] = useState(false);

  const openPlanner = (asset: Asset) => {
    setPlanFor(asset);
    setPlanPlatforms(channels);
  };

  const createDrafts = async () => {
    if (!planFor) return;
    setPlanning(true);
    try {
      const body = await api('/outbox/plan', {
        method: 'POST',
        body: JSON.stringify({ assetId: planFor.id, tier: planTier, platforms: planPlatforms }),
      });
      flash(`${body.posts?.length || 0} drafts added to the outbox for “${planFor.title}”.`);
      setPlanFor(null);
      setOutboxTab('draft');
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Could not create drafts.');
    } finally {
      setPlanning(false);
    }
  };

  const deleteAsset = async (asset: Asset) => {
    if (!window.confirm(`Delete “${asset.title}” from the bucket? Unposted drafts for it are removed too.`)) return;
    try {
      await api(`/assets/${asset.id}`, { method: 'DELETE' });
      flash('Asset deleted.');
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Delete failed.');
    }
  };

  // ── outbox ────────────────────────────────────────────────────────────────
  const [outboxTab, setOutboxTab] = useState<Post['status']>('draft');
  const [captionEdits, setCaptionEdits] = useState<Record<string, string>>({});
  const [postedUrls, setPostedUrls] = useState<Record<string, string>>({});

  const patchPost = async (post: Post, patch: Record<string, unknown>, done: string) => {
    try {
      await api(`/outbox/${post.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      flash(done);
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Update failed.');
    }
  };

  const removePost = async (post: Post) => {
    if (!window.confirm('Delete this post from the outbox?')) return;
    try {
      await api(`/outbox/${post.id}`, { method: 'DELETE' });
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Delete failed.');
    }
  };

  const visiblePosts = posts.filter((p) => p.status === outboxTab);

  // ── sitemap explorer ──────────────────────────────────────────────────────
  const [smSection, setSmSection] = useState('');
  const [smQuery, setSmQuery] = useState('');
  const [smPage, setSmPage] = useState(1);
  const [sitemap, setSitemap] = useState<SitemapPage | null>(null);
  const [smError, setSmError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ page: String(smPage) });
        if (smSection) params.set('section', smSection);
        if (smQuery.trim()) params.set('q', smQuery.trim());
        const body = await api(`/sitemap?${params.toString()}`);
        if (!cancelled) {
          setSitemap(body as SitemapPage);
          setSmError(null);
        }
      } catch (err: any) {
        if (!cancelled) setSmError(err?.message || 'Sitemap failed to load.');
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [api, smSection, smQuery, smPage]);

  // ── search engines ────────────────────────────────────────────────────────
  const [pinging, setPinging] = useState(false);
  const pingNow = async () => {
    setPinging(true);
    try {
      const body = await api('/indexnow', { method: 'POST', body: '{}' });
      flash(`IndexNow: ${body.entry?.submitted ?? 0} URLs sent.`);
    } catch (err: any) {
      setError(err?.message || 'IndexNow ping failed.');
    } finally {
      setPinging(false);
      await refresh();
    }
  };

  const funnel = overview?.funnel.ok ? overview.funnel.totals : null;
  const assetsKnown = Boolean(overview && overview.storage.assets.configured && !overview.storage.libraryError);
  const outboxKnown = Boolean(overview && overview.storage.outbox !== 'unavailable' && !overview.storage.outboxError);
  const pipeline = useMemo(
    () => [
      { label: 'Assets', value: assetsKnown ? overview!.assets.total : null, hint: 'in the bucket' },
      { label: 'Drafts', value: outboxKnown ? overview!.outbox.byStatus.draft ?? 0 : null, hint: 'waiting on you' },
      { label: 'Approved', value: outboxKnown ? overview!.outbox.byStatus.approved ?? 0 : null, hint: 'ready to post' },
      { label: 'Posted', value: outboxKnown ? overview!.outbox.byStatus.posted ?? 0 : null, hint: 'live links' },
      { label: 'Visits', value: funnel ? funnel.visits : null, hint: 'tracked /go links' },
      { label: 'CTA clicks', value: funnel ? funnel.ctas : null, hint: 'plan buttons' },
      { label: 'Sign-ups', value: funnel ? funnel.signups : null, hint: 'accounts' },
      { label: 'Trials', value: funnel ? funnel.trials : null, hint: 'started' },
      { label: 'Paid', value: funnel ? funnel.conversions : null, hint: 'revenue' },
    ],
    [overview, funnel, assetsKnown, outboxKnown]
  );

  const storageReady = overview?.storage.assets.configured ?? false;

  return (
    <div data-ceo-marketing-department className="space-y-4 rounded-2xl border border-fuchsia-400/30 bg-[#120a18] p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="m-0 flex items-center gap-2 text-lg font-black uppercase tracking-widest text-fuchsia-200">
            <Megaphone size={22} aria-hidden="true" /> Marketing Department
          </h2>
          <p className="m-0 max-w-3xl text-sm leading-relaxed text-zinc-300">
            Load images and videos, turn each one into ready-to-post captions with tracked links, approve them, post them, and
            watch the visits, sign-ups and paid members those links bring back. Every number here is measured; anything not
            connected yet says so.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className={`${BTN} border border-fuchsia-400/40 text-fuchsia-100 hover:bg-fuchsia-400/10`}
        >
          <RefreshCw size={14} aria-hidden="true" className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      {error ? (
        <p role="alert" className="m-0 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      ) : null}
      {note ? (
        <p role="status" className="m-0 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
          {note}
        </p>
      ) : null}

      {/* Pipeline strip */}
      <Bento title="The machine — what's going in, out, and coming back" icon={<ArrowRight size={16} aria-hidden="true" />} data-mkt-pipeline>
        <ol className="m-0 grid list-none grid-cols-3 gap-2 p-0 sm:grid-cols-5 lg:grid-cols-9">
          {pipeline.map((step, i) => (
            <li key={step.label} className="relative rounded-lg border border-white/10 bg-black/30 px-2 py-3 text-center">
              <p className="m-0 text-[10px] font-black uppercase tracking-widest text-zinc-400">{step.label}</p>
              <p className="m-0 mt-1 font-mono text-2xl font-black text-white">
                {step.value === null ? <span className="text-xs text-zinc-500">DATA UNAVAILABLE</span> : step.value.toLocaleString()}
              </p>
              <p className="m-0 text-[10px] text-zinc-500">{step.hint}</p>
              {i < pipeline.length - 1 ? (
                <ArrowRight size={12} aria-hidden="true" className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-fuchsia-300 lg:block" />
              ) : null}
            </li>
          ))}
        </ol>
        <p className="m-0 mt-2 text-xs text-zinc-500">
          {overview?.funnel.ok
            ? `Funnel window ${overview.funnel.from} → ${overview.funnel.to} (storage: ${overview.funnel.storage}).`
            : overview
              ? `Funnel numbers unavailable: ${overview.funnel.error || 'no data source'}.`
              : 'Loading…'}
        </p>
      </Bento>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upload */}
        <Bento title="Load media" icon={<Upload size={16} aria-hidden="true" />} accent="text-[#00FFFF]" data-mkt-upload>
          {overview && !storageReady ? (
            <Unavailable label="STORAGE NOT CONFIGURED" detail={overview.storage.assets.reason} />
          ) : (
            <div className="space-y-3">
              <label className="block text-xs text-zinc-300">
                Title / headline (used in captions)
                <input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Start with the chart"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  void handleFiles(e.dataTransfer.files);
                }}
                className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center ${
                  dragOver ? 'border-[#00FFFF] bg-[#00FFFF]/10' : 'border-white/20 hover:border-[#00FFFF]/60'
                }`}
              >
                <Upload size={28} aria-hidden="true" className="text-[#00FFFF]" />
                <p className="m-0 text-sm font-black uppercase tracking-widest text-white">Tap or drop files</p>
                <p className="m-0 text-xs text-zinc-400">
                  Posters, artwork, Flow clips, MP4. Images up to {overview ? formatBytes(overview.limits.imageMaxBytes) : '…'}, videos up to{' '}
                  {overview ? formatBytes(overview.limits.videoMaxBytes) : '…'}.
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.m4v,.webm,.mkv"
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              {uploads.length ? (
                <ul className="m-0 list-none space-y-1 p-0">
                  {uploads.map((u) => (
                    <li key={u.key} className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="truncate text-zinc-200">{u.name}</span>
                        <span className={u.state === 'error' ? 'text-red-300' : u.state === 'done' ? 'text-emerald-300' : 'text-zinc-400'}>
                          {u.state === 'uploading' ? `${u.percent}%` : u.state}
                        </span>
                      </div>
                      {u.message ? <p className="m-0 text-[11px] text-zinc-400">{u.message}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </Bento>

        {/* Library */}
        <Bento
          title={`Asset library (${assets.length})`}
          icon={<ImageIcon size={16} aria-hidden="true" />}
          className="lg:col-span-2"
          data-mkt-library
          right={
            overview ? (
              <span className="font-mono text-[11px] text-zinc-400">
                {overview.assets.images} images · {overview.assets.videos} videos
              </span>
            ) : null
          }
        >
          {overview?.storage.libraryError ? <Unavailable detail={overview.storage.libraryError} /> : null}
          {!assets.length ? (
            <p className="m-0 text-sm text-zinc-400">No assets yet. Load a poster or video on the left to start.</p>
          ) : (
            <ul className="m-0 grid max-h-[520px] list-none grid-cols-2 gap-3 overflow-y-auto p-0 md:grid-cols-3">
              {assets.map((a) => (
                <li key={`${a.source}-${a.id}`} className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-black/40">
                  <div className="aspect-video bg-black">
                    {a.kind === 'image' ? (
                      <img src={a.url} alt={a.title} loading="lazy" className="h-full w-full object-contain" />
                    ) : (
                      <video src={a.url} preload="metadata" muted controls className="h-full w-full object-contain" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2">
                    <p className="m-0 line-clamp-2 text-xs font-bold text-white" title={a.title}>
                      {a.kind === 'video' ? <Film size={12} aria-hidden="true" className="mr-1 inline" /> : null}
                      {a.title}
                    </p>
                    <p className="m-0 text-[10px] text-zinc-500">
                      {formatBytes(a.sizeBytes)} · {a.source === 'video-library' ? 'Explainer video library' : 'Marketing upload'}
                      {a.publicRead === false ? ' · not public' : ''}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => openPlanner(a)}
                        className={`${BTN} flex-1 bg-fuchsia-500 text-black hover:bg-fuchsia-400`}
                      >
                        <Send size={12} aria-hidden="true" /> Plan posts
                      </button>
                      {a.source === 'marketing' ? (
                        <button
                          type="button"
                          aria-label={`Delete ${a.title}`}
                          onClick={() => void deleteAsset(a)}
                          className={`${BTN} border border-red-500/40 text-red-200 hover:bg-red-500/10`}
                        >
                          <Trash2 size={12} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Bento>
      </div>

      {planFor ? (
        <Bento title={`Plan posts for “${planFor.title}”`} icon={<Send size={16} aria-hidden="true" />} accent="text-amber-200" data-mkt-planner>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Send viewers to</span>
              {TIERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPlanTier(t.id)}
                  className={`${BTN} border ${planTier === t.id ? 'border-amber-300 bg-amber-300 text-black' : 'border-white/20 text-zinc-200'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {overview?.destinations.map((d) => {
                const on = planPlatforms.includes(d.platform);
                return (
                  <label
                    key={d.platform}
                    className={`flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-bold ${
                      on ? 'border-fuchsia-300 bg-fuchsia-400/15 text-white' : 'border-white/15 text-zinc-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setPlanPlatforms((prev) => (on ? prev.filter((p) => p !== d.platform) : [...prev, d.platform]))
                      }
                    />
                    {d.label}
                  </label>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={planning || !planPlatforms.length}
                onClick={() => void createDrafts()}
                className={`${BTN} bg-amber-300 text-black hover:bg-amber-200`}
              >
                {planning ? 'Writing drafts…' : `Write ${planPlatforms.length} drafts`}
              </button>
              <button type="button" onClick={() => setPlanFor(null)} className={`${BTN} border border-white/20 text-zinc-300`}>
                Cancel
              </button>
            </div>
            <p className="m-0 text-xs text-zinc-500">
              Captions use your title, the plan's approved pitch, a tracked link per platform, platform search hashtags and the
              required disclaimer. Nothing is posted until you approve and post it.
            </p>
          </div>
        </Bento>
      ) : null}

      {/* Outbox */}
      <Bento
        title="Outbox — approve, copy, post"
        icon={<CheckCircle2 size={16} aria-hidden="true" />}
        accent="text-emerald-200"
        data-mkt-outbox
        right={
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setOutboxTab(s)}
                className={`${BTN} min-h-[32px] border ${outboxTab === s ? 'border-emerald-300 bg-emerald-300 text-black' : 'border-white/15 text-zinc-300'}`}
              >
                {s} ({overview?.outbox.byStatus[s] ?? 0})
              </button>
            ))}
          </div>
        }
      >
        {overview?.storage.outbox === 'unavailable' ? (
          <Unavailable label="OUTBOX STORAGE UNAVAILABLE" detail="Firestore is not reachable, so drafts cannot be saved durably." />
        ) : null}
        {overview?.storage.outboxError ? <Unavailable detail={overview.storage.outboxError} /> : null}
        {!visiblePosts.length ? (
          <p className="m-0 text-sm text-zinc-400">Nothing {outboxTab}. Use “Plan posts” on an asset to fill the queue.</p>
        ) : (
          <ul className="m-0 grid max-h-[720px] list-none gap-3 overflow-y-auto p-0 md:grid-cols-2">
            {visiblePosts.map((p) => {
              const caption = captionEdits[p.id] ?? p.caption;
              const dirty = caption !== p.caption;
              return (
                <li key={p.id} className="space-y-2 rounded-lg border border-white/10 bg-black/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-fuchsia-200">
                      {overview?.destinations.find((d) => d.platform === p.platform)?.label || p.platform}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-zinc-500">→ {p.tier} plan</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-black">
                      {p.assetKind === 'image' ? (
                        <img src={p.mediaUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <video src={p.mediaUrl} preload="metadata" muted className="h-full w-full object-cover" />
                      )}
                    </div>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaptionEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      rows={5}
                      aria-label="Caption"
                      className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 text-xs text-zinc-100"
                    />
                  </div>
                  <p className="m-0 text-[10px] text-zinc-500">
                    {caption.length} chars · link <span className="font-mono text-zinc-400">{p.trackedLink.replace('https://', '')}</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {dirty ? (
                      <button
                        type="button"
                        onClick={() => void patchPost(p, { caption }, 'Caption saved.')}
                        className={`${BTN} bg-white text-black`}
                      >
                        Save caption
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={async () => flash((await copyText(caption)) ? 'Caption copied.' : 'Copy blocked — select the text instead.')}
                      className={`${BTN} border border-white/20 text-zinc-100`}
                    >
                      <Copy size={12} aria-hidden="true" /> Caption
                    </button>
                    <a href={p.mediaUrl} target="_blank" rel="noreferrer" className={`${BTN} border border-white/20 text-zinc-100`}>
                      <ExternalLink size={12} aria-hidden="true" /> Media
                    </a>
                    {p.status === 'draft' ? (
                      <button
                        type="button"
                        onClick={() => void patchPost(p, { status: 'approved' }, 'Approved. Copy it and post it.')}
                        className={`${BTN} bg-emerald-400 text-black hover:bg-emerald-300`}
                      >
                        <CheckCircle2 size={12} aria-hidden="true" /> Approve
                      </button>
                    ) : null}
                    {p.status !== 'archived' && p.status !== 'posted' ? (
                      <button
                        type="button"
                        onClick={() => void patchPost(p, { status: 'archived' }, 'Archived.')}
                        className={`${BTN} border border-white/15 text-zinc-400`}
                      >
                        Archive
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label="Delete post"
                      onClick={() => void removePost(p)}
                      className={`${BTN} border border-red-500/40 text-red-200`}
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </div>
                  {p.status === 'approved' ? (
                    <div className="flex flex-wrap gap-1">
                      <input
                        value={postedUrls[p.id] ?? ''}
                        onChange={(e) => setPostedUrls((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Paste the live post link (https://…)"
                        className="min-h-[40px] flex-1 rounded-lg border border-white/15 bg-black/40 px-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        disabled={!(postedUrls[p.id] || '').trim()}
                        onClick={() =>
                          void patchPost(p, { postedUrl: (postedUrls[p.id] || '').trim(), status: 'posted' }, 'Marked posted.')
                        }
                        className={`${BTN} bg-[#00FFFF] text-black`}
                      >
                        Mark posted
                      </button>
                    </div>
                  ) : null}
                  {p.status === 'posted' && p.postedUrl ? (
                    <a href={p.postedUrl} target="_blank" rel="noreferrer" className="block truncate text-xs text-[#00FFFF] underline">
                      Live: {p.postedUrl}
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Bento>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Destinations */}
        <Bento
          title="Where it's going"
          icon={<Globe size={16} aria-hidden="true" />}
          className="lg:col-span-2"
          accent="text-amber-200"
          data-mkt-destinations
          right={
            <span className="font-mono text-[11px] text-zinc-400">
              Auto-posting: OFF · Metricool: {overview?.publishing.metricool || '…'}
            </span>
          }
        >
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 xl:grid-cols-3">
            {overview?.destinations.map((d) => (
              <li key={d.platform} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white">{d.label}</span>
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] uppercase text-zinc-300">Manual</span>
                </div>
                <p className="m-0 mt-1 font-mono text-[11px] text-zinc-400">
                  {d.counts.draft} draft · {d.counts.approved} approved · {d.counts.posted} posted
                </p>
                <p className="m-0 text-[11px] text-zinc-500">
                  Last post:{' '}
                  {d.lastPostedUrl ? (
                    <a href={d.lastPostedUrl} target="_blank" rel="noreferrer" className="text-[#00FFFF] underline">
                      {formatWhen(d.lastPostedAt)}
                    </a>
                  ) : (
                    'none yet'
                  )}
                </p>
                {d.keywords.length ? (
                  <p className="m-0 mt-1 line-clamp-2 text-[10px] text-zinc-500" title={d.keywords.join(', ')}>
                    Targets: {d.keywords.slice(0, 5).join(' · ')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <Unavailable label={overview?.externalReach.status || 'DATA UNAVAILABLE'} detail={overview?.externalReach.detail} />
          </div>
        </Bento>

        {/* Search engines */}
        <Bento title="Search engines" icon={<Search size={16} aria-hidden="true" />} accent="text-[#00FFFF]" data-mkt-search>
          <p className="m-0 font-mono text-3xl font-black text-white">{overview ? overview.sitemap.totalUrls.toLocaleString() : '…'}</p>
          <p className="m-0 text-xs text-zinc-400">URLs in the live sitemap</p>
          <ul className="m-0 mt-3 list-none space-y-1 p-0">
            {overview?.sitemap.sections.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 truncate text-zinc-300">{s.label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded bg-white/5">
                  <span
                    className="block h-full bg-[#00FFFF]/60"
                    style={{ width: `${Math.max(2, (s.count / Math.max(1, overview.sitemap.totalUrls)) * 100)}%` }}
                  />
                </span>
                <span className="w-12 text-right font-mono text-zinc-400">{s.count}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Bing / Yandex (IndexNow)</span>
              <button
                type="button"
                disabled={pinging || !overview?.searchEngines.indexNowKey}
                onClick={() => void pingNow()}
                className={`${BTN} min-h-[32px] bg-[#00FFFF] text-black`}
              >
                {pinging ? 'Pinging…' : 'Ping now'}
              </button>
            </div>
            {overview?.searchEngines.pings.length ? (
              <ul className="m-0 list-none space-y-1 p-0">
                {overview.searchEngines.pings.slice(0, 5).map((ping) => (
                  <li key={ping.at} className="text-[11px] text-zinc-400">
                    <span className={ping.ok ? 'text-emerald-300' : 'text-red-300'}>{ping.ok ? 'OK' : 'FAILED'}</span> ·{' '}
                    {formatWhen(ping.at)} · {ping.submitted} URLs · {ping.trigger}
                    {ping.skipped ? ` · skipped: ${ping.skipped}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[11px] text-zinc-500">No pings recorded since this log was added.</p>
            )}
            <p className="m-0 text-xs font-bold uppercase tracking-widest text-zinc-300">Google</p>
            <Unavailable label={overview?.searchEngines.google.status || 'DATA UNAVAILABLE'} detail={overview?.searchEngines.google.detail} />
            <a
              href="https://search.google.com/search-console/sitemaps"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#00FFFF] underline"
            >
              Open Search Console sitemaps <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
        </Bento>
      </div>

      {/* Sitemap explorer */}
      <Bento
        title={`Every page on the site${sitemap ? ` (${sitemap.total.toLocaleString()})` : ''}`}
        icon={<Globe size={16} aria-hidden="true" />}
        accent="text-[#00FFFF]"
        data-mkt-sitemap
        right={
          <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-xs text-[#00FFFF] underline">
            sitemap.xml
          </a>
        }
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <select
            value={smSection}
            onChange={(e) => {
              setSmSection(e.target.value);
              setSmPage(1);
            }}
            aria-label="Section"
            className="min-h-[40px] rounded-lg border border-white/15 bg-black/40 px-2 text-xs text-white"
          >
            <option value="">All sections</option>
            {overview?.sitemap.sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.count})
              </option>
            ))}
          </select>
          <input
            value={smQuery}
            onChange={(e) => {
              setSmQuery(e.target.value);
              setSmPage(1);
            }}
            placeholder="Search paths, e.g. gold, aapl, rsi"
            aria-label="Search pages"
            className="min-h-[40px] flex-1 rounded-lg border border-white/15 bg-black/40 px-3 text-xs text-white"
          />
        </div>
        {smError ? <Unavailable detail={smError} /> : null}
        {sitemap ? (
          <>
            <ul className="m-0 grid max-h-[480px] list-none gap-x-4 overflow-y-auto p-0 font-mono text-[11px] md:grid-cols-2">
              {sitemap.rows.map((r) => (
                <li key={r.url} className="flex justify-between gap-2 border-b border-white/5 py-1">
                  <a href={r.path} target="_blank" rel="noreferrer" className="truncate text-zinc-200 hover:text-[#00FFFF]">
                    {r.path}
                  </a>
                  <span className="shrink-0 text-zinc-600">{r.section}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <button
                type="button"
                disabled={sitemap.page <= 1}
                onClick={() => setSmPage((p) => Math.max(1, p - 1))}
                className={`${BTN} border border-white/15 text-zinc-200`}
              >
                Previous
              </button>
              <span>
                Page {sitemap.page} of {sitemap.pages}
              </span>
              <button
                type="button"
                disabled={sitemap.page >= sitemap.pages}
                onClick={() => setSmPage((p) => p + 1)}
                className={`${BTN} border border-white/15 text-zinc-200`}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="m-0 text-sm text-zinc-400">Loading pages…</p>
        )}
      </Bento>
    </div>
  );
}
