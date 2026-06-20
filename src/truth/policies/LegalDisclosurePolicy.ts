import { BaseTruthPolicy, PolicyValidationResult, PolicySeverity } from './TruthPolicy';

/**
 * LegalDisclosurePolicy
 * Guarantees that essential protection pages (Terms of Use, Privacy Policy,
 * CFD/Forex Risk Disclosure, and Provider Data Attribution licenses) exist
 * and are fully active in the client environment before enabling rendering.
 */
export class LegalDisclosurePolicy extends BaseTruthPolicy {
  key = 'POLICY_LEGAL_DISCLOSURE';
  name = 'Legal Disclosure Enforcement Policy';
  description = 'Reviews environment settings to ensure that risk warning disclosures have been fully accepted and attributed.';
  severity: PolicySeverity = 'CRITICAL';

  enforce(context: Record<string, any>): PolicyValidationResult {
    // Check if the legal disclosure flags are initialized
    const disclosures = context.disclosures || {};

    const requiredKeys = [
      'termsAccepted',
      'privacyPolicyActive',
      'riskDisclosureAcknowledged',
      'attributionRendered'
    ];

    const missing: string[] = [];

    for (const key of requiredKeys) {
      if (disclosures[key] !== true) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      return this.createResult(
        false,
        `CRITICAL POLICY VIOLATION: Legal safety audit failed. Missing disclosure compliance components: ${missing.join(', ')}.`,
        { missingComponents: missing }
      );
    }

    return this.createResult(true, 'Legal disclosure constraints verified. Litigation shield active.');
  }
}
