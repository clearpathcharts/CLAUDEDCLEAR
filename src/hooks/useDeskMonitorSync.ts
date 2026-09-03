import { useEffect, useRef } from 'react';
import {
  DESK_MONITOR_CHANNEL,
  type DeskMonitorSnapshot,
  writeDeskMonitorSnapshot,
  readDeskMonitorSnapshot,
} from '../lib/deskMonitorTree';
import type { TraderDeskId } from '../lib/traderDesks';

type SetStr = (value: string) => void;

/**
 * Keeps symbol + timeframe in lockstep across the main desk and satellite
 * monitor windows (BroadcastChannel + localStorage).
 */
export function useDeskMonitorSync(
  deskId: TraderDeskId,
  symbol: string,
  timeframe: string,
  setSymbol: SetStr,
  setTimeframe: SetStr,
): void {
  const localRef = useRef({ symbol, timeframe });
  localRef.current = { symbol, timeframe };
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const snap = readDeskMonitorSnapshot(deskId);
    if (!snap) return;
    if (snap.symbol && snap.symbol !== localRef.current.symbol) setSymbol(snap.symbol);
    if (snap.timeframe && snap.timeframe !== localRef.current.timeframe) setTimeframe(snap.timeframe);
  }, [deskId, setSymbol, setTimeframe]);

  useEffect(() => {
    const next: DeskMonitorSnapshot = { deskId, symbol, timeframe, at: Date.now() };
    writeDeskMonitorSnapshot(next);
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      const ch = new BroadcastChannel(DESK_MONITOR_CHANNEL);
      ch.postMessage(next);
      ch.close();
    } catch {
      /* private mode */
    }
  }, [deskId, symbol, timeframe]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    let ch: BroadcastChannel;
    try {
      ch = new BroadcastChannel(DESK_MONITOR_CHANNEL);
    } catch {
      return;
    }
    ch.onmessage = (ev: MessageEvent<DeskMonitorSnapshot>) => {
      const msg = ev.data;
      if (!msg || msg.deskId !== deskId) return;
      if (msg.symbol && msg.symbol !== localRef.current.symbol) setSymbol(msg.symbol);
      if (msg.timeframe && msg.timeframe !== localRef.current.timeframe) setTimeframe(msg.timeframe);
    };
    return () => {
      ch.close();
    };
  }, [deskId, setSymbol, setTimeframe]);
}
