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
import {
  INVESTOR_SEED,
  findInvestorSeed,
  buildInvestorDraftLetter,
  getInvestorCatalog,
  catalogKindCounts,
  catalogIdentityKey,
} from "../src/server/investorDesk";
import { featuredStocks } from "../src/server/crawlCatalog";
import { PAYMENTS_ENABLED } from "../src/lib/paymentsEnabled";
import { SUPPORTED_CHART_INDICATORS } from "../src/config/tradingViewIndicators";
import { themeProfiles } from "../src/lib/theme/profiles";
import {
  LEGAL_NON_ADVISORY_CLAUSE,
  LEGAL_POSITIONING_BLURB,
  legalNonAdvisoryClausePresent,
} from "../src/legal/nonAdvisoryCopy";
import { QUIZZES, isQuizPassed } from "../src/education/quizData";

const ids = CATALOG.map((c) => c.id);
assert.equal(ids.length, new Set(ids).size, "catalog ids must be unique");
assert.ok(CATALOG.some((c) => c.survival), "need a survival subset");
assert.ok(CATALOG.filter((c) => c.kind === "auto").length >= 8, "auto checks too thin");
assert.ok(SHIPPED_AS_OF_2026_08_18.length >= 10, "shipped list should record real work");
assert.ok(OPEN_SITE_WORK.some((w) => w.id === "ava_voice"));
assert.ok(OPEN_SITE_WORK.some((w) => w.id === "cloud_run_after_merge"));
assert.ok(OPEN_SITE_WORK.some((w) => w.id === "google_flow_section_guides"));
assert.equal(
  OPEN_SITE_WORK.some((w) => w.id === "stripe_first_charge"),
  false,
  "payments are hard-off — do not list first Stripe charge as open site work"
);
assert.equal(
  OPEN_SITE_WORK.some((w) => w.id === "github_token"),
  false,
  "GITHUB_TOKEN is optional skip, not open site work"
);

const today = itemsForDay();
assert.ok(today.some((i) => i.id === "auto_site_doctor"));
assert.ok(today.some((i) => i.id === "human_user_flow"));
assert.ok(today.some((i) => i.id === "human_money"));
assert.ok(today.some((i) => i.id === "human_outreach_one"));
assert.ok(today.some((i) => i.id === "human_investor_send"));
assert.equal(
  CATALOG.filter((c) => c.kind === "human" && c.survival).map((c) => c.id).sort().join(","),
  ["human_investor_send", "human_money", "human_outreach_one", "human_user_flow"].join(",")
);
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

const catalog = getInvestorCatalog();
const kinds = catalogKindCounts(catalog);
assert.ok(kinds.total >= 300, `catalog too thin: ${kinds.total}`);
assert.ok(kinds.vc >= 80, `need more VCs, got ${kinds.vc}`);
assert.ok(kinds.seed >= 40, `need more seed funds, got ${kinds.seed}`);
assert.ok(kinds.angel >= 80, `need more angels, got ${kinds.angel}`);
assert.ok(kinds.linkedin >= 80, `need public LinkedIn rows, got ${kinds.linkedin}`);
assert.ok(findInvestorSeed("naval")?.linkedin?.includes("linkedin.com"));
assert.ok(findInvestorSeed("jasoncalacanis")?.linkedin?.includes("linkedin.com"));
assert.ok(findInvestorSeed("pearvc") || findInvestorSeed("Pear VC"));
assert.ok(findInvestorSeed("hustlefund") || findInvestorSeed("Hustle Fund"));
assert.equal(catalog.map((s) => s.id).length, new Set(catalog.map((s) => s.id)).size);
const siteKeys = catalog.map((s) => catalogIdentityKey(s.linkedin || s.website));
assert.equal(siteKeys.length, new Set(siteKeys).size, "identical website listings must be collapsed");
const nameKeys = catalog.map((s) => s.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
assert.equal(nameKeys.length, new Set(nameKeys).size, "identical firm-name listings must be collapsed");
assert.ok(kinds.withEmail >= 150, `findfunding public emails missing, got ${kinds.withEmail}`);
assert.ok(findInvestorSeed("8VC")?.outreachEmail || findInvestorSeed("ff_8vc")?.outreachEmail);
assert.ok(findInvestorSeed("Cowboy Ventures")?.outreachEmail);
assert.equal(catalog.some((s) => (s.outreachEmail || "").startsWith("name@")), false);

const pipeline = findInvestorSeed("pipeline");
assert.ok(pipeline, "Pipeline Angels must be in the catalog");
const pipelineLetter = buildInvestorDraftLetter(pipeline!);
assert.match(pipelineLetter, /^Dear Pipeline Angels,/);
assert.match(buildInvestorDraftLetter(baird!), /^Dear Ryan,/);
assert.match(pipelineLetter, /https:\/\/clearpathtrader\.com/);
assert.match(pipelineLetter, /https:\/\/clearpathtrader\.com\/desk\/institutional/);
assert.match(pipelineLetter, /https:\/\/clearpathtrader\.com\/desk\/fundamental/);
assert.match(pipelineLetter, /https:\/\/clearpathtrader\.com\/desk\/retail/);
assert.match(pipelineLetter, /https:\/\/clearpathtrader\.com\/desk\/neurodivergent/);
assert.match(pipelineLetter, /not a brokerage/i);
assert.match(pipelineLetter, /do not provide trade advice/i);
assert.match(pipelineLetter, /Richard A\. Floyd/);
assert.doesNotMatch(pipelineLetter, /\$700B|dry powder|we are raising/i);

for (const seed of INVESTOR_SEED) {
  const letter = buildInvestorDraftLetter(seed);
  assert.match(letter, /https:\/\/clearpathtrader\.com\/desk\/institutional/, `${seed.id} letter must name Institutional`);
  assert.match(letter, /https:\/\/clearpathtrader\.com\/desk\/fundamental/, `${seed.id} letter must name Fundamental`);
  assert.match(letter, /https:\/\/clearpathtrader\.com\/desk\/retail/, `${seed.id} letter must name Retail`);
  assert.match(letter, /https:\/\/clearpathtrader\.com\/desk\/neurodivergent/, `${seed.id} letter must name Neurodivergent`);
}

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

assert.ok(legalNonAdvisoryClausePresent(LEGAL_NON_ADVISORY_CLAUSE));
assert.ok(legalNonAdvisoryClausePresent(LEGAL_POSITIONING_BLURB));
const footerSrc = fs.readFileSync(path.join(process.cwd(), "src/components/LegalFooter.tsx"), "utf8");
assert.ok(footerSrc.includes("LEGAL_POSITIONING_BLURB"), "LegalFooter must use bundled legal constant");

const quizzes = Object.values(QUIZZES);
assert.ok(quizzes.length >= 1, "need at least one education quiz");
assert.ok(quizzes.every((q) => q.passingScore >= 1));
const sample = quizzes[0]!;
assert.equal(isQuizPassed(sample.passingScore, sample), true);
assert.equal(isQuizPassed(Math.max(0, sample.passingScore - 1), sample), false);
const quizEngine = fs.readFileSync(path.join(process.cwd(), "src/education/QuizEngine.tsx"), "utf8");
assert.ok(quizEngine.includes("isQuizPassed"), "QuizEngine must use shared isQuizPassed helper");

const rules = fs.readFileSync(path.join(process.cwd(), "firestore.rules"), "utf8");
assert.ok(rules.includes("vipStatus"));
assert.ok(rules.includes("noClientPrivilegeKeys"));

console.log(`daily-ops.selftest ok · catalog=${CATALOG.length} today=${today.length} investors=${INVESTOR_SEED.length} date=${date}`);
