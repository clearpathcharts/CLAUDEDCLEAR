/**
 * About page must include the homepage manifesto from
 * "Some people see patterns." onward.
 *
 * Run: npx tsx scripts/about-manifesto.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ABOUT_MANIFESTO_CLOSER, ABOUT_MANIFESTO_LEAD } from '../src/content/aboutManifesto.ts';

assert.match(ABOUT_MANIFESTO_LEAD, /^Some people see patterns\./);
assert.match(ABOUT_MANIFESTO_LEAD, /Some people need structure/);
assert.match(ABOUT_MANIFESTO_LEAD, /KNOWLEDGE BEFORE EXECUTION/);
assert.match(ABOUT_MANIFESTO_CLOSER, /The problem isn't the person/);
assert.match(ABOUT_MANIFESTO_CLOSER, /Charts should adapt to people/);

const aboutPage = fs.readFileSync(
  path.resolve('src/components/ExternalAboutPage.tsx'),
  'utf8',
);
assert.match(aboutPage, /ABOUT_MANIFESTO_LEAD/);
assert.match(aboutPage, /ABOUT_MANIFESTO_CLOSER/);
assert.match(aboutPage, /id="about-manifesto"/);
assert.match(aboutPage, /canonical="https:\/\/clearpathtrader.com\/about"/);

console.log('about-manifesto.selftest: ok');
