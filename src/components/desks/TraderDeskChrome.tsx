import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  DESK_CHARTS_ANCHOR,
  FX_SESSIONS,
  TRADER_DESKS,
  isSessionOpen,
  navigateToDesk,
  readDeskDisclaimerDismissed,
  rememberDeskDisclaimerDismissed,
  type TraderDeskId,
} from '../../lib/traderDesks';
import { DESK_DISCLAIMER } from '../../content/traderDesksCopy';
import { useDeskAppearance } from './DeskAppearanceContext';

type Props = {
  active: TraderDeskId;
};

function utcHourFrom(date: Date): number {
  return date.getUTCHours();
}

function deskButtonLabel(id: TraderDeskId): string {
  if (id === 'neurodivergent') return 'Neurodivergent UI';
  return TRADER_DESKS[id].title.replace(' Traders', '').replace(' Trader', '');
}

function scrollToDeskCharts() {
  if (typeof document === 'undefined') return;
  document.getElementById(DESK_CHARTS_ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function TraderDeskChrome({ active }: Props) {
  const meta = TRADER_DESKS[active];
  const { paper, togglePaper } = useDeskAppearance();
  const [now, setNow] = useState(() => new Date());
  const [disclaimerOpen, setDisclaimerOpen] = useState(() => !readDeskDisclaimerDismissed());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hour = utcHourFrom(now);
  const utcStamp = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const dismissDisclaimer = () => {
    setDisclaimerOpen(false);
    rememberDeskDisclaimerDismissed();
    window.requestAnimationFrame(scrollToDeskCharts);
  };

  const onDeskClick = (id: TraderDeskId) => {
    if (id === 'neurodivergent' && active === 'neurodivergent') {
      scrollToDeskCharts();
      return;
    }
    navigateToDesk(id);
    if (id === 'neurodivergent') {
      window.requestAnimationFrame(scrollToDeskCharts);
    }
  };

  return (
    <header className="relative z-20 shrink-0 border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="/"
            className="shrink-0 text-sm font-black uppercase tracking-[0.18em] text-zinc-400 hover:text-white"
          >
            ClearPath
          </a>
          <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden="true" />
          <div className="hidden min-w-0 sm:block">
            <p
              className="truncate text-base font-black uppercase tracking-widest"
              style={{ color: meta.accent }}
            >
              {active === 'institutional'
                ? 'ClearPath Institutional'
                : active === 'fundamental'
                  ? 'ClearPath Fundamental'
                  : active === 'retail'
                    ? 'Retail Market'
                    : active === 'neurodivergent'
                      ? 'Neurodivergent UI'
                      : meta.title}
            </p>
            <p className="truncate font-mono text-sm font-bold uppercase tracking-wider text-zinc-500">
              {active === 'institutional'
                ? 'See the market system'
                : active === 'fundamental'
                  ? 'Understand the business'
                  : active === 'neurodivergent'
                    ? 'Live trading charts'
                    : meta.tagline}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="hidden font-mono text-sm font-bold tabular-nums text-zinc-300 sm:block">{utcStamp}</p>
          <p className="font-mono text-[11px] font-bold tabular-nums text-zinc-300 sm:hidden">
            {utcStamp.slice(11, 19)}
          </p>
          <button
            type="button"
            onClick={togglePaper}
            aria-pressed={paper === 'white'}
            className="rounded-md border px-3 py-1.5 text-sm font-extrabold uppercase tracking-wide"
            style={{
              color: paper === 'white' ? '#111111' : '#ffffff',
              borderColor: paper === 'white' ? 'rgba(17,17,17,0.35)' : 'rgba(255,255,255,0.35)',
              background: paper === 'white' ? '#ffffff' : 'transparent',
            }}
          >
            {paper === 'white' ? 'Dark screen' : 'White screen'}
          </button>
        </div>
      </div>

      <nav
        aria-label="Trader desks"
        className="flex flex-nowrap gap-1 overflow-x-auto border-t border-white/5 px-2 py-1.5"
      >
        {(Object.keys(TRADER_DESKS) as TraderDeskId[]).map((id) => {
          const desk = TRADER_DESKS[id];
          const on = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onDeskClick(id)}
              aria-current={on ? 'page' : undefined}
              className="shrink-0 rounded-md border px-2.5 py-1.5 text-sm font-extrabold uppercase tracking-widest"
              style={{
                color: on ? '#fff' : desk.accent,
                borderColor: on ? desk.accent : `${desk.accent}55`,
                background: on ? `${desk.accent}33` : 'transparent',
              }}
            >
              {deskButtonLabel(id)}
            </button>
          );
        })}
        <a
          href="/"
          className="ml-auto shrink-0 rounded-md border border-white/15 px-2.5 py-1.5 text-sm font-extrabold uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          Home
        </a>
      </nav>

      {active === 'institutional' ? (
      <div
        className="flex flex-wrap items-center gap-2 border-t border-white/5 px-3 py-1.5"
        aria-label="FX sessions"
      >
        {FX_SESSIONS.map((session) => {
          const open = isSessionOpen(hour, session.utcStart, session.utcEnd);
          return (
            <span
              key={session.id}
              className="inline-flex items-center gap-1.5 font-mono text-sm font-bold uppercase tracking-widest"
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
      ) : null}

      {disclaimerOpen ? (
        <div
          role="region"
          aria-labelledby="desk-disclaimer-label"
          className="relative z-30 flex items-start gap-2 border-t border-white/10 bg-zinc-950 px-3 py-2"
        >
          <p
            id="desk-disclaimer-label"
            className="min-w-0 flex-1 font-mono text-sm font-bold uppercase leading-snug tracking-wider text-zinc-500"
          >
            {DESK_DISCLAIMER}
          </p>
          <button
            type="button"
            onClick={dismissDisclaimer}
            aria-label="Dismiss educational disclaimer"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/25 text-zinc-200 hover:border-white hover:text-white"
          >
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      ) : null}
    </header>
  );
}
