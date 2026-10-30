import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clipboard,
  Database,
  Download,
  ExternalLink,
  FileJson,
  Globe2,
  Megaphone,
  Search,
  ShieldCheck,
} from 'lucide-react';
import marketingMetadata from '../../data/marketing/clearpath-marketing-metadata.json';
import searchIntelligence from '../../data/marketing/global-search-intelligence.json';
import MarketingFunnelDashboard from './MarketingFunnelDashboard';

type KeywordCluster = (typeof marketingMetadata.keywordClusters)[number];

const ROLLOUT = [
  {
    phase: '1 · Foundation',
    action: 'Connect analytics, validate conversions, and publish the metadata map.',
    gate: 'No spend until registrations and qualified visits can be attributed.',
  },
  {
    phase: '2 · Controlled pilot',
    action: 'Run two content pillars on YouTube, TikTok, Instagram, LinkedIn, Threads, Bluesky, and Reddit.',
    gate: 'Every public draft requires founder review; use platform-native copy.',
  },
  {
    phase: '3 · Learn',
    action: 'Compare qualified visits, page engagement, registrations, saves, and video completion.',
    gate: 'Do not optimize around impressions alone.',
  },
  {
    phase: '4 · Scale winners',
    action: 'Expand only the channel, audience, and creative combinations that produced evidence.',
    gate: 'Add paid media or another vendor as a bounded experiment, not an open-ended retainer.',
  },
];

const VENDOR_LINKS: Record<string, string> = {
  Mega: 'https://www.gomega.ai/pricing',
  Buffer: 'https://buffer.com/pricing',
  Metricool: 'https://metricool.com/pricing/',
  'Hootsuite with compliance tooling': 'https://www.hootsuite.com/financial-services',
};

function saveJson(filename: string, value: unknown) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function saveCsv(filename: string, records: Array<Record<string, string>>) {
  const columns = ['Category', 'Keyword', 'Audience', 'Platform', 'Language', 'Intent', 'Priority', 'Status'];
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = [
    columns.join(','),
    ...records.map((record) => columns.map((column) => escapeCell(record[column] || '')).join(',')),
  ].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}\r\n`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function MarketingCampaignDesk({
  getHeaders,
}: {
  getHeaders: () => Promise<Record<string, string>>;
}) {
  const [query, setQuery] = useState('');
  const [intelligenceQuery, setIntelligenceQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const socialOsUrl =
    (typeof import.meta !== 'undefined' &&
      (import.meta as { env?: { VITE_SOCIAL_OS_PUBLIC_URL?: string } }).env?.VITE_SOCIAL_OS_PUBLIC_URL) ||
    '';

  const filteredClusters = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return marketingMetadata.keywordClusters;
    return marketingMetadata.keywordClusters
      .map((cluster) => ({
        ...cluster,
        keywords: cluster.keywords.filter((keyword) => keyword.toLowerCase().includes(needle)),
      }))
      .filter(
        (cluster) =>
          cluster.keywords.length > 0 ||
          cluster.id.toLowerCase().includes(needle) ||
          cluster.intent.toLowerCase().includes(needle),
      );
  }, [query]);

  const keywordCount = marketingMetadata.keywordClusters.reduce(
    (total, cluster) => total + cluster.keywords.length,
    0,
  );

  const researchOnlyTerms = useMemo(
    () => new Set(searchIntelligence.researchOnlyTerms.map((item) => item.term.toLowerCase())),
    [],
  );

  const intelligenceRecords = useMemo(() => {
    const highPriority = new Set(searchIntelligence.highPriorityTerms.map((term) => term.toLowerCase()));
    const statusFor = (keyword: string) =>
      researchOnlyTerms.has(keyword.toLowerCase()) ? 'Research only' : 'Candidate';
    const priorityFor = (keyword: string) =>
      highPriority.has(keyword.toLowerCase()) ? 'High' : 'Medium';
    const master = searchIntelligence.masterGroups.flatMap((group) =>
      group.keywords.map((keyword) => ({
        Category: group.category,
        Keyword: keyword,
        Audience: group.audience,
        Platform: 'All',
        Language: 'English',
        Intent: 'Discovery',
        Priority: priorityFor(keyword),
        Status: statusFor(keyword),
      })),
    );
    const platform = searchIntelligence.platforms.flatMap((channel) =>
      channel.keywords.map((keyword) => ({
        Category: channel.type,
        Keyword: keyword,
        Audience: 'Platform audience',
        Platform: channel.platform,
        Language: channel.language,
        Intent: 'Platform discovery',
        Priority: priorityFor(keyword),
        Status: statusFor(keyword),
      })),
    );
    const brand = [
      ...searchIntelligence.brandAcquisitionTerms.map((keyword) => ({
        Category: 'Product acquisition',
        Keyword: keyword,
        Audience: 'Prospective customers',
        Platform: 'All',
        Language: 'English',
        Intent: 'Product discovery',
        Priority: 'High',
        Status: statusFor(keyword),
      })),
      ...searchIntelligence.officialBrandTerms.map((keyword) => ({
        Category: 'Official brand term',
        Keyword: keyword,
        Audience: 'All audiences',
        Platform: 'All',
        Language: 'English',
        Intent: 'Brand discovery',
        Priority: 'High',
        Status: statusFor(keyword),
      })),
    ];
    const neurodivergent = searchIntelligence.neurodivergentTerms.map((keyword) => ({
      Category: 'Neurodivergent trading',
      Keyword: keyword,
      Audience: 'Neurodivergent traders and learners',
      Platform: 'All',
      Language: 'English',
      Intent: 'Audience discovery',
      Priority: 'High',
      Status: statusFor(keyword),
    }));
    return [...master, ...platform, ...brand, ...neurodivergent];
  }, [researchOnlyTerms]);

  const uniqueIntelligenceTermCount = useMemo(
    () => new Set(intelligenceRecords.map((record) => record.Keyword.toLowerCase())).size,
    [intelligenceRecords],
  );

  const filteredPlatforms = useMemo(() => {
    const needle = intelligenceQuery.trim().toLowerCase();
    if (!needle) return searchIntelligence.platforms;
    return searchIntelligence.platforms
      .map((platform) => ({
        ...platform,
        keywords: platform.keywords.filter((keyword) => keyword.toLowerCase().includes(needle)),
      }))
      .filter(
        (platform) =>
          platform.keywords.length > 0 ||
          platform.platform.toLowerCase().includes(needle) ||
          platform.type.toLowerCase().includes(needle) ||
          platform.language.toLowerCase().includes(needle),
      );
  }, [intelligenceQuery]);

  const copyKeywords = async () => {
    const text = marketingMetadata.keywordClusters
      .flatMap((cluster) => cluster.keywords)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section
      data-ceo-marketing-campaign
      className="mb-10 overflow-hidden rounded-2xl border border-fuchsia-400/30 bg-[#120a18] shadow-[0_0_30px_rgba(217,70,239,0.09)]"
    >
      <header className="border-b border-white/10 bg-gradient-to-r from-fuchsia-500/15 via-violet-500/10 to-cyan-500/10 px-5 py-6 md:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="m-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-fuchsia-300">
              <Megaphone size={14} aria-hidden="true" /> Founder marketing command center
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
              {marketingMetadata.campaign.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {marketingMetadata.campaign.objective}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => saveJson('clearpath-marketing-metadata.json', marketingMetadata)}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/20"
            >
              <Download size={14} aria-hidden="true" /> Download metadata
            </button>
            <button
              type="button"
              onClick={() => void copyKeywords()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-wider text-zinc-100 hover:bg-white/10"
            >
              <Clipboard size={14} aria-hidden="true" /> {copied ? 'Copied' : 'Copy keywords'}
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-8 px-5 py-6 md:px-7">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="m-0 text-[10px] uppercase tracking-widest text-zinc-500">Keyword map</p>
            <p className="mt-1 text-2xl font-black text-white">{keywordCount}</p>
            <p className="mt-1 text-xs text-zinc-400">{marketingMetadata.keywordClusters.length} intent clusters</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="m-0 text-[10px] uppercase tracking-widest text-zinc-500">Search database</p>
            <p className="mt-1 text-2xl font-black text-white">{uniqueIntelligenceTermCount}</p>
            <p className="mt-1 text-xs text-zinc-400">Unique research terms</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="m-0 text-[10px] uppercase tracking-widest text-zinc-500">Audience routes</p>
            <p className="mt-1 text-2xl font-black text-white">{marketingMetadata.audiences.length}</p>
            <p className="mt-1 text-xs text-zinc-400">Each points to a relevant page</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="m-0 text-[10px] uppercase tracking-widest text-zinc-500">Search channels</p>
            <p className="mt-1 text-2xl font-black text-white">{searchIntelligence.platforms.length}</p>
            <p className="mt-1 text-xs text-zinc-400">Platform-native language maps</p>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
            <p className="m-0 flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-300">
              <ShieldCheck size={12} /> Publishing gate
            </p>
            <p className="mt-2 text-sm font-bold text-emerald-50">Founder approval required</p>
            <p className="mt-1 text-xs text-emerald-100/60">No autonomous public posting or ad spend</p>
          </div>
        </div>

        <MarketingFunnelDashboard getHeaders={getHeaders} />

        <section className="rounded-xl border border-violet-400/20 bg-violet-500/[0.04] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h3 className="m-0 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-violet-200">
                <Database size={17} aria-hidden="true" /> Global search intelligence
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                The class database is now a governed research layer. Search terms guide content and
                discovery, but they do not automatically become public product claims.
              </p>
              <p className="mt-2 text-xs italic text-zinc-500">
                Positioning hypothesis: “{searchIntelligence.positioningHypothesis}”
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                saveCsv('ClearPathTrader_All_Keywords_Combined.csv', intelligenceRecords)
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-300/40 bg-violet-400/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-violet-100 hover:bg-violet-400/20"
            >
              <Download size={14} aria-hidden="true" /> Download search CSV
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.1fr]">
            <div>
              <h4 className="m-0 text-xs font-black uppercase tracking-widest text-white">
                Starting audience allocation
              </h4>
              <p className="mt-1 text-[11px] text-zinc-500">
                Planning hypothesis only—not measured market share.
              </p>
              <div className="mt-3 space-y-3">
                {searchIntelligence.audienceAllocation.map((item) => (
                  <div key={item.audience}>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-zinc-200">{item.audience}</span>
                      <span className="font-mono text-violet-200">{item.allocationPercent}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet-400"
                        style={{ width: `${item.allocationPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-600">{item.purpose}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="m-0 text-xs font-black uppercase tracking-widest text-white">
                Claim review queue
              </h4>
              <p className="mt-1 text-[11px] text-zinc-500">
                These remain research topics and cannot describe current ClearPath capabilities.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {searchIntelligence.researchOnlyTerms.map((item) => (
                  <article key={item.term} className="rounded-lg border border-amber-400/20 bg-black/25 p-3">
                    <p className="m-0 text-xs font-bold text-amber-100">{item.term}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{item.reason}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h4 className="m-0 text-xs font-black uppercase tracking-widest text-white">
                  Platform language map
                </h4>
                <p className="mt-1 text-[11px] text-zinc-500">
                  X is excluded. Telegram X is correctly consolidated under Telegram.
                </p>
              </div>
              <input
                value={intelligenceQuery}
                onChange={(event) => setIntelligenceQuery(event.target.value)}
                placeholder="Search channel terms…"
                aria-label="Search global search intelligence"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/50 md:max-w-xs"
              />
            </div>
            <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-black/45 text-[10px] uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Language</th>
                    <th className="px-4 py-3">Discovery terms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredPlatforms.map((platform) => (
                    <tr key={platform.platform} className="bg-black/20 align-top">
                      <td className="px-4 py-3 font-bold text-white">{platform.platform}</td>
                      <td className="px-4 py-3 text-zinc-400">{platform.type}</td>
                      <td className="px-4 py-3 text-zinc-400">{platform.language}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300">
                        {platform.keywords.join(' · ')}
                        {'note' in platform && platform.note ? (
                          <p className="mb-0 mt-2 text-[10px] leading-relaxed text-amber-200/70">
                            {platform.note}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPlatforms.length === 0 && (
              <p className="mt-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                No platform language matches “{intelligenceQuery}”.
              </p>
            )}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-xl border border-amber-400/20 bg-amber-500/[0.05] p-5">
            <h3 className="m-0 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-200">
              <FileJson size={17} aria-hidden="true" /> PDF decision translated into action
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              The supplied comparison favors Mega when fully managed acquisition is the priority and
              Ryze when founder control and experimentation matter more. ClearPath already owns a direct
              Social OS, so the lowest-risk next move is a measured pilot in that system—not an immediate
              full-service migration.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={15} />
                Keep analytics, creative ownership, and approval with ClearPath.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={15} />
                Test organic messages before buying reach.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={15} />
                Evaluate Mega later for a tightly scoped SEO or Google/Meta paid-media experiment.
              </li>
            </ul>
          </article>

          <article className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.05] p-5">
            <h3 className="m-0 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-cyan-200">
              <Globe2 size={17} aria-hidden="true" /> Distribution console
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              The existing publisher supports a broad channel catalog and packages drafts when a network
              is not credentialed. Connect only accounts ClearPath owns.
            </p>
            {socialOsUrl ? (
              <a
                href={socialOsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300"
              >
                Open ClearPath Social OS <ExternalLink size={13} />
              </a>
            ) : (
              <p className="mt-4 rounded-lg border border-amber-400/25 bg-black/30 px-3 py-2 text-xs text-amber-100">
                Publisher URL not configured. Set <span className="font-mono">SOCIAL_OS_PUBLIC_URL</span>{' '}
                and <span className="font-mono">VITE_SOCIAL_OS_PUBLIC_URL</span> on the dedicated host.
              </p>
            )}
          </article>
        </div>

        <div>
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="m-0 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
                <Search size={17} className="text-fuchsia-300" /> Keyword and metadata file
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Search by phrase, cluster, or intent. The JSON download is the source file for SEO,
                campaign briefs, and platform descriptions.
              </p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search keywords…"
              aria-label="Search marketing keywords"
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-400/50 md:max-w-xs"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredClusters.map((cluster: KeywordCluster) => (
              <article key={cluster.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="m-0 text-sm font-black capitalize text-zinc-100">
                      {cluster.id.replace(/-/g, ' ')}
                    </h4>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-fuchsia-300">
                      {cluster.intent}
                    </p>
                  </div>
                  <a
                    href={cluster.destination}
                    className="rounded border border-white/10 px-2 py-1 font-mono text-[10px] text-cyan-300 hover:bg-white/5"
                  >
                    {cluster.destination}
                  </a>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cluster.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-300"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          {filteredClusters.length === 0 && (
            <p className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
              No keyword matches “{query}”.
            </p>
          )}
        </div>

        <div>
          <h3 className="m-0 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
            <BarChart3 size={17} className="text-cyan-300" /> Controlled rollout
          </h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-4">
            {ROLLOUT.map((item) => (
              <article key={item.phase} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="m-0 text-xs font-black uppercase tracking-wider text-cyan-300">{item.phase}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-200">{item.action}</p>
                <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-zinc-500">
                  Gate: {item.gate}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h3 className="m-0 text-sm font-black uppercase tracking-widest text-white">Vendor decision matrix</h3>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-black/45 text-[10px] uppercase tracking-widest text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Best fit</th>
                  <th className="px-4 py-3">ClearPath decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {marketingMetadata.distribution.vendorNotes.map((vendor) => (
                  <tr key={vendor.name} className="bg-black/20 align-top">
                    <td className="px-4 py-3 font-bold text-white">
                      <a
                        href={VENDOR_LINKS[vendor.name]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-cyan-300"
                      >
                        {vendor.name} <ExternalLink size={12} />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{vendor.fit}</td>
                    <td className="px-4 py-3 text-zinc-400">{vendor.decision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
            Vendor features and prices change. Verify the linked official pages before approving a subscription or ad spend.
          </p>
        </div>

        <footer className="rounded-xl border border-rose-400/20 bg-rose-500/[0.05] px-4 py-3 text-xs leading-relaxed text-rose-100/80">
          <strong className="text-rose-100">Claims guardrail:</strong>{' '}
          {marketingMetadata.brand.requiredDisclaimer} Never publish{' '}
          {marketingMetadata.brand.prohibitedClaims.join(', ').toLowerCase()}.
        </footer>
      </div>
    </section>
  );
}
