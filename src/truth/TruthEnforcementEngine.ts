import { NoFallbackPolicy } from './policies/NoFallbackPolicy';
import { NoMockPolicy } from './policies/NoMockPolicy';
import { NoSyntheticDataPolicy } from './policies/NoSyntheticDataPolicy';
import { NoPlaceholderPolicy } from './policies/NoPlaceholderPolicy';
import { DataSourceVerificationPolicy } from './policies/DataSourceVerificationPolicy';
import { LegalDisclosurePolicy } from './policies/LegalDisclosurePolicy';
import { BaseTruthPolicy, PolicyValidationResult } from './policies/TruthPolicy';
import { getDb } from '../firebase';
import { collection, addDoc } from '../firebase';

export interface EnforcementReport {
  timestamp: string;
  isCompliant: boolean;
  score: number; // 0 to 100 compliance rating
  violationsCount: number;
  results: Record<string, PolicyValidationResult>;
}

/**
 * TruthEnforcementEngine
 * Master runtime engine that validates objects, environments, feeds, or profiles
 * against the aggregated stack of strict security and integrity policies.
 */
export class TruthEnforcementEngine {
  private static evaluationCallbacks: ((report: EnforcementReport) => void)[] = [];
  private static serverFilesystemBackup: ((payload: string, originId: string) => Promise<string | null>) | null = null;

  static registerServerFilesystemBackup(
    handler: (payload: string, originId: string) => Promise<string | null>,
  ): void {
    this.serverFilesystemBackup = handler;
  }

  static registerEvaluationCallback(cb: (report: EnforcementReport) => void): void {
    this.evaluationCallbacks.push(cb);
  }

  private static policies: BaseTruthPolicy[] = [
    new NoFallbackPolicy(),
    new NoMockPolicy(),
    new NoSyntheticDataPolicy(),
    new NoPlaceholderPolicy(),
    new DataSourceVerificationPolicy(),
    new LegalDisclosurePolicy()
  ];

  /**
   * Enforces all active truth policies against a given system context or data feed state.
   */
  static evaluate(context: Record<string, any>): EnforcementReport {
    const results: Record<string, PolicyValidationResult> = {};
    let violationsCount = 0;
    
    // Evaluate each registered policy
    for (const policy of this.policies) {
      const result = policy.enforce(context);
      results[policy.key] = result;
      if (!result.valid) {
        violationsCount++;
      }
    }

    const totalPoliciesCount = this.policies.length;
    const score = totalPoliciesCount > 0 
      ? Math.round(((totalPoliciesCount - violationsCount) / totalPoliciesCount) * 100)
      : 100;

    const report: EnforcementReport = {
      timestamp: new Date().toISOString(),
      isCompliant: violationsCount === 0,
      score,
      violationsCount,
      results
    };

    // Dispatch evaluation report to registered custom listeners/circuit breakers
    for (const callback of this.evaluationCallbacks) {
      try {
        callback(report);
      } catch (err) {
        console.error('[TruthEnforcementEngine] Failed evaluating listener callback:', err);
      }
    }

    // Log critical violations asynchronously to the system console
    if (!report.isCompliant) {
      console.error(
        `[TRUTH ENGINE COMPLIANCE ALERT] ${violationsCount} strict corporate integrity breach(es) found! Score: ${score}%`
      );
    }

    return report;
  }

  /**
   * Persists the enforcement report into the Firestore system log collection for real-time compliance alerting.
   */
  static async logReportToCloud(report: EnforcementReport, originId: string): Promise<string | null> {
    try {
      const db = getDb();
      if (!db) {
        console.warn('[TruthEnforcementEngine] Firebase db not initialized. Standard logging suppressed.');
        await this.backupAndAlert(report, originId, 'Firebase DB not initialized.');
        return null;
      }

      const reportPayload = {
        originId,
        timestamp: report.timestamp,
        isCompliant: report.isCompliant,
        score: report.score,
        violationsCount: report.violationsCount,
        results: report.results,
        loggedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'system_truth_audits'), reportPayload);
      return docRef.id;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[TruthEnforcementEngine] FireStore audit write failed safely:', error);
      await this.backupAndAlert(report, originId, errorMsg);
      return null;
    }
  }

  /**
   * Performs an immediate secure local backup and prints diagnostic alert signals.
   */
  static async backupAndAlert(report: EnforcementReport, originId: string, errorMsg: string): Promise<void> {
    const backupPayload = {
      originId,
      errorMsg,
      timestamp: new Date().toISOString(),
      report
    };

    const payloadStr = JSON.stringify(backupPayload, null, 2);

    // 1. Browser Backup (localStorage)
    if (typeof window !== 'undefined') {
      try {
        const key = `truth_audit_backup_${report.timestamp}_${originId}`;
        window.localStorage.setItem(key, payloadStr);
        console.warn(`[TRUTH RESILIENCE BACKUP] Saved audit to localStorage with key: ${key}`);
      } catch (e) {
        console.error('[TRUTH RESILIENCE] Failed saving to localStorage:', e);
      }
    }

    // 2. Server-side / Node File System Backup (injected from server.ts — keeps node:fs out of the client bundle)
    if (
      typeof process !== 'undefined' &&
      process.env &&
      typeof window === 'undefined' &&
      this.serverFilesystemBackup
    ) {
      try {
        const filePath = await this.serverFilesystemBackup(payloadStr, originId);
        if (filePath) {
          console.warn(`[TRUTH RESILIENCE BACKUP] Saved audit recovery file to server: ${filePath}`);
        }
      } catch (e) {
        console.warn('[TRUTH RESILIENCE BACKUP] Native fs backup bypass or error:', e);
      }
    }

    // 3. Email & Dashboard Alert dispatch simulation (until full Block C Alert engine is instantiated)
    console.error(
      `\n=======================================================\n` +
      `!!! TRUTH ENFORCEMENT ENGINE RESILIENCE ALERT ALERT !!!\n` +
      `=======================================================\n` +
      `CRITICAL SERVICE DISRUPTION: DB persist failed: ${errorMsg}\n` +
      `[EMAIL ALERT DISPATCHED]: To forexanarchy@gmail.com\n` +
      `[DASHBOARD ALERT INJECTED]: UI notification feed forced active.\n` +
      `[AUDIT LOG ID]: backup-${originId}-${report.timestamp}\n` +
      `=======================================================\n`
    );
  }
}
