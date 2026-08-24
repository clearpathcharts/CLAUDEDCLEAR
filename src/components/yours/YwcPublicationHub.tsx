import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Heart, Library, Plus, Search } from 'lucide-react';
import { useMagazineRack } from './YwcMagazineRack';
import { PublicationTranslator } from './YwcPublicationTranslator';
import { usePublicationFavorites } from './usePublicationFavorites';
import type { AudienceAge, MagazineStory, OrientationDesk, PoliticsDesk } from '../../lib/ywc/magazineTypes';
import {
  AUDIENCE_AGE_OPTIONS,
  ORIENTATION_OPTIONS,
  POLITICS_OPTIONS,
  favoriteFromForm,
  type PublicationFavorite,
} from '../../lib/ywc/publicationHub';
import {
  AGE_BANDS,
  INTEREST_DESKS,
  SOURCE_KIND_LABEL,
  agentsFor,
  favoriteFromInterestSource,
  sourceHost,
  type AgeBandId,
  type InterestDeskId,
  type InterestSource,
} from '../../lib/ywc/interestCatalog';

function facetPills(src: { kind?: string; audienceAge?: string; orientation?: string; politics?: string }, extra: string[] = []) {
  const kind = src.kind ? SOURCE_KIND_LABEL[src.kind as keyof typeof SOURCE_KIND_LABEL] : '';
  const age = AUDIENCE_AGE_OPTIONS.find((o) => o.id === src.audienceAge)?.label;
  const ori = ORIENTATION_OPTIONS.find((o) => o.id === src.orientation)?.label;
  const pol = POLITICS_OPTIONS.find((o) => o.id === src.politics)?.label;
  return [kind, age, ori, pol, ...extra].filter(Boolean) as string[];
}

function liveStoryFor(homepage: string, stories: MagazineStory[]): MagazineStory | undefined {
  const host = sourceHost(homepage);
  if (!host) return undefined;
  return stories.find((s) => sourceHost(s.homepage) === host || sourceHost(s.articleUrl) === host);
}

function TwinCard({
  name,
  homepage,
  facets,
  story,
  action,
  translatorPageUrl,
  storyId,
}: {
  name: string;
  homepage: string;
  facets: string[];
  story?: MagazineStory;
  action: React.ReactNode;
  translatorPageUrl: string;
  storyId?: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 space-y-3 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h4 className="text-lg font-serif italic font-black text-white leading-tight">{name}</h4>
          <div className="flex flex-wrap gap-1">
            {facets.map((f) => (
              <span
                key={f}
                className="text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 text-zinc-400"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
        {action}
      </div>
      {story ? (
        <a
          href={story.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-200 hover:text-cyan-300 line-clamp-2 leading-snug"
        >
          {story.title}
        </a>
      ) : (
        <p className="text-xs text-zinc-500 font-mono">Opens the publisher homepage.</p>
      )}
      <PublicationTranslator
        pageUrl={translatorPageUrl}
        storyId={storyId}
        title={story?.title}
        snippet={story?.snippet}
      />
      <a
        href={homepage}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-[#00f0ff] hover:text-[#ff0088]"
      >
        Subscribe at publisher
        <ArrowUpRight size={12} />
      </a>
    </article>
  );
}

function CatalogNav({
  band,
  desk,
  agentSlug,
  title,
  onBand,
  onDesk,
  onAgent,
  onTitle,
}: {
  band: AgeBandId;
  desk: InterestDeskId;
  agentSlug: string;
  title: string;
  onBand: (id: AgeBandId) => void;
  onDesk: (id: InterestDeskId) => void;
  onAgent: (slug: string) => void;
  onTitle: (q: string) => void;
}) {
  const agents = agentsFor(band, desk);
  const bandNote = AGE_BANDS.find((b) => b.id === band)?.note || '';
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {AGE_BANDS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onBand(b.id)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg shrink-0 ${
              band === b.id ? 'bg-[#39ff14] text-black' : 'text-zinc-400 border border-white/10 hover:text-[#39ff14]'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {INTEREST_DESKS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onDesk(d.id)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg shrink-0 ${
              desk === d.id ? 'bg-cyan-400 text-black' : 'text-zinc-400 border border-white/10 hover:text-cyan-300'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
        {desk === 'everyone'
          ? bandNote
          : 'Opt-in desk — you opened this. ClearPath does not sort people into it.'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {agents.map((a) => (
          <button
            key={a.slug}
            type="button"
            onClick={() => onAgent(a.slug)}
            className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg shrink-0 ${
              agentSlug === a.slug
                ? 'bg-white text-black'
                : 'text-zinc-400 border border-white/10 hover:text-white'
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>
      <label className="relative block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Search this desk by title…"
          className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#39ff14]/40"
        />
      </label>
    </div>
  );
}

function AddFavoriteForm({ onAdd }: { onAdd: (fav: PublicationFavorite) => void }) {
  const [title, setTitle] = useState('');
  const [homepage, setHomepage] = useState('');
  const [audienceAge, setAudienceAge] = useState<AudienceAge>('all-ages');
  const [orientation, setOrientation] = useState<OrientationDesk>('general');
  const [politics, setPolitics] = useState<PoliticsDesk>('nonpartisan');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fav = favoriteFromForm({ title, homepage, audienceAge, orientation, politics });
    if (!fav) {
      setError('Need a title and an https:// publisher homepage.');
      return;
    }
    onAdd(fav);
    setTitle('');
    setHomepage('');
    setError('');
  };

  const field = 'w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white';
  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl border border-[#39ff14]/25 bg-black/30 p-3">
      <p className="text-[9px] font-mono uppercase tracking-widest text-[#39ff14]">Add your fav</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Publication title"
        className={field}
        maxLength={80}
      />
      <input
        value={homepage}
        onChange={(e) => setHomepage(e.target.value)}
        placeholder="https://publisher.example/"
        className={field}
      />
      <div className="grid grid-cols-3 gap-1.5">
        <select value={audienceAge} onChange={(e) => setAudienceAge(e.target.value as AudienceAge)} className={field}>
          {AUDIENCE_AGE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select value={orientation} onChange={(e) => setOrientation(e.target.value as OrientationDesk)} className={field}>
          {ORIENTATION_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select value={politics} onChange={(e) => setPolitics(e.target.value as PoliticsDesk)} className={field}>
          {POLITICS_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-[10px] text-rose-400">{error}</p> : null}
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#39ff14] text-black text-[10px] font-black uppercase tracking-widest py-2"
      >
        <Plus size={12} />
        Add favorite
      </button>
    </form>
  );
}

export function YwcPublicationHub({ onBack }: { onBack: () => void }) {
  const { rack, status, refresh } = useMagazineRack();
  const { favs, add, remove, hasHomepage } = usePublicationFavorites();
  const [band, setBand] = useState<AgeBandId>('19-22');
  const [desk, setDesk] = useState<InterestDeskId>('everyone');
  const [agentSlug, setAgentSlug] = useState('ai');
  const [titleQ, setTitleQ] = useState('');

  const agents = useMemo(() => agentsFor(band, desk), [band, desk]);
  useEffect(() => {
    if (!agents.some((a) => a.slug === agentSlug)) {
      setAgentSlug(agents[0]?.slug || '');
    }
  }, [agents, agentSlug]);

  const selected = agents.find((a) => a.slug === agentSlug) || agents[0];
  const q = titleQ.trim().toLowerCase();
  const sources = useMemo(() => {
    const list = selected?.sources || [];
    if (!q) return list;
    return list.filter((src) => `${src.name} ${src.homepage} ${selected?.name || ''}`.toLowerCase().includes(q));
  }, [selected, q]);

  const favCards = useMemo(() => {
    return favs.filter((f) => {
      if (!q) return true;
      return `${f.title} ${f.homepage}`.toLowerCase().includes(q);
    });
  }, [favs, q]);

  const addSource = (src: InterestSource) => {
    const fav = favoriteFromInterestSource(src, band, desk);
    if (fav) add(fav);
  };

  return (
    <section className="space-y-6" aria-label="Online publication hub">
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
              <span>Online publication hub — twin desk</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif italic font-black text-white">
              Two matching racks
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              35 interest desks per life stage, plus opt-in 15-desk maps you choose: gay men,
              lesbian/queer women, Republican-leaning men, and Republican-leaning women. You add
              those tags to your own rack — ClearPath does not guess orientation or politics. Each
              card opens the publisher so people can subscribe there. Dating apps and official health
              pages are bookmarks, not scraped feeds, and not medical advice. ClearPath does not sell
              these titles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#39ff14] border border-white/10 rounded-lg px-3 py-1.5"
          >
            Refresh wires
          </button>
        </div>
      </div>

      <CatalogNav
        band={band}
        desk={desk}
        agentSlug={selected?.slug || ''}
        title={titleQ}
        onBand={setBand}
        onDesk={setDesk}
        onAgent={setAgentSlug}
        onTitle={setTitleQ}
      />

      {selected ? (
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          <span className="text-white font-semibold">{selected.name}</span>
          {' — '}
          {selected.watches}
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4 md:p-5 space-y-4 min-h-[28rem]">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
            <h3 className="text-xl font-serif italic font-black text-white">The hub</h3>
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
              {sources.length} sources
            </span>
          </div>
          {status === 'loading' && rack.items.length === 0 ? (
            <p className="text-xs font-mono text-zinc-500">Pulling magazine RSS…</p>
          ) : null}
          <div className="space-y-3">
            {sources.map((src) => {
              const story = liveStoryFor(src.homepage, rack.items);
              return (
                <TwinCard
                  key={`${src.id}:${src.homepage}`}
                  name={src.name}
                  homepage={src.homepage}
                  facets={facetPills(src)}
                  story={story}
                  translatorPageUrl={story?.articleUrl || src.homepage}
                  storyId={story?.id}
                  action={
                    hasHomepage(src.homepage) ? (
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#39ff14]">On your rack</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addSource(src)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#39ff14] text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5"
                      >
                        <Heart size={11} />
                        Add fav
                      </button>
                    )
                  }
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-[#39ff14]/25 bg-black/20 p-4 md:p-5 space-y-4 min-h-[28rem] shadow-[0_0_40px_rgba(57,255,20,0.06)]">
          <div className="flex items-center justify-between gap-2 border-b border-[#39ff14]/20 pb-3">
            <h3 className="text-xl font-serif italic font-black text-white">Your favorites</h3>
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
              {favCards.length} saved
            </span>
          </div>
          <AddFavoriteForm onAdd={add} />
          {favCards.length === 0 ? (
            <p className="text-xs text-zinc-500 leading-relaxed">
              Twin is empty until you add a title from the hub or paste an https homepage here.
            </p>
          ) : (
            <div className="space-y-3">
              {favCards.map((fav) => {
                const story = liveStoryFor(fav.homepage, rack.items);
                return (
                  <TwinCard
                    key={fav.id}
                    name={fav.title}
                    homepage={fav.homepage}
                    facets={facetPills(fav)}
                    story={story}
                    translatorPageUrl={story?.articleUrl || fav.homepage}
                    storyId={story?.id}
                    action={
                      <button
                        type="button"
                        onClick={() => remove(fav.id)}
                        className="shrink-0 text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-rose-300 border border-white/10 rounded-lg px-2 py-1"
                      >
                        Remove
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Back-compat name used by the Y.W.C. catalog route. */
export function YwcRssCatalog({ onBack }: { onBack: () => void }) {
  return <YwcPublicationHub onBack={onBack} />;
}
