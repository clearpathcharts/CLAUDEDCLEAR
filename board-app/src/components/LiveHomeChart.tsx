"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DESKS, type DeskId } from "@/lib/desks";
import { searchSymbols, type Candle } from "@/lib/marketData";
import { scanPatternScatter } from "@/lib/patternScatter";
import { type ChartStyle } from "@/lib/chartStyle";
import { CandleChart } from "./CandleChart";
import { ChartStyleControls } from "./ChartStyleControls";
import { PatternScannerBento } from "./PatternScannerBento";

type LiveSeries = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  candles: Candle[];
  source: "clearpathtrader.com";
  vendor?: string;
  unavailable?: boolean;
  error?: string;
};

function suggest(query: string) {
  const catalog = searchSymbols(query, 8);
  const q = query.trim().toUpperCase();
  if (!q) return catalog;
  if (!catalog.some((s) => s.symbol.toUpperCase() === q)) {
    return [
      {
        symbol: q,
        name: `Load “${q}” from clearpathtrader.com`,
        assetClass: "stocks" as const,
        basePrice: 0,
      },
      ...catalog,
    ].slice(0, 8);
  }
  return catalog;
}

const DEFAULT_SYMBOL = "XAU/USD";

export function LiveHomeChart() {
  const [deskId, setDeskId] = useState<DeskId>("retail");
  const desk = DESKS[deskId];
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<LiveSeries | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>("desk");
  const [scannerOn, setScannerOn] = useState(true);

  const results = useMemo(() => suggest(query), [query]);
  const candles = series?.candles ?? [];
  const patternHits = useMemo(
    () => (scannerOn ? scanPatternScatter(candles) : []),
    [scannerOn, candles],
  );

  const load = useCallback(async (nextSymbol: string) => {
    setLoading(true);
    setSymbol(nextSymbol);
    try {
      const res = await fetch(`/api/live/series?symbol=${encodeURIComponent(nextSymbol)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as LiveSeries;
      setSeries(data);
    } catch (err) {
      setSeries({
        symbol: nextSymbol,
        name: "DATA UNAVAILABLE",
        price: 0,
        change: 0,
        changePct: 0,
        candles: [] as Candle[],
        source: "clearpathtrader.com",
        unavailable: true,
        error: err instanceof Error ? err.message : "Could not load live chart",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(DEFAULT_SYMBOL);
  }, [load]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = (query.trim() || symbol).toUpperCase();
    setOpen(false);
    void load(next);
  }

  const changeClass =
    series && !series.unavailable && series.change >= 0 ? "up" : "down";

  return (
    <section className="live-home" aria-label="Live market chart from clearpathtrader.com">
      <div className="container">
        <div className="live-home-head">
          <div>
            <p className="eyebrow">Live from clearpathtrader.com</p>
            <h2>Search any market</h2>
            <p className="lede">
              Desk colors stay unique (Institutional / Fundamental / Retail / Neurodivergent).
              Switch to green/red, OHLC bars, or a line anytime — Pattern Scanner bento works on all four.
            </p>
          </div>
          <form className="live-search" onSubmit={onSubmit} role="search">
            <label className="sr-only" htmlFor="live-symbol-search">
              Search financial chart
            </label>
            <input
              id="live-symbol-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="AAPL, EUR/USD, BTC/USD, XAU/USD…"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary">
              Load chart
            </button>
            {open && results.length > 0 ? (
              <ul className="live-search-results" role="listbox">
                {results.map((item) => (
                  <li key={item.symbol}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={item.symbol === symbol}
                      onClick={() => {
                        setQuery(item.symbol);
                        setOpen(false);
                        void load(item.symbol);
                      }}
                    >
                      <strong>{item.symbol}</strong>
                      <span>{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </form>
        </div>

        <div className="live-desk-row" role="group" aria-label="Desk candle colors">
          {(Object.keys(DESKS) as DeskId[]).map((id) => (
            <button
              key={id}
              type="button"
              className="live-desk-chip"
              aria-pressed={deskId === id}
              onClick={() => setDeskId(id)}
            >
              {DESKS[id].title}
            </button>
          ))}
        </div>

        <ChartStyleControls
          value={chartStyle}
          onChange={setChartStyle}
          deskTitle={desk.title}
        />

        <div className="live-home-layout">
          <div className="live-home-stage">
            <div className="live-home-meta">
              <div>
                <div className="live-symbol">{series?.symbol || symbol}</div>
                <div className="live-name">{series?.name || (loading ? "Loading…" : "—")}</div>
              </div>
              <div className="live-quote">
                {loading ? (
                  <span className="muted">Fetching live candles…</span>
                ) : series?.unavailable ? (
                  <span className="muted">
                    DATA UNAVAILABLE{series.error ? ` · ${series.error}` : ""}
                  </span>
                ) : (
                  <>
                    <strong>{formatPrice(series?.price ?? 0)}</strong>
                    <span className={changeClass}>
                      {(series?.change ?? 0) >= 0 ? "+" : ""}
                      {formatPrice(series?.change ?? 0)} ({(series?.changePct ?? 0).toFixed(2)}%)
                    </span>
                  </>
                )}
              </div>
              <div className="live-vendor">
                Source:{" "}
                <a href="https://clearpathtrader.com" target="_blank" rel="noreferrer">
                  clearpathtrader.com
                </a>
                {series?.vendor ? ` · ${series.vendor}` : ""} · {desk.title} colors
              </div>
            </div>
            <div className="live-home-chart">
              {series?.candles?.length ? (
                <CandleChart
                  candles={series.candles}
                  desk={desk}
                  chartStyle={chartStyle}
                  patternHits={patternHits}
                  showPatternScatter={scannerOn}
                />
              ) : (
                <div className="live-home-empty">
                  {loading
                    ? "Loading live chart…"
                    : "No candles for this symbol yet. Try another ticker."}
                </div>
              )}
            </div>
          </div>
          <PatternScannerBento
            symbol={series?.symbol || symbol}
            hits={patternHits}
            enabled={scannerOn}
            onToggle={setScannerOn}
            loading={loading}
          />
        </div>
      </div>
    </section>
  );
}

function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1) return n.toFixed(2);
  return n.toFixed(5);
}
