"use client";

import type { PatternHit } from "@/lib/patternScatter";

type Props = {
  symbol: string;
  hits: PatternHit[];
  enabled: boolean;
  onToggle: (next: boolean) => void;
  loading?: boolean;
};

export function PatternScannerBento({
  symbol,
  hits,
  enabled,
  onToggle,
  loading = false,
}: Props) {
  return (
    <section className="bento scanner-bento" data-bento="scanner" aria-label="Pattern Scanner">
      <header className="bento-head">
        <div>
          <h2>Pattern Scanner</h2>
          <p className="bento-sub">
            Live pattern scatter · {symbol}
            {loading ? " · scanning…" : ""}
          </p>
        </div>
        <button
          type="button"
          className={`bento-toggle${enabled ? " on" : ""}`}
          aria-pressed={enabled}
          onClick={() => onToggle(!enabled)}
        >
          {enabled ? "Scatter on" : "Scatter off"}
        </button>
      </header>

      {!enabled ? (
        <p className="bento-empty">
          Turn scatter on to draw pattern hits on the chart for every desk
          (Institutional, Fundamental, Retail, Neurodivergent).
        </p>
      ) : hits.length === 0 ? (
        <p className="bento-empty">
          {loading
            ? "Waiting on candles…"
            : "No scatter hits on this window yet — try another symbol or wait for structure."}
        </p>
      ) : (
        <ul className="scanner-hits">
          {hits
            .slice()
            .reverse()
            .map((hit) => (
              <li key={hit.id} data-group={hit.group} data-direction={hit.direction}>
                <strong>{hit.label}</strong>
                <span>
                  {hit.group} · {hit.direction}
                  {typeof hit.endIndex === "number" ? ` · bars ${hit.index}–${hit.endIndex}` : ` · bar ${hit.index}`}
                </span>
              </li>
            ))}
        </ul>
      )}
      <p className="bento-note">
        Educational overlay for board demos. Full River / HUD engine stays on clearpathtrader.com.
      </p>
    </section>
  );
}
