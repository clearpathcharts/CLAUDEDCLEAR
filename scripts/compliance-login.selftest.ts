/**
 * Regulatory compliance dialog after Private Login.
 * Run: npm run test:compliance-login
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  COMPLIANCE_LOGIN_FLAG_KEY,
  clearComplianceLoginFlag,
  hasComplianceLoginFlag,
  markCompliancePopupForNextLoad,
} from '../src/lib/complianceLoginFlag.ts';

const store = new Map<string, string>();
(globalThis as any).sessionStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => {
    store.set(k, String(v));
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
};

assert.equal(hasComplianceLoginFlag(), false);
markCompliancePopupForNextLoad();
assert.equal(store.get(COMPLIANCE_LOGIN_FLAG_KEY), '1');
assert.equal(hasComplianceLoginFlag(), true);
clearComplianceLoginFlag();
assert.equal(hasComplianceLoginFlag(), false);

const root = path.resolve('.');
const desk = fs.readFileSync(path.join(root, 'src/components/PrivateLoginDesk.tsx'), 'utf8');
assert.equal(desk.split('markCompliancePopupForNextLoad()').length - 1, 3);

const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
assert.match(app, /RegulatoryComplianceLoginPopup/);

const popup = fs.readFileSync(
  path.join(root, 'src/components/compliance/RegulatoryComplianceLoginPopup.tsx'),
  'utf8',
);
assert.match(popup, /get\('compliance'\) === '1'/);
assert.match(popup, /Continue to desk/);
assert.match(popup, /RegulatoryComplianceCard/);
assert.match(popup, /setTermsOpen\(true\)/);

const card = fs.readFileSync(
  path.join(root, 'src/components/compliance/RegulatoryComplianceCard.tsx'),
  'utf8',
);
assert.match(card, /REGULATORY COMPLIANCE/);
assert.match(card, /Update Compliance Status/);
assert.doesNotMatch(card, /buy now|guaranteed profit/i);

const hub = fs.readFileSync(path.join(root, 'src/components/ProfileHub.tsx'), 'utf8');
assert.match(hub, /RegulatoryComplianceCard/);
assert.doesNotMatch(hub, /COMMUNITY INCENTIVES/);

console.log('compliance-login.selftest: ok');
