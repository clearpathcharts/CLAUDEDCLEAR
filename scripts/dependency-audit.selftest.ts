/**
 * CI guard: npm audit must report zero known vulnerabilities on the lockfile.
 * Run: npx tsx scripts/dependency-audit.selftest.ts
 */
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const out = execSync('npm audit --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const report = JSON.parse(out) as { metadata?: { vulnerabilities?: Record<string, number> } };
const vuln = report.metadata?.vulnerabilities ?? {};
const total = Object.values(vuln).reduce((sum, n) => sum + (Number(n) || 0), 0);
assert.equal(total, 0, `npm audit reported ${total} vulnerabilities: ${JSON.stringify(vuln)}`);

console.log('dependency-audit.selftest: ok (0 vulnerabilities)');
