import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const chartTip = {
  contentStyle: { background: '#121316', border: '1px solid #3a342c', fontSize: 11, color: '#e8e4db' },
};

export function CompactEmpty({ hint = 'Awaiting vendor series' }: { hint?: string }) {
  return (
    <div className="fund-empty" role="status">
      <div className="fund-empty-bars" aria-hidden="true">
        <i style={{ height: '38%' }} />
        <i style={{ height: '62%' }} />
        <i style={{ height: '44%' }} />
        <i style={{ height: '78%' }} />
        <i style={{ height: '52%' }} />
      </div>
      <p>{hint}</p>
    </div>
  );
}

export function Bento({
  id,
  kicker,
  title,
  span,
  primary,
  primaryLabel,
  source,
  period,
  children,
  onExpand,
  expanded,
}: {
  id: string;
  kicker?: string;
  title: string;
  span: 3 | 4 | 5 | 6 | 7 | 8 | 12;
  primary?: React.ReactNode;
  primaryLabel?: string;
  source?: string;
  period?: string;
  children: React.ReactNode;
  onExpand?: () => void;
  expanded?: boolean;
}) {
  return (
    <article id={id} className={`fund-card fund-span-${span}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          {kicker ? <p className="fund-kicker">{kicker}</p> : null}
          <h3>{title}</h3>
        </div>
        {onExpand ? (
          <button
            type="button"
            onClick={onExpand}
            className="fund-mono shrink-0 text-[10px] uppercase tracking-widest text-[#c49558]"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        ) : null}
      </div>
      {primary != null ? (
        <div className="mb-2">
          {primaryLabel ? <p className="fund-kicker">{primaryLabel}</p> : null}
          <p className="fund-primary">{primary}</p>
        </div>
      ) : null}
      <div className="min-h-0 flex-1">{children}</div>
      <div className="fund-mono mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[9px] uppercase tracking-widest text-[#6f6a60]">
        {source ? <span>Source {source}</span> : null}
        {period ? <span>{period}</span> : null}
      </div>
    </article>
  );
}

export function MarginMeter({ label, pct }: { label: string; pct: number | null }) {
  const w = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <div className="fund-meter fund-sans">
      <span className="uppercase tracking-wider text-[#9a9588]">{label}</span>
      <div className="fund-meter-track" aria-hidden="true">
        <div className="fund-meter-fill" style={{ width: pct == null ? '8%' : `${w}%`, opacity: pct == null ? 0.25 : 1 }} />
      </div>
      <span className="fund-mono text-right tabular-nums">
        {pct == null ? '—' : `${pct.toFixed(1)}%`}
      </span>
    </div>
  );
}

export function MixBars({
  rows,
}: {
  rows: { label: string; pct: number | null }[];
}) {
  if (!rows.length) return <CompactEmpty hint="No disclosed mix" />;
  return (
    <div>
      {rows.map((r) => (
        <MarginMeter key={r.label} label={r.label} pct={r.pct} />
      ))}
    </div>
  );
}

export function SparkLine({
  data,
  color = '#c49558',
}: {
  data: { label: string; value: number | null }[];
  color?: string;
}) {
  const clean = data.filter((d) => d.value != null);
  if (!clean.length) return <CompactEmpty />;
  return (
    <div className="h-[112px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <LineChart data={clean}>
          <CartesianGrid stroke="rgba(232,228,219,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#6f6a60', fontSize: 10 }} />
          <YAxis tick={{ fill: '#6f6a60', fontSize: 10 }} width={44} />
          <Tooltip {...chartTip} />
          <Line type="monotone" dataKey="value" stroke={color} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SparkBars({
  data,
  color = '#c49558',
}: {
  data: { label: string; value: number | null }[];
  color?: string;
}) {
  const clean = data.filter((d) => d.value != null);
  if (!clean.length) return <CompactEmpty />;
  return (
    <div className="h-[112px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={clean}>
          <CartesianGrid stroke="rgba(232,228,219,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#6f6a60', fontSize: 10 }} />
          <YAxis tick={{ fill: '#6f6a60', fontSize: 10 }} width={44} />
          <Tooltip {...chartTip} />
          <Bar dataKey="value" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DualDotChart({
  data,
}: {
  data: { label: string; actual: number | null; estimate: number | null }[];
}) {
  const clean = data.filter((d) => d.actual != null || d.estimate != null);
  if (!clean.length) return <CompactEmpty hint="No estimate vs actual series" />;
  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <LineChart data={clean}>
          <CartesianGrid stroke="rgba(232,228,219,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#6f6a60', fontSize: 10 }} />
          <YAxis tick={{ fill: '#6f6a60', fontSize: 10 }} width={40} />
          <Tooltip {...chartTip} />
          <Line type="monotone" dataKey="actual" stroke="#c49558" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="estimate" stroke="#8a8478" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HistRange({
  low,
  high,
  current,
}: {
  low: number | null;
  high: number | null;
  current: number | null;
}) {
  if (low == null || high == null || current == null || high === low) {
    return <CompactEmpty hint="Historical range unavailable" />;
  }
  const pos = ((current - low) / (high - low)) * 100;
  return (
    <div>
      <p className="fund-kicker">Historical range</p>
      <div className="fund-range" aria-hidden="true">
        <div className="fund-range-mark" style={{ left: `${Math.max(0, Math.min(100, pos))}%` }} />
      </div>
      <div className="fund-mono flex justify-between text-[10px] uppercase text-[#9a9588]">
        <span>Low {low.toFixed(1)}</span>
        <span>Current {current.toFixed(1)}</span>
        <span>High {high.toFixed(1)}</span>
      </div>
    </div>
  );
}

export function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[rgba(232,228,219,0.06)] py-1.5">
      <span className="fund-sans text-[11px] uppercase tracking-wider text-[#9a9588]">{label}</span>
      <span className="fund-mono text-[13px] tabular-nums text-[#f4efe4]">{value}</span>
    </div>
  );
}

export function ExposureDot({
  label,
  band,
  note,
}: {
  label: string;
  band: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  note: string;
}) {
  const color = band === 'HIGH' ? '#c45c4a' : band === 'MEDIUM' ? '#c49558' : band === 'LOW' ? '#7d9a6e' : '#6f6a60';
  return (
    <div className="mb-2" title={note}>
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="fund-sans text-[12px] uppercase tracking-wider">{label}</span>
        <span className="fund-mono ml-auto text-[11px] tracking-widest" style={{ color }}>
          {band || 'UNMAPPED'}
        </span>
      </div>
      <p className="fund-mono mt-0.5 pl-4 text-[9px] leading-snug text-[#6f6a60]">{note}</p>
    </div>
  );
}
