/**
 * Product overview PDF must ship with the press kit.
 * Run: npx tsx scripts/brochure-pdf.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pdf = path.resolve('public/press/ClearPath-Trader-Product-Overview.pdf');
const html = path.resolve('docs/marketing/product-overview.html');
const press = fs.readFileSync(path.resolve('src/components/PressKitPage.tsx'), 'utf8');

assert.equal(fs.existsSync(html), true, 'brochure HTML source missing');
assert.equal(fs.existsSync(pdf), true, 'brochure PDF missing from public/press');
assert.ok(fs.statSync(pdf).size > 50_000, 'brochure PDF is suspiciously small');
assert.match(press, /ClearPath-Trader-Product-Overview\.pdf/);
assert.match(press, /Product overview PDF/);
assert.match(fs.readFileSync(html, 'utf8'), /Not a brokerage/);
assert.match(fs.readFileSync(html, 'utf8'), /\/desk\/neurodivergent/);
assert.doesNotMatch(fs.readFileSync(html, 'utf8'), /guaranteed returns/i);

console.log('brochure-pdf.selftest: ok');
