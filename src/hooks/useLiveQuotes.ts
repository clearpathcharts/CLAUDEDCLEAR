import { useEffect, useMemo, useState } from 'react';
import { fetchQuotesMap } from '../lib/clientMarketCache';
import { resolveQuotePrice, type QuotePriceFields } from '../lib/resolveQuotePrice';

export type LiveQuote = {
  price: number;
  percentChange: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  name: string | null;
};

type RawQuote = QuotePriceFields & {
  name?: string;
  percent_change?: string | number;
  high?: string | number;
  low?: string | number;
  open?: string | number;
};

function finiteOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * Real vendor quotes only. A symbol with no valid print maps to null so the
 * caller renders DATA UNAVAILABLE — never a placeholder number.
 */
export function useLiveQuotes(symbols: string[], refreshMs = 60_000) {
  const key = useMemo(() => [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].sort().join(','), [symbols]);
  const [quotes, setQuotes] = useState<Record<string, LiveQuote | null>>({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!key) {
      setQuotes({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const raw = await fetchQuotesMap(key.split(','));
        if (cancelled) return;
        const next: Record<string, LiveQuote | null> = {};
        for (const sym of key.split(',')) {
          const q = (raw[sym] || null) as RawQuote | null;
          const price = q ? resolveQuotePrice(q) : null;
          next[sym] = price == null || !q
            ? null
            : {
                price,
                percentChange: finiteOrNull(q.percent_change),
                high: finiteOrNull(q.high),
                low: finiteOrNull(q.low),
                open: finiteOrNull(q.open),
                name: q.name || null,
              };
        }
        setQuotes(next);
        setUpdatedAt(new Date());
      } catch {
        if (!cancelled) setQuotes(Object.fromEntries(key.split(',').map((s) => [s, null])));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), Math.max(15_000, refreshMs));
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [key, refreshMs]);

  const get = (symbol: string): LiveQuote | null => quotes[symbol.trim().toUpperCase()] ?? null;
  return { quotes, get, loading, updatedAt };
}

export const DATA_UNAVAILABLE = 'DATA UNAVAILABLE';

export function formatPct(pct: number | null): string {
  if (pct == null) return '';
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}
