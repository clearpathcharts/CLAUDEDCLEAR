import React, { useEffect, useState } from 'react';
import {
  FX_SESSIONS,
  TRADER_DESKS,
  isSessionOpen,
  navigateToDesk,
  type TraderDeskId,
} from '../../lib/traderDesks';
import { DESK_DISCLAIMER } from '../../content/traderDesksCopy';

type Props = {
  active: TraderDeskId;
};

function utcHourFrom(date: Date): number {
  return date.getUTCHours();
}

export default function TraderDeskChrome({ active }: Props) {
  const meta = TRADER_DESKS[active];
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hour = utcHourFrom(now);
  const utcStamp = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return (
    <header className="shrink-0 border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="/"
            className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 hover:text-white"
          >
            ClearPath
          </a>
          <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <p
              className="truncate text-xs font-black uppercase tracking-widest"
              style={{ color: meta.accent }}
            >
              {meta.title}
            </p>
            <p className="truncate font-mono text-[9px] uppercase tracking-wider text-zinc-500">
              {meta.tagline}
            </p>
          </div>
        </div>
        <p className="font-mono text-[10px] tabular-nums text-zinc-300">{utcStamp}</p>
      </div>

      <nav
        aria-label="Trader desks"
        className="flex flex-wrap gap-1 border-t border-white/5 px-2 py-1.5"
      >
        {(Object.keys(TRADER_DESKS) as TraderDeskId[]).map((id) => {
          const desk = TRADER_DESKS[id];
          const on = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigateToDesk(id)}
              aria-current={on ? 'page' : undefined}
              className="rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
              style={{
                color: on ? '#fff' : desk.accent,
                borderColor: on ? desk.accent : `${desk.accent}55`,
                background: on ? `${desk.accent}33` : 'transparent',
              }}
            >
              {desk.title.replace(' Trader', '').replace(' Traders', '')}
            </button>
          );
        })}
        <a
          href="/"
          className="ml-auto rounded-md border border-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          Home
        </a>
      </nav>

      <div
        className="flex flex-wrap items-center gap-2 border-t border-white/5 px-3 py-1.5"
        aria-label="FX sessions"
      >
        {FX_SESSIONS.map((session) => {
          const open = isSessionOpen(hour, session.utcStart, session.utcEnd);
          return (
            <span
              key={session.id}
              className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                aria-hidden="true"
              />
              <span className={open ? 'text-emerald-300' : 'text-zinc-500'}>
                {session.label} {open ? 'open' : 'closed'}
              </span>
            </span>
          );
        })}
      </div>
      <p className="px-3 pb-2 font-mono text-[8px] uppercase tracking-wider text-zinc-600">
        {DESK_DISCLAIMER}
      </p>
    </header>
  );
}
