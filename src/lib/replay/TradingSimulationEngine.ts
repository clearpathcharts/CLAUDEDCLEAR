import {
  DEFAULT_STARTING_BALANCE,
  type AccountSnapshot,
  type ClosedTrade,
  type OrderSide,
  type OrderType,
  type ReplayCandle,
  type SimulatedAccount,
  type SimulatedOrder,
  type SimulatedPosition,
} from './types';

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Notional multiplier: 1 lot ≈ 100k FX units; metals/futures scaled simply. */
function contracts(symbol: string, size: number): number {
  const s = symbol.toUpperCase();
  if (s.includes('XAU') || s.includes('GOLD')) return size * 100;
  if (s === 'ES') return size * 50;
  if (s === 'NQ') return size * 20;
  if (s === 'CL') return size * 1000;
  return size * 100_000;
}

export function computeTradePnl(
  side: OrderSide,
  entry: number,
  exit: number,
  size: number,
  symbol: string,
): number {
  const dir = side === 'long' ? 1 : -1;
  return dir * (exit - entry) * contracts(symbol, size);
}

/**
 * Paper-trading simulator driven by replay candles only.
 * Evaluates fills/SL/TP on the CURRENT bar OHLC — never future bars.
 */
export class TradingSimulationEngine {
  private account: SimulatedAccount;
  private symbol: string;
  private peakEquity: number;
  private maxDrawdown: number;

  constructor(startingBalance = DEFAULT_STARTING_BALANCE, symbol = '') {
    this.symbol = symbol;
    this.account = {
      startingBalance,
      cash: startingBalance,
      realizedPnl: 0,
      trades: [],
      openPosition: null,
      pendingOrders: [],
    };
    this.peakEquity = startingBalance;
    this.maxDrawdown = 0;
  }

  getAccount(): SimulatedAccount {
    return this.account;
  }

  setSymbol(symbol: string) {
    this.symbol = symbol;
  }

  reset(startingBalance = DEFAULT_STARTING_BALANCE) {
    this.account = {
      startingBalance,
      cash: startingBalance,
      realizedPnl: 0,
      trades: [],
      openPosition: null,
      pendingOrders: [],
    };
    this.peakEquity = startingBalance;
    this.maxDrawdown = 0;
  }

  placeOrder(input: {
    side: OrderSide;
    type: OrderType;
    size: number;
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
    barIndex: number;
    bar: ReplayCandle;
  }): SimulatedOrder {
    const order: SimulatedOrder = {
      id: uid('ord'),
      side: input.side,
      type: input.type,
      size: Math.max(0.01, input.size),
      price: input.price,
      stopLoss: input.stopLoss,
      takeProfit: input.takeProfit,
      status: 'pending',
      createdIndex: input.barIndex,
      createdAt: input.bar.time,
    };

    if (input.type === 'market') {
      this.fill(order, input.bar.close, input.barIndex, input.bar.time);
    } else {
      this.account.pendingOrders = [...this.account.pendingOrders, order];
    }
    return order;
  }

  /** Close open position at current close. */
  closePosition(barIndex: number, bar: ReplayCandle, reason: ClosedTrade['exitReason'] = 'manual') {
    const pos = this.account.openPosition;
    if (!pos) return null;
    return this.exitPosition(pos, bar.close, barIndex, bar.time, reason);
  }

  /**
   * Process one newly revealed candle: pending orders + SL/TP.
   * MUST only receive the current bar (no look-ahead).
   */
  onBar(barIndex: number, bar: ReplayCandle) {
    // Pending limit / stop
    const stillPending: SimulatedOrder[] = [];
    for (const o of this.account.pendingOrders) {
      if (o.status !== 'pending') continue;
      const filled = this.tryFillPending(o, bar);
      if (filled != null) {
        this.fill(o, filled, barIndex, bar.time);
      } else {
        stillPending.push(o);
      }
    }
    this.account.pendingOrders = stillPending;

    // SL / TP on open position
    const pos = this.account.openPosition;
    if (!pos) {
      this.trackEquity(bar.close);
      return;
    }
    if (pos.side === 'long') {
      if (pos.stopLoss != null && bar.low <= pos.stopLoss) {
        this.exitPosition(pos, pos.stopLoss, barIndex, bar.time, 'stop_loss');
      } else if (pos.takeProfit != null && bar.high >= pos.takeProfit) {
        this.exitPosition(pos, pos.takeProfit, barIndex, bar.time, 'take_profit');
      }
    } else {
      if (pos.stopLoss != null && bar.high >= pos.stopLoss) {
        this.exitPosition(pos, pos.stopLoss, barIndex, bar.time, 'stop_loss');
      } else if (pos.takeProfit != null && bar.low <= pos.takeProfit) {
        this.exitPosition(pos, pos.takeProfit, barIndex, bar.time, 'take_profit');
      }
    }
    this.trackEquity(bar.close);
  }

  snapshot(markPrice: number): AccountSnapshot {
    const openPnl = this.openPnl(markPrice);
    const equity = this.account.cash + openPnl;
    const wins = this.account.trades.filter((t) => t.pnl > 0);
    const losses = this.account.trades.filter((t) => t.pnl <= 0);
    const sumWin = wins.reduce((a, t) => a + t.pnl, 0);
    const sumLossAbs = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
    return {
      startingBalance: this.account.startingBalance,
      cash: this.account.cash,
      equity,
      availableBalance: this.account.cash,
      openPnl,
      realizedPnl: this.account.realizedPnl,
      tradeCount: this.account.trades.length,
      winRate: this.account.trades.length
        ? wins.length / this.account.trades.length
        : 0,
      avgWin: wins.length ? sumWin / wins.length : 0,
      avgLoss: losses.length ? losses.reduce((a, t) => a + t.pnl, 0) / losses.length : 0,
      profitFactor: sumLossAbs > 0 ? sumWin / sumLossAbs : sumWin > 0 ? Infinity : 0,
      largestWin: wins.reduce((m, t) => Math.max(m, t.pnl), 0),
      largestLoss: losses.reduce((m, t) => Math.min(m, t.pnl), 0),
      maxDrawdown: this.maxDrawdown,
    };
  }

  private openPnl(mark: number): number {
    const pos = this.account.openPosition;
    if (!pos) return 0;
    return computeTradePnl(pos.side, pos.entryPrice, mark, pos.size, this.symbol);
  }

  private trackEquity(mark: number) {
    const eq = this.account.cash + this.openPnl(mark);
    if (eq > this.peakEquity) this.peakEquity = eq;
    const dd = this.peakEquity > 0 ? (this.peakEquity - eq) / this.peakEquity : 0;
    if (dd > this.maxDrawdown) this.maxDrawdown = dd;
  }

  private tryFillPending(o: SimulatedOrder, bar: ReplayCandle): number | null {
    if (o.type === 'limit' && o.price != null) {
      if (o.side === 'long' && bar.low <= o.price) return o.price;
      if (o.side === 'short' && bar.high >= o.price) return o.price;
    }
    if (o.type === 'stop' && o.price != null) {
      if (o.side === 'long' && bar.high >= o.price) return o.price;
      if (o.side === 'short' && bar.low <= o.price) return o.price;
    }
    return null;
  }

  private fill(order: SimulatedOrder, price: number, barIndex: number, time: number) {
    order.status = 'filled';
    order.filledIndex = barIndex;
    order.filledPrice = price;

    if (this.account.openPosition) {
      const pos = this.account.openPosition;
      if (pos.side !== order.side) {
        this.exitPosition(pos, price, barIndex, time, 'reverse');
      } else {
        // Add to position (average)
        const total = pos.size + order.size;
        const entry = (pos.entryPrice * pos.size + price * order.size) / total;
        this.account.openPosition = {
          ...pos,
          size: total,
          entryPrice: entry,
          stopLoss: order.stopLoss ?? pos.stopLoss,
          takeProfit: order.takeProfit ?? pos.takeProfit,
        };
        return;
      }
    }

    this.account.openPosition = {
      id: uid('pos'),
      side: order.side,
      size: order.size,
      entryPrice: price,
      entryIndex: barIndex,
      entryTime: time,
      stopLoss: order.stopLoss,
      takeProfit: order.takeProfit,
    };
  }

  private exitPosition(
    pos: SimulatedPosition,
    exitPrice: number,
    exitIndex: number,
    exitTime: number,
    reason: ClosedTrade['exitReason'],
  ): ClosedTrade {
    const pnl = computeTradePnl(pos.side, pos.entryPrice, exitPrice, pos.size, this.symbol);
    const risk =
      pos.stopLoss != null
        ? Math.abs(pos.entryPrice - pos.stopLoss) * contracts(this.symbol, pos.size)
        : null;
    const trade: ClosedTrade = {
      id: uid('tr'),
      symbol: this.symbol,
      side: pos.side,
      size: pos.size,
      entryPrice: pos.entryPrice,
      exitPrice,
      entryIndex: pos.entryIndex,
      exitIndex,
      entryTime: pos.entryTime,
      exitTime,
      pnl,
      riskReward: risk && risk > 0 ? Math.abs(pnl) / risk : null,
      durationSec: Math.max(0, exitTime - pos.entryTime),
      exitReason: reason,
    };
    this.account.trades = [...this.account.trades, trade];
    this.account.realizedPnl += pnl;
    this.account.cash += pnl;
    this.account.openPosition = null;
    return trade;
  }
}
