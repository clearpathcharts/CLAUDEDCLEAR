import { BaseTruthPolicy, PolicyValidationResult, PolicySeverity } from './TruthPolicy';

/**
 * NoMockPolicy
 * Rejects any data payload, service metric, or environment context indicating simulated, dummy, or mock origins.
 */
export class NoMockPolicy extends BaseTruthPolicy {
  key = 'POLICY_NO_MOCK';
  name = 'No Mock Data Enforcement Policy';
  description = 'Examines telemetry records and data frames to guarantee they do not originate from mock data models.';
  severity: PolicySeverity = 'CRITICAL';

  enforce(context: Record<string, any>): PolicyValidationResult {
    // 1. Explicit mock flags
    if (context.isMock === true || context.mock === true || context.demoMode === true) {
      return this.createResult(
        false,
        'CRITICAL POLICY VIOLATION: Mock/Demo flag is explicitly detected as TRUE in execution context.',
        { isMock: context.isMock, mock: context.mock, demoMode: context.demoMode }
      );
    }

    // 2. Scan text fields for mock/stub markings
    const bannedWords = [
      "mock",
      "demo",
      "sandbox",
      "sample",
      "fake",
      "testfeed",
      "stub",
      "fixture"
    ];

    const fieldsToScan = ['message', 'description', 'status', 'source', 'origin'];
    for (const field of fieldsToScan) {
      const val = (context[field] || '').toString().toLowerCase();
      for (const word of bannedWords) {
        if (val.includes(word)) {
          return this.createResult(
            false,
            `CRITICAL POLICY VIOLATION: Trace field '${field}' contains banned mockup word '${word}': "${context[field]}".`,
            { field, word, value: context[field] }
          );
        }
      }
    }

    // 3. Scan sub-items or list metrics
    if (Array.isArray(context.services)) {
      const mockServices = context.services.filter(
        (srv: any) =>
          srv.isMock === true ||
          srv.mock === true ||
          (srv.message && srv.message.toLowerCase().includes('mock')) ||
          (srv.status && srv.status.toString().toUpperCase().includes('MOCK'))
      );

      if (mockServices.length > 0) {
        return this.createResult(
          false,
          `CRITICAL POLICY VIOLATION: ${mockServices.length} service(s) identified with active mock interfaces.`,
          { mockServices: mockServices.map((s: any) => s.name || 'Unknown') }
        );
      }
    }

    return this.createResult(true, 'No Mock Policy complied successfully.');
  }
}
