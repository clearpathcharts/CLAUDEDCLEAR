import React, { useState } from 'react';
import { Newspaper, Radio, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { usePageAutoUpdate } from '../hooks/usePageAutoUpdate';

interface NewsItem {
  title: string;
  source: string;
  category: string;
  pubDate?: string;
}

export default function BreakingNewsTicker() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/newsdata/latest');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNews(data);
          setError(null);
        } else {
          setNews([]);
          setError('Invalid news payload structure');
        }
      } else {
        setNews([]);
        setError(`Failed to synchronize: HTTP ${res.status}`);
      }
    } catch (e: any) {
      setNews([]);
      setError(e?.message || 'Connection offline');
    } finally {
      setLoading(false);
    }
  };

  usePageAutoUpdate(fetchNews, { intervalMs: 60_000 });

  return (
    <>
      <div className="w-full bg-[#0a0d14] border-t border-[#ff4500]/30 h-10 flex items-center justify-between font-mono text-[11px] text-white overflow-hidden select-none relative z-40 shadow-[0_-5px_15px_rgba(255,69,0,0.08)]">
        {/* Ticker Lead-In Label */}
        <div className="flex items-center gap-1.5 px-3 bg-black h-full border-r border-[#ff4500]/30 shrink-0 text-[#ff4500] font-black tracking-wider shadow-[5px_0_10px_rgba(0,0,0,0.5)] z-10">
          <Radio className="h-3.5 w-3.5 animate-pulse text-[#ff4500]" />
          <span>BREAKING INTELLIGENCE</span>
          <span className="text-[9px] text-[#ff4500]/50 font-normal">LIVE FEED</span>
        </div>

        {/* Scrolling Area Container */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center bg-[#070a0f]">
          {loading && news.length === 0 ? (
            <div className="flex items-center gap-2 pl-4 text-zinc-400">
              <RefreshCw className="h-3 w-3 animate-spin text-[#ff4500]" />
              <span>SYNCHRONIZING NEWS INGRESS...</span>
            </div>
          ) : error && news.length === 0 ? (
            <div className="flex items-center gap-2 pl-4 text-rose-400">
              <AlertCircle className="h-3 w-3" />
              <span>FEED TEMPORARILY OFFLINE: {error}</span>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden h-full flex items-center">
              {/* Marquee Body */}
              <div 
                className="absolute flex items-center gap-12 whitespace-nowrap animate-[marquee_50s_linear_infinite] hover:[animation-play-state:paused]"
                style={{
                  willChange: 'transform',
                }}
              >
                {/* Render items twice to ensure seamless looping scroll */}
                {news.concat(news).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedNews(item)}
                    className="flex items-center gap-3 bg-[#0a0e17] hover:bg-[#ff4500]/10 hover:border-[#ff4500]/40 border border-white/5 px-3 py-1 rounded transition-all cursor-pointer select-none shrink-0 group text-left"
                  >
                    <span className="text-[#ff4500] font-black text-[9px] px-1 border border-[#ff4500]/30 rounded bg-[#ff4500]/5 group-hover:bg-[#ff4500] group-hover:text-black transition-colors uppercase">
                      {item.source}
                    </span>
                    <span className="text-zinc-400 text-[10px] uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-500">
                      {item.category}
                    </span>
                    <span className="text-white group-hover:text-[#ff4500] font-medium text-[10.5px] transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[9px] text-zinc-600">
                      {item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'LIVE'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sync Controls */}
        <button
          onClick={fetchNews}
          disabled={loading}
          className="px-3 bg-black h-full border-l border-[#ff4500]/30 hover:bg-[#ff4500]/10 text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer select-none"
          title="Force refresh dynamic NewsData stream"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-[#ff4500]' : ''}`} />
        </button>
      </div>

      {/* Styled inline animation block if not defined in Tailwind */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Breaking News Brief Detail Overlay Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0e11] border-2 border-[#ff4500]/50 max-w-lg w-full rounded-2xl p-6 font-mono text-left text-white shadow-[0_0_50px_rgba(255,69,0,0.2)]">
            <div className="flex items-center justify-between border-b border-[#ff4500]/25 pb-3">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-[#ff4500]" />
                <span className="text-[#ff4500] font-black text-xs uppercase border border-[#ff4500] px-1.5 py-0.5 rounded bg-[#ff4500]/10">
                  {selectedNews.source}
                </span>
                <span className="text-xs text-zinc-400 uppercase font-black tracking-widest">{selectedNews.category}</span>
              </div>
              <span className="text-[10px] text-zinc-500">
                {selectedNews.pubDate ? new Date(selectedNews.pubDate).toLocaleString() : 'JUST NOW'}
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-bold leading-relaxed text-white uppercase tracking-tight">
                {selectedNews.title}
              </h3>
              <p className="mt-3 text-xs text-zinc-400 leading-relaxed font-sans">
                This high-fidelity alert outlines a critical real-time macro-intelligence event logged on ClearPath's digital routing infrastructure. Please consult current trading positions relative to this trigger.
              </p>
            </div>

            <div className="mt-6 flex justify-between gap-3 border-t border-white/5 pt-4">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                CLEARPATH SENTINEL DISPATCH
              </span>
              <button
                onClick={() => setSelectedNews(null)}
                className="px-4 py-1.5 bg-[#ff4500] hover:bg-red-600 text-black font-black text-xs rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
              >
                DISMISS BRIEFING
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
