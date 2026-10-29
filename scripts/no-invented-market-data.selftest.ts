/**
 * Guard: member-facing market / macro numbers must come from a vendor or render
 * DATA UNAVAILABLE. Fails CI if known fabrication patterns reappear anywhere in src/.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const BANNED: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /returning simulated/i, why: 'fallback that substitutes simulated values' },
  { pattern: /Randomize market prices/i, why: 'random price nudges presented as live' },
  { pattern: /(high|low):\s*\(Math\.(max|min)\(price/, why: 'padded high/low not from market data' },
  { pattern: /latency:\s*['"]\d+(\.\d+)?ms['"]/, why: 'hardcoded latency reported as measured' },
  { pattern: /latencyMs\s*\|\|\s*\d+/, why: 'invented latency default' },
  { pattern: /value:\s*26000\s*\+/, why: 'synthetic GDP series' },
  { pattern: /'5\.25 - 5\.50%'/, why: 'hardcoded Fed Funds rate' },
  { pattern: /Locked in \+45 pips/, why: 'fabricated trade testimonial' },
  { pattern: /value:\s*68420/, why: 'hardcoded BTC price' },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = [...walk(path.join(ROOT, 'src')), path.join(ROOT, 'websockets.ts'), path.join(ROOT, 'server.ts')];
const failures: string[] = [];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { pattern, why } of BANNED) {
      if (pattern.test(line)) failures.push(`${path.relative(ROOT, file)}:${i + 1} — ${why}`);
    }
  });
}

assert.deepEqual(failures, [], `Invented market data found:\n${failures.join('\n')}`);
console.log(`no-invented-market-data.selftest: OK (${files.length} files scanned)`);
