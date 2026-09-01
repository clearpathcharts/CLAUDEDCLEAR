import React, { useMemo, useState } from 'react';
import { ChartSymbolSearch } from '../../charts/ChartSymbolSearch';
import { LightweightCandles } from '../../charts/LightweightCandles';
import { resolveMarketAsset } from '../../../constants/marketAssets';
import { analyzeInstitutionalStructure, formatStructurePrice } from '../../../lib/institutional/analyzeStructure';
import { DEFAULT_MARKET_SYMBOLS } from '../../../constants/chartLayout';
import { InstitutionalRegistry } from '../../../core/registry/InstitutionalRegistry';
import { navigateToDesk } from '../../../lib/traderDesks';
import {
  atrValue,
  expectedRangeFromAtr,
  maxDrawdownPct,
  realizedVolPct,
  reconstructBarTape,
  scenarioPrices,
} from '../../../lib/institutional/marketMath';
import { Bento, Unavail, KV, Bar } from './Bento';
import { useDeskHold } from '../DeskHoldScope';
import {
  CORR_KEYS,
  RIBBON_MARKETS,
  UNIVERSE_TABS,
  useInstitutionalIntelligence,
  type QuoteRow,
} from './useInstitutionalIntelligence';
import type { Candle } from '../../../types/indicators';

const TIMEFRAMES = ['5m', '15m', '1h', '4h', '1d'] as const;

function pctClass(pct: number | null): string {
  if (pct == null) return 'text-[var(--desk-muted)]';
  return pct >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

function QuoteCell({ row, on, onPick }: { row: QuoteRow; on?: boolean; onPick?: (s: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick?.(row.symbol)}
      className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-white/5"
      style={{ background: on ? 'rgba(0,255,255,0.08)' : undefined }}
    >
      <span className="min-w-0">
        <span className="block truncate font-mono text-[11px] font-extrabold text-[var(--desk-text)]">{row.symbol}</span>
        <span className="block truncate text-[9px] uppercase text-[var(--desk-muted)]">{row.name}</span>
      </span>
      <span className="shrink-0 text-right font-mono">
        {row.live && row.price != null ? (
          <>
            <span className="block text-[11px] tabular-nums text-[var(--desk-text)]">{formatStructurePrice(row.price)}</span>
            <span className={`block text-[10px] ${pctClass(row.pct)}`}>
              {row.pct == null ? '—' : `${row.pct >= 0 ? '+' : ''}${row.pct.toFixed(2)}%`}
            </span>
          </>
        ) : (
          <span className="text-[9px] uppercase text-amber-200/80">DATA UNAVAILABLE</span>
        )}
      </span>
    </button>
  );
}

function flowStats(candles: Candle[]) {
  let buy = 0;
  let sell = 0;
  const prints: { size: number; time: number; price: number }[] = [];
  for (const c of candles) {
    const range = c.high - c.low;
    const vol = typeof c.volume === 'number' && c.volume > 0 ? c.volume : Math.max(0, range);
    const buyerRatio = range > 0 ? (c.close - c.low) / range : 0.5;
    buy += buyerRatio * vol;
    sell += (1 - buyerRatio) * vol;
    prints.push({ size: vol, time: c.time, price: c.close });
  }
  prints.sort((a, b) => b.size - a.size);
  return { buy, sell, bars: candles.length, large: prints.slice(0, 3) };
}

function heatColor(r: number | null): string {
  if (r == null) return 'bg-white/5 text-[var(--desk-muted)]';
  if (r >= 0.5) return 'bg-cyan-500/35 text-cyan-100';
  if (r >= 0.15) return 'bg-cyan-500/15 text-cyan-200';
  if (r <= -0.5) return 'bg-fuchsia-500/35 text-fuchsia-100';
  if (r <= -0.15) return 'bg-fuchsia-500/15 text-fuchsia-200';
  return 'bg-white/10 text-[var(--desk-text)]';
}

export default function InstitutionalDashboard() {
  const [symbol, setSymbol] = useState<string>(DEFAULT_MARKET_SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [layout, setLayout] = useState<1 | 2 | 4>(1);
  const [universeTab, setUniverseTab] = useState('equities');
  const [open, setOpen] = useState<Record<string, boolean>>({
    structure: false,
    options: false,
  });
  const [focus, setFocus] = useState<string | null>(null);

  const intel = useInstitutionalIntelligence(symbol, timeframe, layout, universeTab);
  const primaryCandles = intel.candlesBySymbol[symbol] ?? [];
  const report = useMemo(
    () => (primaryCandles.length ? analyzeInstitutionalStructure(primaryCandles) : null),
    [primaryCandles],
  );
  const mark = primaryCandles.length ? primaryCandles[primaryCandles.length - 1].close : null;
  const flow = useMemo(() => flowStats(primaryCandles), [primaryCandles]);
  const tape = useMemo(() => reconstructBarTape(primaryCandles, 48), [primaryCandles]);
  const rv = realizedVolPct(primaryCandles);
  const atr = atrValue(primaryCandles);
  const dd = maxDrawdownPct(primaryCandles);
  const scenarios = scenarioPrices(mark);
  const lastCvd = report?.cvd.length ? report.cvd[report.cvd.length - 1] : null;
  const poc = report?.volumeProfile.find((n) => n.isPOC);
  const maxVp = report ? Math.max(...report.volumeProfile.map((n) => n.volume), 1) : 1;
  const vpShare = poc && report ? (poc.volume / report.volumeProfile.reduce((s, n) => s + n.volume, 0)) * 100 : null;
  const lastRange = primaryCandles.length
    ? primaryCandles[primaryCandles.length - 1].high - primaryCandles[primaryCandles.length - 1].low
    : null;
  const fed = intel.macro.find((m) => m.id === 'fed');
  const cpi = intel.macro.find((m) => m.id === 'cpi');
  const gdp = intel.macro.find((m) => m.id === 'gdp');
  const nfp = intel.macro.find((m) => m.id === 'nfp');
  const y10 = intel.macro.find((m) => m.id === 'dgs10');
  const y2 = intel.macro.find((m) => m.id === 'dgs2');
  const curve =
    y10?.value != null && y2?.value != null ? (y10.value - y2.value) * 100 : null;
  const vixRow = intel.ribbon.find((r) => r.symbol === 'VIX');
  const tabMeta = UNIVERSE_TABS.find((t) => t.id === universeTab);
  const totalFlow = flow.buy + flow.sell;
  const buyPct = totalFlow > 0 ? (flow.buy / totalFlow) * 100 : 0;
  const sellPct = totalFlow > 0 ? (flow.sell / totalFlow) * 100 : 0;

  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: s[id] === false ? true : false }));
  const hold = useDeskHold();
  const universeHeld = hold?.isHeld('universe') ?? false;
  const flowHeld = hold?.isHeld('flow') ?? false;
  const liqHeld = hold?.isHeld('liq') ?? false;
  const sideHeld = flowHeld && liqHeld;
  const chartCols = [
    universeHeld ? null : '260px',
    'minmax(0,1.6fr)',
    sideHeld ? null : 'minmax(280px,0.9fr)',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      data-institutional-door
      className="flex flex-col gap-2 p-2"
    >
      <Bento holdId="ribbon" title="Global Markets" status="environment" className="shrink-0">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-7">
          {RIBBON_MARKETS.map((m) => {
            const row = intel.ribbon.find((r) => r.symbol === m.symbol);
            return (
              <button
                key={m.symbol}
                type="button"
                onClick={() => m.symbol !== 'VIX' && setSymbol(m.symbol)}
                className="rounded border border-[var(--desk-border)] px-2 py-1.5 text-left hover:border-[var(--desk-cyan)]/40"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--desk-muted)]">{m.label}</p>
                {row?.live && row.pct != null ? (
                  <p className={`font-mono text-[13px] font-extrabold tabular-nums ${pctClass(row.pct)}`}>
                    {row.pct >= 0 ? '+' : ''}
                    {row.pct.toFixed(2)}%
                  </p>
                ) : (
                  <p className="text-[9px] font-bold uppercase text-amber-200/80">DATA UNAVAILABLE</p>
                )}
                {row?.live && row.price != null ? (
                  <p className="font-mono text-[10px] tabular-nums text-[var(--desk-text)]">{formatStructurePrice(row.price)}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </Bento>

      <div
        data-desk-chart-room
        data-chart-room={!universeHeld && !sideHeld ? 'full' : 'open'}
        className="grid min-h-[420px] grid-cols-1 gap-2"
        style={{ ['--desk-chart-cols' as string]: chartCols }}
      >
        <Bento holdId="universe" title="Market Universe" status={tabMeta?.label} className="min-h-[280px]">
          <div className="mb-2 flex flex-wrap gap-1">
            {UNIVERSE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setUniverseTab(t.id)}
                className="rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                style={{
                  borderColor: universeTab === t.id ? 'var(--desk-cyan)' : 'var(--desk-border)',
                  color: universeTab === t.id ? 'var(--desk-cyan)' : 'var(--desk-muted)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tabMeta?.note ? <p className="mb-1 text-[9px] uppercase text-[var(--desk-muted)]">{tabMeta.note}</p> : null}
          <ul>
            {intel.universeQuotes.map((row) => (
              <li key={row.symbol}>
                <QuoteCell row={row} on={row.symbol === symbol} onPick={setSymbol} />
              </li>
            ))}
          </ul>
        </Bento>

        <section className="flex min-h-[380px] min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--desk-border)] bg-[var(--desk-panel)]">
          <header className="shrink-0 space-y-1.5 border-b border-[var(--desk-border)] px-2.5 py-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--desk-cyan)]">
                Primary Market Workspace
              </h2>
              <div className="flex gap-1" role="group" aria-label="Chart layout">
                {([1, 2, 4] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setLayout(n)}
                    className="rounded border px-2 py-0.5 text-[9px] font-black uppercase"
                    style={{
                      borderColor: layout === n ? 'var(--desk-pink)' : 'var(--desk-border)',
                      color: layout === n ? 'var(--desk-pink)' : 'var(--desk-muted)',
                    }}
                  >
                    {n} CHART{n > 1 ? 'S' : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="font-mono text-sm font-extrabold text-[var(--desk-text)]">
                {symbol}
                {mark != null && (
                  <span className="ml-2 text-[var(--desk-cyan)]">{formatStructurePrice(mark)}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className="rounded border px-1.5 py-0.5 text-[9px] font-black uppercase"
                    style={{
                      borderColor: timeframe === tf ? 'var(--desk-indigo)' : 'var(--desk-border)',
                      color: timeframe === tf ? 'var(--desk-indigo)' : 'var(--desk-muted)',
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <ChartSymbolSearch
              placeholder="Load any market…"
              activeSymbol={symbol}
              onSubmit={(raw) => setSymbol(resolveMarketAsset(raw).value)}
            />
            {intel.candleError ? <p className="font-mono text-[11px] text-rose-400">{intel.candleError}</p> : null}
          </header>
          <div
            className={`grid min-h-0 flex-1 gap-1 p-1 ${
              layout === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
            } ${layout === 4 ? 'sm:grid-rows-2' : ''}`}
          >
            {intel.slots.map((s) => {
              const data = intel.candlesBySymbol[s] ?? [];
              return (
                <div key={s} className="relative min-h-[180px] overflow-hidden rounded border border-[var(--desk-border)]">
                  <p className="absolute left-2 top-1 z-10 font-mono text-[10px] font-black uppercase tracking-wider text-[var(--desk-cyan)]">
                    {s}
                  </p>
                  <LightweightCandles
                    data={data}
                    symbol={s}
                    profileId="focus_mode"
                    timeframe={timeframe}
                    fillParent
                    height={layout === 1 ? 420 : 200}
                    embedMode
                    hideChartToolbar
                  />
                </div>
              );
            })}
          </div>
        </section>

        {sideHeld ? null : (
        <div className={`grid min-h-0 gap-2 ${flowHeld || liqHeld ? 'grid-rows-1' : 'grid-rows-2'}`}>
          <Bento
            holdId="flow"
            title="Market Flow"
            status={report?.volumeMode === 'vendor' ? 'vendor volume' : 'range-proxy'}
            onExpand={() => setFocus('flow')}
          >
            {primaryCandles.length === 0 ? (
              <Unavail />
            ) : (
              <>
                <p className="mb-1 text-[9px] uppercase text-[var(--desk-muted)]">
                  Close-location split of bar volume. Not a live tape.
                </p>
                <KV k="Buy-side volume" v={Math.round(flow.buy).toLocaleString()} accent="text-emerald-400" />
                <Bar pct={buyPct} color="bg-emerald-400" />
                <KV k="Sell-side volume" v={Math.round(flow.sell).toLocaleString()} accent="text-rose-400" />
                <Bar pct={sellPct} color="bg-rose-400" />
                <KV k="Delta" v={lastCvd ? lastCvd.cumulativeDelta.toLocaleString() : 'DATA UNAVAILABLE'} />
                <KV k="Bar count" v={flow.bars.toLocaleString()} />
                <KV
                  k="Avg bar size"
                  v={flow.bars ? Math.round(totalFlow / flow.bars).toLocaleString() : 'DATA UNAVAILABLE'}
                />
                <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-[var(--desk-muted)]">Large prints (bars)</p>
                {flow.large.map((p, i) => (
                  <p key={i} className="font-mono text-[10px] tabular-nums text-[var(--desk-text)]">
                    {formatStructurePrice(p.price)} · {Math.round(p.size).toLocaleString()}
                  </p>
                ))}
              </>
            )}
          </Bento>

          <Bento holdId="liq" title="Liquidity" status="OHLC-derived" onExpand={() => setFocus('liq')}>
            <p className="mb-1 text-[9px] uppercase text-[var(--desk-muted)]">
              Level II / book depth DATA UNAVAILABLE. Visuals from candles + volume profile.
            </p>
            <KV k="Last bar range" v={lastRange != null ? formatStructurePrice(lastRange) : 'DATA UNAVAILABLE'} />
            <KV k="Quoted spread" v="DATA UNAVAILABLE" />
            <KV k="Bid depth" v="DATA UNAVAILABLE" />
            <KV k="Ask depth" v="DATA UNAVAILABLE" />
            <KV
              k="POC concentration"
              v={vpShare != null ? `${vpShare.toFixed(1)}%` : 'DATA UNAVAILABLE'}
            />
            <KV
              k="Delta imbalance"
              v={totalFlow > 0 ? `${(((flow.buy - flow.sell) / totalFlow) * 100).toFixed(1)}%` : 'DATA UNAVAILABLE'}
            />
            <KV k="Sweep events" v={report ? String(report.sweeps.length) : 'DATA UNAVAILABLE'} />
            {report?.volumeProfile.slice(-8).reverse().map((n) => (
              <div key={n.price} className="flex items-center gap-1 py-px">
                <span className="w-14 shrink-0 font-mono text-[9px] tabular-nums text-[var(--desk-muted)]">
                  {formatStructurePrice(n.price)}
                </span>
                <div className="h-1.5 flex-1 bg-black/40">
                  <div
                    className={`h-1.5 ${n.isPOC ? 'bg-[var(--desk-pink)]' : 'bg-[var(--desk-cyan)]/50'}`}
                    style={{ width: `${Math.max(4, (n.volume / maxVp) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </Bento>
        </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Bento holdId="tape" title="Time & Sales" status="reconstructed bars" onExpand={() => setFocus('tape')}>
          <p className="mb-1 text-[9px] uppercase text-[var(--desk-muted)]">
            Tick tape DATA UNAVAILABLE. Each row is one OHLC bar.
          </p>
          <div className="max-h-48 overflow-auto font-mono text-[10px]">
            <div className="sticky top-0 grid grid-cols-[64px_1fr_72px_88px] gap-1 bg-[var(--desk-panel)] text-[8px] uppercase text-[var(--desk-muted)]">
              <span>Time</span>
              <span>Price</span>
              <span>Size</span>
              <span>Side</span>
            </div>
            {tape.length === 0 ? <Unavail /> : null}
            {tape.map((row, i) => (
              <div key={`${row.time}-${i}`} className="grid grid-cols-[64px_1fr_72px_88px] gap-1 py-0.5">
                <span>{row.time}</span>
                <span>{formatStructurePrice(row.price)}</span>
                <span>{Math.round(row.size).toLocaleString()}</span>
                <span className={row.side === 'BUY-SIDE' ? 'text-emerald-400' : row.side === 'SELL-SIDE' ? 'text-rose-400' : 'text-[var(--desk-muted)]'}>
                  {row.side}
                </span>
              </div>
            ))}
          </div>
        </Bento>

        <Bento
          holdId="structure"
          title="Market Structure / Technical Analytics"
          status="educational"
          expanded={open.structure === true}
          onToggle={() => toggle('structure')}
          collapsedSummary={
            report
              ? `BOS ${report.bos.length} · CHoCH ${report.choch.length} · FVG ${report.fvg.length} · OB ${report.orderBlocks.length} · SWEEPS ${report.sweeps.length}`
              : 'Waiting for candles'
          }
        >
          <p className="mb-1 text-[9px] uppercase text-[var(--desk-muted)]">
            Derived from the loaded OHLC series. Not signals.
          </p>
          {report ? (
            <dl className="mb-2 grid grid-cols-5 gap-1 font-mono text-[10px] uppercase text-[var(--desk-muted)]">
              <div>BOS <strong className="text-[var(--desk-text)]">{report.bos.length}</strong></div>
              <div>CHoCH <strong className="text-[var(--desk-text)]">{report.choch.length}</strong></div>
              <div>FVG <strong className="text-[var(--desk-text)]">{report.fvg.length}</strong></div>
              <div>OB <strong className="text-[var(--desk-text)]">{report.orderBlocks.length}</strong></div>
              <div>SWP <strong className="text-[var(--desk-text)]">{report.sweeps.length}</strong></div>
            </dl>
          ) : (
            <Unavail />
          )}
          <ul className="max-h-36 overflow-auto">
            {(report?.events.slice(0, 12) ?? []).map((ev, i) => (
              <li key={`${ev.family}-${ev.time}-${i}`} className="flex justify-between gap-2 border-b border-[var(--desk-border)] py-0.5">
                <span className="text-[10px] font-black uppercase text-[var(--desk-cyan)]">{ev.family}</span>
                <span className="truncate text-[10px] text-[var(--desk-muted)]">{ev.label}</span>
                <span className="font-mono text-[10px]">{formatStructurePrice(ev.price)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[8px] uppercase text-[var(--desk-muted)]">Engine roster</p>
          {InstitutionalRegistry.map((item) => (
            <p key={item.id} className="font-mono text-[9px] text-[var(--desk-muted)]">
              {item.abbr} {item.name}
            </p>
          ))}
        </Bento>

        <Bento holdId="volume" title="Volume Analytics" status={report?.volumeMode}>
          <p className="mb-1 text-[9px] uppercase text-[var(--desk-muted)]">
            {report?.volumeMode === 'vendor'
              ? 'Vendor volume bins'
              : 'Range-weighted proxy — vendor volume is not in this candle feed'}
            {poc ? ` · POC ${formatStructurePrice(poc.price)}` : ''}
          </p>
          <div className="max-h-40 overflow-auto">
            {(report?.volumeProfile ?? [])
              .slice()
              .reverse()
              .map((node) => (
                <div key={node.price} className="flex items-center gap-1 py-px">
                  <span className="w-16 shrink-0 font-mono text-[9px] tabular-nums text-[var(--desk-muted)]">
                    {formatStructurePrice(node.price)}
                  </span>
                  <div className="h-1.5 flex-1 bg-black/40">
                    <div
                      className={`h-1.5 ${node.isPOC ? 'bg-[var(--desk-pink)]' : 'bg-[var(--desk-indigo)]/70'}`}
                      style={{ width: `${Math.max(3, (node.volume / maxVp) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Bento>

        <Bento holdId="vol" title="Volatility" onExpand={() => setFocus('vol')}>
          <KV k="VIX" v={vixRow?.live && vixRow.price != null ? formatStructurePrice(vixRow.price) : 'DATA UNAVAILABLE'} />
          <KV k="Realized vol" v={rv != null ? `${rv.toFixed(1)}%` : 'DATA UNAVAILABLE'} />
          <KV k="Implied vol" v="DATA UNAVAILABLE" />
          <KV k="ATR" v={atr != null ? formatStructurePrice(atr) : 'DATA UNAVAILABLE'} />
          <KV k="Vol percentile" v="DATA UNAVAILABLE" />
          <KV
            k="Expected range (ATR)"
            v={expectedRangeFromAtr(atr) != null ? formatStructurePrice(expectedRangeFromAtr(atr)!) : 'DATA UNAVAILABLE'}
          />
          {rv != null ? (
            <div className="mt-2">
              <p className="mb-1 text-[9px] uppercase text-[var(--desk-muted)]">Realized vol (ann.)</p>
              <Bar pct={Math.min(100, rv)} color="bg-[var(--desk-indigo)]" />
            </div>
          ) : null}
        </Bento>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <Bento
          holdId="options"
          title="Options Intelligence"
          status="no options feed"
          expanded={open.options === true}
          onToggle={() => toggle('options')}
          onExpand={() => setFocus('options')}
          collapsedSummary="Calls / puts / OI / IV / GEX — DATA UNAVAILABLE until an options vendor is configured"
        >
          <p className="mb-2 text-[9px] uppercase text-[var(--desk-muted)]">
            Compact card. Workspace fields stay empty rather than synthetic.
          </p>
          {['Calls', 'Puts', 'Open interest', 'Volume', 'IV', 'Delta', 'Gamma', 'Vega', 'Theta', 'Skew', 'Term structure', 'Gamma exposure'].map(
            (k) => (
              <KV key={k} k={k} v="DATA UNAVAILABLE" />
            ),
          )}
        </Bento>

        <Bento holdId="corr" title="Cross-Asset Correlation" status="Pearson · daily closes" onExpand={() => setFocus('corr')}>
          <div className="overflow-auto">
            <table className="w-full border-collapse text-center font-mono text-[10px]">
              <thead>
                <tr>
                  <th className="p-1 text-left text-[8px] uppercase text-[var(--desk-muted)]" />
                  {CORR_KEYS.map((k) => (
                    <th key={k} className="p-1 text-[8px] uppercase text-[var(--desk-muted)]">
                      {k === 'XAUUSD' ? 'GOLD' : k === 'US10Y' ? '10Y' : k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CORR_KEYS.map((a) => (
                  <tr key={a}>
                    <th className="p-1 text-left text-[8px] uppercase text-[var(--desk-muted)]">
                      {a === 'XAUUSD' ? 'GOLD' : a === 'US10Y' ? '10Y' : a}
                    </th>
                    {CORR_KEYS.map((b) => {
                      const r = intel.correlation[a]?.[b] ?? null;
                      return (
                        <td key={b} className={`p-1 ${heatColor(r)}`}>
                          {r == null ? '—' : r.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[8px] uppercase text-[var(--desk-muted)]">
            VIX series not in the live registry — those cells stay unavailable. Missing series are never filled with 1.0.
          </p>
        </Bento>

        <Bento holdId="macro" title="Macro Intelligence" onExpand={() => setFocus('macro')}>
          <KV k="FED" v={fed?.value != null ? `${fed.value.toFixed(2)}%` : 'DATA UNAVAILABLE'} />
          <KV k="CPI" v={cpi?.value != null ? cpi.value.toFixed(2) : 'DATA UNAVAILABLE'} />
          <KV k="GDP" v={gdp?.value != null ? gdp.value.toFixed(1) : 'DATA UNAVAILABLE'} />
          <KV k="NFP" v={nfp?.value != null ? nfp.value.toFixed(0) : 'DATA UNAVAILABLE'} />
          <KV k="10Y yield" v={y10?.value != null ? `${y10.value.toFixed(2)}%` : 'DATA UNAVAILABLE'} />
          <KV k="2Y yield" v={y2?.value != null ? `${y2.value.toFixed(2)}%` : 'DATA UNAVAILABLE'} />
          <KV k="Yield curve" v={curve != null ? `${curve >= 0 ? '+' : ''}${curve.toFixed(0)} bps` : 'DATA UNAVAILABLE'} />
          <button
            type="button"
            onClick={() => navigateToDesk('fundamental')}
            className="mt-2 w-full rounded border border-[var(--desk-indigo)] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--desk-indigo)]"
          >
            View Macro
          </button>
        </Bento>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Bento holdId="news" title="News Intelligence" status={intel.newsError ? 'offline' : 'wire'} onExpand={() => setFocus('news')}>
          {intel.newsError ? <p className="text-[10px] text-rose-400">{intel.newsError}</p> : null}
          <ul className="max-h-52 overflow-auto">
            {intel.news.map((item, i) => (
              <li key={`${item.title}-${i}`} className="border-b border-[var(--desk-border)] py-1">
                <p className="flex flex-wrap gap-2 font-mono text-[9px] uppercase text-[var(--desk-muted)]">
                  <span className="text-[var(--desk-cyan)]">{item.time}</span>
                  <span>{item.category}</span>
                  <span>{item.affected}</span>
                  <span>{item.relevance}</span>
                  <span>{item.source}</span>
                </p>
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[var(--desk-text)] hover:text-[var(--desk-cyan)]">
                    {item.title}
                  </a>
                ) : (
                  <span className="text-[11px] text-[var(--desk-text)]">{item.title}</span>
                )}
              </li>
            ))}
          </ul>
        </Bento>

        <Bento holdId="calendar" title="Economic Calendar" status="wire — not a timed calendar">
          <p className="mb-1 text-[9px] uppercase text-[var(--desk-muted)]">
            Dated high/medium event rows DATA UNAVAILABLE. Macro headlines only.
          </p>
          {intel.econError && intel.econ.length === 0 ? <Unavail label={intel.econError} /> : null}
          <ul className="max-h-52 overflow-auto">
            {intel.econ.map((item, i) => (
              <li key={`${item.title}-${i}`} className="border-b border-[var(--desk-border)] py-1">
                <p className="font-mono text-[9px] uppercase text-[var(--desk-muted)]">
                  {item.pubDate ? new Date(item.pubDate).toISOString().slice(11, 16) : '—'} · {item.source}
                  {item.category ? ` · ${item.category}` : ''}
                </p>
                <p className="text-[11px] text-[var(--desk-text)]">{item.title}</p>
              </li>
            ))}
          </ul>
        </Bento>

        <Bento holdId="positioning" title="Positioning" status="no COT / SI feed">
          {['COT', 'Futures positioning', 'Short interest', 'ETF flows', 'Fund flows', 'Options positioning', 'Open interest'].map(
            (k) => (
              <KV key={k} k={k} v="DATA UNAVAILABLE" />
            ),
          )}
        </Bento>

        <Bento holdId="risk" title="Risk Environment" onExpand={() => setFocus('risk')}>
          <KV k="Volatility (RV)" v={rv != null ? `${rv.toFixed(1)}%` : 'DATA UNAVAILABLE'} />
          <KV k="Market beta" v="DATA UNAVAILABLE" />
          <KV
            k="SPX corr"
            v={
              intel.correlation.SPX?.[symbol as 'DXY'] != null
                ? intel.correlation.SPX[symbol as 'DXY']!.toFixed(2)
                : intel.correlation.SPX?.DXY != null
                  ? `vs DXY ${intel.correlation.SPX.DXY.toFixed(2)}`
                  : 'DATA UNAVAILABLE'
            }
          />
          <KV k="Drawdown (window)" v={dd != null ? `${dd.toFixed(1)}%` : 'DATA UNAVAILABLE'} />
          <KV k="Concentration (POC)" v={vpShare != null ? `${vpShare.toFixed(1)}%` : 'DATA UNAVAILABLE'} />
          <p className="mt-2 text-[9px] font-black uppercase text-[var(--desk-muted)]">Arithmetic scenarios (not advice)</p>
          {scenarios ? (
            scenarios.map((s) => (
              <KV key={s.pct} k={`${s.pct}%`} v={formatStructurePrice(s.price)} />
            ))
          ) : (
            <Unavail />
          )}
        </Bento>
      </div>

      <Bento holdId="earnings" title="Earnings" status={intel.earningsAvail === 'ok' ? 'FMP surprises' : 'DATA UNAVAILABLE'}>
        {intel.earningsAvail !== 'ok' || !intel.earnings?.length ? (
          <Unavail label={intel.earningsAvail === 'unconfigured' ? 'FMP unconfigured — DATA UNAVAILABLE' : 'DATA UNAVAILABLE'} />
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {intel.earnings.map((row, i) => (
              <li key={`${row.date}-${i}`} className="rounded border border-[var(--desk-border)] px-2 py-1">
                <p className="font-mono text-[10px] text-[var(--desk-text)]">{row.symbol}</p>
                <p className="text-[9px] uppercase text-[var(--desk-muted)]">{row.date || '—'}</p>
                <p className="font-mono text-[10px]">
                  act {row.actual ?? '—'} · est {row.estimated ?? '—'}
                </p>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => navigateToDesk('fundamental')}
          className="mt-2 rounded border border-[var(--desk-border)] px-2 py-1 text-[9px] font-black uppercase text-[var(--desk-indigo)]"
        >
          Open fundamental workspace
        </button>
      </Bento>

      <p className="shrink-0 py-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[var(--desk-muted)]">
        Information & analytics only · educational market structure · ClearPath does not evaluate, alter, or advise on financial decisions
      </p>

      {focus ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" role="dialog">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg border border-[var(--desk-border)] bg-[var(--desk-panel)] p-4">
            <div className="mb-2 flex justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--desk-cyan)]">
                Expanded · {focus}
              </h3>
              <button type="button" onClick={() => setFocus(null)} className="text-[10px] font-black uppercase text-[var(--desk-pink)]">
                Close
              </button>
            </div>
            <p className="text-[11px] text-[var(--desk-muted)]">
              Same domain, larger reading pane. Still information only — no execution.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
