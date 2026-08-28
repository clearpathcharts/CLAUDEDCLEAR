import React from "react";

export function Sparkline({
  points,
  color = "#c4a574",
}: {
  points: Array<{ label: string; value: number }>;
  color?: string;
}) {
  if (points.length < 2) {
    return (
      <div className="fr-ghost-spark" aria-hidden>
        <span style={{ height: "28%" }} />
        <span style={{ height: "42%" }} />
        <span style={{ height: "36%" }} />
        <span style={{ height: "58%" }} />
        <span style={{ height: "70%" }} />
      </div>
    );
  }
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const w = 240;
  const h = 78;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - 8 - ((p.value - min) / span) * (h - 18);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[78px]" role="img" aria-label="Historical series">
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
      {points.map((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - 8 - ((p.value - min) / span) * (h - 18);
        return <circle key={p.label + i} cx={x} cy={y} r="2.2" fill={color} />;
      })}
    </svg>
  );
}

export function YearLabels({ points }: { points: Array<{ label: string }> }) {
  if (!points.length) {
    return <div className="fr-empty">Series unavailable</div>;
  }
  return (
    <div className="flex justify-between fr-faint fr-mono text-[9px] tracking-widest uppercase">
      {points.map((p) => (
        <span key={p.label}>{p.label.replace(/^20/, "’")}</span>
      ))}
    </div>
  );
}

export function MarginBar({ label, value }: { label: string; value: number | null }) {
  const pct = value === null ? null : Math.abs(value) <= 1.5 ? value * 100 : value;
  const width = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <div className="mb-3">
      <div className="fr-row" style={{ border: 0, paddingBottom: 4 }}>
        <span className="fr-label">{label}</span>
        <span className="fr-val">{pct === null ? "—" : `${pct.toFixed(1)}%`}</span>
      </div>
      <div className="fr-bar-track">
        <div className="fr-bar-fill" style={{ width: `${width}%`, opacity: pct === null ? 0.18 : 1 }} />
      </div>
    </div>
  );
}

export function RangeTrack({
  low,
  high,
  current,
}: {
  low: number;
  high: number;
  current: number;
}) {
  const span = high - low || 1;
  const pos = Math.max(0, Math.min(100, ((current - low) / span) * 100));
  return (
    <div>
      <div className="relative h-2 bg-white/[0.08] mt-2 mb-2">
        <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#c4a574]" style={{ left: `calc(${pos}% - 4px)` }} />
      </div>
      <div className="flex justify-between fr-mono text-[10px] text-[#9a9186]">
        <span>{low.toFixed(1)}</span>
        <span>{current.toFixed(1)}</span>
        <span>{high.toFixed(1)}</span>
      </div>
    </div>
  );
}

export function SegmentTree({
  name,
  segments,
}: {
  name: string;
  segments: Array<{ label: string; pct: number | null }>;
}) {
  const rows = segments.length ? segments : [
    { label: "Product / segment mix", pct: null },
    { label: "Secondary line", pct: null },
    { label: "Other", pct: null },
  ];
  return (
    <div className="flex flex-col items-center text-center py-2">
      <div className="fr-mono text-[11px] tracking-[0.2em] uppercase text-[#c4a574]">{name}</div>
      <div className="w-px h-4 bg-white/20" />
      <div className="grid grid-cols-3 gap-3 w-full">
        {rows.slice(0, 3).map((seg) => (
          <div key={seg.label} className="border-t border-white/15 pt-2">
            <div className="fr-label" style={{ letterSpacing: "0.08em" }}>{seg.label}</div>
            <div className="fr-val mt-1">{seg.pct === null ? "—" : `${seg.pct.toFixed(0)}%`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="fr-row">
      <span className="fr-label">{label}</span>
      <span className="fr-val">{value}</span>
    </div>
  );
}
