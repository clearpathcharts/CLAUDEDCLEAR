import { BaseTruthPolicy, PolicyValidationResult, PolicySeverity } from './TruthPolicy';

/**
 * DataSourceVerificationPolicy
 * Ensures that all feeds and tick vectors originate strictly from legal, licensed, and allowlisted providers.
 * Totally blocks custom rogue endpoints, mock simulations, or unsanctioned aggregators.
 */
export class DataSourceVerificationPolicy extends BaseTruthPolicy {
  key = 'POLICY_DATA_SOURCE_VERIFICATION';
  name = 'Data Source verification Policy';
  description = 'Verifies if incoming streams are registered under licensed institutional channels.';
  severity: PolicySeverity = 'CRITICAL';

  // Allowed data sources
  private static readonly ALLOWED_SOURCES = [
    'TWELVEDATA',
    'POLYGON',
    'FINNHUB',
    'FRED',
    'SEC',
    'NEWSDATA',
    'BENZINGA',
    'GOOGLE_CALENDAR',
    'APPLE_CALENDAR',
    'OUTLOOK',
    'FIREBASE_AUTH',
    'FIRESTORE',
    'FIREBASE_STORAGE',
    'STRIPE',
    'TWILIO',
    'SENDGRID',
    'CLIENT_APPLICATION_STARTUP',
    'CLIENT_DATA_REFRESH_CYCLE'
  ];

  enforce(context: Record<string, any>): PolicyValidationResult {
    const rawSource = (context.source || '').toString().toUpperCase();

    // Check direct context source
    if (rawSource) {
      const isAllowed = DataSourceVerificationPolicy.ALLOWED_SOURCES.some(
        allowed => rawSource === allowed || rawSource.startsWith(allowed)
      );

      if (!isAllowed) {
        return this.createResult(
          false,
          `CRITICAL POLICY VIOLATION: Source '${rawSource}' is NOT certified in the allowlisted institutional network.`,
          { rawSource, allowedSources: DataSourceVerificationPolicy.ALLOWED_SOURCES }
        );
      }
    }

    // Check services array if present
    if (Array.isArray(context.services)) {
      const unauthorized = context.services.filter((srv: any) => {
        const srvSrc = (srv.source || srv.name || '').toString().toUpperCase();
        return !DataSourceVerificationPolicy.ALLOWED_SOURCES.some(
          allowed => srvSrc === allowed || srvSrc.startsWith(allowed) || allowed.startsWith(srvSrc)
        );
      });

      if (unauthorized.length > 0) {
        return this.createResult(
          false,
          `CRITICAL POLICY VIOLATION: Unauthorized telemetry feed(s) detected: ${unauthorized.map((s: any) => s.name || 'Unknown').join(', ')}`,
          { unauthorized: unauthorized.map((s: any) => s.name || 'Unknown') }
        );
      }
    }

    return this.createResult(true, 'Data source validation compliant.');
  }
}
