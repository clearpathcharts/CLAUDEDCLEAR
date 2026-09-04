import React, { useCallback, useEffect, useState } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../contexts/FirebaseContext';
import { isFounderEmail, isFounderSession } from '../lib/founder';
import type { PackageStatus, ProductPackage } from '../lib/packageCatalog';

const STATUS_TONE: Record<PackageStatus, string> = {
  shipped: 'bg-emerald-400',
  partial: 'bg-sky-400',
  planned: 'bg-zinc-500',
  draft: 'bg-amber-400',
};

function statusLabel(status: PackageStatus): string {
  if (status === 'shipped') return 'Shipped';
  if (status === 'partial') return 'Partial — still building';
  if (status === 'planned') return 'Planned';
  return 'Draft';
}

async function founderHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-clearpath-founder-action': '1',
  };
  const current = auth.currentUser;
  if (current && isFounderEmail(current.email)) {
    headers.Authorization = `Bearer ${await current.getIdToken(true)}`;
  }
  return headers;
}

export function PackagesPanel({ showAddForm = false }: { showAddForm?: boolean }) {
  const { user, userProfile } = useAuth();
  const founderOk =
    showAddForm && isFounderSession(user?.email, userProfile?.email, auth.currentUser?.email);

  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [includesText, setIncludesText] = useState('');
  const [status, setStatus] = useState<PackageStatus>('draft');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/packages', { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Could not load packages.');
      setPackages(Array.isArray(body.packages) ? body.packages : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load packages.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const includes = includesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const res = await fetch('/api/packages', {
        method: 'POST',
        credentials: 'include',
        headers: await founderHeaders(),
        body: JSON.stringify({ name, summary, includes, status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.message || 'Could not add package.');
      setName('');
      setSummary('');
      setIncludesText('');
      setStatus('draft');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add package.');
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/packages/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: await founderHeaders(),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.message || 'Could not remove package.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove package.');
    } finally {
      setBusy(false);
    }
  };

  const membership = packages.filter((pkg) => pkg.kind === 'membership');
  const addOns = packages.filter((pkg) => pkg.kind === 'add_on');

  return (
    <div className="space-y-6" data-testid="packages-panel">
      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Membership packages</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {membership.map((pkg) => (
            <article
              key={pkg.id}
              className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-3"
              data-package-id={pkg.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-cyan-300" />
                  <h4 className="text-sm font-black uppercase tracking-widest text-white">{pkg.name}</h4>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  <span className={`w-2 h-2 rounded-full ${STATUS_TONE[pkg.status]}`} />
                  {statusLabel(pkg.status)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{pkg.summary}</p>
              <ul className="space-y-1 text-[11px] font-mono text-zinc-300">
                {pkg.includes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Added packages</h3>
        {addOns.length === 0 ? (
          <p className="text-xs text-zinc-500" data-testid="packages-empty">
            No add-on packages yet. The founder can add ones below.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {addOns.map((pkg) => (
              <article
                key={pkg.id}
                className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-3"
                data-package-id={pkg.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">{pkg.name}</h4>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      <span className={`w-2 h-2 rounded-full ${STATUS_TONE[pkg.status]}`} />
                      {statusLabel(pkg.status)}
                    </span>
                  </div>
                  {founderOk && !pkg.locked ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onRemove(pkg.id)}
                      className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-rose-300"
                      aria-label={`Remove ${pkg.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{pkg.summary}</p>
                {pkg.includes.length > 0 ? (
                  <ul className="space-y-1 text-[11px] font-mono text-zinc-300">
                    {pkg.includes.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {founderOk ? (
        <form
          onSubmit={(event) => void onAdd(event)}
          className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4 space-y-3"
          data-testid="packages-add-form"
        >
          <div className="flex items-center gap-2 text-cyan-200">
            <Plus className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-widest">Add a package</h3>
          </div>
          <p className="text-[11px] text-zinc-500">
            Feature package only — no list price, no checkout. Status stays honest.
          </p>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Summary</span>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={280}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Includes (one line each)
            </span>
            <textarea
              value={includesText}
              onChange={(e) => setIncludesText(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white font-mono"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PackageStatus)}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
            >
              <option value="draft">Draft</option>
              <option value="planned">Planned</option>
              <option value="partial">Partial</option>
              <option value="shipped">Shipped</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-xl border border-cyan-500/40 text-cyan-200 text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Add package'}
          </button>
        </form>
      ) : null}

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
