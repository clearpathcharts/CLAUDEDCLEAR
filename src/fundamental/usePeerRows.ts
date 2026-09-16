import { useEffect, useState } from 'react';
import { num } from './service';
import type { PeerRow } from './types';

export function usePeerRows(symbol: string, selectedPeers: string[]): PeerRow[] {
  const [peerMetrics, setPeerMetrics] = useState<PeerRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const tickers = Array.from(new Set([symbol, ...selectedPeers])).slice(0, 8);
    void (async () => {
      const rows: PeerRow[] = [];
      for (const t of tickers) {
        try {
          const [qRes, mRes] = await Promise.all([
            fetch(`/api/fmp/quote/${encodeURIComponent(t)}`),
            fetch(`/api/fmp/key-metrics-ttm/${encodeURIComponent(t)}`),
          ]);
          if (!qRes.ok) continue;
          const q = await qRes.json();
          const m = mRes.ok ? await mRes.json() : [];
          const quote = Array.isArray(q) ? q[0] : q;
          const met = Array.isArray(m) ? m[0] : m;
          if (quote?.error) continue;
          rows.push({
            company: String(quote?.name || t),
            ticker: t,
            pe: num(quote, 'pe'),
            evEbitda: num(met, 'enterpriseValueOverEBITDATTM'),
            revenueGrowth: null,
            epsGrowth: null,
            roic: num(met, 'roicTTM') ?? num(met, 'roic'),
            fcfMargin: num(met, 'freeCashFlowYieldTTM'),
            debtEbitda: num(met, 'netDebtToEBITDATTM'),
          });
        } catch {
          /* skip */
        }
      }
      if (!cancelled) setPeerMetrics(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPeers, symbol]);

  return peerMetrics;
}
