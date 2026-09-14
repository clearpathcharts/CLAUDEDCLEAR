import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { LightweightCandles } from '../charts/LightweightCandles';
import { PatternScannerPanel } from '../charts/PatternScannerPanel';
import NewsPanel from '../NewsPanel';
import EconomicCalendar from '../EconomicCalendar';
import { DEFAULT_MARKET_SYMBOLS } from '../../constants/chartLayout';
import { advancedProfiles } from '../../lib/advanced/profiles';
import { formatStructurePrice } from '../../lib/institutional/analyzeStructure';
import { fetchTieredHistoricalData } from '../../services/marketData';
import { scheduleChartVisionImmediate } from '../../patterns';
import {
  DESK_SCREEN_PANE_LABEL,
  readDeskMonitorQuery,
  readDeskMonitorSnapshot,
  type DeskScreenPane,
} from '../../lib/deskMonitorTree';
import { useDeskMonitorSync } from '../../hooks/useDeskMonitorSync';
import { useMembership } from '../../hooks/useMembership';
import { useVisibilityPause } from '../../hooks/useVisibilityPause';
import {
  loadActiveWatchlistId,
  loadWatchlists,
  type RetailWatchlist,
} from './retail/retailStore';
import type { TraderDeskId } from '../../lib/traderDesks';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;
const NEURO_WL_KEY = 'clearpath_neuro_watchlists_v1';
const NEURO_WL_ACTIVE = 'clearpath_neuro_active_watchlist_v1';

type QuoteRow = {
  symbol: string;
  price: number | null;
  pct: number | null;
  live: boolean;
};

function readChartProfileId(): string {
  try {
    const saved = localStorage.getItem('clearpath_current_profile_id');
    if (saved && saved in advancedProfiles) return saved;
  } catch {
    /* ignore */
  }
  return 'standard_red_green';
}

function loadPaneWatchlist(deskId: TraderDeskId): string[] {
  if (deskId === 'neurodivergent') {
    try {
      const raw = localStorage.getItem(NEURO_WL_KEY);
      const parsed = raw ? (JSON.parse(raw) as RetailWatchlist[]) : null;
      const active = localStorage.getItem(NEURO_WL_ACTIVE);
      const lists = Array.isArray(parsed) && parsed.length ? parsed : [];
      const wl = lists.find((w) => w.id === active) ?? lists[0];
      if (wl?.symbols?.length) return wl.symbols.map((s) => String(s).toUpperCase());
    } catch {
      /* ignore */
    }
  }
  const lists = loadWatchlists();
  const wl = lists.find((w) => w.id === loadActiveWatchlistId()) ?? lists[0];
  if (wl?.symbols?.length) return wl.symbols;
  return [...DEFAULT_MARKET_SYMBOLS];
}

function SatelliteWatchlist({
  deskId,
  symbol,
  onPick,
}: {
  deskId: TraderDeskId;
  symbol: string;
  onPick: (s: string) => void;
}) {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const watch = useMemo(() => loadPaneWatchlist(deskId), [deskId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(watch.join(','))}`);
        if (!res.ok) {
          if (!cancelled) {
            setRows(watch.map((s) => ({ symbol: s, price: null, pct: null, live: false })));
            setError(`Quotes unavailable (HTTP ${res.status}).`);
          }
          return;
        }
        const body = await res.json();
        const map = (body?.quotes || {}) as Record<
          string,
          { close?: string; price?: string; percent_change?: string }
        >;
        if (cancelled) return;
        setError(null);
        setRows(
          watch.map((s) => {
            const data = map[s];
            const priceRaw = parseFloat(String(data?.price ?? data?.close ?? ''));
            const pctRaw = parseFloat(String(data?.percent_change ?? ''));
            const price = Number.isFinite(priceRaw) ? priceRaw : null;
            return {
              symbol: s,
              price,
              pct: Number.isFinite(pctRaw) ? pctRaw : null,
              live: price !== null,
            };
          }),
        );
      } catch (e) {
        if (!cancelled) {
          setRows(watch.map((s) => ({ symbol: s, price: null, pct: null, live: false })));
          setError(e instanceof Error ? e.message : 'Quotes offline');
        }
      }
    };
    void run();
    const id = window.setInterval(() => void run(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [watch]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-3">
      <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        Tap a row to sync the chart on every screen
      </p>
      {error ? <p className="mb-2 font-mono text-sm text-rose-400">{error}</p> : null}
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {rows.map((row) => {
          const on = row.symbol === symbol;
          return (
            <li key={row.symbol}>
              <button
                type="button"
                onClick={() => onPick(row.symbol)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left"
                style={{
                  borderColor: on ? 'var(--desk-cyan, #22d3ee)' : 'rgba(255,255,255,0.08)',
                  background: on ? 'rgba(34,211,238,0.08)' : 'transparent',
                }}
              >
                <span className="font-mono text-sm font-extrabold">{row.symbol}</span>
                <span className="text-right font-mono text-sm tabular-nums">
                  {row.live && row.price != null ? (
                    <>
                      <span className="block">{formatStructurePrice(row.price)}</span>
                      <span
                        className={`block text-xs ${
                          row.pct == null ? 'text-zinc-500' : row.pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {row.pct == null ? 'DATA UNAVAILABLE' : `${row.pct >= 0 ? '+' : ''}${row.pct.toFixed(2)}%`}
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-500">DATA UNAVAILABLE</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ScannerSatellite({
  symbol,
  timeframe,
  locked,
  aiMode,
}: {
  symbol: string;
  timeframe: string;
  locked: boolean;
  aiMode: boolean;
}) {
  const visible = useVisibilityPause();
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void (async () => {
      try {
        const candles = await fetchTieredHistoricalData(symbol, timeframe, 'BRONZE');
        if (cancelled || !candles.length) return;
        scheduleChartVisionImmediate({ candles, symbol, timeframe });
      } catch {
        /* Pattern panel stays empty rather than inventing hits. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe, visible]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <PatternScannerPanel symbol={symbol} timeframe={timeframe} locked={locked} aiMode={aiMode} />
    </div>
  );
}

export default function DeskScreenWorkspace({
  deskId,
  pane,
}: {
  deskId: TraderDeskId;
  pane: DeskScreenPane;
}) {
  const query = typeof window === 'undefined' ? {} : readDeskMonitorQuery(window.location.search);
  const snap = typeof window === 'undefined' ? null : readDeskMonitorSnapshot(deskId);
  const [symbol, setSymbol] = useState(
    () => query.symbol || snap?.symbol || DEFAULT_MARKET_SYMBOLS[0],
  );
  const [timeframe, setTimeframe] = useState(() => query.timeframe || snap?.timeframe || '1h');
  const setSymbolCb = useCallback((s: string) => setSymbol(s.trim().toUpperCase()), []);
  const setTimeframeCb = useCallback((t: string) => setTimeframe(t), []);
  useDeskMonitorSync(deskId, symbol, timeframe, setSymbolCb, setTimeframeCb);
  const { hasFeature } = useMembership();
  const profileId = readChartProfileId();

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-desk-screen-pane={pane}>
      {pane === 'chart' ? (
        <section className="flex min-h-0 flex-1 flex-col" data-desk-chart-room>
          <header className="shrink-0 flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
            <ChartSymbolSearch compact activeSymbol={symbol} onSubmit={setSymbolCb} />
            <div className="flex flex-wrap gap-1" role="group" aria-label="Timeframe">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframeCb(tf)}
                  aria-pressed={timeframe === tf}
                  className="rounded-md border px-2 py-1 text-xs font-extrabold uppercase"
                  style={{
                    borderColor: timeframe === tf ? 'var(--desk-indigo, #818cf8)' : 'rgba(255,255,255,0.15)',
                    color: timeframe === tf ? 'var(--desk-indigo, #818cf8)' : '#a1a1aa',
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
            <span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {symbol} · {timeframe}
            </span>
          </header>
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
              <LightweightCandles
                symbol={symbol}
                timeframe={timeframe}
                profileId={profileId}
                fillParent
                height={420}
              />
            </div>
          </div>
        </section>
      ) : null}
      {pane === 'watchlist' ? (
        <SatelliteWatchlist deskId={deskId} symbol={symbol} onPick={setSymbolCb} />
      ) : null}
      {pane === 'scanner' ? (
        <ScannerSatellite
          symbol={symbol}
          timeframe={timeframe}
          locked={!hasFeature('patternOverlay')}
          aiMode={hasFeature('aiScanner')}
        />
      ) : null}
      {pane === 'news' ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <NewsPanel />
        </div>
      ) : null}
      {pane === 'calendar' ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <EconomicCalendar />
        </div>
      ) : null}
      <p className="sr-only">
        {DESK_SCREEN_PANE_LABEL[pane]} satellite for {deskId}
      </p>
    </div>
  );
}
