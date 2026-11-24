"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DESKS, type DeskId, isDeskId } from "@/lib/desks";
import { searchSymbols, type Candle, type SymbolInfo } from "@/lib/marketData";
import { scanPatternScatter } from "@/lib/patternScatter";
import { isChartStyle, type ChartStyle } from "@/lib/chartStyle";
import { CandleChart } from "./CandleChart";
import { ChartStyleControls } from "./ChartStyleControls";
import { PatternScannerBento } from "./PatternScannerBento";

type MeResponse = {
  viewer?: { name: string; email: string; simulated?: boolean };
  preferredDesk?: string;
  watchlist?: { symbol: string; label: string }[];
  storage?: string;
};

type LiveSeries = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  candles: Candle[];
  vendor?: string;
  unavailable?: boolean;
  error?: string;
};

export function ChartWorkspace() {
  const [deskId, setDeskId] = useState<DeskId>("retail");
  const [symbol, setSymbol] = useState("XAU/USD");
  const [query, setQuery] = useState("");
  const [openSearch, setOpenSearch] = useState(false);
  const [watchlist, setWatchlist] = useState<{ symbol: string; label: string }[]>([]);
  const [viewerLabel, setViewerLabel] = useState("Guest session");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("desk");
  const [scannerOn, setScannerOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<LiveSeries | null>(null);

  const desk = DESKS[deskId];
  const results = useMemo(() => searchSymbols(query), [query]);
  const candles = series?.candles ?? [];
  const patternHits = useMemo(
    () => (scannerOn ? scanPatternScatter(candles) : []),
    [scannerOn, candles],
  );

  const loadSeries = useCallback(async (nextSymbol: string) => {
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
        candles: [],
        unavailable: true,
        error: err instanceof Error ? err.message : "Live series failed",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("desk");
    if (isDeskId(fromQuery)) setDeskId(fromQuery);
    const style = params.get("style");
    if (isChartStyle(style)) setChartStyle(style);

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = (await res.json()) as MeResponse;
        if (cancelled) return;
        if (data.viewer?.name) {
          setViewerLabel(
            data.viewer.simulated
              ? `${data.viewer.name} (local simulated)`
              : data.viewer.name,
          );
        }
        if (!isDeskId(fromQuery) && isDeskId(data.preferredDesk)) {
          setDeskId(data.preferredDesk);
        }
        if (Array.isArray(data.watchlist) && data.watchlist.length) {
          setWatchlist(data.watchlist);
        }
      } catch {
        /* offline / first paint */
      }
    })();
    void loadSeries("XAU/USD");
    return () => {
      cancelled = true;
    };
  }, [loadSeries]);

  async function persistDesk(next: DeskId) {
    setDeskId(next);
    try {
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preferredDesk: next }),
      });
    } catch {
      /* local-only */
    }
  }

  async function addToWatchlist(info: SymbolInfo) {
    setQuery("");
    setOpenSearch(false);
    void loadSeries(info.symbol);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol: info.symbol, label: info.name }),
      });
      if (res.ok) {
        const data = (await res.json()) as { watchlist: { symbol: string; label: string }[] };
        setWatchlist(data.watchlist);
      } else {
        setWatchlist((prev) =>
          prev.some((w) => w.symbol === info.symbol)
            ? prev
            : [...prev, { symbol: info.symbol, label: info.name }],
        );
      }
    } catch {
      setWatchlist((prev) =>
        prev.some((w) => w.symbol === info.symbol)
          ? prev
          : [...prev, { symbol: info.symbol, label: info.name }],
      );
    }
  }

  const changeClass = (series?.change ?? 0) >= 0 ? "up" : "down";

  return (
    <div className={`workspace${desk.calm ? " neuro" : ""}`}>
      <aside className="panel">
        <h2>Desks</h2>
        <div className="desk-switch" role="group" aria-label="Desk switcher">
          {(Object.keys(DESKS) as DeskId[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={deskId === id}
              onClick={() => void persistDesk(id)}
            >
              {DESKS[id].title}
              <span className="tone">{DESKS[id].tagline}</span>
            </button>
          ))}
        </div>
        <p style={{ marginTop: "1rem", color: "var(--text-dim)", fontSize: "0.85rem" }}>
          {desk.tone} Each desk keeps its own candle colors unless you switch to green/red, bars, or line.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          <span className="status-chip">{viewerLabel}</span>
        </p>
        <div style={{ marginTop: "1rem" }}>
          <PatternScannerBento
            symbol={series?.symbol || symbol}
            hits={patternHits}
            enabled={scannerOn}
            onToggle={setScannerOn}
            loading={loading}
          />
        </div>
      </aside>

      <section className="chart-shell" aria-label="Chart workspace">
        <div className="chart-toolbar">
          <div className="quote-meta">
            <strong>{series?.symbol || symbol}</strong>
            {loading ? (
              <span className="status-chip">Loading live…</span>
            ) : series?.unavailable ? (
              <span className="status-chip">DATA UNAVAILABLE</span>
            ) : (
              <>
                <span className="price">{format(series?.price ?? 0)}</span>
                <span className={changeClass}>
                  {(series?.change ?? 0) >= 0 ? "+" : ""}
                  {format(series?.change ?? 0)} ({(series?.changePct ?? 0).toFixed(2)}%)
                </span>
                <span className="status-chip">
                  LIVE{series?.vendor ? ` · ${series.vendor}` : ""}
                </span>
              </>
            )}
          </div>
          <div className="search-box">
            <input
              aria-label="Symbol search"
              placeholder="Search stocks, FX, crypto, metals…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpenSearch(true);
              }}
              onFocus={() => setOpenSearch(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const next = query.trim().toUpperCase() || symbol;
                  setOpenSearch(false);
                  void loadSeries(next);
                }
              }}
            />
            {openSearch && (
              <div className="search-results" role="listbox">
                {results.map((s) => (
                  <button key={s.symbol} type="button" onClick={() => void addToWatchlist(s)}>
                    <span className="sym">{s.symbol}</span>
                    {s.name}
                    <span style={{ float: "right", color: "var(--text-dim)" }}>{s.assetClass}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <ChartStyleControls
          value={chartStyle}
          onChange={setChartStyle}
          deskTitle={desk.title}
        />
        <CandleChart
          candles={candles}
          desk={desk}
          chartStyle={chartStyle}
          patternHits={patternHits}
          showPatternScatter={scannerOn}
        />
      </section>

      <aside className="panel">
        <h2>Desk intel</h2>
        <ul className="intel-list">
          {intelFor(deskId, series?.symbol || symbol).map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              {item.body}
            </li>
          ))}
        </ul>
        <h3 style={{ marginTop: "1.25rem" }}>Watchlist</h3>
        <ul className="watch-list">
          {watchlist.length === 0 && (
            <li style={{ fontFamily: "var(--font-body)", color: "var(--text-dim)" }}>
              Search a symbol to save it
            </li>
          )}
          {watchlist.map((w) => (
            <li key={w.symbol}>
              <button
                type="button"
                onClick={() => void loadSeries(w.symbol)}
                style={{ all: "unset", cursor: "pointer" }}
              >
                {w.symbol}
              </button>
              <span style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>
                {w.label.slice(0, 18)}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function format(n: number): string {
  if (Math.abs(n) >= 1000) return n.toFixed(2);
  if (Math.abs(n) >= 1) return n.toFixed(3);
  return n.toFixed(5);
}

function intelFor(desk: DeskId, symbol: string) {
  switch (desk) {
    case "institutional":
      return [
        { title: "Tape", body: `${symbol} — live via clearpathtrader.com.` },
        {
          title: "Desk colors",
          body: "Cyan ups / pink downs by default. Switch to green/red, bars, or line anytime.",
        },
        { title: "Pattern Scanner", body: "Bento scatter stays available on every desk." },
      ];
    case "fundamental":
      return [
        { title: "Business lens", body: "Ask what the instrument represents before reading the candle." },
        {
          title: "Desk colors",
          body: "Cyan ups / orange downs. Optional classic green/red, OHLC bars, or close line.",
        },
        { title: "Honesty rule", body: "Missing vendor cells stay blank. No invented CPI/NFP rows." },
      ];
    case "neurodivergent":
      return [
        { title: "Sensory profile", body: "Softer contrast, wider rhythm, fewer competing panels." },
        {
          title: "Desk colors",
          body: "Cyan ups / fluorescent pink downs. Flip to green/red, bars, or line if that reads cleaner.",
        },
        { title: "Focus", body: "One chart job at a time. Pattern Scanner is optional scatter." },
      ];
    default:
      return [
        { title: "Guided desk", body: "Labels first. Tools explained. Jargon reduced." },
        {
          title: "Desk colors",
          body: "Cyan ups / violet downs. Green/red, bar, and line modes are one click away.",
        },
        { title: "Pattern Scanner", body: "Same bento + scatter option as the other three desks." },
      ];
  }
}
