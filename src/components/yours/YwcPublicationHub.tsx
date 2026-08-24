import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Heart, Library, Plus, Search } from 'lucide-react';
import { PublicationTranslator } from './YwcPublicationTranslator';
import { usePublicationFavorites } from './usePublicationFavorites';
import type { AudienceAge, OrientationDesk, PoliticsDesk } from '../../lib/ywc/magazineTypes';
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
  favoriteFromInterestSource,
  feedRowsFor,
  sourceHost,
  type AgeBandId,
  type InterestDeskId,
  type InterestFeedRow,
  type InterestSource,
} from '../../lib/ywc/interestCatalog';

function facetPills(src: { kind?: string; audienceAge?: string; orientation?: string; politics?: string }, extra: string[] = []) {
  const kind = src.kind ? SOURCE_KIND_LABEL[src.kind as keyof typeof SOURCE_KIND_LABEL] : '';
  const age = AUDIENCE_AGE_OPTIONS.find((o) => o.id === src.audienceAge)?.label;
  const ori = ORIENTATION_OPTIONS.find((o) => o.id === src.orientation)?.label;
  const pol = POLITICS_OPTIONS.find((o) => o.id === src.politics)?.label;
  return [kind, age, ori, pol, ...extra].filter(Boolean) as string[];
}

function FeedListRow({
  row,
  actionFor,
}: {
  row: InterestFeedRow;
  actionFor: (src: InterestSource) => React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#39ff14] flex items-center justify-center">
          {row.n}
        </span>
        <div className="min-w-0 space-y-1">
          <h4 className="text-lg font-serif italic font-black text-white leading-tight">{row.agent.name}</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">{row.agent.watches}</p>
        </div>
      </div>
      <ul className="space-y-3">
        {row.agent.sources.map((src) => (
          <li key={`${src.id}:${src.homepage}`} className="rounded-xl border border-white/5 bg-black/40 p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-white font-semibold">{src.name}</p>
                <p className="text-[10px] font-mono text-zinc-500 truncate">{sourceHost(src.homepage) || src.homepage}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {facetPills(src).map((f) => (
                    <span
                      key={f}
                      className="text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 text-zinc-400"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              {actionFor(src)}
            </div>
            <PublicationTranslator pageUrl={src.homepage} title={src.name} />
            <a
              href={src.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-[#00f0ff] hover:text-[#ff0088]"
            >
              Subscribe at publisher
              <ArrowUpRight size={12} />
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}

function FavoriteCard({
  fav,
  onRemove,
}: {
  fav: PublicationFavorite;
  onRemove: () => void;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 space-y-3 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h4 className="text-lg font-serif italic font-black text-white leading-tight">{fav.title}</h4>
          <p className="text-[10px] font-mono text-zinc-500 truncate">{sourceHost(fav.homepage) || fav.homepage}</p>
          <div className="flex flex-wrap gap-1">
            {facetPills(fav).map((f) => (
              <span
                key={f}
                className="text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 text-zinc-400"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-rose-300 border border-white/10 rounded-lg px-2 py-1"
        >
          Remove
        </button>
      </div>
      <PublicationTranslator pageUrl={fav.homepage} title={fav.title} />
      <a
        href={fav.homepage}
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
  const rows = feedRowsFor(band, desk);
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
        <button
          type="button"
          onClick={() => onAgent('')}
          className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg shrink-0 ${
            agentSlug === '' ? 'bg-white text-black' : 'text-zinc-400 border border-white/10 hover:text-white'
          }`}
        >
          All feeds on this desk
        </button>
        {rows.map((row) => (
          <button
            key={row.agent.slug}
            type="button"
            onClick={() => onAgent(row.agent.slug)}
            className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg shrink-0 ${
              agentSlug === row.agent.slug
                ? 'bg-white text-black'
                : 'text-zinc-400 border border-white/10 hover:text-white'
            }`}
          >
            {row.n}. {row.agent.name}
          </button>
        ))}
      </div>
      <label className="relative block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Search this feed list by title…"
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
  const { favs, add, remove, hasHomepage } = usePublicationFavorites();
  const [band, setBand] = useState<AgeBandId>('19-22');
  const [desk, setDesk] = useState<InterestDeskId>('everyone');
  const [agentSlug, setAgentSlug] = useState('');
  const [titleQ, setTitleQ] = useState('');

  const rows = useMemo(() => feedRowsFor(band, desk), [band, desk]);
  useEffect(() => {
    if (agentSlug && !rows.some((r) => r.agent.slug === agentSlug)) {
      setAgentSlug('');
    }
  }, [rows, agentSlug]);

  const q = titleQ.trim().toLowerCase();
  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (agentSlug && row.agent.slug !== agentSlug) return false;
      if (!q) return true;
      const blob = `${row.agent.name} ${row.agent.watches} ${row.agent.sources.map((s) => `${s.name} ${s.homepage}`).join(' ')}`;
      return blob.toLowerCase().includes(q);
    });
  }, [rows, agentSlug, q]);

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
    <section id="ywc-publication-hub" className="space-y-6" aria-label="RSS feed list hub">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to the live newspaper
        </button>
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-[#39ff14] uppercase">
            <Library className="w-3 h-3" />
            <span>Hub 2 — RSS feed list</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif italic font-black text-white">
            A separate list from the newspaper
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The live editorial grid stays on Your World Connected. This desk is the second way to process
            the same world: a numbered feed list you scan, tag, and subscribe to at the publisher. Opt-in
            maps include gay men, lesbian/queer women, Republican- and Democrat-leaning desks, sports —
            men / sports — women, and a unified weird / off-the-wall niche list (Robb Report sits there as
            a luxury cross-read for yachts, charters, and watches). Those chips are tags you add — not a
            bucket assigned by politics or gender. Dating apps and official health pages are bookmarks, not
            scraped feeds, and not medical advice. ClearPath does not sell these titles.
          </p>
        </div>
      </div>

      <CatalogNav
        band={band}
        desk={desk}
        agentSlug={agentSlug}
        title={titleQ}
        onBand={setBand}
        onDesk={setDesk}
        onAgent={setAgentSlug}
        onTitle={setTitleQ}
      />

      <p className="text-[11px] text-zinc-400 leading-relaxed">
        {agentSlug
          ? `${visibleRows[0]?.agent.name || 'One interest'} — ${visibleRows[0]?.agent.watches || ''}`
          : `${visibleRows.length} feeds on this desk. Scan the list; do not hunt headlines here.`}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4 md:p-5 space-y-4 min-h-[28rem]">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
            <h3 className="text-xl font-serif italic font-black text-white">Feed list</h3>
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
              {visibleRows.length} rows
            </span>
          </div>
          <div className="space-y-3">
            {visibleRows.map((row) => (
              <FeedListRow
                key={row.agent.slug}
                row={row}
                actionFor={(src) =>
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
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#39ff14]/25 bg-black/20 p-4 md:p-5 space-y-4 min-h-[28rem] shadow-[0_0_40px_rgba(57,255,20,0.06)]">
          <div className="flex items-center justify-between gap-2 border-b border-[#39ff14]/20 pb-3">
            <h3 className="text-xl font-serif italic font-black text-white">Your feed list</h3>
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
              {favCards.length} saved
            </span>
          </div>
          <AddFavoriteForm onAdd={add} />
          {favCards.length === 0 ? (
            <p className="text-xs text-zinc-500 leading-relaxed">
              Your list is empty until you add a title from Hub 2 or paste an https homepage here.
            </p>
          ) : (
            <div className="space-y-3">
              {favCards.map((fav) => (
                <FavoriteCard key={fav.id} fav={fav} onRemove={() => remove(fav.id)} />
              ))}
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
