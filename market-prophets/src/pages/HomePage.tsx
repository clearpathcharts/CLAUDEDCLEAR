import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { fetchLatestBrief } from "../api";
import type { MarketBrief } from "../types";
import { SubscribeBlock } from "../components/SubscribeBlock";

export function HomePage() {
  const [brief, setBrief] = useState<MarketBrief | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestBrief()
      .then(setBrief)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      <section className="space-y-4 text-center pt-4">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-violet-400">marketprophets.io</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Today&apos;s market, <span className="text-violet-400">decoded</span>
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
          A calm daily brief built from public macro, policy, and market headlines — written for traders who want signal
          without the noise.
        </p>
      </section>

      <SubscribeBlock />

      <section className="mp-glow rounded-2xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">Latest edition</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : brief ? (
          <div className="space-y-3">
            <p className="text-xs font-mono text-violet-300/70">{brief.editionDate}</p>
            <h3 className="text-xl font-semibold text-white">{brief.headline}</h3>
            <p className="text-zinc-400 leading-relaxed line-clamp-3">{brief.summary}</p>
            <Link
              to={`/brief/${brief.editionDate}`}
              className="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200 font-medium"
            >
              Read full brief <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3 text-zinc-400 text-sm">
            <p>No edition published yet. The first brief generates when the daily cron runs — or trigger it manually:</p>
            <code className="block bg-black/60 rounded-lg p-3 text-xs text-zinc-500 overflow-x-auto">
              curl -X POST https://marketprophets.io/api/brief/generate -H &quot;X-Brief-Secret: YOUR_SECRET&quot;
            </code>
          </div>
        )}
      </section>
    </div>
  );
}
