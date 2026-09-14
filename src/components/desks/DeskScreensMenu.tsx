import React, { useEffect, useMemo, useState } from 'react';
import {
  DESK_SCREEN_PANE_LABEL,
  MONITOR_TREE_PRESETS,
  closeDeskSatellites,
  launchDeskPane,
  launchMonitorTree,
  type DeskScreenPane,
  type LaunchMonitorResult,
  type MonitorTreePreset,
} from '../../lib/deskMonitorTree';
import type { TraderDeskId } from '../../lib/traderDesks';

type Props = {
  deskId: TraderDeskId;
  accent: string;
  paper: 'black' | 'white';
};

function resultNote(result: LaunchMonitorResult): string {
  if (result.blocked.length && result.opened.length === 0) {
    return 'Browser blocked the pop-ups. Allow pop-ups for this site, then tap again.';
  }
  if (result.blocked.length) {
    return `Opened ${result.opened.length}. Allow pop-ups to open the rest, then drag each window onto a monitor.`;
  }
  if (result.placedOnOtherScreens) {
    return 'Windows placed on other monitors. Chrome asked for Window Management — that is required to land on screen 2 automatically.';
  }
  if (result.screenCountKnown === 1 || result.screenCountKnown == null) {
    return 'Windows opened on this monitor. Drag each one onto another screen — browsers cannot silently force a window onto monitor 2.';
  }
  return 'Satellite windows opened. Drag any that landed here onto another screen.';
}

export default function DeskScreensMenu({ deskId, accent, paper }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const dark = paper !== 'white';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const run = async (fn: () => Promise<LaunchMonitorResult>) => {
    const result = await fn();
    setNote(resultNote(result));
  };

  const presets = useMemo(
    () =>
      ([2, 3, 4] as MonitorTreePreset[]).map((n) => ({
        n,
        labels: MONITOR_TREE_PRESETS[n].map((p) => DESK_SCREEN_PANE_LABEL[p]).join(' · '),
      })),
    [],
  );

  const panes = Object.keys(DESK_SCREEN_PANE_LABEL) as DeskScreenPane[];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        data-desk-screens-toggle
        className="rounded-md border px-3 py-1.5 text-sm font-extrabold uppercase tracking-wide"
        style={{
          color: open ? '#fff' : dark ? '#ffffff' : '#111111',
          borderColor: open ? accent : dark ? 'rgba(255,255,255,0.35)' : 'rgba(17,17,17,0.35)',
          background: open ? `${accent}44` : 'transparent',
        }}
      >
        Screens
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close screens menu"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            data-desk-screens-menu
            className="absolute right-0 z-50 mt-1 w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-white/15 bg-zinc-950 p-3 shadow-2xl"
          >
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Multi-monitor tree
            </p>
            <div className="flex flex-col gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.n}
                  type="button"
                  role="menuitem"
                  onClick={() => void run(() => launchMonitorTree(deskId, p.n))}
                  className="rounded-md border border-white/15 px-2.5 py-2 text-left text-sm font-extrabold uppercase tracking-wide text-white hover:bg-white/10"
                >
                  {p.n}-screen
                  <span className="mt-0.5 block font-mono text-[10px] font-bold normal-case tracking-wider text-zinc-500">
                    {p.labels}
                  </span>
                </button>
              ))}
            </div>
            <p className="mb-1.5 mt-3 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Pop out one panel
            </p>
            <div className="flex flex-wrap gap-1.5">
              {panes.map((pane) => (
                <button
                  key={pane}
                  type="button"
                  role="menuitem"
                  onClick={() => void run(() => launchDeskPane(deskId, pane))}
                  className="rounded-md border border-white/15 px-2 py-1 text-xs font-extrabold uppercase tracking-wide text-zinc-200 hover:bg-white/10"
                >
                  {DESK_SCREEN_PANE_LABEL[pane]}
                </button>
              ))}
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const n = closeDeskSatellites();
                setNote(n ? `Closed ${n} satellite window${n === 1 ? '' : 's'}.` : 'No satellite windows from this tab.');
              }}
              className="mt-3 w-full rounded-md border border-white/10 px-2.5 py-1.5 text-left text-xs font-extrabold uppercase tracking-wide text-zinc-400 hover:text-white"
            >
              Close satellites opened here
            </button>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-zinc-500">
              Allow pop-ups. Chrome can place windows on other monitors if you permit Window Management;
              otherwise drag each satellite onto a screen.
            </p>
            {note ? (
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-cyan-300" data-desk-screens-note>
                {note}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
