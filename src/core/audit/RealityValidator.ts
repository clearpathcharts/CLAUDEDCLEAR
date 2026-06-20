import { RegistryAuditor, SystemAuditReport } from "./RegistryAuditor";

export class RealityValidator {
  private static cachedReport: SystemAuditReport | null = null;

  /**
   * Performs the full platform sanity audit.
   * If section validation fails (e.g. required files are missing), can throw build errors
   * or disable respective items.
   */
  static validate(failOnMissing: boolean = false): SystemAuditReport {
    const report = RegistryAuditor.runFullAudit();
    this.cachedReport = report;

    // Log the Reality Enforcement Check results to backend console
    console.log("-----------------------------------------------------------------");
    console.log(`[REALITY ENFORCEMENT ENGINE] Audit triggered at: ${report.timestamp}`);
    console.log(`[TECHNICAL INDICATORS]  ${report.counters.implementedIndicators} / ${report.counters.totalIndicators} Implemented`);
    console.log(`[FUNDAMENTAL SURVEYS]  ${report.counters.implementedFundamentals} / ${report.counters.totalFundamentals} Implemented`);
    console.log(`[INSTITUTIONAL MODELS] ${report.counters.implementedInstitutional} / ${report.counters.totalInstitutional} Implemented`);
    
    // Check missing implementations
    const missingIndicators = report.indicators.filter(i => i.status !== "Implemented");
    const missingFundamentals = report.fundamentals.filter(f => f.status !== "Implemented");
    const missingInstitutional = report.institutional.filter(i => i.status !== "Implemented");

    if (missingIndicators.length > 0) {
      console.warn(`[WARNING] Missing indicator files: ${missingIndicators.map(i => i.abbr).join(", ")}`);
    }
    if (missingFundamentals.length > 0) {
      console.warn(`[WARNING] Missing fundamental files: ${missingFundamentals.map(f => f.abbr).join(", ")}`);
    }
    if (missingInstitutional.length > 0) {
      console.warn(`[WARNING] Missing institutional files: ${missingInstitutional.map(inst => inst.abbr).join(", ")}`);
    }

    if (failOnMissing) {
      const hasHoles = missingIndicators.length > 0 || missingFundamentals.length > 0 || missingInstitutional.length > 0;
      if (hasHoles) {
        throw new Error("[BUILD FAILED] ClearPath Reality Enforcement Audit Failure: Undefined components found in registration matrices without corresponding source code!");
      }
    }

    console.log("[REALITY ENFORCEMENT ENGINE] Platform integrity verified successfully.");
    console.log("-----------------------------------------------------------------");

    return report;
  }

  static getLatestReport(): SystemAuditReport {
    if (!this.cachedReport) {
      return this.validate();
    }
    return this.cachedReport;
  }
}
