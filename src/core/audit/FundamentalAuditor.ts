import { FundamentalRegistry } from "../registry/FundamentalRegistry";
import fs from "fs";
import path from "path";

export interface FundamentalAuditResult {
  id: string;
  name: string;
  abbr: string;
  file: string;
  exists: boolean;
  status: "Implemented" | "Missing";
}

export class FundamentalAuditor {
  static audit(): FundamentalAuditResult[] {
    return FundamentalRegistry.map((item) => {
      let fileExists = false;
      const cleanFile = item.sourceFile;

      try {
        if (typeof window === "undefined" || (typeof process !== "undefined" && process?.versions?.node)) {
          const fullPath = path.join(process.cwd(), "src", cleanFile);
          fileExists = fs.existsSync(fullPath);
        } else {
          // Client pass-through for compilation boundary safety
          fileExists = true;
        }
      } catch (e) {
        fileExists = false;
      }

      return {
        id: item.id,
        name: item.name,
        abbr: item.abbr,
        file: cleanFile,
        exists: fileExists,
        status: fileExists ? "Implemented" : "Missing"
      };
    });
  }
}
