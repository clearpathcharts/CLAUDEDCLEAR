import { EnforcementReport, TruthEnforcementEngine } from './TruthEnforcementEngine';

export type HaltListener = (halted: boolean, reason: string | null, details: any) => void;

/**
 * TradingHaltController
 * Emergency circuit breaker of the ClearPath platform.
 * If severe truth violations are detected (e.g., fallbacks, mocks, or unauthorized synthetic data),
 * it completely halts all market data, charts, and transaction feeds, showing an active compliance warning banner instead.
 */
export class TradingHaltController {
  private static halted = false;
  private static haltReason: string | null = null;
  private static haltDetails: any = null;
  private static listeners: Set<HaltListener> = new Set();

  /**
   * Evaluates an enforcement report and dynamically engages the circuit breaker if critical rules fail.
   */
  static assertHaltFromReport(report: EnforcementReport): boolean {
    if (report.isCompliant) {
      // Auto-recover if all policies comply
      if (this.halted) {
        this.clearHalt();
      }
      return false;
    }

    // Inspect critical policy keys
    const criticalViolations = Object.keys(report.results).filter(key => {
      const result = report.results[key];
      // POLICY_NO_PLACEHOLDER is WARNING, others are CRITICAL
      return !result.valid && key !== 'POLICY_NO_PLACEHOLDER';
    });

    if (criticalViolations.length > 0) {
      const primaryFailKey = criticalViolations[0];
      const primaryFail = report.results[primaryFailKey];
      
      this.engageHalt(
        `Critical policy failure [${primaryFailKey}]: ${primaryFail.message}`,
        {
          timestamp: report.timestamp,
          score: report.score,
          failures: criticalViolations,
          allResults: report.results
        }
      );
      return true;
    }

    // Warnings only do not trigger full trading halt
    return false;
  }

  /**
   * Explicitly triggers the emergency circuit breaker.
   */
  static engageHalt(reason: string, details: any = null): void {
    if (!this.halted) {
      this.halted = true;
      this.haltReason = reason;
      this.haltDetails = details;
      
      console.error(
        `[EMERGENCY CIRCUIT BREAKER SEVERE] ACTIVATING TRADING HALT:\n` +
        `Reason: ${reason}\n` +
        `Action: Blanking all market data interfaces, charts, and order tools instantly!`
      );
      
      this.notifyListeners();
    }
  }

  /**
   * Recovers/resets the platform.
   */
  static clearHalt(): void {
    if (this.halted) {
      this.halted = false;
      this.haltReason = null;
      this.haltDetails = null;
      
      console.log('[EMERGENCY CIRCUIT BREAKER] TRADING HALT CLEARED. Platform resuming standard flow.');
      this.notifyListeners();
    }
  }

  /**
   * Check status
   */
  static isHalted(): boolean {
    return this.halted;
  }

  /**
   * Fetch details
   */
  static getHaltReason(): string | null {
    return this.haltReason;
  }

  static getHaltDetails(): any {
    return this.haltDetails;
  }

  /**
   * Subscription mechanisms for React components
   */
  static subscribe(listener: HaltListener): () => void {
    this.listeners.add(listener);
    // Instant initial value callback
    listener(this.halted, this.haltReason, this.haltDetails);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.halted, this.haltReason, this.haltDetails);
      } catch (err) {
        console.error('[TradingHaltController] Listener callback failed:', err);
      }
    });
  }
}

// Self-register to the compliance assertion cycle
TruthEnforcementEngine.registerEvaluationCallback((report) => {
  TradingHaltController.assertHaltFromReport(report);
});
