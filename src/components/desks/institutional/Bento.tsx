import React from 'react';
import { X } from 'lucide-react';
import { useDeskHold } from '../DeskHoldScope';

export function Bento({
  title,
  status,
  expanded,
  onToggle,
  onExpand,
  children,
  className = '',
  collapsedSummary,
  holdId,
}: {
  title: string;
  status?: string;
  expanded?: boolean;
  onToggle?: () => void;
  onExpand?: () => void;
  children: React.ReactNode;
  className?: string;
  collapsedSummary?: React.ReactNode;
  holdId?: string;
}) {
  const holdApi = useDeskHold();
  if (holdId && holdApi?.isHeld(holdId)) return null;

  const open = expanded !== false;
  return (
    <section
      data-retail-bento={className.includes('retail-bento') ? 'true' : undefined}
      data-hold-id={holdId}
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--desk-border)] bg-[var(--desk-panel)] ${className}`}
    >
      {holdId && holdApi ? (
        <button
          type="button"
          className="rt-bento-x"
          aria-label={`Hold ${title} in the file`}
          title="Hold in file — chart uses this space"
          onClick={() => holdApi.hold(holdId)}
        >
          <X size={11} strokeWidth={2.75} aria-hidden="true" />
        </button>
      ) : null}
      <header className={`flex shrink-0 items-center gap-2 border-b border-[var(--desk-border)] px-2.5 py-1.5 ${holdId ? 'pr-8' : ''}`}>
        <h3 className="min-w-0 flex-1 truncate text-[10px] font-black uppercase tracking-[0.16em] text-[var(--desk-cyan)]">
          {title}
        </h3>
        {status ? (
          <span className="shrink-0 text-[8px] font-bold uppercase tracking-wider text-[var(--desk-muted)]">
            {status}
          </span>
        ) : null}
        {onExpand ? (
          <button
            type="button"
            onClick={onExpand}
            className="shrink-0 text-[8px] font-black uppercase tracking-wider text-[var(--desk-indigo)] hover:text-[var(--desk-cyan)]"
          >
            Expand
          </button>
        ) : null}
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 text-[8px] font-black uppercase tracking-wider text-[var(--desk-muted)] hover:text-[var(--desk-text)]"
          >
            {open ? 'Collapse' : 'Open'}
          </button>
        ) : null}
      </header>
      {open ? (
        <div className="retail-bento-body min-h-0 flex-1 overflow-auto p-2">{children}</div>
      ) : (
        <div className="px-2.5 py-1.5 text-[10px] text-[var(--desk-muted)]">{collapsedSummary ?? 'Collapsed'}</div>
      )}
    </section>
  );
}

export function Unavail({ label = 'DATA UNAVAILABLE' }: { label?: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">{label}</p>
  );
}

export function KV({ k, v, accent }: { k: string; v: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--desk-muted)]">{k}</span>
      <span className={`font-mono text-[11px] font-semibold tabular-nums ${accent ?? 'text-[var(--desk-text)]'}`}>
        {v}
      </span>
    </div>
  );
}

export function Bar({ pct, color }: { pct: number; color: string }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
      <div className={`h-full ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
}
