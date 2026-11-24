import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SEO from '../SEO';
import { BrandMark } from '../brand/BrandMark';
import { COMMUNICATIONS_PATH, TECHNOLOGY_OPPORTUNITY_PATH } from '../../content/brentOutreach';

type InvestorRow = {
  id: string;
  name: string;
  kind: string;
  website: string;
  outreachEmail: string | null;
  stage: string;
};

type Status = {
  brentEmailConfigured: boolean;
  brentEmailPreview: string | null;
  fromPreview: string | null;
  smtpConfigured: boolean;
  opportunityUrl: string;
  siteUrl: string;
  screenshotCount: number;
  investorCount: number;
};

type Draft = {
  investorId: string;
  investorName: string;
  to: string | null;
  subject: string;
  text: string;
  html: string;
  opportunityUrl: string;
  siteUrl: string;
  screenshots: Array<{ src: string; alt: string; caption: string }>;
  fromConfigured: boolean;
  fromPreview: string;
  smtpConfigured: boolean;
};

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api/communications${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || body?.reason || `HTTP ${res.status}`);
  return body;
}

/**
 * Fundamental Marketing Department for Brent (CCO).
 * Completely separate from the CEO Dashboard marketing desk.
 */
export default function BrentMarketingDepartment() {
  const [status, setStatus] = useState<Status | null>(null);
  const [investors, setInvestors] = useState<InvestorRow[]>([]);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toOverride, setToOverride] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');
  const [authError, setAuthError] = useState('');

  const load = useCallback(async () => {
    setAuthError('');
    try {
      const [st, inv] = await Promise.all([api('/status'), api('/investors?limit=500')]);
      setStatus(st);
      setInvestors(Array.isArray(inv.investors) ? inv.investors : []);
    } catch (err: any) {
      setAuthError(err?.message || 'Could not load communications desk (founder session required).');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return investors;
    return investors.filter(
      (i) =>
        i.name.toLowerCase().includes(needle) ||
        i.kind.toLowerCase().includes(needle) ||
        i.id.toLowerCase().includes(needle) ||
        (i.outreachEmail || '').toLowerCase().includes(needle)
    );
  }, [investors, q]);

  const loadDraft = async (id: string) => {
    setBusy(true);
    setFlash('');
    try {
      const body = await api(`/draft/${encodeURIComponent(id)}`);
      setSelectedId(id);
      setDraft(body.draft);
      setToOverride(body.draft?.to || '');
    } catch (err: any) {
      setFlash(err?.message || 'Draft failed');
    } finally {
      setBusy(false);
    }
  };

  const send = async (confirmSend: boolean) => {
    if (!selectedId) return;
    setBusy(true);
    setFlash('');
    try {
      const body = await api('/send', {
        method: 'POST',
        headers: { 'x-clearpath-founder-action': '1' },
        body: JSON.stringify({
          investorId: selectedId,
          to: toOverride || undefined,
          confirmSend,
        }),
      });
      if (confirmSend && body.sent) {
        setFlash(`Sent to ${body.draft?.to || toOverride}`);
      } else if (!confirmSend) {
        setFlash('Preview OK — message not sent. Set confirmSend to send.');
        setDraft(body.draft);
      } else {
        setFlash(body.reason || 'Send blocked');
      }
    } catch (err: any) {
      setFlash(err?.message || 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <SEO
        title="ClearPath Communications — Brent Marketing Department"
        description="Investor outreach desk for Brent (CCO): VC roster, technology opportunity page, screenshot emails."
        canonical={`https://clearpathtrader.com${COMMUNICATIONS_PATH}`}
      />
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-3">
          <BrandMark size={32} />
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-black uppercase tracking-[0.2em]">Communications</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">Brent · CCO desk</span>
          </span>
        </a>
        <nav className="flex flex-wrap gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
          <a href={TECHNOLOGY_OPPORTUNITY_PATH} className="hover:text-white">
            Technology opportunity
          </a>
          <a href="/pitch" className="hover:text-white">
            Pitch slides
          </a>
          <a href="/ceo" className="hover:text-zinc-200">
            CEO desk (separate)
          </a>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-8">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#00E5FF]/80 mb-2">
            Fundamental marketing department
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Investor outreach for Brent</h1>
          <p className="mt-3 text-zinc-400 max-w-3xl leading-relaxed">
            Separate from the CEO Marketing Department. Drafts and sends venture / investor notes from Brent’s mailbox
            (<code className="text-[#00E5FF]">clearpath.brent@gmail.com</code>), embeds website screenshots, and links
            the Technology, Innovation &amp; Investment Opportunity page. Override with Cloud Run env{' '}
            <code className="text-[#00E5FF]">BRENT_OUTREACH_EMAIL</code> if the mailbox changes. Sends still need SMTP
            on the service.
          </p>
        </div>

        {authError ? (
          <div className="border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {authError} Sign in with the founder Private Login, then reopen this page.
          </div>
        ) : null}

        {status ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Brent From',
                value: status.fromPreview || 'Brent From unavailable',
              },
              { label: 'SMTP', value: status.smtpConfigured ? 'Configured' : 'Not configured' },
              { label: 'Investors in roster', value: String(status.investorCount) },
              { label: 'Screenshots per email', value: String(status.screenshotCount) },
            ].map((card) => (
              <div key={card.label} className="border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{card.label}</p>
                <p className="mt-1 text-sm text-white break-all">{card.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <aside className="border border-white/10 bg-[#0c1118] p-4 space-y-3">
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Search VC / angels / IB
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="mt-2 w-full bg-black/50 border border-white/15 px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                placeholder="Name, kind, email…"
              />
            </label>
            <div className="max-h-[60vh] overflow-y-auto space-y-1">
              {filtered.slice(0, 200).map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => void loadDraft(inv.id)}
                  className={`w-full text-left px-3 py-2 border text-sm transition-colors ${
                    selectedId === inv.id
                      ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                      : 'border-transparent hover:border-white/15 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="font-semibold text-white">{inv.name}</div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    {inv.kind} · {inv.stage}
                    {inv.outreachEmail ? ` · ${inv.outreachEmail}` : ' · no public inbox'}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="border border-white/10 bg-[#0c1118] p-4 md:p-6 space-y-4 min-h-[420px]">
            {!draft ? (
              <p className="text-zinc-500 text-sm">Select an investor to draft Brent’s note with screenshots + links.</p>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-bold">{draft.investorName}</h2>
                  <p className="text-xs font-mono text-zinc-500 mt-1">From preview: {draft.fromPreview}</p>
                </div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  To
                  <input
                    value={toOverride}
                    onChange={(e) => setToOverride(e.target.value)}
                    className="mt-2 w-full bg-black/50 border border-white/15 px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                    placeholder="public firm inbox"
                  />
                </label>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">Subject</p>
                  <p className="text-sm text-white">{draft.subject}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">Text</p>
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300 bg-black/40 border border-white/10 p-3 max-h-64 overflow-y-auto">
                    {draft.text}
                  </pre>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                    Screenshots embedded in HTML ({draft.screenshots.length})
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {draft.screenshots.map((s) => (
                      <figure key={s.src} className="border border-white/10 bg-black/30">
                        <img src={s.src} alt={s.alt} className="w-full h-28 object-cover" loading="lazy" />
                        <figcaption className="px-2 py-1.5 text-[10px] text-zinc-400">{s.caption}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  Links: <a className="text-[#00E5FF] underline" href={draft.opportunityUrl}>{draft.opportunityUrl}</a>
                  {' · '}
                  <a className="text-[#00E5FF] underline" href={draft.siteUrl}>{draft.siteUrl}</a>
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void send(false)}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest border border-white/20 hover:border-[#00E5FF] disabled:opacity-40"
                  >
                    Preview send path
                  </button>
                  <button
                    type="button"
                    disabled={busy || !draft.fromConfigured || !draft.smtpConfigured}
                    onClick={() => {
                      if (!window.confirm(`Send this note from Brent to ${toOverride || draft.to || 'recipient'}?`)) return;
                      void send(true);
                    }}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-[#00E5FF] text-black disabled:opacity-40"
                  >
                    Send from Brent
                  </button>
                </div>
              </>
            )}
            {flash ? <p className="text-sm text-amber-200">{flash}</p> : null}
          </section>
        </div>
      </main>
    </div>
  );
}
