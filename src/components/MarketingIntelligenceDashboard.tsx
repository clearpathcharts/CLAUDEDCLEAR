import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrainCircuit, ExternalLink, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';

type CapabilityCoverage = {
  id: string;
  name: string;
  family: 'search' | 'knowledge' | 'experience';
  maturity: 'active' | 'supporting' | 'planned' | 'umbrella';
  opportunityCount: number;
  activateCount: number;
  holdCount: number;
};

type MarketingOpportunity = {
  id: string;
  keyword: string;
  canonicalPath: string | null;
  absoluteUrl: string | null;
  audience: string;
  platform?: string;
  status: 'activate' | 'optimize' | 'hold';
  readinessScore: number;
  capabilities: string[];
  rationale: string[];
  reviewReason?: string;
};

type MarketingIntelligenceReport = {
  ok: true;
  generatedAt: string;
  methodology: {
    score: string;
    exclusions: string;
    approval: string;
  };
  summary: {
    sourceRecords: number;
    uniqueOpportunities: number;
    activate: number;
    optimize: number;
    heldForReview: number;
    canonicalRoutes: number;
    capabilities: number;
  };
  capabilityCoverage: CapabilityCoverage[];
  opportunities: MarketingOpportunity[];
};

const FAMILY_STYLES: Record<CapabilityCoverage['family'], string> = {
  search: 'border-cyan-400/20 bg-cyan-500/[0.06] text-cyan-100',
  knowledge: 'border-fuchsia-400/20 bg-fuchsia-500/[0.06] text-fuchsia-100',
  experience: 'border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-100',
};

export default function MarketingIntelligenceDashboard({
  getHeaders,
}: {
  getHeaders: () => Promise<Record<string, string>>;
}) {
  const [report, setReport] = useState<MarketingIntelligenceReport | null>(null);
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
      const response = await fetch('/api/admin/marketing/intelligence?limit=12', {
        headers,
        credentials: 'include',
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || `Marketing intelligence failed (${response.status})`);
      }
      setReport(body as MarketingIntelligenceReport);
    } catch (loadError: any) {
      setError(loadError?.message || 'Marketing intelligence is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section
      className="rounded-xl border border-cyan-400/25 bg-[#07141c] p-5"
      data-marketing-intelligence-dashboard
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
            <BrainCircuit size={14} /> ClearPath Marketing Intelligence
          </p>
          <h3 className="mt-2 text-lg font-black text-white">
            Evidence-driven discovery and conversion operating system
          </h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-400">
            Maps approved search language to real ClearPath pages, coordinates 20 discovery capabilities,
            and holds unsupported claims before they reach public copy.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/10 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {!report && loading ? <p className="mt-4 text-sm text-zinc-500">Building intelligence map…</p> : null}

      {report ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ['Source records', report.summary.sourceRecords],
              ['Unique opportunities', report.summary.uniqueOpportunities],
              ['Activation ready', report.summary.activate],
              ['Needs optimization', report.summary.optimize],
              ['Claim-review holds', report.summary.heldForReview],
              ['Canonical routes', report.summary.canonicalRoutes],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-white/10 bg-black/25 p-3">
                <p className="m-0 text-[9px] uppercase tracking-widest text-zinc-500">{label}</p>
                <p className="mt-1 text-xl font-black text-white">{Number(value).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h4 className="m-0 text-xs font-black uppercase tracking-widest text-white">
                  Capability command matrix
                </h4>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Related AI-discovery disciplines share one evidence layer instead of becoming disconnected tools.
                </p>
              </div>
              <span className="font-mono text-[10px] text-cyan-300">
                {report.summary.capabilities} governed capabilities
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {report.capabilityCoverage.map((capability) => (
                <article
                  key={capability.id}
                  className={`rounded-lg border p-3 ${FAMILY_STYLES[capability.family]}`}
                  title={capability.name}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm">{capability.id}</strong>
                    <span className="text-[9px] uppercase tracking-wider opacity-60">
                      {capability.maturity}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[10px] opacity-70">{capability.name}</p>
                  <p className="mt-2 font-mono text-[10px] opacity-80">
                    {capability.opportunityCount} mapped · {capability.activateCount} ready
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="m-0 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
              <Sparkles size={14} className="text-cyan-300" /> Highest-readiness opportunities
            </h4>
            <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[840px] text-left text-xs">
                <thead className="bg-black/40 text-[9px] uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">Term</th>
                    <th className="px-3 py-2">Destination</th>
                    <th className="px-3 py-2">Audience</th>
                    <th className="px-3 py-2">Capability coverage</th>
                    <th className="px-3 py-2">Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {report.opportunities
                    .filter((opportunity) => opportunity.status !== 'hold')
                    .slice(0, 8)
                    .map((opportunity) => (
                      <tr key={opportunity.id} className="bg-black/20">
                        <td className="px-3 py-3 font-bold text-white">{opportunity.keyword}</td>
                        <td className="px-3 py-3">
                          {opportunity.absoluteUrl ? (
                            <a
                              href={opportunity.absoluteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                            >
                              {opportunity.canonicalPath} <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-zinc-600">Held</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-zinc-400">{opportunity.audience}</td>
                        <td className="px-3 py-3 text-zinc-400">
                          {opportunity.capabilities.slice(0, 6).join(' · ')}
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono font-bold text-emerald-300">
                            {opportunity.readinessScore}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <p className="m-0 rounded-lg border border-amber-400/20 bg-amber-500/[0.05] p-3 text-[11px] leading-relaxed text-amber-100/80">
              <strong>Score boundary:</strong> {report.methodology.score} {report.methodology.exclusions}
            </p>
            <p className="m-0 flex gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/[0.05] p-3 text-[11px] leading-relaxed text-emerald-100/80">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              <span><strong>Control boundary:</strong> {report.methodology.approval}</span>
            </p>
          </div>
        </>
      ) : null}
    </section>
  );
}
