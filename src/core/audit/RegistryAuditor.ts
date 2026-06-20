import { IndicatorAuditor, AuditResult } from "./IndicatorAuditor";
import { FundamentalAuditor, FundamentalAuditResult } from "./FundamentalAuditor";
import { InstitutionalAuditor, InstitutionalAuditResult } from "./InstitutionalAuditor";

export interface SystemAuditReport {
  timestamp: string;
  counters: {
    totalIndicators: number;
    implementedIndicators: number;
    totalFundamentals: number;
    implementedFundamentals: number;
    totalInstitutional: number;
    implementedInstitutional: number;
  };
  indicators: AuditResult[];
  fundamentals: FundamentalAuditResult[];
  institutional: InstitutionalAuditResult[];
}

export class RegistryAuditor {
  static runFullAudit(): SystemAuditReport {
    const indicators = IndicatorAuditor.audit();
    const fundamentals = FundamentalAuditor.audit();
    const institutional = InstitutionalAuditor.audit();

    const implementedIndicators = indicators.filter((i) => i.status === "Implemented").length;
    const implementedFundamentals = fundamentals.filter((f) => f.status === "Implemented").length;
    const implementedInstitutional = institutional.filter((inst) => inst.status === "Implemented").length;

    return {
      timestamp: new Date().toISOString(),
      counters: {
        totalIndicators: indicators.length,
        implementedIndicators,
        totalFundamentals: fundamentals.length,
        implementedFundamentals,
        totalInstitutional: institutional.length,
        implementedInstitutional
      },
      indicators,
      fundamentals,
      institutional
    };
  }
}
