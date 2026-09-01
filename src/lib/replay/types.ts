import type { NormalizedCandle } from '../../services/marketData';

/** Replay session candle — identical to NormalizedCandle (unix seconds). */
export type ReplayCandle = NormalizedCandle;

export const REPLAY_SPEEDS = [0.25, 0.5, 1, 2, 5, 10, 20] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];

export const REPLAY_STEP_PRESETS = [1, 5, 10] as const;

export type ReplayEngineState = {
  symbol: string;
  timeframe: string;
  /** Full historical buffer (oldest → newest). Never expose beyond currentIndex to chart. */
  candles: ReplayCandle[];
  replayStartIndex: number;
  currentReplayIndex: number;
  replayEndIndex: number;
  isPlaying: boolean;
  playbackSpeed: ReplaySpeed;
};

export type OrderSide = 'long' | 'short';
export type OrderType = 'market' | 'limit' | 'stop';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected';

export type SimulatedOrder = {
  id: string;
  side: OrderSide;
  type: OrderType;
  size: number;
  /** Limit / stop trigger price (ignored for market). */
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: OrderStatus;
  createdIndex: number;
  createdAt: number;
  filledIndex?: number;
  filledPrice?: number;
};

export type SimulatedPosition = {
  id: string;
  side: OrderSide;
  size: number;
  entryPrice: number;
  entryIndex: number;
  entryTime: number;
  stopLoss?: number;
  takeProfit?: number;
};

export type ClosedTrade = {
  id: string;
  symbol: string;
  side: OrderSide;
  size: number;
  entryPrice: number;
  exitPrice: number;
  entryIndex: number;
  exitIndex: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  riskReward: number | null;
  durationSec: number;
  exitReason: 'manual' | 'stop_loss' | 'take_profit' | 'reverse';
};

export type SimulatedAccount = {
  startingBalance: number;
  cash: number;
  realizedPnl: number;
  trades: ClosedTrade[];
  openPosition: SimulatedPosition | null;
  pendingOrders: SimulatedOrder[];
};

export type AccountSnapshot = {
  startingBalance: number;
  cash: number;
  equity: number;
  availableBalance: number;
  openPnl: number;
  realizedPnl: number;
  tradeCount: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  maxDrawdown: number;
};

export const DEFAULT_STARTING_BALANCE = 50_000;
