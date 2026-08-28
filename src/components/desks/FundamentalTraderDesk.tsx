import React, { lazy, Suspense, useState } from 'react';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { LightweightCandles } from '../charts/LightweightCandles';
import { resolveMarketAsset } from '../../constants/marketAssets';

const FundamentalsPanel = lazy(() => import('../FundamentalsPanel'));
const MacroDashboard = lazy(() => import('../MacroDashboard'));
const EconomicCalendar = lazy(() => import('../EconomicCalendar'));

function Pane({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-[#FF7A00]/25 bg-black/50 p-2">
      <Suspense
        fallback={
          <p className="font-mono text-sm font-bold uppercase tracking-widest text-zinc-500">Loading panel…</p>
        }
      >
        <div className="h-full w-full overflow-auto">{children}</div>
      </Suspense>
    </div>
  );
}

export default function FundamentalTraderDesk() {
  const [symbol, setSymbol] = useState('AAPL');
  const [pane, setPane] = useState<'fundamentals' | 'macro' | 'economy'>('fundamentals');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="flex min-h-[380px] flex-col overflow-hidden rounded-xl border border-[#FF7A00]/40 bg-black/80">
        <div className="space-y-2 border-b border-white/10 px-3 py-2">
          <h2 className="text-base font-black uppercase tracking-widest text-[#FF7A00]">
            Valuation chart
          </h2>
          <p className="font-mono text-sm font-bold uppercase text-zinc-500">
            What is the asset? Load a ticker, then read the fundamental pane.
          </p>
          <ChartSymbolSearch
            placeholder="AAPL, MSFT, EURUSD…"
            activeSymbol={symbol}
            onSubmit={(raw) => setSymbol(resolveMarketAsset(raw).value)}
          />
        </div>
        <div className="relative min-h-[320px] flex-1">
          <LightweightCandles
            symbol={symbol}
            profileId="calm_focus"
            timeframe="1d"
            fillParent
            height={360}
          />
        </div>
      </section>

      <section className="flex min-h-0 flex-col gap-2">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Fundamental panes">
          {(
            [
              ['fundamentals', 'Fundamentals'],
              ['macro', 'Macro'],
              ['economy', 'Economic news'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={pane === id}
              onClick={() => setPane(id)}
              className="rounded-md border px-3 py-1.5 text-sm font-extrabold uppercase tracking-widest"
              style={{
                color: pane === id ? '#fff' : '#FF7A00',
                borderColor: pane === id ? '#FF7A00' : 'rgba(255,122,0,0.35)',
                background: pane === id ? 'rgba(255,122,0,0.25)' : 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {pane === 'fundamentals' && (
          <Pane>
            <FundamentalsPanel />
          </Pane>
        )}
        {pane === 'macro' && (
          <Pane>
            <MacroDashboard />
          </Pane>
        )}
        {pane === 'economy' && (
          <Pane>
            <EconomicCalendar />
          </Pane>
        )}
      </section>
    </div>
  );
}
