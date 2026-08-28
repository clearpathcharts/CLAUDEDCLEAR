import React, { useMemo, useState } from 'react';
import { Bell, Search, Settings } from 'lucide-react';
import { FundamentalProvider, useFundamental } from './FundamentalContext';
import {
  CompanyOverviewPanel,
  EarningsPanels,
  FinancialPerformancePanels,
  HealthPanel,
  IndustryPanels,
  MacroPanels,
  NewsRiskPanels,
  ScorecardPanel,
  SegmentsPanel,
  StatusChip,
  ValuationPanels,
  ValuationRail,
  WorkspacePanels,
} from './ResearchPanels';
import { RESEARCH_NAV } from '../../fundamental/localStore';
import { formatCompactUsd, formatPercent, formatUsdPerShare, marketSessionUtc } from '../../fundamental/format';
import { DataRibbon } from './primitives';

function HeaderBar() {
  const { lastUpdatedAt, settingsOpen, setSettingsOpen, noticesOpen, setNoticesOpen, alerts, bundle } = useFundamental();
  const stamp = lastUpdatedAt ? new Date(lastUpdatedAt).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '—';
  return (
    <header className="shrink-0 border-b border-white/10 bg-[#05070a]">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500">ClearPath</p>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Fundamental</p>
        </div>
        <h2 className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-white sm:text-sm">
          Fundamental Market Intelligence
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusChip />
          <span className="hidden font-mono text-[8px] uppercase tracking-widest text-zinc-500 sm:inline">Last update {stamp}</span>
          <span className="hidden font-mono text-[8px] uppercase tracking-widest text-zinc-500 lg:inline">
            {marketSessionUtc()}
          </span>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNoticesOpen(!noticesOpen)}
            className="rounded border border-white/10 p-1.5 text-zinc-400 hover:text-white"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="rounded border border-white/10 p-1.5 text-zinc-400 hover:text-white"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {noticesOpen ? (
        <div className="border-t border-white/5 px-3 py-2">
          {alerts.length ? (
            alerts.map((a) => (
              <p key={a.id} className="font-mono text-[10px] text-zinc-300">
                {a.title}: {a.detail}
              </p>
            ))
          ) : (
            <p className="font-mono text-[10px] uppercase text-zinc-500">No objective alerts</p>
          )}
        </div>
      ) : null}
      {settingsOpen ? (
        <div className="border-t border-white/5 px-3 py-2 font-mono text-[10px] uppercase text-zinc-400">
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
    <div className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-zinc-500" />
      <input
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search stocks, ETFs, FX, commodities, indicators…"
        className="w-full rounded-lg border border-white/10 bg-black/60 py-1.5 pl-7 pr-2 font-mono text-xs text-white outline-none focus:border-cyan-500/50"
        aria-label="Asset search"
      />
      {open && searchHits.length ? (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-white/10 bg-[#0b0e13] shadow-xl">
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
                <span className="font-mono text-xs text-cyan-200">{hit.ticker}</span>
                <span className="truncate text-[11px] text-zinc-200">{hit.name}</span>
                <span className="hidden font-mono text-[9px] uppercase text-zinc-500 sm:inline">
                  {hit.exchange} · {hit.country}
                </span>
                <span className="hidden font-mono text-[9px] uppercase text-zinc-500 sm:inline">
                  {hit.sector} · {hit.industry} · {hit.assetType}
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

function CompanyRibbon() {
  const { bundle, loading } = useFundamental();
  const id = bundle?.identity;
  const q = bundle?.quote;
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#080b10] px-3 py-3">
      <AssetSearchBox />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-black uppercase tracking-wide text-white">
          {id?.name || (loading ? 'Loading…' : 'DATA UNAVAILABLE')}
        </p>
        <p className="font-mono text-xs text-cyan-300">{id?.ticker || bundle?.symbol}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4 lg:grid-cols-6">
        <RibbonStat label="Price" value={q?.price != null ? formatUsdPerShare(q.price) : 'DATA UNAVAILABLE'} />
        <RibbonStat label="Market cap" value={formatCompactUsd(q?.marketCap ?? null)} />
        <RibbonStat label="Sector" value={id?.sector || 'DATA UNAVAILABLE'} />
        <RibbonStat label="Industry" value={id?.industry || 'DATA UNAVAILABLE'} />
        <RibbonStat label="Fiscal year" value={id?.fiscalYear || 'DATA UNAVAILABLE'} />
        <RibbonStat
          label="Change"
          value={q?.changePct == null ? 'DATA UNAVAILABLE' : formatPercent(q.changePct)}
        />
      </div>
      <div className="w-full flex flex-wrap gap-3 font-mono text-[8px] uppercase tracking-widest text-zinc-500">
        <span>Exchange {id?.exchange || '—'}</span>
        <span>Country {id?.country || '—'}</span>
        <span>Currency {id?.currency || '—'}</span>
        <span>Shares {id?.sharesOutstanding != null ? formatCompactUsd(id.sharesOutstanding).replace('$', '') : 'DATA UNAVAILABLE'}</span>
        <span>Float {id?.floatShares != null ? formatCompactUsd(id.floatShares).replace('$', '') : 'DATA UNAVAILABLE'}</span>
        <span>Reporting {id?.reportingFrequency || '—'}</span>
        {bundle?.fmp === 'unconfigured' ? <DataRibbon status="unconfigured" /> : null}
      </div>
    </div>
  );
}

function RibbonStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="font-mono text-xs tabular-nums text-white">{value}</p>
    </div>
  );
}

function ResearchNav({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { section, setSection } = useFundamental();
  return (
    <aside className={`${collapsed ? 'hidden lg:flex' : 'flex'} w-full shrink-0 flex-col gap-1 border-b border-white/10 bg-black/40 p-2 lg:w-44 lg:border-b-0 lg:border-r`}>
      <button type="button" className="mb-1 text-left font-mono text-[8px] uppercase text-zinc-500 lg:hidden" onClick={onToggle}>
        Hide navigation
      </button>
      {RESEARCH_NAV.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            setSection(item.id);
            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="rounded-md px-2 py-1.5 text-left text-[10px] font-black uppercase tracking-widest"
          style={{
            color: section === item.id ? '#22d3ee' : '#94a3b8',
            background: section === item.id ? 'rgba(34,211,238,0.12)' : 'transparent',
          }}
        >
          {item.label}
        </button>
      ))}
    </aside>
  );
}

function MainStage() {
  const { section } = useFundamental();
  const body = useMemo(() => {
    switch (section) {
      case 'financials':
        return <FinancialPerformancePanels />;
      case 'earnings':
        return <EarningsPanels />;
      case 'valuation':
        return <ValuationPanels />;
      case 'industry':
        return <IndustryPanels />;
      case 'macro':
        return <MacroPanels />;
      case 'news':
      case 'filings':
      case 'risk':
        return <NewsRiskPanels />;
      case 'workspace':
        return <WorkspacePanels />;
      default:
        return (
          <div className="space-y-3">
            <CompanyOverviewPanel />
            <ScorecardPanel />
            <HealthPanel />
            <SegmentsPanel />
          </div>
        );
    }
  }, [section]);
  return <div className="min-w-0 flex-1 space-y-3 p-2 sm:p-3">{body}</div>;
}

function FooterBar() {
  return (
    <footer className="shrink-0 border-t border-white/10 px-3 py-2 text-center font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-500">
      Information &amp; analytics only — no trade execution — no investment recommendation
    </footer>
  );
}

function FundamentalShell() {
  const [navOpen, setNavOpen] = useState(true);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#05070a] text-zinc-100">
      <HeaderBar />
      <CompanyRibbon />
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-1 lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen((v) => !v)}
          className="text-[10px] font-black uppercase tracking-widest text-cyan-300"
        >
          Research navigation
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ResearchNav collapsed={!navOpen} onToggle={() => setNavOpen(false)} />
        <MainStage />
        <div className="hidden w-64 shrink-0 border-l border-white/10 p-2 xl:block">
          <ValuationRail />
        </div>
      </div>
      <div className="hidden border-t border-white/5 px-3 py-1 font-mono text-[8px] uppercase tracking-widest text-zinc-600 md:block">
        Company → business model → revenue → earnings → profitability → cash flow → balance sheet → capital allocation →
        valuation → peers → industry → macro → risk
      </div>
      <FooterBar />
    </div>
  );
}

export default function FundamentalDashboard({ initialSymbol = 'NVDA' }: { initialSymbol?: string }) {
  return (
    <FundamentalProvider initialSymbol={initialSymbol}>
      <FundamentalShell />
    </FundamentalProvider>
  );
}
