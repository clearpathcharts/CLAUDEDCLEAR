import { BaseTruthPolicy, PolicyValidationResult, PolicySeverity } from './TruthPolicy';

/**
 * NoSyntheticDataPolicy
 * Mandates that all tick feeds, order block records, and economic structures are driven by actual, verified public/private ledgers.
 * This blocks any random-walk simulators, price drift mechanisms, or computer-generated indicators.
 */
export class NoSyntheticDataPolicy extends BaseTruthPolicy {
  key = 'POLICY_NO_SYNTHETIC';
  name = 'No Synthetic Data Enforcement Policy';
  description = 'Blocks algorithmic generation of ticker, forex, or macro indicators where live-market APIs are down.';
  severity: PolicySeverity = 'CRITICAL';

  enforce(context: Record<string, any>): PolicyValidationResult {
    // 1. Check for synthetic indices
    if (context.isSynthetic === true || context.synthetic === true || context.source === 'SYNTHETIC') {
      return this.createResult(
        false,
        'CRITICAL POLICY VIOLATION: Pipeline utilizes structural synthetic/simulated streams.',
        { source: context.source }
      );
    }

    // 2. Scan messaging profiles
    const message = (context.message || '').toString().toLowerCase();
    if (message.includes('synthetic') || message.includes('simulation') || message.includes('drift') || message.includes('random-walk')) {
      return this.createResult(
        false,
        `CRITICAL POLICY VIOLATION: Execution message explicitly contains synthetic keywords: "${context.message}"`,
        { message }
      );
    }

    // 3. Scan sub-modules
    if (Array.isArray(context.services)) {
      const syntheticFeeds = context.services.filter(
        (srv: any) =>
          srv.isSynthetic === true ||
          srv.synthetic === true ||
          (srv.message && (
            srv.message.toLowerCase().includes('synthetic') ||
            srv.message.toLowerCase().includes('simulation') ||
            srv.message.toLowerCase().includes('drift')
          ))
      );

      if (syntheticFeeds.length > 0) {
        return this.createResult(
          false,
          `CRITICAL POLICY VIOLATION: ${syntheticFeeds.length} active endpoint(s) utilizing generated synthetic feeds instead of strict raw tickers.`,
          { syntheticFeeds: syntheticFeeds.map((s: any) => s.name || 'Unknown') }
        );
      }
    }

    return this.createResult(true, 'No Synthetic Data Policy complied successfully.');
  }
}
