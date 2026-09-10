/**
 * Guard: banned third-party automation vendors must not re-enter the GitHub tree.
 * Run: npm run test:no-third-party-automation
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const CREW = 'crew' + 'ai';
const ZAP = 'zap' + 'ier';
const MAKE_HOST = 'make' + '.com';
const MAKE_ENV = 'MAKE_' + 'WEBHOOK';
const INTEGRO = 'integro' + 'mat';

const skipFiles = new Set(['data/disposable-email-domains.txt']);

const needles = [CREW, ZAP, MAKE_HOST, MAKE_ENV, INTEGRO];

function gitFiles(): string[] {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'buffer' });
  return out
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
}

assert.equal(fs.existsSync(path.join(root, CREW)), false, `${CREW}/ directory must be gone`);
assert.equal(
  fs.existsSync(path.join(root, 'automation', 'clearpath_growth_os')),
  false,
  'automation/clearpath_growth_os must be gone'
);

const hits: string[] = [];
for (const rel of gitFiles()) {
  if (skipFiles.has(rel)) continue;
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
  let text: string;
  try {
    text = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  const lower = text.toLowerCase();
  for (const needle of needles) {
    if (lower.includes(needle.toLowerCase())) {
      hits.push(`${rel}: ${needle}`);
    }
  }
}

assert.equal(hits.length, 0, `banned automation vendors still in GitHub files:\n${hits.join('\n')}`);

console.log('no-third-party-automation.selftest: OK');
console.log(`  scanned git files; ${CREW}/${ZAP}/${MAKE_HOST} absent`);
