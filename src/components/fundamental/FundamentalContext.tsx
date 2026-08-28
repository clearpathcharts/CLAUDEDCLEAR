import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  ChartWorkspaceId,
  FundamentalBundle,
  ResearchSection,
  SearchHit,
  StatementPeriod,
} from '../../fundamental/types';
import { loadFundamentalBundle, searchFundamentalAssets } from '../../fundamental/service';
import { usePageAutoUpdate } from '../../hooks/usePageAutoUpdate';
import {
  loadNotes,
  loadWatchlists,
  saveNotes,
  saveSnapshot,
  saveWatchlists,
  loadPriorSnapshot,
  type ResearchNote,
  type StoredAlert,
  type Watchlist,
} from '../../fundamental/localStore';
import { asFinite } from '../../fundamental/format';

type Ctx = {
  symbol: string;
  setSymbol: (s: string) => void;
  period: StatementPeriod;
  setPeriod: (p: StatementPeriod) => void;
  section: ResearchSection;
  setSection: (s: ResearchSection) => void;
  chartLayout: ChartWorkspaceId;
  setChartLayout: (id: ChartWorkspaceId) => void;
  valuationWindow: '1Y' | '3Y' | '5Y' | '10Y' | 'MAX';
  setValuationWindow: (w: Ctx['valuationWindow']) => void;
  bundle: FundamentalBundle | null;
  loading: boolean;
  lastUpdatedAt: number | null;
  refresh: () => void;
  searchHits: SearchHit[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  notes: ResearchNote[];
  addNote: (body: string, tags: string[]) => void;
  watchlists: Watchlist[];
  setWatchlists: (w: Watchlist[]) => void;
  alerts: StoredAlert[];
  selectedPeers: string[];
  setSelectedPeers: (p: string[]) => void;
  profileOpen: boolean;
  setProfileOpen: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  noticesOpen: boolean;
  setNoticesOpen: (v: boolean) => void;
};

const FundamentalCtx = createContext<Ctx | null>(null);

export function FundamentalProvider({
  initialSymbol = 'NVDA',
  children,
}: {
  initialSymbol?: string;
  children: React.ReactNode;
}) {
  const [symbol, setSymbolState] = useState(initialSymbol.toUpperCase());
  const [period, setPeriod] = useState<StatementPeriod>('annual');
  const [section, setSection] = useState<ResearchSection>('overview');
  const [chartLayout, setChartLayout] = useState<ChartWorkspaceId>('business_growth');
  const [valuationWindow, setValuationWindow] = useState<Ctx['valuationWindow']>('5Y');
  const [bundle, setBundle] = useState<FundamentalBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [notes, setNotes] = useState<ResearchNote[]>(() => (typeof window === 'undefined' ? [] : loadNotes()));
  const [watchlists, setWatchlistsState] = useState<Watchlist[]>(() =>
    typeof window === 'undefined' ? [] : loadWatchlists(),
  );
  const [alerts, setAlerts] = useState<StoredAlert[]>([]);
  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);

  const setSymbol = useCallback((s: string) => {
    setSymbolState(s.trim().toUpperCase());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const next = await loadFundamentalBundle(symbol);
    setBundle(next);
    const revenue = asFinite(next.incomeAnnual?.[0]?.revenue);
    const eps = asFinite(next.quote?.eps);
    const pe = asFinite(next.quote?.pe);
    const prior = loadPriorSnapshot(symbol);
    const fresh: StoredAlert[] = [];
    if (prior && revenue != null && prior.revenue != null && revenue !== prior.revenue) {
      fresh.push({
        id: `rev-${Date.now()}`,
        kind: 'REVENUE UPDATE',
        title: 'REVENUE UPDATE',
        detail: 'Quarterly or annual revenue changed from the previously stored reported period.',
        at: Date.now(),
        symbol,
      });
    }
    if (next.quote?.earningsAnnouncement) {
      fresh.push({
        id: `earn-${next.quote.earningsAnnouncement}`,
        kind: 'EARNINGS EVENT',
        title: 'EARNINGS EVENT',
        detail: `Scheduled earnings announcement field: ${next.quote.earningsAnnouncement}`,
        at: Date.now(),
        symbol,
      });
    }
    if (next.filings[0]) {
      fresh.push({
        id: `file-${next.filings[0].date}-${next.filings[0].type}`,
        kind: 'FILINGS EVENT',
        title: 'FILINGS EVENT',
        detail: `Latest filing type ${next.filings[0].type || 'unknown'} dated ${next.filings[0].date || 'unknown'}.`,
        at: Date.now(),
        symbol,
      });
    }
    setAlerts(fresh);
    saveSnapshot({ symbol, revenue, eps, pe, fetchedAt: Date.now() });
    if (next.peers.length) setSelectedPeers(next.peers.slice(0, 6));
    setLoading(false);
  }, [symbol]);

  const { refresh, lastUpdatedAt } = usePageAutoUpdate(load, { intervalMs: 300_000, immediate: true });

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void searchFundamentalAssets(searchQuery).then((hits) => {
        if (!cancelled) setSearchHits(hits);
      });
    }, searchQuery ? 200 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [searchQuery]);

  const addNote = useCallback(
    (body: string, tags: string[]) => {
      const note: ResearchNote = {
        id: `n-${Date.now()}`,
        symbol,
        createdAt: Date.now(),
        body,
        tags,
      };
      const next = [note, ...notes];
      setNotes(next);
      saveNotes(next);
    },
    [notes, symbol],
  );

  const setWatchlists = useCallback((w: Watchlist[]) => {
    setWatchlistsState(w);
    saveWatchlists(w);
  }, []);

  const value = useMemo(
    () => ({
      symbol,
      setSymbol,
      period,
      setPeriod,
      section,
      setSection,
      chartLayout,
      setChartLayout,
      valuationWindow,
      setValuationWindow,
      bundle,
      loading,
      lastUpdatedAt,
      refresh,
      searchHits,
      searchQuery,
      setSearchQuery,
      notes,
      addNote,
      watchlists,
      setWatchlists,
      alerts,
      selectedPeers,
      setSelectedPeers,
      profileOpen,
      setProfileOpen,
      settingsOpen,
      setSettingsOpen,
      noticesOpen,
      setNoticesOpen,
    }),
    [
      symbol,
      setSymbol,
      period,
      section,
      chartLayout,
      valuationWindow,
      bundle,
      loading,
      lastUpdatedAt,
      refresh,
      searchHits,
      searchQuery,
      notes,
      addNote,
      watchlists,
      setWatchlists,
      alerts,
      selectedPeers,
      profileOpen,
      settingsOpen,
      noticesOpen,
    ],
  );

  return <FundamentalCtx.Provider value={value}>{children}</FundamentalCtx.Provider>;
}

export function useFundamental() {
  const ctx = useContext(FundamentalCtx);
  if (!ctx) throw new Error('useFundamental requires FundamentalProvider');
  return ctx;
}
