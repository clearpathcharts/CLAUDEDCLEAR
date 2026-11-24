import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChartDataAdapter } from '../lib/replay/ChartDataAdapter';
import { historicalDataService } from '../lib/replay/HistoricalDataService';
import { ReplayEngine } from '../lib/replay/ReplayEngine';
import {
  REPLAY_SPEEDS,
  type ReplayCandle,
  type ReplayEngineState,
  type ReplaySpeed,
} from '../lib/replay/types';

export type UseMarketReplayOptions = {
  initialSymbol?: string;
  initialTimeframe?: string;
  userTier?: string;
};

export function useMarketReplay(opts: UseMarketReplayOptions = {}) {
  const engineRef = useRef(new ReplayEngine({
    symbol: opts.initialSymbol || 'USDJPY',
    timeframe: opts.initialTimeframe || '1h',
  }));
  const adapterRef = useRef(new ChartDataAdapter(engineRef.current));

  const [engineState, setEngineState] = useState<ReplayEngineState>(() => engineRef.current.getState());
  const [visibleCandles, setVisibleCandles] = useState<ReplayCandle[]>([]);
  const [loadNote, setLoadNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);

  const syncFromEngine = useCallback(() => {
    const eng = engineRef.current;
    const st = eng.getState();
    setEngineState(st);
    setVisibleCandles(eng.visibleCandles());
  }, []);

  useEffect(() => {
    const eng = engineRef.current;
    const unsub = eng.subscribe(() => syncFromEngine());
    return () => {
      unsub();
      eng.dispose();
    };
  }, [syncFromEngine]);

  const load = useCallback(
    async (args: {
      symbol: string;
      timeframe: string;
      startUnix?: number;
      startDate?: string;
      endDate?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await historicalDataService.loadForReplay({
          symbol: args.symbol,
          timeframe: args.timeframe,
          startUnix: args.startUnix,
          startDate: args.startDate,
          endDate: args.endDate,
          userTier: opts.userTier || 'VIP',
        });
        engineRef.current.loadSession({
          symbol: args.symbol,
          timeframe: args.timeframe,
          candles: result.candles,
          startIndex: result.startIndex,
        });
        setLoadNote(result.note);
        setActive(true);
        syncFromEngine();
      } catch (e: any) {
        setError(e?.message || 'Failed to load real historical data for replay.');
        setActive(false);
      } finally {
        setLoading(false);
      }
    },
    [opts.userTier, syncFromEngine],
  );

  const play = useCallback(() => engineRef.current.play(), []);
  const pause = useCallback(() => engineRef.current.pause(), []);
  const restart = useCallback(() => {
    engineRef.current.restart();
    syncFromEngine();
  }, [syncFromEngine]);
  const step = useCallback((n: number) => engineRef.current.step(n), []);
  const setSpeed = useCallback((s: ReplaySpeed) => engineRef.current.setSpeed(s), []);
  const seekToIndex = useCallback((i: number) => {
    engineRef.current.seekToIndex(i);
    syncFromEngine();
  }, [syncFromEngine]);

  const exitReplay = useCallback(() => {
    engineRef.current.pause();
    setActive(false);
  }, []);

  const currentTimeLabel = useMemo(() => {
    const c = visibleCandles[visibleCandles.length - 1];
    if (!c) return '—';
    return new Date(c.time * 1000).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [visibleCandles]);

  return {
    active,
    loading,
    error,
    loadNote,
    engineState,
    visibleCandles,
    currentTimeLabel,
    speeds: REPLAY_SPEEDS,
    progress: adapterRef.current.getProgress(),
    load,
    play,
    pause,
    restart,
    step,
    setSpeed,
    seekToIndex,
    exitReplay,
  };
}
