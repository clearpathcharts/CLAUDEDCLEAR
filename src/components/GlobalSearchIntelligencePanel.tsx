import React, { useMemo, useState } from 'react';
import { Database, Download } from 'lucide-react';
import searchIntelligence from '../../data/marketing/global-search-intelligence.json';

type SearchRecord = Record<string, string>;
type SearchPlatform = (typeof searchIntelligence.platforms)[number];

function saveCsv(filename: string, records: SearchRecord[]) {
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

function buildIntelligenceRecords() {
  const researchOnly = new Set(
    searchIntelligence.researchOnlyTerms.map((item) => item.term.toLowerCase()),
  );
  const highPriority = new Set(
    searchIntelligence.highPriorityTerms.map((term) => term.toLowerCase()),
  );
  const statusFor = (keyword: string) =>
    researchOnly.has(keyword.toLowerCase()) ? 'Research only' : 'Candidate';
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
}

function AudienceAllocation() {
  return (
    <div>
      <h4 className="m-0 text-xs font-black uppercase tracking-widest text-white">
        Starting audience allocation
      </h4>
      <p className="mt-1 text-[11px] text-zinc-500">Planning hypothesis only—not measured market share.</p>
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
  );
}

function ClaimReviewQueue() {
  return (
    <div>
      <h4 className="m-0 text-xs font-black uppercase tracking-widest text-white">Claim review queue</h4>
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
  );
}

function PlatformLanguageMap({
  platforms,
  query,
  onQueryChange,
}: {
  platforms: SearchPlatform[];
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
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
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
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
            {platforms.map((platform) => (
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
      {platforms.length === 0 && (
        <p className="mt-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
          No platform language matches “{query}”.
        </p>
      )}
    </div>
  );
}

export default function GlobalSearchIntelligencePanel() {
  const [query, setQuery] = useState('');
  const records = useMemo(() => buildIntelligenceRecords(), []);
  const filteredPlatforms = useMemo(() => {
    const needle = query.trim().toLowerCase();
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
  }, [query]);

  return (
    <section className="rounded-xl border border-violet-400/20 bg-violet-500/[0.04] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h3 className="m-0 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-violet-200">
            <Database size={17} aria-hidden="true" /> Global search intelligence
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            The class database is now a governed research layer. Search terms guide content and discovery,
            but they do not automatically become public product claims.
          </p>
          <p className="mt-2 text-xs italic text-zinc-500">
            Positioning hypothesis: “{searchIntelligence.positioningHypothesis}”
          </p>
        </div>
        <button
          type="button"
          onClick={() => saveCsv('ClearPathTrader_All_Keywords_Combined.csv', records)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-300/40 bg-violet-400/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-violet-100 hover:bg-violet-400/20"
        >
          <Download size={14} aria-hidden="true" /> Download search CSV
        </button>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <AudienceAllocation />
        <ClaimReviewQueue />
      </div>
      <PlatformLanguageMap platforms={filteredPlatforms} query={query} onQueryChange={setQuery} />
    </section>
  );
}
