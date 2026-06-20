import { BaseTruthPolicy, PolicyValidationResult, PolicySeverity } from './TruthPolicy';

/**
 * NoPlaceholderPolicy
 * Hardens the platform against mock content. Rejects default mock texts,
 * "Lorem Ipsum", "your-api-key-here" patterns, or unconfigured default strings.
 */
export class NoPlaceholderPolicy extends BaseTruthPolicy {
  key = 'POLICY_NO_PLACEHOLDER';
  name = 'No Placeholder Content Policy';
  description = 'Flags any unconfigured credentials prompts, template strings, or placeholder labels in active streams.';
  severity: PolicySeverity = 'WARNING'; // Can be custom severity

  enforce(context: Record<string, any>): PolicyValidationResult {
    // 1. Scan for key placeholders (like "Set STRIPE_API_KEY", "your_api_key", or default "xxxx")
    const bannedPatterns = [
      'lorem ipsum',
      'set_',
      'your_api_key',
      '_key_here',
      'secret_here',
      'placeholder',
      'unconfigured',
      'insert key',
      'todo: ',
      'test_key',
    ];

    const fieldsToScan = ['message', 'key', 'apiKey', 'description', 'title'];
    for (const field of fieldsToScan) {
      if (context[field]) {
        const val = context[field].toString().toLowerCase();
        for (const pattern of bannedPatterns) {
          if (val.includes(pattern)) {
            return this.createResult(
              false,
              `POLICY WARNING/VIOLATION: Placeholder pattern '${pattern}' detected in field '${field}': "${context[field]}"`,
              { field, pattern, value: context[field] }
            );
          }
        }
      }
    }

    // 2. Scan services or properties
    if (Array.isArray(context.services)) {
      const servicesWithPlaceholders = context.services.filter((srv: any) => {
        const msg = (srv.message || '').toLowerCase();
        return bannedPatterns.some(pat => msg.includes(pat));
      });

      if (servicesWithPlaceholders.length > 0) {
        return this.createResult(
          false,
          `POLICY WARNING/VIOLATION: ${servicesWithPlaceholders.length} service(s) displaying unconfigured/placeholder messages.`,
          { servicesWithPlaceholders: servicesWithPlaceholders.map((s: any) => s.name || 'Unknown') }
        );
      }
    }

    return this.createResult(true, 'No Placeholder Policy complied successfully.');
  }
}
