import React, { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import {
  HUB_TRANSLATE_LANGS,
  googleTranslatePageUrl,
  type HubTranslateLang,
} from '../../lib/ywc/publicationHub';

type Props = {
  pageUrl: string;
  storyId?: string;
  title?: string;
  snippet?: string;
};

export function PublicationTranslator({ pageUrl, storyId, title = '', snippet = '' }: Props) {
  const [lang, setLang] = useState<HubTranslateLang>('en');
  const [viewTitle, setViewTitle] = useState(title);
  const [viewSnippet, setViewSnippet] = useState(snippet);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setViewTitle(title);
    setViewSnippet(snippet);
  }, [title, snippet]);

  useEffect(() => {
    if (!storyId || lang === 'en') {
      setViewTitle(title);
      setViewSnippet(snippet);
      return;
    }
    let cancelled = false;
    setBusy(true);
    void fetch('/api/ywc/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyId, lang }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { title?: string; snippet?: string };
      })
      .then((data) => {
        if (cancelled || !data) return;
        if (typeof data.title === 'string') setViewTitle(data.title);
        if (typeof data.snippet === 'string') setViewSnippet(data.snippet);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storyId, lang, title, snippet]);

  const translatedPage = googleTranslatePageUrl(pageUrl, lang);

  return (
    <div className="space-y-2">
      {(viewTitle || viewSnippet) && lang !== 'en' ? (
        <div className="rounded-xl border border-cyan-400/20 bg-black/40 p-3 space-y-1">
          {viewTitle ? (
            <p className="text-sm font-serif italic text-white leading-snug">{viewTitle}</p>
          ) : null}
          {viewSnippet ? (
            <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">{viewSnippet}</p>
          ) : null}
          {busy ? (
            <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Translating…</p>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-zinc-400">
          <Languages size={12} className="text-[#00f0ff]" />
          Translator
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as HubTranslateLang)}
            className="bg-black/70 border border-white/15 rounded-lg px-2 py-1 text-[10px] text-white normal-case tracking-normal"
            aria-label="Translate this publication"
          >
            {HUB_TRANSLATE_LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <a
          href={translatedPage}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono uppercase tracking-widest text-[#00f0ff] hover:text-[#ff0088]"
        >
          {lang === 'en' ? 'Open page' : 'Open translated page'}
        </a>
      </div>
    </div>
  );
}
