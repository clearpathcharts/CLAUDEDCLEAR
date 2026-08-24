import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Library, Search } from 'lucide-react';
import { MagazineStoryCard, useMagazineRack } from './YwcMagazineRack';
import type { MagazineCategory } from '../../lib/ywc/magazineTypes';

const TABS: Array<{ id: 'all' | MagazineCategory; label: string }> = [
  { id: 'all', label: 'ALL SHELVES' },
  { id: 'automotive', label: 'CARS & RACING' },
  { id: 'lifestyle', label: 'LIFESTYLE' },
  { id: 'tech', label: 'TECH' },
  { id: 'science', label: 'SCIENCE' },
];

export function YwcRssCatalog({ onBack }: { onBack: () => void }) {
  const { rack, status, refresh } = useMagazineRack();
  const [tab, setTab] = useState<'all' | MagazineCategory>('all');
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const shelves = useMemo(() => {
    return (rack.shelves || []).filter((shelf) => {
      if (tab !== 'all' && shelf.publication.category !== tab) return false;
      if (!query) return true;
      const hay = `${shelf.publication.name} ${shelf.publication.homepage} ${shelf.items.map((i) => i.title).join(' ')}`.toLowerCase();
      return hay.includes(query);
    });
  }, [rack.shelves, tab, query]);

  return (
    <section className="space-y-6" aria-label="RSS magazine catalog">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to Your World Connected
        </button>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-[#39ff14] uppercase">
              <Library className="w-3 h-3" />
              <span>Secondary desk — RSS catalog</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif italic font-black text-white">
              Every shelf we carry
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              One card per magazine. Headlines open <strong className="text-zinc-200 font-semibold">their</strong> site
              so you can subscribe there. ClearPath does not sell these titles. Paste a domain list later and we will
              probe each publisher for a real RSS URL before it lands on this desk.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#39ff14] border border-white/10 rounded-lg px-3 py-1.5"
          >
            Refresh catalog
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <label className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Motorsport, WIRED, Smithsonian…"
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#39ff14]/40"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg whitespace-nowrap ${
                tab === t.id
                  ? 'bg-[#39ff14] text-black'
                  : 'text-zinc-400 hover:text-[#39ff14] border border-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
        {rack.publications.length} publications · {shelves.length} shelves in view
      </p>

      {status === 'loading' && shelves.length === 0 && (
        <p className="text-xs font-mono text-zinc-500">Pulling magazine RSS…</p>
      )}
      {status === 'error' && shelves.length === 0 && (
        <p className="text-xs font-mono text-rose-400">Catalog is quiet right now. Try refresh.</p>
      )}

      <div className="space-y-10">
        {shelves.map((shelf) => (
          <div key={shelf.publication.id} className="space-y-3">
            <div className="flex items-end justify-between gap-3 border-b border-white/10 pb-2">
              <div>
                <h3 className="text-lg font-serif italic font-black text-white">{shelf.publication.name}</h3>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  {shelf.publication.category}
                </span>
              </div>
              <a
                href={shelf.publication.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-[#00f0ff] hover:text-[#ff0088]"
              >
                Subscribe at publisher
                <ArrowUpRight size={12} />
              </a>
            </div>
            {shelf.items.length === 0 ? (
              <p className="text-xs text-zinc-600 font-mono">No headlines this pass.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shelf.items.map((story) => (
                  <MagazineStoryCard key={story.id} story={story} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
