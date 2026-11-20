"use client";

import { useEffect, useMemo, useState } from "react";
import { DESKS, type DeskId, isDeskId } from "@/lib/desks";
import { lastQuote, searchSymbols, type SymbolInfo } from "@/lib/marketData";
import { CandleChart } from "./CandleChart";

type MeResponse = {
  viewer?: { name: string; email: string; simulated?: boolean };
  preferredDesk?: string;
  watchlist?: { symbol: string; label: string }[];
  storage?: string;
};

export function ChartWorkspace() {
  const [deskId, setDeskId] = useState<DeskId>("retail");
  const [symbol, setSymbol] = useState("XAU/USD");
  const [query, setQuery] = useState("");
  const [openSearch, setOpenSearch] = useState(false);
  const [watchlist, setWatchlist] = useState<{ symbol: string; label: string }[]>([]);
  const [viewerLabel, setViewerLabel] = useState("Guest session");

  const desk = DESKS[deskId];
  const quote = useMemo(() => lastQuote(symbol), [symbol]);
  const results = useMemo(() => searchSymbols(query), [query]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("desk");
    if (isDeskId(fromQuery)) setDeskId(fromQuery);

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
    return () => {
      cancelled = true;
    };
  }, []);

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
    setSymbol(info.symbol);
    setQuery("");
    setOpenSearch(false);
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

  const changeClass = quote.change >= 0 ? "up" : "down";

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
          {desk.tone}
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          <span className="status-chip">{viewerLabel}</span>
        </p>
      </aside>

      <section className="chart-shell" aria-label="Chart workspace">
        <div className="chart-toolbar">
          <div className="quote-meta">
            <strong>{quote.symbol}</strong>
            <span className="price">{format(quote.price)}</span>
            <span className={changeClass}>
              {quote.change >= 0 ? "+" : ""}
              {format(quote.change)} ({quote.changePct.toFixed(2)}%)
            </span>
            <span className="status-chip">PAPER DATA</span>
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
        <CandleChart candles={quote.candles} desk={desk} />
      </section>

      <aside className="panel">
        <h2>Desk intel</h2>
        <ul className="intel-list">
          {intelFor(deskId, quote.symbol).map((item) => (
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
              <button type="button" onClick={() => setSymbol(w.symbol)} style={{ all: "unset", cursor: "pointer" }}>
                {w.symbol}
              </button>
              <span style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>{w.label.slice(0, 18)}</span>
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
        { title: "Tape", body: `${symbol} — board paper series for layout review.` },
        { title: "Positioning", body: "Live COT stays on production Cloud Run (CFTC). Demo shows panel seat only." },
        { title: "Levels", body: "Session range drawn from deterministic candles — not a live DOM." },
      ];
    case "fundamental":
      return [
        { title: "Business lens", body: "Ask what the instrument represents before reading the candle." },
        { title: "Macro seat", body: "Rates, growth, and inventory context belong beside price — not instead of it." },
        { title: "Honesty rule", body: "Missing vendor cells stay blank. No invented CPI/NFP rows." },
      ];
    case "neurodivergent":
      return [
        { title: "Sensory profile", body: "Softer contrast, wider rhythm, fewer competing panels." },
        { title: "Same market", body: "Identical instruments — presentation adapts to the learner." },
        { title: "Focus", body: "One chart job at a time. Extra intel stays secondary." },
      ];
    default:
      return [
        { title: "Guided desk", body: "Labels first. Tools explained. Jargon reduced." },
        { title: "Practice", body: "Paper quotes so navigation is safe for demos and classrooms." },
        { title: "Next step", body: "Education and encyclopedia deepen the chart — not a signal feed." },
      ];
  }
}
