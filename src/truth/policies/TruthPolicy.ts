export interface PolicyValidationResult {
  valid: boolean;
  message: string;
  code?: string;
  timestamp: string;
  details?: Record<string, any>;
}

export type PolicySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface TruthPolicy {
  key: string;
  name: string;
  description: string;
  severity: PolicySeverity;
  enforce(context: Record<string, any>): PolicyValidationResult;
}

export abstract class BaseTruthPolicy implements TruthPolicy {
  abstract key: string;
  abstract name: string;
  abstract description: string;
  abstract severity: PolicySeverity;

  abstract enforce(context: Record<string, any>): PolicyValidationResult;

  protected createResult(valid: boolean, message: string, details?: Record<string, any>): PolicyValidationResult {
    return {
      valid,
      message,
      code: this.key,
      timestamp: new Date().toISOString(),
      details,
    };
  }
}
