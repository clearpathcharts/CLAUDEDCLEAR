/**
 * CEO-only Community Outreach admin: institution status, resources, documents, inquiries.
 * Never exposed on the public outreach page.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { INSTITUTION_STATUSES, type InstitutionStatus } from '../../content/communityOutreach';

type HeadersFn = () => Promise<Record<string, string>> | Record<string, string>;

const PUB_STATUSES = [
  'In Development',
  'Draft',
  'Approved for Public Distribution',
  'Published',
] as const;

export default function CeoCommunityOutreachAdmin({ getHeaders }: { getHeaders: HeadersFn }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [state, setState] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/admin/community-outreach/state', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load outreach admin state');
      setState(data);
    } catch (e: any) {
      setError(e?.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (path: string, body: Record<string, unknown>) => {
    setMsg('');
    setError('');
    const headers = await getHeaders();
    const res = await fetch(`/api/admin/community-outreach${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Update failed');
    setMsg('Saved.');
    await load();
  };

  if (loading && !state) {
    return (
      <section className="mb-8 rounded-xl border border-cyan-500/20 bg-black/40 p-5 text-sm text-zinc-400 font-mono">
        Loading Community Outreach admin…
      </section>
    );
  }

  return (
    <section className="mb-10 rounded-xl border border-sky-500/25 bg-slate-950/70 p-5 md:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-sky-300">Community Outreach</p>
          <h2 className="text-lg font-black text-white mt-1">Institutional status & document controls</h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-3xl">
            Public page: <a href="/community-outreach" className="text-sky-300 hover:underline">/community-outreach</a>.
            Status never auto-approves. Approved/Active requires an approval source note. Food shelf stays a future
            initiative until you publish operating docs here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="text-[10px] font-mono uppercase tracking-widest border border-zinc-600 px-3 py-2 text-zinc-300 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-rose-300 font-mono">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-300 font-mono">{msg}</p> : null}

      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Institutions</h3>
        {(state?.institutions || []).map((inst: any) => (
          <details key={inst.id} className="border border-zinc-800 bg-black/30 p-3">
            <summary className="cursor-pointer text-sm text-white font-semibold">
              {inst.name} · <span className="text-amber-200 font-mono text-xs">{inst.status}</span>
            </summary>
            <form
              className="mt-3 grid md:grid-cols-2 gap-3 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                void post(`/institutions/${inst.id}`, {
                  status: String(fd.get('status')),
                  submittedAt: String(fd.get('submittedAt') || '') || null,
                  approvedAt: String(fd.get('approvedAt') || '') || null,
                  approvalSource: String(fd.get('approvalSource') || '') || null,
                  evidenceNote: String(fd.get('evidenceNote') || '') || null,
                  lastVerifiedDate: String(fd.get('lastVerifiedDate') || ''),
                }).catch((err) => setError(err.message));
              }}
            >
              <label className="block">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Status</span>
                <select
                  name="status"
                  defaultValue={inst.status}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-700 px-2 py-2"
                >
                  {INSTITUTION_STATUSES.map((s: InstitutionStatus) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Last verified (YYYY-MM-DD)</span>
                <input
                  name="lastVerifiedDate"
                  defaultValue={inst.lastVerifiedDate || ''}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-700 px-2 py-2"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Submitted at</span>
                <input
                  name="submittedAt"
                  defaultValue={inst.submittedAt || ''}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-700 px-2 py-2"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Approved at</span>
                <input
                  name="approvedAt"
                  defaultValue={inst.approvedAt || ''}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-700 px-2 py-2"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  Approval source (required for Approved/Active)
                </span>
                <input
                  name="approvalSource"
                  defaultValue={inst.approvalSource || ''}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-700 px-2 py-2"
                  placeholder="e.g. Letter from City Manager dated …"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Evidence note</span>
                <textarea
                  name="evidenceNote"
                  defaultValue={inst.evidenceNote || ''}
                  rows={2}
                  className="mt-1 w-full bg-zinc-950 border border-zinc-700 px-2 py-2"
                />
              </label>
              <button
                type="submit"
                className="md:col-span-2 text-[10px] font-mono uppercase tracking-widest bg-sky-500/20 border border-sky-400/40 text-sky-200 px-3 py-2 hover:bg-sky-500/30"
              >
                Save institution
              </button>
            </form>
          </details>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Educational resources</h3>
        {(state?.resources || []).map((res: any) => (
          <form
            key={res.id}
            className="border border-zinc-800 bg-black/30 p-3 grid md:grid-cols-3 gap-2 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void post(`/resources/${res.id}`, {
                publicationStatus: String(fd.get('publicationStatus')),
                revisionDate: String(fd.get('revisionDate') || ''),
                downloadUrl: String(fd.get('downloadUrl') || '') || null,
              }).catch((err) => setError(err.message));
            }}
          >
            <div className="md:col-span-3 text-white font-semibold">{res.title}</div>
            <select name="publicationStatus" defaultValue={res.publicationStatus} className="bg-zinc-950 border border-zinc-700 px-2 py-2">
              {PUB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              name="revisionDate"
              defaultValue={res.revisionDate || ''}
              placeholder="Revision date"
              className="bg-zinc-950 border border-zinc-700 px-2 py-2"
            />
            <input
              name="downloadUrl"
              defaultValue={res.downloadUrl || ''}
              placeholder="https://… or /docs/… (only when approved)"
              className="bg-zinc-950 border border-zinc-700 px-2 py-2"
            />
            <button type="submit" className="md:col-span-3 text-[10px] font-mono uppercase tracking-widest border border-zinc-600 px-3 py-2 text-zinc-300">
              Save resource
            </button>
          </form>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Document center</h3>
        {(state?.documents || []).map((doc: any) => (
          <form
            key={doc.id}
            className="border border-zinc-800 bg-black/30 p-3 grid md:grid-cols-3 gap-2 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void post(`/documents/${doc.id}`, {
                approvalStatus: String(fd.get('approvalStatus')),
                version: String(fd.get('version') || ''),
                publicationDate: String(fd.get('publicationDate') || ''),
                downloadUrl: String(fd.get('downloadUrl') || '') || null,
              }).catch((err) => setError(err.message));
            }}
          >
            <div className="md:col-span-3 text-white font-semibold">{doc.title}</div>
            <select name="approvalStatus" defaultValue={doc.approvalStatus} className="bg-zinc-950 border border-zinc-700 px-2 py-2">
              {PUB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input name="version" defaultValue={doc.version || ''} className="bg-zinc-950 border border-zinc-700 px-2 py-2" placeholder="Version" />
            <input
              name="publicationDate"
              defaultValue={doc.publicationDate || ''}
              className="bg-zinc-950 border border-zinc-700 px-2 py-2"
              placeholder="Publication date"
            />
            <input
              name="downloadUrl"
              defaultValue={doc.downloadUrl || ''}
              className="md:col-span-3 bg-zinc-950 border border-zinc-700 px-2 py-2"
              placeholder="Authorized public PDF URL"
            />
            <button type="submit" className="md:col-span-3 text-[10px] font-mono uppercase tracking-widest border border-zinc-600 px-3 py-2 text-zinc-300">
              Save document
            </button>
          </form>
        ))}
      </div>

      <div>
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Recent inquiries</h3>
        <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
          {(state?.inquiries || []).length === 0 ? (
            <p className="text-zinc-500">No inquiries yet.</p>
          ) : (
            (state.inquiries as any[]).map((inq) => (
              <div key={inq.id} className="border border-zinc-800 bg-black/20 p-3">
                <p className="text-white font-semibold">
                  {inq.organization} · {inq.category}
                </p>
                <p className="text-zinc-400 text-xs font-mono mt-1">
                  {inq.name} · {inq.businessEmail} · {inq.createdAt}
                </p>
                <p className="text-zinc-300 mt-2 whitespace-pre-wrap">{inq.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Change history</h3>
        <ul className="max-h-48 overflow-y-auto text-xs font-mono text-zinc-500 space-y-1">
          {(state?.history || []).map((h: any) => (
            <li key={h.id}>
              {h.at} · {h.actor} · {h.action} · {h.targetType}/{h.targetId} · {h.detail}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
