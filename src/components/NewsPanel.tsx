import React, { useState } from 'react';
import { Newspaper, Radio, AlertCircle, RefreshCw } from 'lucide-react';
import { usePageAutoUpdate } from '../hooks/usePageAutoUpdate';

interface NewsItem {
  title: string;
  source: string;
  category?: string;
  pubDate?: string;
  link?: string;
  description?: string;
}

/**
 * Live news only — fetches `/api/newsdata/latest`. Never invents headlines or asset prices.
 */
export default function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { refresh, lastUpdatedAt } = usePageAutoUpdate(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/newsdata/latest');
      if (!res.ok) {
        setNews([]);
        setError(`News feed unavailable (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        setNews([]);
        setError('Invalid news payload from server.');
        return;
      }
      setNews(
        data.map((item: Record<string, unknown>) => ({
          title: String(item.title ?? ''),
          source: String(item.source ?? item.source_id ?? 'Wire'),
          category: item.category ? String(item.category) : undefined,
          pubDate: item.pubDate ? String(item.pubDate) : item.published_at ? String(item.published_at) : undefined,
          link: item.link ? String(item.link) : item.url ? String(item.url) : undefined,
          description: item.description ? String(item.description) : undefined,
        })).filter((n: NewsItem) => n.title.trim().length > 0)
      );
      setError(null);
    } catch (e: unknown) {
      setNews([]);
      setError(e instanceof Error ? e.message : 'News feed offline');
    } finally {
      setLoading(false);
    }
  }, { intervalMs: 60_000 });

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/5 bg-black/40 p-4 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/20">
            <Newspaper className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">News</h2>
            <p className="font-mono text-[10px] uppercase text-orange-400/60">
              Live wire · /api/newsdata/latest
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
              error && news.length === 0
                ? 'bg-rose-500/10 text-rose-400'
                : news.length > 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-zinc-500/10 text-zinc-400'
            }`}
          >
            <Radio className="h-3 w-3" />
            {error && news.length === 0 ? 'Offline' : news.length > 0 ? `${news.length} items` : 'Empty'}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {loading && news.length === 0 ? (
          <div className="flex h-40 items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Synchronizing news…
          </div>
        ) : error && news.length === 0 ? (
          <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-rose-500/20 bg-rose-950/20 px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-rose-400" />
            <p className="max-w-md text-sm text-zinc-300">{error}</p>
            <p className="text-[11px] text-zinc-500">
              Headlines are never fabricated. Configure the news vendor key on the server to enable this panel.
            </p>
          </div>
        ) : news.length === 0 ? (
          <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 text-center text-zinc-500">
            <Newspaper className="h-8 w-8 opacity-40" />
            <p className="font-mono text-xs uppercase tracking-widest">No headlines returned</p>
          </div>
        ) : (
          news.map((item, i) => (
            <article
              key={`${item.title}-${i}`}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                <span className="text-orange-400/80">{item.source}</span>
                {item.category && <span>· {item.category}</span>}
                {item.pubDate && <span>· {item.pubDate}</span>}
              </div>
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-white hover:text-orange-300"
                >
                  {item.title}
                </a>
              ) : (
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
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
