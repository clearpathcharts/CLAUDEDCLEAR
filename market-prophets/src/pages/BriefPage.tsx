import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { fetchBrief, fetchLatestBrief } from "../api";
import { BriefView } from "../components/BriefView";
import type { MarketBrief } from "../types";

export function BriefPage() {
  const { date } = useParams<{ date: string }>();
  const [brief, setBrief] = useState<MarketBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setError(null);
    const load = date === "latest" ? fetchLatestBrief() : fetchBrief(date);
    load
      .then((b) => {
        if (!b) setError("Edition not found.");
        else setBrief(b);
      })
      .catch(() => setError("Failed to load brief."))
      .finally(() => setLoading(false));
  }, [date]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-20 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading edition…
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-zinc-400">{error ?? "Not found"}</p>
        <Link to="/" className="text-violet-300 hover:underline text-sm">
          ← Back home
        </Link>
      </div>
    );
  }

  return <BriefView brief={brief} />;
}
