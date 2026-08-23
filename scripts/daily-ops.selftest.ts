/**
 * Daily Ops catalog + leftover-grant invariants.
 * Run: npx tsx scripts/daily-ops.selftest.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CATALOG,
  itemsForDay,
  pacificDateKey,
  SHIPPED_AS_OF_2026_08_18,
  OPEN_SITE_WORK,
} from "../src/server/dailyOpsCatalog";
import { INVESTOR_SEED, findInvestorSeed } from "../src/server/investorDesk";
import { featuredStocks } from "../src/server/crawlCatalog";
import { PAYMENTS_ENABLED } from "../src/lib/paymentsEnabled";
import { SUPPORTED_CHART_INDICATORS } from "../src/config/tradingViewIndicators";
import { themeProfiles } from "../src/lib/theme/profiles";

const ids = CATALOG.map((c) => c.id);
assert.equal(ids.length, new Set(ids).size, "catalog ids must be unique");
assert.ok(CATALOG.some((c) => c.survival), "need a survival subset");
assert.ok(CATALOG.filter((c) => c.kind === "auto").length >= 8, "auto checks too thin");
assert.ok(SHIPPED_AS_OF_2026_08_18.length >= 10, "shipped list should record real work");
assert.ok(OPEN_SITE_WORK.some((w) => w.id === "ava_voice"));

const today = itemsForDay();
assert.ok(today.some((i) => i.id === "auto_site_doctor"));
assert.ok(today.some((i) => i.id === "human_body"));
assert.ok(today.some((i) => i.id === "human_investor_send"));
assert.ok(
  today.filter((i) => i.section === "marketing" && i.kind === "human" && i.id.startsWith("human_post_")).length <= 2,
  "should not schedule four native posts on one day"
);

const date = pacificDateKey();
assert.match(date, /^\d{4}-\d{2}-\d{2}$/);

const invIds = INVESTOR_SEED.map((s) => s.id);
assert.equal(invIds.length, new Set(invIds).size, "investor ids unique");
for (const s of INVESTOR_SEED) {
  assert.ok(s.website.startsWith("https://"), `${s.id} website must be https`);
  assert.ok(s.whyClearPath.length > 20, `${s.id} needs a real why`);
}

const baird = INVESTOR_SEED.find((s) => s.id === "baird_augustine");
assert.ok(baird, "Ryan Baird / Baird Augustine must be in the catalog");
assert.equal(baird?.kind, "ib");
assert.ok(baird?.linkedin?.includes("ryandbaird"));
assert.ok(/not a (seed|broker)/i.test(`${baird?.stage} ${baird?.whyClearPath}`));

assert.equal(findInvestorSeed("Ryan Baird")?.id, "baird_augustine");
assert.equal(findInvestorSeed("baird")?.id, "baird_augustine");

const featured = featuredStocks(8);
const jpm = featured.find((s: { ticker?: string }) => String(s.ticker).toUpperCase() === "JPM");
assert.ok(jpm, "featured stocks should include JPM");
assert.match(String(jpm.company), /JPMorgan/i, "JPM must not be a procedural fake issuer");

assert.ok(SUPPORTED_CHART_INDICATORS.length >= 20);
assert.equal(Object.keys(themeProfiles).length, 13);

const membership = fs.readFileSync(path.join(process.cwd(), "src/hooks/useMembership.ts"), "utf8");
const tab = fs.readFileSync(path.join(process.cwd(), "src/components/MembershipTab.tsx"), "utf8");
assert.equal(/legacyPaid\s*=/.test(membership), false);
assert.equal(/handleSelfUpgrade/.test(tab), false);
assert.equal(/create-checkout-session/.test(tab), false);
assert.equal(/buy\.stripe\.com/.test(tab), false);
assert.equal(PAYMENTS_ENABLED, false, "billing must stay hard-off");
assert.equal(/vipStatus\s*===\s*['"]vip_pro['"]/.test(membership), false);
assert.equal(/vipStatus\s*===\s*['"]vip_pro['"]/.test(tab), false);

const rules = fs.readFileSync(path.join(process.cwd(), "firestore.rules"), "utf8");
assert.ok(rules.includes("vipStatus"));
assert.ok(rules.includes("noClientPrivilegeKeys"));

console.log(`daily-ops.selftest ok · catalog=${CATALOG.length} today=${today.length} investors=${INVESTOR_SEED.length} date=${date}`);
