import React, { useState } from 'react';
import { Bell, Search, Settings } from 'lucide-react';
import { FundamentalProvider, useFundamental } from './FundamentalContext';
import {
  CompanyOverviewPanel,
  EarningsPanels,
  FinancialPerformancePanels,
  IndustryPanels,
  MacroPanels,
  NewsRiskPanels,
  StatusChip,
  ValuationPanels,
  WorkspacePanels,
} from './ResearchPanels';
import BentoWorkspace from './BentoWorkspace';
import { RESEARCH_NAV } from '../../fundamental/localStore';
import { formatCompactUsd, formatPercent, formatUsdPerShare, marketSessionUtc } from '../../fundamental/format';
import { DataRibbon } from './primitives';
import './bento.css';
import type { ResearchSection } from '../../fundamental/types';
import { useDeskMonitorSync } from '../../hooks/useDeskMonitorSync';

function HeaderBar() {
  const { lastUpdatedAt, settingsOpen, setSettingsOpen, noticesOpen, setNoticesOpen, alerts, bundle } = useFundamental();
  const stamp = lastUpdatedAt ? new Date(lastUpdatedAt).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '—';
  return (
    <header className="shrink-0 border-b border-[rgba(232,228,219,0.1)] bg-[#07080a]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div>
          <p className="fund-kicker">ClearPath Fundamental</p>
          <p className="fund-serif text-lg text-[#f4efe4]">Equity research workstation</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusChip />
          <span className="fund-mono hidden text-[10px] uppercase tracking-widest text-[#6f6a60] sm:inline">Updated {stamp}</span>
          <span className="fund-mono hidden text-[10px] uppercase tracking-widest text-[#6f6a60] lg:inline">
            {marketSessionUtc()}
          </span>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNoticesOpen(!noticesOpen)}
            className="rounded border border-white/10 p-1.5 text-[#9a9588] hover:text-white"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="rounded border border-white/10 p-1.5 text-[#9a9588] hover:text-white"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {noticesOpen ? (
        <div className="border-t border-white/5 px-4 py-2">
          {alerts.length ? (
            alerts.map((a) => (
              <p key={a.id} className="fund-mono text-[11px] text-[#e8e4db]">
                {a.title}: {a.detail}
              </p>
            ))
          ) : (
            <p className="fund-mono text-[10px] uppercase text-[#6f6a60]">No objective alerts</p>
          )}
        </div>
      ) : null}
      {settingsOpen ? (
        <div className="fund-mono border-t border-white/5 px-4 py-2 text-[10px] uppercase text-[#9a9588]">
          Research workstation · information only · vendor keys stay on the server · FMP {bundle?.fmp} · FRED {bundle?.fred}
        </div>
      ) : null}
    </header>
  );
}

function AssetSearchBox() {
  const { searchQuery, setSearchQuery, searchHits, setSymbol, symbol } = useFundamental();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-w-[220px] max-w-md flex-1">
      <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-[#6f6a60]" />
      <input
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Company search"
        className="fund-mono w-full rounded-sm border border-[rgba(232,228,219,0.14)] bg-black/40 py-2 pl-7 pr-2 text-sm text-[#f4efe4] outline-none focus:border-[#c49558]"
        aria-label="Asset search"
      />
      {open && searchHits.length ? (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-sm border border-[rgba(232,228,219,0.14)] bg-[#121316] shadow-xl">
          {searchHits.map((hit) => (
            <li key={`${hit.ticker}-${hit.assetType}-${hit.source}`}>
              <button
                type="button"
                className="grid w-full grid-cols-2 gap-x-2 px-3 py-2 text-left hover:bg-white/5 sm:grid-cols-4"
                onClick={() => {
                  setSymbol(hit.ticker);
                  setSearchQuery(hit.ticker);
                  setOpen(false);
                }}
              >
                <span className="fund-mono text-xs text-[#c49558]">{hit.ticker}</span>
                <span className="fund-sans truncate text-[12px]">{hit.name}</span>
                <span className="fund-mono hidden text-[10px] uppercase text-[#6f6a60] sm:inline">
                  {hit.exchange} · {hit.country}
                </span>
                <span className="fund-mono hidden text-[10px] uppercase text-[#6f6a60] sm:inline">
                  {hit.sector} · {hit.industry}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="sr-only">Active symbol {symbol}</p>
    </div>
  );
}

function CompanyIdentity() {
  const { bundle, loading, setSection } = useFundamental();
  const id = bundle?.identity;
  const q = bundle?.quote;
  const jump = (section: ResearchSection, el: string) => {
    setSection(section);
    document.getElementById(el)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const chg = q?.changePct;
  return (
    <section id="overview" className="border-b border-[rgba(232,228,219,0.1)] px-4 py-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <AssetSearchBox />
        <div className="fund-mono text-[10px] uppercase tracking-widest text-[#6f6a60]">
          Data status · FMP {bundle?.fmp || '—'} · FRED {bundle?.fred || '—'}
          {bundle?.fmp === 'unconfigured' ? (
            <span className="ml-2">
              <DataRibbon status="unconfigured" />
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-5">
        {id?.image ? (
          <img
            src={id.image}
            alt=""
            className="h-14 w-14 rounded-sm border border-[rgba(232,228,219,0.12)] object-contain bg-white/90"
          />
        ) : (
          <div
            className="fund-serif flex h-14 w-14 items-center justify-center rounded-sm border border-[rgba(196,149,88,0.35)] bg-[rgba(196,149,88,0.12)] text-xl text-[#c49558]"
            aria-hidden="true"
          >
            {(id?.ticker || bundle?.symbol || '?').slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="fund-serif text-3xl font-semibold tracking-tight text-[#f4efe4] sm:text-4xl">
            {id?.name || (loading ? 'Loading…' : bundle?.symbol || 'Company')}
          </h2>
          <p className="fund-mono mt-1 text-[12px] uppercase tracking-[0.18em] text-[#c49558]">
            {id?.ticker || bundle?.symbol} · {id?.exchange || '—'} · {id?.sector || '—'} · {id?.industry || '—'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-4">
          <div>
            <p className="fund-kicker">Price</p>
            <p className="fund-primary text-[26px]">{q?.price != null ? formatUsdPerShare(q.price) : '—'}</p>
            <p
              className="fund-mono text-[12px]"
              style={{ color: chg == null ? '#6f6a60' : chg >= 0 ? '#7d9a6e' : '#c45c4a' }}
            >
              {chg == null ? '—' : formatPercent(chg)}
            </p>
          </div>
          <div>
            <p className="fund-kicker">Market cap</p>
            <p className="fund-mono text-xl tabular-nums">{q?.marketCap != null ? formatCompactUsd(q.marketCap) : '—'}</p>
          </div>
          <div>
            <p className="fund-kicker">Fiscal year</p>
            <p className="fund-mono text-xl">{id?.fiscalYear || '—'}</p>
          </div>
          <div>
            <p className="fund-kicker">Exchange</p>
            <p className="fund-mono text-xl">{id?.exchange || '—'}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ['BUSINESS', 'business', 'overview'],
          ['FINANCIALS', 'revenue', 'financials'],
          ['VALUATION', 'valuation', 'valuation'],
          ['FILINGS', 'filings', 'filings'],
        ].map(([label, el, section]) => (
          <button
            key={label}
            type="button"
            onClick={() => jump(section as ResearchSection, el)}
            className="fund-mono rounded-sm border border-[rgba(196,149,88,0.35)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c49558]"
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function ResearchRail() {
  const { section, setSection } = useFundamental();
  const items = RESEARCH_NAV.filter((i) => i.id !== 'workspace' && i.id !== 'risk');
  return (
    <nav className="fund-rail" aria-label="Research sections">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-on={section === item.id ? 'true' : 'false'}
          onClick={() => {
            setSection(item.id);
            const map: Record<string, string> = {
              overview: 'overview',
              financials: 'revenue',
              earnings: 'earnings',
              valuation: 'valuation',
              industry: 'industry',
              macro: 'macro',
              news: 'news',
              filings: 'filings',
            };
            document.getElementById(map[item.id] || item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function ExpandedLedger({ expandedId }: { expandedId: string | null }) {
  if (!expandedId) return null;
  return (
    <div className="border-t border-[rgba(232,228,219,0.08)] px-3 py-3">
      <p className="fund-kicker mb-2">Expanded statements</p>
      {expandedId === 'financials' ? <FinancialPerformancePanels /> : null}
      {expandedId === 'earnings' ? <EarningsPanels /> : null}
      {expandedId === 'valuation' ? <ValuationPanels /> : null}
      {expandedId === 'industry' ? <IndustryPanels /> : null}
      {expandedId === 'macro' ? <MacroPanels /> : null}
      {expandedId === 'news' || expandedId === 'filings' || expandedId === 'risk' ? <NewsRiskPanels /> : null}
      {expandedId === 'workspace' ? <WorkspacePanels /> : null}
      {expandedId === 'overview' ? <CompanyOverviewPanel /> : null}
    </div>
  );
}

function FooterBar() {
  return (
    <footer className="shrink-0 border-t border-[rgba(232,228,219,0.1)] px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#6f6a60]">
      Information &amp; analytics only — no trade execution — no investment recommendation
    </footer>
  );
}

function FundamentalShell() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div className="fund-shell flex w-full flex-col">
      <HeaderBar />
      <CompanyIdentity />
      <ResearchRail />
      <div className="overflow-visible">
        <BentoWorkspace
          expandedId={expandedId}
          onExpand={(id) => setExpandedId(id ? id : null)}
        />
        <ExpandedLedger expandedId={expandedId} />
      </div>
      <FooterBar />
    </div>
  );
}

function FundamentalMonitorBridge() {
  const { symbol, setSymbol } = useFundamental();
  const [timeframe, setTimeframe] = useState('1d');
  useDeskMonitorSync('fundamental', symbol, timeframe, setSymbol, setTimeframe);
  return null;
}

export default function FundamentalDashboard({ initialSymbol = 'NVDA' }: { initialSymbol?: string }) {
  return (
    <FundamentalProvider initialSymbol={initialSymbol}>
      <FundamentalMonitorBridge />
      <FundamentalShell />
    </FundamentalProvider>
  );
}
