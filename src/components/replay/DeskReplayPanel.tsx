"use client";

import React, { useMemo, useState } from 'react';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { LightweightCandles } from '../charts/LightweightCandles';
import { useMarketReplay } from '../../hooks/useMarketReplay';
import {
  DEFAULT_STARTING_BALANCE,
  REPLAY_STEP_PRESETS,
  type OrderSide,
  type OrderType,
  type ReplaySpeed,
} from '../../lib/replay/types';
import { resolveMarketAsset } from '../../constants/marketAssets';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const;

function money(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function DeskReplayPanel({
  initialSymbol = 'USDJPY',
  initialTimeframe = '1h',
  profileId = 'calm_focus',
  userTier = 'VIP',
}: {
  initialSymbol?: string;
  initialTimeframe?: string;
  profileId?: string;
  userTier?: string;
}) {
  const replay = useMarketReplay({ initialSymbol, initialTimeframe, userTier });
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [customStep, setCustomStep] = useState(5);
  const [orderSide, setOrderSide] = useState<OrderSide>('long');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [orderSize, setOrderSize] = useState(0.1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const startUnix = useMemo(() => {
    const t = Date.parse(`${dateStr}T00:00:00Z`);
    return Number.isFinite(t) ? Math.floor(t / 1000) : undefined;
  }, [dateStr]);

  const onLoad = () => {
    void replay.load({
      symbol,
      timeframe,
      startUnix,
      // Pass the picker date as Twelve Data startDate so the 5k-bar window
      // is anchored near the chosen session (not only “last N bars to now”).
      startDate: dateStr,
      endDate: new Date().toISOString().slice(0, 10),
    });
  };

  const submitOrder = () => {
    replay.placeOrder({
      side: orderSide,
      type: orderType,
      size: orderSize,
      price: limitPrice ? Number(limitPrice) : undefined,
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      takeProfit: takeProfit ? Number(takeProfit) : undefined,
    });
  };

  return (
    <section
      data-market-replay
      className="flex min-h-0 flex-col gap-3 rounded-2xl border border-cyan-500/25 bg-black/60 p-3 shadow-[0_0_24px_rgba(0,229,255,0.08)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Market Replay</p>
          <p className="text-xs text-zinc-500">
            Real Twelve Data history · no look-ahead · paper account isolated from live
          </p>
        </div>
        {replay.active && (
          <button
            type="button"
            onClick={replay.exitReplay}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:border-rose-500/50 hover:text-rose-300"
          >
            Exit Replay
          </button>
        )}
      </header>

      {/* Setup row */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-600">Symbol</label>
          <ChartSymbolSearch
            compact
            placeholder="USDJPY…"
            activeSymbol={symbol}
            onSubmit={(s) => setSymbol(resolveMarketAsset(s).value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-600">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="rounded-lg border border-white/10 bg-black px-2 py-1.5 font-mono text-xs text-zinc-200"
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-600">Start date (UTC)</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="rounded-lg border border-white/10 bg-black px-2 py-1.5 font-mono text-xs text-zinc-200"
          />
        </div>
        <button
          type="button"
          onClick={onLoad}
          disabled={replay.loading}
          className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-50"
        >
          {replay.loading ? 'Loading…' : 'Load Real History'}
        </button>
      </div>

      {replay.error && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-300">
          {replay.error}
        </p>
      )}
      {replay.loadNote && replay.active && (
        <p className="font-mono text-[10px] text-zinc-500">{replay.loadNote}</p>
      )}

      {replay.active && (
        <>
          {/* Status strip */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2">
            <span className="rounded bg-rose-600/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-rose-300">
              Replay Mode
            </span>
            <span className="font-mono text-sm font-bold text-cyan-300">{replay.engineState.symbol}</span>
            <span className="font-mono text-xs text-zinc-400">{replay.engineState.timeframe}</span>
            <span className="font-mono text-sm text-white">{replay.currentTimeLabel}</span>
          </div>

          {/* Transport */}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => replay.step(-1)} className="replay-btn">◀ 1</button>
            {replay.engineState.isPlaying ? (
              <button type="button" onClick={replay.pause} className="replay-btn replay-btn-primary">Pause</button>
            ) : (
              <button type="button" onClick={replay.play} className="replay-btn replay-btn-primary">Play</button>
            )}
            <button type="button" onClick={() => replay.step(1)} className="replay-btn">1 ▶</button>
            {REPLAY_STEP_PRESETS.map((n) => (
              <button key={n} type="button" onClick={() => replay.step(n)} className="replay-btn">{n} ▶▶</button>
            ))}
            <input
              type="number"
              min={1}
              value={customStep}
              onChange={(e) => setCustomStep(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-lg border border-white/10 bg-black px-2 py-1 font-mono text-xs text-zinc-200"
            />
            <button type="button" onClick={() => replay.step(customStep)} className="replay-btn">Custom ▶</button>
            <button type="button" onClick={replay.restart} className="replay-btn">Restart</button>
            <label className="ml-2 flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
              Speed
              <select
                value={replay.engineState.playbackSpeed}
                onChange={(e) => replay.setSpeed(Number(e.target.value) as ReplaySpeed)}
                className="rounded border border-white/10 bg-black px-1 py-0.5 font-mono text-xs text-cyan-300"
              >
                {replay.speeds.map((s) => (
                  <option key={s} value={s}>{s}x</option>
                ))}
              </select>
            </label>
          </div>

          {/* Timeline */}
          <div className="space-y-1">
            <input
              type="range"
              min={replay.engineState.replayStartIndex}
              max={replay.engineState.replayEndIndex}
              value={replay.engineState.currentReplayIndex}
              onChange={(e) => replay.seekToIndex(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between font-mono text-[9px] text-zinc-600">
              <span>Start #{replay.engineState.replayStartIndex}</span>
              <span>
                Now #{replay.engineState.currentReplayIndex} / {replay.engineState.replayEndIndex}
              </span>
              <span>End of loaded history</span>
            </div>
          </div>

          {/* Chart — ONLY visible (revealed) candles */}
          <div className="min-h-[360px] overflow-hidden rounded-xl border border-white/10 bg-black">
            <LightweightCandles
              key={`replay-${replay.engineState.symbol}-${replay.engineState.timeframe}-${replay.engineState.replayStartIndex}`}
              data={replay.visibleCandles}
              symbol={replay.engineState.symbol}
              timeframe={replay.engineState.timeframe}
              profileId={profileId}
              height={360}
              fillParent
              embedMode
              hidePatternOverlays
              replayMode
            />
          </div>

          {/* Account + ticket */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Paper Account</p>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <KV label="Starting" value={money(DEFAULT_STARTING_BALANCE)} />
                <KV label="Equity" value={money(replay.accountSnap.equity)} />
                <KV label="Available" value={money(replay.accountSnap.availableBalance)} />
                <KV label="Open P&L" value={money(replay.accountSnap.openPnl)} accent={replay.accountSnap.openPnl} />
                <KV label="Realized" value={money(replay.accountSnap.realizedPnl)} accent={replay.accountSnap.realizedPnl} />
                <KV label="Trades" value={String(replay.accountSnap.tradeCount)} />
                <KV label="Win rate" value={`${(replay.accountSnap.winRate * 100).toFixed(0)}%`} />
                <KV label="Max DD" value={`${(replay.accountSnap.maxDrawdown * 100).toFixed(1)}%`} />
                <KV label="Profit factor" value={Number.isFinite(replay.accountSnap.profitFactor) ? replay.accountSnap.profitFactor.toFixed(2) : '—'} />
                <KV label="Avg win" value={money(replay.accountSnap.avgWin)} />
                <KV label="Avg loss" value={money(replay.accountSnap.avgLoss)} />
                <KV label="Largest win" value={money(replay.accountSnap.largestWin)} />
              </div>
              {replay.openPosition && (
                <p className="mt-2 font-mono text-[10px] text-amber-300">
                  Open {replay.openPosition.side.toUpperCase()} {replay.openPosition.size} @ {replay.openPosition.entryPrice}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Order Ticket</p>
              <div className="flex flex-wrap gap-2">
                <select value={orderSide} onChange={(e) => setOrderSide(e.target.value as OrderSide)} className="replay-input">
                  <option value="long">BUY / LONG</option>
                  <option value="short">SELL / SHORT</option>
                </select>
                <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} className="replay-input">
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                  <option value="stop">Stop</option>
                </select>
                <input type="number" step="0.01" min="0.01" value={orderSize} onChange={(e) => setOrderSize(Number(e.target.value) || 0.01)} className="replay-input w-20" title="Size (lots)" />
                {(orderType === 'limit' || orderType === 'stop') && (
                  <input placeholder="Price" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className="replay-input w-24" />
                )}
                <input placeholder="SL" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="replay-input w-24" />
                <input placeholder="TP" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="replay-input w-24" />
                <button type="button" onClick={submitOrder} className="replay-btn replay-btn-primary">Submit</button>
                <button type="button" onClick={replay.closePosition} className="replay-btn">Close</button>
              </div>
            </div>
          </div>

          {/* Journal */}
          <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/70 p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Trade Journal</p>
            {replay.trades.length === 0 ? (
              <p className="text-xs text-zinc-600">No closed trades yet — place orders as candles reveal.</p>
            ) : (
              <ul className="space-y-1 font-mono text-[10px]">
                {[...replay.trades].reverse().map((t, i) => (
                  <li key={t.id} className="flex flex-wrap gap-2 border-b border-white/5 py-1 text-zinc-300">
                    <span className="text-zinc-500">#{replay.trades.length - i}</span>
                    <span>{t.symbol}</span>
                    <span className={t.side === 'long' ? 'text-cyan-400' : 'text-pink-400'}>{t.side.toUpperCase()}</span>
                    <span>{t.entryPrice} → {t.exitPrice}</span>
                    <span className={t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{money(t.pnl)}</span>
                    <span className="text-zinc-600">{t.exitReason}</span>
                    {t.riskReward != null && <span className="text-zinc-500">R:R {t.riskReward.toFixed(2)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <style>{`
        .replay-btn {
          border-radius: 0.5rem;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.7);
          padding: 0.35rem 0.65rem;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #d4d4d8;
        }
        .replay-btn:hover { border-color: rgba(0,229,255,0.45); color: #67e8f9; }
        .replay-btn-primary {
          border-color: rgba(0,229,255,0.45);
          background: rgba(0,229,255,0.12);
          color: #67e8f9;
        }
        .replay-input {
          border-radius: 0.5rem;
          border: 1px solid rgba(255,255,255,0.12);
          background: #000;
          padding: 0.35rem 0.5rem;
          font-family: ui-monospace, monospace;
          font-size: 11px;
          color: #e4e4e7;
        }
      `}</style>
    </section>
  );
}

function KV({ label, value, accent }: { label: string; value: string; accent?: number }) {
  const color =
    accent == null ? 'text-zinc-200' : accent >= 0 ? 'text-emerald-400' : 'text-rose-400';
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-zinc-600">{label}</div>
      <div className={`tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
