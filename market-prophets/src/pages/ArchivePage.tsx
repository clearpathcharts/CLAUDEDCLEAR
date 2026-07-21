import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { fetchArchive } from "../api";
import type { BriefSummary } from "../types";

export function ArchivePage() {
  const [briefs, setBriefs] = useState<BriefSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchive()
      .then(setBriefs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Archive</h1>
        <p className="text-zinc-400 text-sm">Past daily editions — indexed for search engines.</p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : briefs.length === 0 ? (
        <p className="text-zinc-500">No editions yet.</p>
      ) : (
        <ul className="space-y-4">
          {briefs.map((b) => (
            <li key={b.editionDate}>
              <Link
                to={`/brief/${b.editionDate}`}
                className="block mp-glow rounded-xl border border-white/5 bg-zinc-900/30 p-5 hover:border-violet-500/30 transition-colors"
              >
                <p className="text-xs font-mono text-violet-300/70 mb-1">{b.editionDate}</p>
                <h2 className="font-semibold text-white mb-2">{b.headline}</h2>
                <p className="text-sm text-zinc-400 line-clamp-2">{b.summary}</p>
                <p className="text-xs text-zinc-600 mt-2">
                  {(() => {
                    try {
                      return format(parseISO(b.generatedAt), "MMM d, yyyy");
                    } catch {
                      return "";
                    }
                  })()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
