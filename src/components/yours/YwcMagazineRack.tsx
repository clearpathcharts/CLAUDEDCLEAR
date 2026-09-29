import React, { useCallback, useState } from 'react';
import { BookOpen, Newspaper, X } from 'lucide-react';
import { usePageAutoUpdate } from '../../hooks/usePageAutoUpdate';
import type {
  MagazineCategory,
  MagazinePublicationCard,
  MagazineRackPayload,
  MagazineStory,
} from '../../lib/ywc/magazineTypes';

function withDeskFacets(pub: MagazinePublicationCard | undefined): MagazinePublicationCard {
  return {
    id: pub?.id || '',
    name: pub?.name || '',
    homepage: pub?.homepage || '',
    category: pub?.category || 'lifestyle',
    audienceAge: pub?.audienceAge || 'all-ages',
    orientation: pub?.orientation || 'general',
    politics: pub?.politics || 'nonpartisan',
  };
}

const EMPTY: MagazineRackPayload = {
  fetchedAt: '',
  publications: [],
  items: [],
  shelves: [],
};

function formatWhen(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const delta = Date.now() - t;
  if (delta < 90_000) return 'Just now';
  if (delta < 3_600_000) return `${Math.max(1, Math.round(delta / 60_000))}m ago`;
  if (delta < 86_400_000) return `${Math.max(1, Math.round(delta / 3_600_000))}h ago`;
  return new Date(t).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function StoryArt({
  story,
  className,
  onOpen,
}: {
  story: MagazineStory;
  className: string;
  onOpen: (story: MagazineStory) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(story)}
      className={`relative block overflow-hidden bg-zinc-900 text-left ${className}`}
    >
      {story.image ? (
        <img
          src={story.image}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-600">
          <Newspaper size={28} />
        </div>
      )}
      <div className="absolute top-3 left-3">
        <span className="bg-[#ff0088]/90 text-white text-[8px] font-mono font-black tracking-widest px-2 py-0.5 rounded uppercase">
          {story.category}
        </span>
      </div>
      {story.publishedAt ? (
        <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-zinc-950/85 text-zinc-400 px-2 py-0.5 rounded">
          {formatWhen(story.publishedAt)}
        </div>
      ) : null}
    </button>
  );
}

function sourceLabel(source: string): string {
  return source.split('—')[0].trim();
}

export function MagazineStoryCard({
  story,
  onOpen,
}: {
  story: MagazineStory;
  onOpen: (story: MagazineStory) => void;
}) {
  return (
    <article className="bg-zinc-950/80 border border-white/5 hover:border-[#ff0088]/20 rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(255,0,136,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      <StoryArt story={story} className="h-48 w-full" onOpen={onOpen} />
      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
            <span>magazine</span>
            <span>•</span>
            <span>{story.source}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpen(story)}
            className="text-left text-base font-serif font-black italic text-white hover:text-cyan-400 transition-colors line-clamp-2"
          >
            {story.title}
          </button>
          {story.snippet ? (
            <p className="text-zinc-400 text-xs line-clamp-3 leading-relaxed">{story.snippet}</p>
          ) : null}
        </div>
        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-zinc-500 truncate">{sourceLabel(story.source)}</span>
          <button
            type="button"
            onClick={() => onOpen(story)}
            className="text-xs text-[#00f0ff] font-bold tracking-widest hover:text-[#ff0088] transition-colors shrink-0"
          >
            Read on Y.W.C.
          </button>
        </div>
      </div>
    </article>
  );
}

function StoryReader({ story, onClose }: { story: MagazineStory; onClose: () => void }) {
  return (
    <article className="rounded-3xl border border-[#39ff14]/30 bg-zinc-950 overflow-hidden" data-testid="ywc-story-reader">
      {story.image ? (
        <img src={story.image} alt="" referrerPolicy="no-referrer" className="w-full max-h-[420px] object-cover" />
      ) : null}
      <div className="p-6 md:p-8 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#39ff14]">
            {sourceLabel(story.source)} · on Your World Connected
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white"
          >
            <X size={14} /> Close
          </button>
        </div>
        <h3 className="text-2xl md:text-4xl font-serif italic font-black text-white leading-tight">{story.title}</h3>
        {story.publishedAt ? (
          <p className="text-[11px] font-mono text-zinc-500">{formatWhen(story.publishedAt)}</p>
        ) : null}
        <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
          {story.snippet || 'This wire did not include a summary. The headline is the story ClearPath can show here.'}
        </p>
      </div>
    </article>
  );
}

export function useMagazineRack() {
  const [rack, setRack] = useState<MagazineRackPayload>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');

  const load = useCallback(async () => {
    setStatus((prev) => (prev === 'ready' ? prev : 'loading'));
    try {
      const res = await fetch('/api/ywc/magazines');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as MagazineRackPayload;
      const items = Array.isArray(data.items) ? data.items : [];
      const publications = (Array.isArray(data.publications) ? data.publications : []).map(withDeskFacets);
      const shelves = (Array.isArray(data.shelves) ? data.shelves : []).map((shelf) => ({
        publication: withDeskFacets(shelf.publication),
        items: Array.isArray(shelf.items) ? shelf.items : [],
      }));
      setRack({
        fetchedAt: data.fetchedAt || new Date().toISOString(),
        publications,
        items,
        shelves,
      });
      setStatus(items.length ? 'ready' : 'empty');
    } catch {
      setStatus('error');
    }
  }, []);

  const { refresh, lastUpdatedAt } = usePageAutoUpdate(load, {
    intervalMs: 6 * 60 * 60 * 1000,
  });

  return { rack, status, refresh, lastUpdatedAt };
}

function MagazineHero({
  story,
  onOpen,
}: {
  story: MagazineStory;
  onOpen: (story: MagazineStory) => void;
}) {
  return (
    <article className="relative min-h-[320px] md:min-h-[420px] rounded-3xl overflow-hidden border border-white/10 flex flex-col justify-end">
      <StoryArt story={story} className="absolute inset-0" onOpen={onOpen} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/10 pointer-events-none" />
      <div className="relative z-10 p-6 md:p-10 space-y-3 max-w-3xl">
        <span className="inline-flex bg-[#ff0088] text-white text-[9px] font-mono font-black tracking-widest px-3 py-1 rounded">
          {story.source}
        </span>
        <button
          type="button"
          onClick={() => onOpen(story)}
          className="block text-left text-3xl md:text-5xl font-serif italic font-black leading-tight text-white hover:text-cyan-400 transition-colors"
        >
          {story.title}
        </button>
        {story.snippet ? (
          <p className="text-zinc-300 text-xs md:text-sm max-w-2xl leading-relaxed">{story.snippet}</p>
        ) : null}
        <button
          type="button"
          onClick={() => onOpen(story)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 hover:border-[#ff0088] rounded-xl text-xs font-black tracking-wider"
        >
          Read on Y.W.C.
        </button>
      </div>
    </article>
  );
}

export function YwcMagazineRack({
  compact = false,
  category = 'all',
  hideIntro = false,
  showHero = false,
}: {
  compact?: boolean;
  category?: 'all' | MagazineCategory;
  hideIntro?: boolean;
  /** First headline as a full-width cinematic card that opens on Y.W.C. */
  showHero?: boolean;
}) {
  const { rack, status, refresh } = useMagazineRack();
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [openStory, setOpenStory] = useState<MagazineStory | null>(null);
  const items = (category === 'all' ? rack.items : rack.items.filter((s) => s.category === category)).filter(
    (story) => !selectedSourceId || story.sourceId === selectedSourceId,
  );
  const hero = showHero ? items[0] : null;
  const rest = hero ? items.slice(1) : items;
  const shown = compact ? rest.slice(0, 8) : rest;

  return (
    <section className="space-y-4" aria-label="Magazine publications">
      {!hideIntro && (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-[#39ff14] uppercase">
              <BookOpen className="w-3 h-3" />
              <span>From the magazines</span>
            </div>
            <h3 className="text-lg font-black font-serif italic text-white">
              Live editorial wires
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Headlines stay on Your World Connected. Tap a title such as Smithsonian to read that wire here.
              ClearPath does not sell these magazines.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="self-start text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#39ff14] border border-white/10 rounded-lg px-3 py-1.5"
          >
            Refresh wires
          </button>
        </div>
      )}

      {rack.publications.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedSourceId(null);
              setOpenStory(null);
            }}
            className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              selectedSourceId
                ? 'border-white/10 text-zinc-400 hover:text-white'
                : 'border-[#39ff14]/50 text-[#39ff14]'
            }`}
          >
            All titles
          </button>
          {rack.publications
            .filter((p, i, all) => all.findIndex((x) => x.id === p.id) === i)
            .map((pub) => {
              const on = selectedSourceId === pub.id;
              return (
                <button
                  key={pub.id}
                  type="button"
                  onClick={() => {
                    setSelectedSourceId(on ? null : pub.id);
                    setOpenStory(null);
                  }}
                  className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    on
                      ? 'border-[#39ff14]/50 text-white bg-[#39ff14]/10'
                      : 'border-white/10 text-zinc-400 hover:text-white hover:border-[#39ff14]/40'
                  }`}
                >
                  {sourceLabel(pub.name)}
                </button>
              );
            })}
        </div>
      )}

      {openStory ? <StoryReader story={openStory} onClose={() => setOpenStory(null)} /> : null}

      {status === 'loading' && shown.length === 0 && (
        <p className="text-xs font-mono text-zinc-500">Pulling magazine RSS…</p>
      )}
      {status === 'error' && shown.length === 0 && (
        <p className="text-xs font-mono text-rose-400">
          Magazine wires are quiet right now. Try refresh in a minute.
        </p>
      )}
      {status === 'empty' && (
        <p className="text-xs font-mono text-zinc-500">No magazine headlines in this pass.</p>
      )}

      {hero && !openStory ? <MagazineHero story={hero} onOpen={setOpenStory} /> : null}

      {shown.length > 0 && !openStory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shown.map((story) => (
            <MagazineStoryCard key={story.id} story={story} onOpen={setOpenStory} />
          ))}
        </div>
      )}
    </section>
  );
}
