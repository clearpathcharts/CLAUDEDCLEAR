import React, { useState } from 'react';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { LightweightCandles } from '../charts/LightweightCandles';
import { resolveMarketAsset } from '../../constants/marketAssets';
import { DEFAULT_MARKET_SYMBOLS } from '../../constants/chartLayout';
import { InstitutionalRegistry } from '../../core/registry/InstitutionalRegistry';

const TIMEFRAMES = ['15m', '1h', '4h', '1d'] as const;

export default function RetailTraderDesk() {
  const [symbol, setSymbol] = useState<string>(DEFAULT_MARKET_SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState('1h');
  const [openId, setOpenId] = useState<string | null>(InstitutionalRegistry[0]?.id ?? null);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3 p-3">
      <section className="overflow-hidden rounded-2xl border border-[#00FFFF]/35 bg-black/80">
        <div className="space-y-3 border-b border-white/10 px-4 py-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-white">Your chart</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
            Search a market. Watch the candles. When a word on the right is new, tap it — we explain
            it in plain language. This is a study desk, not a place that tells you to buy or sell.
          </p>
          <ChartSymbolSearch
            placeholder="Search AAPL, EURUSD, gold…"
            activeSymbol={symbol}
            onSubmit={(raw) => setSymbol(resolveMarketAsset(raw).value)}
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Timeframe">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                aria-pressed={timeframe === tf}
                className="rounded-lg border px-3 py-1.5 text-xs font-bold uppercase"
                style={{
                  color: timeframe === tf ? '#050505' : '#00FFFF',
                  borderColor: '#00FFFF66',
                  background: timeframe === tf ? '#00FFFF' : 'transparent',
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="relative h-[min(70vh,640px)] min-h-[360px]">
          <LightweightCandles
            symbol={symbol}
            profileId="standard_red_green"
            timeframe={timeframe}
            fillParent
            height={480}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/60 p-4">
        <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-[#00FFFF]">
          What am I looking at?
        </h2>
        <ul className="space-y-2">
          {InstitutionalRegistry.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id} className="rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-white"
                >
                  {item.name}
                  <span className="font-mono text-[10px] text-zinc-500">{item.abbr}</span>
                </button>
                {open && (
                  <p className="border-t border-white/10 px-3 py-2 text-sm leading-relaxed text-zinc-400">
                    {item.description}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a href="/education" className="text-[#00FFFF] underline-offset-2 hover:underline">
            Education
          </a>
          <a href="/literacy" className="text-[#00FFFF] underline-offset-2 hover:underline">
            Literacy OS
          </a>
          <a href="/encyclopedia" className="text-[#00FFFF] underline-offset-2 hover:underline">
            Encyclopedia
          </a>
        </div>
      </section>
    </div>
  );
}
