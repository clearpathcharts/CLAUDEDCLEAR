import { NoFallbackPolicy } from './policies/NoFallbackPolicy';
import { NoMockPolicy } from './policies/NoMockPolicy';
import { NoSyntheticDataPolicy } from './policies/NoSyntheticDataPolicy';
import { NoPlaceholderPolicy } from './policies/NoPlaceholderPolicy';

export interface TickData {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
  latencyMs: number;
}

export interface StreamAuditLog {
  id: string;
  timestamp: string;
  symbol: string;
  passed: boolean;
  message: string;
  metrics: {
    priceDrift: number;
    latency: number;
    tickInterval: number;
    isRepeatedValue: boolean;
  };
}

/**
 * LiveDataEnforcementEngine
 * Actively audits incoming pricing ticks, order book entries, and feed vectors.
 * If any mock or synthetic data behavior is identified, it rejects the stream frame.
 */
export class LiveDataEnforcementEngine {
  private static fallbackPolicy = new NoFallbackPolicy();
  private static mockPolicy = new NoMockPolicy();
  private static syntheticPolicy = new NoSyntheticDataPolicy();
  private static placeholderPolicy = new NoPlaceholderPolicy();

  private static lastTicks: Map<string, TickData> = new Map();
  private static repeatedValueCounter: Map<string, number> = new Map();
  private static symbolDriftHistory: Map<string, { priceDrift: number; count: number }> = new Map();

  /**
   * Evaluates an incoming price tick or transaction record under active policies.
   * Throws an error or returns false if data is compromised by fallbacks, simulation, or placeholders.
   */
  static validateTick(tick: TickData): { valid: boolean; message: string; audit?: StreamAuditLog } {
    const now = Date.now();
    
    // 1. Direct key scanning & pattern verification
    const textContext = {
      status: tick.source === 'MOCK' ? 'MOCK_FALLBACK' : 'ONLINE',
      source: tick.source,
      message: `Tick validation for ${tick.symbol}`,
      isMock: tick.source.includes('MOCK') || tick.source.includes('SYNTHETIC'),
    };

    // Run active policies
    const fallbackCheck = this.fallbackPolicy.enforce(textContext);
    if (!fallbackCheck.valid) {
      return { valid: false, message: fallbackCheck.message };
    }

    const mockCheck = this.mockPolicy.enforce(textContext);
    if (!mockCheck.valid) {
      return { valid: false, message: mockCheck.message };
    }

    const syntheticCheck = this.syntheticPolicy.enforce(textContext);
    if (!syntheticCheck.valid) {
      return { valid: false, message: syntheticCheck.message };
    }

    const placeholderCheck = this.placeholderPolicy.enforce(textContext);
    if (!placeholderCheck.valid) {
      return { valid: false, message: placeholderCheck.message };
    }

    // 2. High-Grade Mathematical Signal Validation (Anti-Simulated Drift Checking)
    const prevTick = this.lastTicks.get(tick.symbol);
    let priceDrift = 0;
    let tickInterval = 0;
    let isRepeatedValue = false;

    if (prevTick) {
      priceDrift = Math.abs(tick.price - prevTick.price);
      tickInterval = tick.timestamp - prevTick.timestamp;

      // Anti-stagnant: only flag RAPID identical ticks (fake local simulators).
      // Quiet FX/metals + a ~5s quote cache routinely return the same price for
      // many minutes — that is live market silence, not simulation. Blocking it
      // 403'd StrictlyCharts while Twelve Data was healthy.
      if (priceDrift === 0) {
        const rapidRepeat = tickInterval > 0 && tickInterval < 2000;
        if (rapidRepeat) {
          const repeatedCount = (this.repeatedValueCounter.get(tick.symbol) || 0) + 1;
          this.repeatedValueCounter.set(tick.symbol, repeatedCount);
          if (repeatedCount >= 40) {
            return {
              valid: false,
              message: `CRITICAL INTEGRITY VIOLATION: Channel ${tick.symbol} has duplicate constant quotes, signaling stagnant simulation fallback.`
            };
          }
          isRepeatedValue = true;
        } else {
          // Spaced repeats (cache / quiet tape) are normal — do not accumulate.
          this.repeatedValueCounter.set(tick.symbol, 0);
          isRepeatedValue = true;
        }
      } else {
        this.repeatedValueCounter.set(tick.symbol, 0);
      }

      // Statistical / consecutive identical drift checking to detect deterministic simulation grids
      if (priceDrift > 0) {
        const driftHistory = this.symbolDriftHistory.get(tick.symbol);
        if (driftHistory && Math.abs(priceDrift - driftHistory.priceDrift) < 0.000001) {
          const newCount = driftHistory.count + 1;
          this.symbolDriftHistory.set(tick.symbol, { priceDrift, count: newCount });
          if (newCount >= 20) {
            return {
              valid: false,
              message: `CRITICAL INTEGRITY VIOLATION: Suspicious grid simulation detected. 20 consecutive price changes of exactly ${priceDrift.toFixed(5)} on ${tick.symbol}.`
            };
          }
        } else {
          this.symbolDriftHistory.set(tick.symbol, { priceDrift, count: 1 });
        }
      }
    }

    // Update historical cache
    this.lastTicks.set(tick.symbol, tick);

    const auditLog: StreamAuditLog = {
      id: `tick-audit-${tick.symbol}-${now}`,
      timestamp: new Date().toISOString(),
      symbol: tick.symbol,
      passed: true,
      message: `Raw stream tick for ${tick.symbol} verified under perfect live data constraints.`,
      metrics: {
        priceDrift,
        latency: tick.latencyMs,
        tickInterval,
        isRepeatedValue
      }
    };

    return {
      valid: true,
      message: 'Uptime integrity check succeeded.',
      audit: auditLog
    };
  }
}
