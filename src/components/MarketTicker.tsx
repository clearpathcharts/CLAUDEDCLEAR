// /src/components/MarketTicker.tsx
import React, { useState, useEffect, useRef } from "react";

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

const DEFAULT_ASSETS: Record<string, { name: string; base: number }> = {
  "XAU/USD": { name: "XAU/USD (Gold)", base: 2382.40 },
  "EUR/USD": { name: "EUR/USD", base: 1.0852 },
  "BTC/USD": { name: "BTC/USD", base: 68120.00 },
  "GBP/USD": { name: "GBP/USD", base: 1.2685 },
  "USD/JPY": { name: "USD/JPY", base: 156.42 },
  "DXY": { name: "DXY Index", base: 104.82 }
};

export default function MarketTicker({ profile = {} }: MarketTickerProps) {
  // Initialize state with standard base values
  const [assets, setAssets] = useState<MarketAsset[]>(() => 
    Object.entries(DEFAULT_ASSETS).map(([symbol, config]) => ({
      symbol,
      name: config.name,
      price: config.base,
      percentChange: 0,
      prevPrice: config.base,
      isLive: false,
      lastUpdated: 0
    }))
  );

  const assetsRef = useRef<MarketAsset[]>(assets);
  assetsRef.current = assets;

  // 1. Core API Quote Fetch Function
  const fetchQuotes = async () => {
    try {
      const updated = await Promise.all(
        assetsRef.current.map(async (asset) => {
          try {
            const url = `/api/quote?symbol=${encodeURIComponent(asset.symbol)}`;
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP Error ${response.status}`);
            }
            const data = await response.json();
            if (data && !data.error && data.price) {
              const livePrice = parseFloat(data.price);
              const changePct = parseFloat(data.percent_change || data.change_percent || "0");
              return {
                ...asset,
                price: livePrice,
                percentChange: isNaN(changePct) ? 0 : changePct,
                prevPrice: asset.price,
                isLive: true,
                lastUpdated: Date.now()
              };
            }
            // Real response came back but had no usable price — surface it, don't hide it
            console.error(`[MarketTicker] ${asset.symbol}: response had no price`, data);
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

  // 2. Setup Intervals
  useEffect(() => {
    // Initial fetch immediately on mount
    fetchQuotes();

    // Poll server-side proxy every 30 seconds for real updates.
    // There is intentionally NO fake "micro-tick" simulator anymore — every number
    // shown on screen now comes directly from a real quote or is marked stale.
    const quoteInterval = setInterval(() => {
      fetchQuotes();
    }, 30000);

    return () => {
      clearInterval(quoteInterval);
    };
  }, []);

  // Format helper based on price values
  const formatPrice = (symbol: string, val: number) => {
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
          const isUp = asset.percentChange >= 0;
          const priceStr = formatPrice(asset.symbol, asset.price);
          const changeSign = isUp ? "▲" : "▼";
          const changeClass = isUp 
            ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.35)]" 
            : "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.35)]";

          // Flash only happens on a REAL price change from a real fetch now
          const isTickingUp = asset.prevPrice !== undefined && asset.price > asset.prevPrice;
          const tickFlashClass = asset.prevPrice !== undefined && asset.price !== asset.prevPrice
            ? (isTickingUp ? "bg-green-500/10" : "bg-red-500/10")
            : "";

          return (
            <span
              key={`${asset.symbol}-${i}`}
              className={`ticker-item font-mono font-bold text-sm tracking-wider flex items-center gap-2 px-2 py-0.5 rounded transition-all duration-300 ${changeClass} ${tickFlashClass}`}
              title={asset.isLive ? `Live as of ${new Date(asset.lastUpdated).toLocaleTimeString()}` : "Stale — last real quote could not be refreshed"}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${asset.isLive ? "bg-green-400" : "bg-yellow-500/70"}`}
                aria-label={asset.isLive ? "live" : "stale"}
              />
              <span className="text-white/60 font-sans tracking-normal uppercase">{asset.name}</span>
              <span>{priceStr}</span>
              <span>{changeSign}</span>
              <span className="text-xs opacity-90">({isUp ? "+" : ""}{asset.percentChange.toFixed(2)}%)</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
