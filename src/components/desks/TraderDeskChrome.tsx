import React, { useEffect, useState } from 'react';
import {
  CEO_DASHBOARD_HREF,
  FX_SESSIONS,
  TRADER_DESKS,
  goHomeFromDesk,
  isSessionOpen,
  navigateToDesk,
  type TraderDeskId,
} from '../../lib/traderDesks';
import { useFounderAccess } from '../../hooks/useFounderAccess';
import { DESK_DISCLAIMER } from '../../content/traderDesksCopy';
import BrokerDeskChip from '../broker/BrokerDeskChip';
import { useDeskAppearance } from './DeskAppearanceContext';
import { clampOpacity } from '../../lib/deskColorChart';
import ColorChartPicker from './ColorChartPicker';
import DeskScreensMenu from './DeskScreensMenu';
import { DESK_SCREEN_PANE_LABEL, type DeskScreenPane } from '../../lib/deskMonitorTree';

type Props = {
  active: TraderDeskId;
  satellitePane?: DeskScreenPane | null;
};

function utcHourFrom(date: Date): number {
  return date.getUTCHours();
}

export default function TraderDeskChrome({ active, satellitePane = null }: Props) {
  const meta = TRADER_DESKS[active];
  const {
    paper,
    togglePaper,
    pickerOpen,
    setPickerOpen,
    target,
    setTarget,
    overrides,
    recents,
    applyColor,
    setOpacity,
    resetVisual,
    saveDesk,
    saveAllDesks,
    discardDraft,
    isDirty,
    savedAt,
    lastSaveScope,
  } = useDeskAppearance();
  const { founder } = useFounderAccess();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hour = utcHourFrom(now);
  const utcStamp = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const homeHref = TRADER_DESKS.institutional.href;
  const onHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Plain left-click stays in-app (no document reload, no auth re-hydration flash).
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    goHomeFromDesk();
  };
  return (
    <header className="sticky top-0 z-[100] shrink-0 border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href={homeHref}
            onClick={onHome}
            className="text-sm font-black uppercase tracking-[0.18em] text-zinc-400 hover:text-white"
          >
            ClearPath
          </a>
          <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <p
              className="truncate text-base font-black uppercase tracking-widest"
              style={{ color: meta.accent }}
            >
              {active === 'institutional'
                ? 'ClearPath Institutional'
                : active === 'fundamental'
                  ? 'ClearPath Fundamental'
                  : active === 'neurodivergent'
                    ? 'ClearPath Neurodivergent'
                    : meta.title}
            </p>
            <p className="truncate font-mono text-sm font-bold uppercase tracking-wider text-zinc-500">
              {satellitePane
                ? `Satellite · ${DESK_SCREEN_PANE_LABEL[satellitePane]}`
                : active === 'institutional'
                  ? 'Market Intelligence Platform'
                  : active === 'fundamental'
                    ? 'Equity Research Workstation'
                    : active === 'neurodivergent'
                      ? 'Calm retail + crypto · sensory UI'
                      : meta.tagline}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BrokerDeskChip />
          <p className="font-mono text-sm font-bold tabular-nums text-zinc-300">{utcStamp}</p>
          <DeskScreensMenu deskId={active} accent={meta.accent} paper={paper} />
          <button
            type="button"
            onClick={() => setPickerOpen(!pickerOpen)}
            aria-pressed={pickerOpen}
            data-color-chart-toggle
            className="rounded-md border px-3 py-1.5 text-sm font-extrabold uppercase tracking-wide"
            style={{
              color: pickerOpen ? '#fff' : paper === 'white' ? '#111111' : '#ffffff',
              borderColor: pickerOpen ? meta.accent : paper === 'white' ? 'rgba(17,17,17,0.35)' : 'rgba(255,255,255,0.35)',
              background: pickerOpen ? `${meta.accent}44` : 'transparent',
            }}
          >
            Colors
          </button>
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
              className="rounded-md border px-2.5 py-1.5 text-sm font-extrabold uppercase tracking-widest"
              style={{
                color: on ? '#fff' : desk.accent,
                borderColor: on ? desk.accent : `${desk.accent}55`,
                background: on ? `${desk.accent}33` : 'transparent',
              }}
            >
              {desk.title.replace(' Traders', '').replace(' Trader', '')}
            </button>
          );
        })}
        {founder ? (
          <a
            href={CEO_DASHBOARD_HREF}
            data-ceo-ops-link
            className="ml-auto rounded-md border px-2.5 py-1.5 text-sm font-extrabold uppercase tracking-widest"
            style={{ color: '#FF2E9A', borderColor: '#FF2E9A88', background: '#FF2E9A1a' }}
            title="CEO Dashboard — founder only"
          >
            CEO
          </a>
        ) : null}
        <a
          href={homeHref}
          onClick={onHome}
          data-desk-home
          className={`${founder ? '' : 'ml-auto '}rounded-md border border-white/15 px-2.5 py-1.5 text-sm font-extrabold uppercase tracking-widest text-zinc-400 hover:text-white`}
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
      <p className="px-3 pb-2 font-mono text-sm font-bold uppercase tracking-wider text-zinc-600">
        {DESK_DISCLAIMER}
      </p>
      {pickerOpen ? (
        <ColorChartPicker
          target={target}
          onTargetChange={setTarget}
          selected={overrides[target]}
          recents={recents}
          opacity={clampOpacity(overrides.opacity ?? 100)}
          onPick={applyColor}
          onOpacity={setOpacity}
          onReset={resetVisual}
          onSave={saveDesk}
          onSaveAll={saveAllDesks}
          onDiscard={discardDraft}
          isDirty={isDirty}
          savedAt={savedAt}
          lastSaveScope={lastSaveScope}
          overrides={overrides}
          deskLabel={meta.title}
          showPastels={active === 'neurodivergent'}
          noPlotOnDesk={active === 'fundamental'}
        />
      ) : null}
    </header>
  );
}
