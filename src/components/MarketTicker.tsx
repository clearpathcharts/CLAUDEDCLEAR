// /src/components/MarketTicker.tsx
import React, { useState, useRef } from "react";
import { usePageAutoUpdate } from "../hooks/usePageAutoUpdate";

interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  percentChange: number;
  prevPrice?: number;
  isLive: boolean;       // true only once a real quote has been received
  lastUpdated: number;   // timestamp (ms) of the last successful real fetch
}

interface MarketTickerProps {
  profile?: any;
}

/** Display names only — never use hardcoded bases as live prices (Twelve Data returns `close`). */
const TICKER_SYMBOLS: { symbol: string; name: string }[] = [
  { symbol: "XAU/USD", name: "XAU/USD (Gold)" },
  { symbol: "EUR/USD", name: "EUR/USD" },
  { symbol: "BTC/USD", name: "BTC/USD" },
  { symbol: "GBP/USD", name: "GBP/USD" },
  { symbol: "USD/JPY", name: "USD/JPY" },
  { symbol: "DXY", name: "DXY Index" },
];

/** Same resolution as ChartFeedAdapter / DataRouter — Twelve Data quotes expose `close`, not always `price`. */
export function resolveQuotePrice(data: { price?: string | number; close?: string | number; error?: unknown } | null | undefined): number | null {
  if (!data || data.error) return null;
  const raw = data.close ?? data.price;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function MarketTicker({ profile = {} }: MarketTickerProps) {
  // Start with no price — never flash stale hardcoded levels (e.g. gold @ 2382 while charts @ ~4022).
  const [assets, setAssets] = useState<MarketAsset[]>(() =>
    TICKER_SYMBOLS.map(({ symbol, name }) => ({
      symbol,
      name,
      price: 0,
      percentChange: 0,
      prevPrice: undefined,
      isLive: false,
      lastUpdated: 0,
    }))
  );

  const assetsRef = useRef<MarketAsset[]>(assets);
  assetsRef.current = assets;
  const noteRateLimitedRef = useRef<(ms?: number) => void>(() => {});

  // 1. Core API Quote Fetch Function
  const fetchQuotes = async () => {
    try {
      const updated = await Promise.all(
        assetsRef.current.map(async (asset) => {
          try {
            const url = `/api/quote?symbol=${encodeURIComponent(asset.symbol)}`;
            const response = await fetch(url);
            if (response.status === 429) {
              noteRateLimitedRef.current(90_000);
              throw new Error(`HTTP Error ${response.status}`);
            }
            if (!response.ok) {
              throw new Error(`HTTP Error ${response.status}`);
            }
            const data = await response.json();
            const livePrice = resolveQuotePrice(data);
            if (livePrice !== null) {
              const changePct = parseFloat(
                data.percent_change ?? data.change_percent ?? data.percentChange ?? "0"
              );
              return {
                ...asset,
                price: livePrice,
                percentChange: isNaN(changePct) ? 0 : changePct,
                prevPrice: asset.lastUpdated > 0 ? asset.price : livePrice,
                isLive: true,
                lastUpdated: Date.now(),
              };
            }
            // Real response came back but had no usable price — surface it, don't hide it
            console.error(`[MarketTicker] ${asset.symbol}: response had no close/price`, data);
          } catch (e) {
            // Real fetch failed — log it loudly. The asset will be marked stale below,
            // NOT silently animated with fake numbers.
            console.error(`[MarketTicker] ${asset.symbol}: live fetch failed`, e);
          }
          // On any failure, keep the last known real price but mark it stale.
          // No more synthetic price movement on failure.
          return { ...asset, isLive: false };
        })
      );
      setAssets(updated);
    } catch (globalError) {
      console.error("[MarketTicker] Failed quotes polling entirely:", globalError);
    }
  };

  // Poll server-side proxy every 30s for real updates (no fake micro-ticks).
  const { noteRateLimited } = usePageAutoUpdate(fetchQuotes, { intervalMs: 30_000 });
  noteRateLimitedRef.current = noteRateLimited;

  // Format helper based on price values — hide until a real quote has arrived
  const formatPrice = (symbol: string, val: number, hasQuote: boolean) => {
    if (!hasQuote || !(val > 0)) return "—";
    if (symbol.includes("BTC")) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (symbol === "EUR/USD" || symbol === "GBP/USD") {
      return val.toFixed(4);
    }
    return val.toFixed(2);
  };

  // Build the repeated list for continuous seamless horizontal loop scrolling
  const repeatedAssets = [...assets, ...assets, ...assets, ...assets];

  return (
    <div className="market-ticker select-none cursor-default border-y border-white/5 bg-black/40 backdrop-blur-md overflow-hidden py-3.5 w-full">
      <div className="ticker-track flex gap-12 whitespace-nowrap w-max animate-tickerMove">
        {repeatedAssets.map((asset, i) => {
          const hasQuote = asset.lastUpdated > 0 && asset.price > 0;
          const isUp = asset.percentChange >= 0;
          const priceStr = formatPrice(asset.symbol, asset.price, hasQuote);
          const changeSign = hasQuote ? (isUp ? "▲" : "▼") : "";
          const changeClass = !hasQuote
            ? "text-white/40"
            : isUp
              ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.35)]"
              : "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.35)]";

          // Flash only happens on a REAL price change from a real fetch now
          const isTickingUp = asset.prevPrice !== undefined && asset.price > asset.prevPrice;
          const tickFlashClass = hasQuote && asset.prevPrice !== undefined && asset.price !== asset.prevPrice
            ? (isTickingUp ? "bg-green-500/10" : "bg-red-500/10")
            : "";

          return (
            <span
              key={`${asset.symbol}-${i}`}
              className={`ticker-item font-mono font-bold text-sm tracking-wider flex items-center gap-2 px-2 py-0.5 rounded transition-all duration-300 ${changeClass} ${tickFlashClass}`}
              title={
                asset.isLive
                  ? `Live as of ${new Date(asset.lastUpdated).toLocaleTimeString()}`
                  : hasQuote
                    ? "Stale — last real quote could not be refreshed"
                    : "Waiting for live quote"
              }
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${asset.isLive ? "bg-green-400" : hasQuote ? "bg-yellow-500/70" : "bg-white/30"}`}
                aria-label={asset.isLive ? "live" : hasQuote ? "stale" : "pending"}
              />
              <span className="text-white/60 font-sans tracking-normal uppercase">{asset.name}</span>
              <span>{priceStr}</span>
              {hasQuote && (
                <>
                  <span>{changeSign}</span>
                  <span className="text-xs opacity-90">({isUp ? "+" : ""}{asset.percentChange.toFixed(2)}%)</span>
                </>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
