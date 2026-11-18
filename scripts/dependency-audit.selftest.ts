/**
 * CI guard: npm audit must report zero *actionable* vulnerabilities.
 *
 * GHSA-fc5q-39xc-vjpf (picomatch ReDoS via single-branch repeated extglobs) is
 * allowlisted until micromatch publishes a release newer than 4.0.7 — the
 * advisory currently lists every version (first_patched_version: null) and
 * open fix PRs are not yet released. Vite/tinyglobby inherit that finding.
 *
 * Remove the allowlist as soon as `npm view picomatch version` is >4.0.7
 * (or npm audit clears it). Do NOT expand this list casually.
 *
 * Run: npx tsx scripts/dependency-audit.selftest.ts
 */
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

/** Advisories with no published patched release yet — keep this list tiny. */
const TEMPORARY_UNPATCHED_ADVISORIES = new Set([
  'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
]);

type AuditVia = string | { source?: number; name?: string; url?: string; title?: string };
type AuditVuln = {
  name?: string;
  severity?: string;
  via?: AuditVia[];
  effects?: string[];
};

function advisoryUrls(v: AuditVuln): string[] {
  const out: string[] = [];
  for (const item of v.via || []) {
    if (typeof item === 'object' && item && typeof item.url === 'string') out.push(item.url);
  }
  return out;
}

function isOnlyAllowlisted(v: AuditVuln, byName: Map<string, AuditVuln>): boolean {
  const urls = advisoryUrls(v);
  if (urls.length > 0) {
    return urls.every((u) => TEMPORARY_UNPATCHED_ADVISORIES.has(u));
  }
  // Transitive "via": ["picomatch"] entries — allow only if every named via
  // package is itself allowlisted-only.
  const viaNames = (v.via || []).filter((x): x is string => typeof x === 'string');
  if (viaNames.length === 0) return false;
  return viaNames.every((name) => {
    const parent = byName.get(name);
    return parent ? isOnlyAllowlisted(parent, byName) : false;
  });
}

let out = '';
try {
  out = execSync('npm audit --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (err: any) {
  // npm audit exits non-zero when any advisory is present; JSON is still on stdout.
  out = String(err?.stdout || '');
  assert.ok(out.trim(), `npm audit failed without JSON output: ${err?.message || err}`);
}
const report = JSON.parse(out) as {
  metadata?: { vulnerabilities?: Record<string, number> };
  vulnerabilities?: Record<string, AuditVuln>;
};

const vulns = report.vulnerabilities || {};
const byName = new Map(Object.entries(vulns).map(([k, v]) => [k, { ...v, name: v.name || k }]));

const blockers: string[] = [];
const allowlisted: string[] = [];
for (const [name, v] of byName) {
  if (isOnlyAllowlisted(v, byName)) {
    allowlisted.push(name);
    continue;
  }
  blockers.push(`${name} (${v.severity || 'unknown'}) via=${JSON.stringify(v.via || [])}`);
}

assert.equal(
  blockers.length,
  0,
  `npm audit reported non-allowlisted vulnerabilities:\n${blockers.join('\n')}`,
);

const meta = report.metadata?.vulnerabilities ?? {};
const total =
  typeof meta.total === 'number'
    ? meta.total
    : ['info', 'low', 'moderate', 'high', 'critical'].reduce(
        (sum, k) => sum + (Number(meta[k]) || 0),
        0,
      );
console.log(
  `dependency-audit.selftest: ok (${total} advisory hit(s), ${allowlisted.length} temporarily allowlisted pending picomatch release: ${allowlisted.join(', ') || 'none'})`,
);
