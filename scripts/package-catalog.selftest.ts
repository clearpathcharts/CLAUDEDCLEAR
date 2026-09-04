/**
 * Product packages: four locked membership packages + Silver add-ons + extras.
 * Membership has no list prices. Add-ons may. Run: npx tsx scripts/package-catalog.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CANONICAL_PLANS } from '../src/lib/planCatalog.ts';
import {
  SHEET_ADD_ONS,
  assertNoListPrice,
  formatAddonPrice,
  isSheetAddOnId,
  membershipPackageStatus,
  membershipPackages,
  sheetAddOnPackages,
  slugifyPackageId,
} from '../src/lib/packageCatalog.ts';

const tmp = path.join(os.tmpdir(), `clearpath-packages-${Date.now()}.json`);
process.env.CLEARPATH_PACKAGES_FILE = tmp;

const { addPackage, listPackages, removePackage } = await import(
  '../src/server/packageCatalogService.ts'
);

const membership = membershipPackages();
assert.equal(membership.length, 4);
assert.deepEqual(
  membership.map((p) => p.planId),
  [...CANONICAL_PLANS]
);
for (const pkg of membership) {
  assert.equal(pkg.kind, 'membership');
  assert.equal(pkg.locked, true);
  assert.equal(pkg.priceMonthlyCents, undefined);
  assert.ok(pkg.includes.length > 0);
  assertNoListPrice(pkg);
}

const sheet = sheetAddOnPackages();
assert.equal(sheet.length, 8);
assert.deepEqual(
  sheet.map((p) => p.name),
  [
    'Unlimited Charts',
    'Unlimited Indicators',
    'Unlimited Watchlist',
    'Market Replay',
    'IndaCreator',
    'Pattern Overlay',
    'AI Pattern Scanner',
    'Ability to add Bots',
  ]
);
assert.deepEqual(
  sheet.map((p) => p.priceMonthlyCents),
  [699, 699, 199, 599, 599, 1299, 1499, 599]
);
for (const pkg of sheet) {
  assert.equal(pkg.kind, 'add_on');
  assert.equal(pkg.stacksOn, 'silver');
  assert.equal(pkg.locked, true);
  assert.ok(isSheetAddOnId(pkg.id));
  assert.equal(formatAddonPrice(pkg.priceMonthlyCents)?.endsWith(' / mo'), true);
}

assert.equal(SHEET_ADD_ONS.length, 8);
assert.equal(membershipPackageStatus('basic'), 'partial');
assert.equal(membershipPackageStatus('silver'), 'partial');
assert.equal(slugifyPackageId('Chart Reminders Pack'), 'chart-reminders-pack');

const listed = listPackages();
assert.equal(listed.length, 12);
assert.equal(
  listed.filter((p) => p.kind === 'add_on').length,
  8
);
assert.equal(
  listed.filter((p) => p.kind === 'membership').every((p) => p.priceMonthlyCents == null),
  true
);

const created = addPackage({
  name: 'Chart Reminders',
  summary: 'Custom chart reminders — extra add-on.',
  includes: ['Per-chart reminder notes', 'Desk restore from Held file'],
  status: 'planned',
});
assert.equal(created.kind, 'add_on');
assert.equal(created.locked, false);
assert.equal(created.status, 'planned');
assert.equal(created.name, 'Chart Reminders');
assert.equal(created.priceMonthlyCents, undefined);
assertNoListPrice(created);
assert.equal(listPackages().length, 13);

const second = addPackage({ name: 'Ok Pack' });
assert.match(second.id, /^addon-ok-pack/);

try {
  addPackage({ name: 'A' });
  assert.fail('short name should fail');
} catch (err) {
  assert.match((err as Error).message, /at least 2/);
}

try {
  removePackage('membership-gold');
  assert.fail('locked membership package should not delete');
} catch (err) {
  assert.match((err as Error).message, /locked/);
}

try {
  removePackage('addon-pattern-overlay');
  assert.fail('sheet add-on should not delete');
} catch (err) {
  assert.match((err as Error).message, /locked/);
}

assert.equal(removePackage(created.id), true);
assert.equal(
  listPackages().filter((p) => p.id === created.id).length,
  0
);

const src = fs.readFileSync(new URL('../src/lib/packageCatalog.ts', import.meta.url), 'utf8');
const panel = fs.readFileSync(new URL('../src/components/PackagesPanel.tsx', import.meta.url), 'utf8');
const tab = fs.readFileSync(new URL('../src/components/MembershipTab.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(src, /8\.99|49\.99|89\.99/);
assert.doesNotMatch(panel, /Checkout/);
assert.match(tab, /PackagesPanel/);
assert.match(panel, /Silver add-ons only/);
assert.match(panel, /Add a package/);

const planSrc = fs.readFileSync(new URL('../src/lib/planCatalog.ts', import.meta.url), 'utf8');
assert.doesNotMatch(planSrc, /priceMonthlyCents/);

try {
  fs.unlinkSync(tmp);
} catch {
  /* ignore */
}

console.log('package-catalog.selftest: ok');
