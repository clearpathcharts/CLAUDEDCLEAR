import { BaseTruthPolicy, PolicyValidationResult, PolicySeverity } from './TruthPolicy';

/**
 * NoFallbackPolicy
 * Strictly enforces that no system component, telemetry pipeline, or data feed is operating in a fallback state.
 * Prevents any silent degradation of data streams in the ClearPath environment.
 */
export class NoFallbackPolicy extends BaseTruthPolicy {
  key = 'POLICY_NO_FALLBACK';
  name = 'No Fallback Enforcement Policy';
  description = 'Rejects and halts execution if any active terminal or stream is operating via a fallback channel.';
  severity: PolicySeverity = 'CRITICAL';

  enforce(context: Record<string, any>): PolicyValidationResult {
    // 1. Check for explicit fallback flags in the input context
    if (context.fallbackMode === true) {
      return this.createResult(
        false,
        'CRITICAL POLICY VIOLATION: System-wide or service-specific fallbackMode is enabled.',
        { activeFallback: true }
      );
    }

    // 2. Check for explicit MOCK_FALLBACK or DEGRADED status strings
    const status = (context.status || '').toString().toUpperCase();
    if (status === 'MOCK_FALLBACK' || status === 'DEGRADED' || status === 'FALLBACK') {
      return this.createResult(
        false,
        `CRITICAL POLICY VIOLATION: Service status '${status}' violates the absolute uptime constraint.`,
        { status }
      );
    }

    // 3. Inspect nested service metrics if present
    if (Array.isArray(context.services)) {
      const failingServices = context.services.filter(
        (srv: any) =>
          srv.status === 'MOCK_FALLBACK' ||
          srv.status === 'FALLBACK' ||
          srv.status === 'DEGRADED' ||
          srv.fallbackMode === true ||
          (srv.message && srv.message.toLowerCase().includes('fallback'))
      );

      if (failingServices.length > 0) {
        return this.createResult(
          false,
          `CRITICAL POLICY VIOLATION: ${failingServices.length} active service(s) operating in fallback/degraded status.`,
          { failingServices: failingServices.map((s: any) => s.name || 'Unknown') }
        );
      }
    }

    return this.createResult(true, 'No Fallback Policy complied successfully.');
  }
}
