import { Candle } from './ChartEngine';

/**
 * CAPITAL FLOW ENGINE (File 113)
 */

const REGION_MAP: Record<string, string> = {
  "AAPL": "US",
  "MSFT": "US",
  "TSLA": "US",
  "DAX": "EU",
  "FTSE": "EU",
  "EUR/USD": "EU",
  "USD/JPY": "JP",
  "N225": "JP",
  "BTC": "GLOBAL",
  "ETH": "GLOBAL"
};

export interface FlowRegion {
  flow: number;
  lastUpdate: number;
}

export interface FlowState {
  regions: Record<string, FlowRegion>;
}

export function buildFlowState(): FlowState {
  return { regions: {} };
}

export function updateFlow(state: FlowState, tick: { symbol: string; price: number; prevPrice?: number; volume?: number }) {
  const region = REGION_MAP[tick.symbol] || "OTHER";
  const change = (tick.price - (tick.prevPrice || tick.price)) || 0;
  const weight = tick.volume || 1;

  if (!state.regions[region]) {
    state.regions[region] = { flow: 0, lastUpdate: Date.now() };
  }

  state.regions[region].flow += change * weight;
  state.regions[region].lastUpdate = Date.now();
  return state;
}

export function normalizeFlow(state: FlowState): Record<string, number> {
  const vals = Object.values(state.regions).map(r => r.flow);
  const maxAbs = Math.max(1, ...vals.map(v => Math.abs(v)));

  const out: Record<string, number> = {};
  Object.entries(state.regions).forEach(([k, v]) => {
    out[k] = v.flow / maxAbs;
  });

  return out;
}
