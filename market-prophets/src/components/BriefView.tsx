import type { MarketBrief } from "../types";
import { format, parseISO } from "date-fns";
import { Calendar, ExternalLink, Eye } from "lucide-react";

export function BriefView({ brief }: { brief: MarketBrief }) {
  const published = (() => {
    try {
      return format(parseISO(brief.generatedAt), "MMMM d, yyyy · h:mm a");
    } catch {
      return brief.editionDate;
    }
  })();

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-violet-300/80 uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5" />
          <span>{brief.editionDate}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500 normal-case">{published}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">{brief.headline}</h1>
        <p className="text-lg text-zinc-300 leading-relaxed">{brief.summary}</p>
      </header>

      <section className="mp-glow rounded-2xl border border-white/10 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-widest text-violet-400">Headlines</h2>
        <ul className="space-y-3">
          {brief.bullets.map((bullet, i) => (
            <li key={i} className="flex gap-3 text-zinc-200 leading-relaxed">
              <span className="text-violet-500 font-mono text-sm shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Trader lens
        </h2>
        <p className="text-zinc-300 leading-relaxed">{brief.traderLens}</p>
      </section>

      {brief.watchToday.length > 0 && (
        <section className="rounded-xl border border-dashed border-violet-500/30 bg-violet-950/20 p-5 space-y-2">
          <h2 className="text-sm font-mono uppercase tracking-widest text-violet-300">Watch today</h2>
          <ul className="list-disc list-inside text-zinc-300 space-y-1">
            {brief.watchToday.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 pt-4 border-t border-white/5">
        <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">Sources</h2>
        <ul className="space-y-2">
          {brief.sources.map((s, i) => (
            <li key={i}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 text-sm text-zinc-400 hover:text-violet-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60 group-hover:opacity-100" />
                <span>
                  <span className="text-zinc-500 font-mono text-xs">{s.source} · </span>
                  {s.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-zinc-600 italic">AI-assisted editorial. Facts are drawn from linked public sources.</p>
    </article>
  );
}
