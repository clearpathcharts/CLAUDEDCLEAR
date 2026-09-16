import React from 'react';
import { definitionFor } from '../../fundamental/metricDefinitions';

export function DataRibbon({
  status,
  label,
}: {
  status: 'live' | 'delayed' | 'unavailable' | 'unconfigured';
  label?: string;
}) {
  const text =
    status === 'live'
      ? label || 'LIVE VENDOR DATA'
      : status === 'delayed'
        ? 'DATA DELAYED'
        : status === 'unconfigured'
          ? 'DATA UNAVAILABLE'
          : 'DATA UNAVAILABLE';
  const color =
    status === 'live' ? 'text-cyan-300 border-cyan-500/30' : 'text-amber-200 border-amber-500/30';
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest ${color}`}>
      {text}
    </span>
  );
}

export function Panel({
  id,
  title,
  children,
  source,
  period,
  reported,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  source?: string;
  period?: string;
  reported?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-xl border border-white/10 bg-[#0b0e13]/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">{title}</h3>
        <div className="flex flex-wrap gap-3 font-mono text-[8px] uppercase tracking-wider text-zinc-500">
          {source ? <span>Source {source}</span> : null}
          {period ? <span>Period {period}</span> : null}
          {reported ? <span>Reported {reported}</span> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  defKey,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  defKey?: string;
  sub?: string;
}) {
  const def = defKey ? definitionFor(defKey) : null;
  return (
    <div className="min-w-0 rounded-lg border border-white/5 bg-black/40 px-3 py-2">
      <div className="flex items-center gap-1">
        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
        {def ? (
          <span className="group relative cursor-help text-[9px] text-indigo-300" title={`${def.title}: ${def.body}`}>
            ⓘ
          </span>
        ) : null}
      </div>
      <p className="truncate font-mono text-sm tabular-nums text-white">{value}</p>
      {sub ? <p className="mt-0.5 font-mono text-[8px] uppercase text-zinc-600">{sub}</p> : null}
    </div>
  );
}

export function Unavailable({ message = 'DATA UNAVAILABLE' }: { message?: string }) {
  return (
    <div className="fund-empty py-2" role="status">
      <div className="fund-empty-bars" aria-hidden="true">
        <i style={{ height: '34%' }} />
        <i style={{ height: '58%' }} />
        <i style={{ height: '42%' }} />
        <i style={{ height: '70%' }} />
        <i style={{ height: '48%' }} />
      </div>
      <p>{message}</p>
    </div>
  );
}

export function FinTable({
  columns,
  rows,
  format,
}: {
  columns: string[];
  rows: { label: string; values: Array<number | null> }[];
  format: (n: number | null) => string;
}) {
  const colCount = Math.max(1, columns.length);
  return (
    <div className="max-h-[320px] overflow-auto">
      <table className="w-full min-w-[520px] border-collapse font-mono text-[10px] tabular-nums">
        <thead className="sticky top-0 bg-[#0b0e13]">
          <tr>
            <th className="px-2 py-1.5 text-left text-[8px] font-black uppercase tracking-widest text-zinc-500">Line</th>
            {columns.map((c) => (
              <th key={c} className="px-2 py-1.5 text-right text-[8px] font-black uppercase tracking-widest text-zinc-500">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-white/5">
              <td className="px-2 py-1 text-left text-zinc-300">{row.label}</td>
              {Array.from({ length: colCount }).map((_, i) => (
                <td key={i} className="px-2 py-1 text-right text-cyan-50">
                  {format(row.values[i] ?? null)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Tone({ value, children }: { value: number | null; children: React.ReactNode }) {
  const cls =
    value == null ? 'text-zinc-400' : value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-zinc-300';
  return <span className={cls}>{children}</span>;
}
