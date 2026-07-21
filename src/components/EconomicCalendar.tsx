import React, { useState } from 'react';
import { Calendar, AlertCircle, RefreshCw, Radio, Newspaper } from 'lucide-react';
import { fetchEconomicNews, EconomicNewsItem } from '../services/economicService';
import { usePageAutoUpdate } from '../hooks/usePageAutoUpdate';

/**
 * Economic News — live macro/economy headlines only.
 * Replaces the old fake TradingEconomics-style calendar mock.
 */
export default function EconomicCalendar() {
  const [items, setItems] = useState<EconomicNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { refresh, lastUpdatedAt } = usePageAutoUpdate(async () => {
    try {
      setLoading(true);
      const data = await fetchEconomicNews();
      setItems(data);
      setError(data.length === 0 ? 'No economic headlines returned from the wire.' : null);
    } catch (e: unknown) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Economic news unavailable');
    } finally {
      setLoading(false);
    }
  }, { intervalMs: 60_000 });

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-md">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/20">
            <Calendar className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-white italic">Economic News</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/60">
              Macro wire · /api/economic/news
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdatedAt && (
            <span className="hidden font-mono text-[9px] uppercase text-zinc-500 sm:inline">
              Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase text-zinc-300 hover:bg-white/10"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] uppercase ${
              items.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
            }`}
          >
            <Radio className="h-3 w-3" />
            {items.length > 0 ? `${items.length} items` : 'Empty'}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {loading && items.length === 0 ? (
          <div className="flex h-40 items-center justify-center font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Loading economic news…
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-zinc-950/50 px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-zinc-500" />
            <p className="max-w-sm text-sm text-zinc-300">
              {error || 'No economic headlines available.'}
            </p>
            <p className="text-[11px] text-zinc-500">
              Events and headlines are never invented. Configure the news vendor key on the server to populate this panel.
            </p>
          </div>
        ) : (
          items.map((item, i) => (
            <article
              key={`${item.title}-${i}`}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-emerald-500/30"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-black text-emerald-500">
                  {item.source}
                </span>
                {item.category && <span>· {item.category}</span>}
                {item.pubDate && <span>· {item.pubDate}</span>}
              </div>
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-white hover:text-emerald-400"
                >
                  {item.title}
                </a>
              ) : (
                <h3 className="flex items-start gap-2 text-sm font-bold text-white">
                  <Newspaper className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
                  {item.title}
                </h3>
              )}
              {item.description && (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-400">{item.description}</p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
