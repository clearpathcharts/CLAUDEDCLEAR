import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChartDataAdapter } from '../lib/replay/ChartDataAdapter';
import { historicalDataService } from '../lib/replay/HistoricalDataService';
import { ReplayEngine } from '../lib/replay/ReplayEngine';
import { TradingSimulationEngine } from '../lib/replay/TradingSimulationEngine';
import {
  DEFAULT_STARTING_BALANCE,
  REPLAY_SPEEDS,
  type AccountSnapshot,
  type OrderSide,
  type OrderType,
  type ReplayCandle,
  type ReplayEngineState,
  type ReplaySpeed,
  type SimulatedOrder,
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
  const simRef = useRef(new TradingSimulationEngine(DEFAULT_STARTING_BALANCE, opts.initialSymbol || 'USDJPY'));
  const adapterRef = useRef(new ChartDataAdapter(engineRef.current));

  const [engineState, setEngineState] = useState<ReplayEngineState>(() => engineRef.current.getState());
  const [visibleCandles, setVisibleCandles] = useState<ReplayCandle[]>([]);
  const [accountSnap, setAccountSnap] = useState<AccountSnapshot>(() => simRef.current.snapshot(0));
  const [loadNote, setLoadNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [trades, setTrades] = useState(() => simRef.current.getAccount().trades);
  const [openPosition, setOpenPosition] = useState(() => simRef.current.getAccount().openPosition);
  const [pendingOrders, setPendingOrders] = useState(() => simRef.current.getAccount().pendingOrders);
  const lastProcessedIndex = useRef(-1);

  const syncFromEngine = useCallback(() => {
    const eng = engineRef.current;
    const st = eng.getState();
    setEngineState(st);
    const vis = eng.visibleCandles();
    setVisibleCandles(vis);
    const mark = vis.length ? vis[vis.length - 1].close : 0;
    // Process newly revealed bars for fills / SL / TP
    if (st.currentReplayIndex > lastProcessedIndex.current) {
      for (let i = lastProcessedIndex.current + 1; i <= st.currentReplayIndex; i++) {
        if (i < 0 || i >= st.candles.length) continue;
        if (i < st.replayStartIndex) continue;
        simRef.current.onBar(i, st.candles[i]);
      }
      lastProcessedIndex.current = st.currentReplayIndex;
    }
    const acct = simRef.current.getAccount();
    setTrades(acct.trades);
    setOpenPosition(acct.openPosition);
    setPendingOrders(acct.pendingOrders);
    setAccountSnap(simRef.current.snapshot(mark));
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
        simRef.current.reset(DEFAULT_STARTING_BALANCE);
        simRef.current.setSymbol(args.symbol);
        lastProcessedIndex.current = result.startIndex - 1;
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
    lastProcessedIndex.current = engineRef.current.getState().replayStartIndex - 1;
    simRef.current.reset(DEFAULT_STARTING_BALANCE);
    simRef.current.setSymbol(engineRef.current.getState().symbol);
    engineRef.current.restart();
    syncFromEngine();
  }, [syncFromEngine]);
  const step = useCallback((n: number) => engineRef.current.step(n), []);
  const setSpeed = useCallback((s: ReplaySpeed) => engineRef.current.setSpeed(s), []);
  const seekToIndex = useCallback((i: number) => {
    // Seeking backward: reset sim and replay fills from start → i (no look-ahead)
    const eng = engineRef.current;
    const st = eng.getState();
    const target = Math.max(st.replayStartIndex, Math.min(st.replayEndIndex, i));
    simRef.current.reset(DEFAULT_STARTING_BALANCE);
    simRef.current.setSymbol(st.symbol);
    lastProcessedIndex.current = st.replayStartIndex - 1;
    eng.seekToIndex(target);
    syncFromEngine();
  }, [syncFromEngine]);

  const placeOrder = useCallback(
    (input: {
      side: OrderSide;
      type: OrderType;
      size: number;
      price?: number;
      stopLoss?: number;
      takeProfit?: number;
    }): SimulatedOrder | null => {
      const candle = engineRef.current.currentCandle();
      const st = engineRef.current.getState();
      if (!candle || !active) return null;
      const order = simRef.current.placeOrder({
        ...input,
        barIndex: st.currentReplayIndex,
        bar: candle,
      });
      const acct = simRef.current.getAccount();
      setTrades(acct.trades);
      setOpenPosition(acct.openPosition);
      setPendingOrders(acct.pendingOrders);
      setAccountSnap(simRef.current.snapshot(candle.close));
      return order;
    },
    [active],
  );

  const closePosition = useCallback(() => {
    const candle = engineRef.current.currentCandle();
    const st = engineRef.current.getState();
    if (!candle) return;
    simRef.current.closePosition(st.currentReplayIndex, candle, 'manual');
    const acct = simRef.current.getAccount();
    setTrades(acct.trades);
    setOpenPosition(acct.openPosition);
    setPendingOrders(acct.pendingOrders);
    setAccountSnap(simRef.current.snapshot(candle.close));
  }, []);

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
    accountSnap,
    trades,
    openPosition,
    pendingOrders,
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
    placeOrder,
    closePosition,
    exitReplay,
  };
}
