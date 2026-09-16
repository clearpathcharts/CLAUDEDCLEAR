/**
 * Founder-sheet membership catalog must stay byte-accurate vs the handwritten matrix.
 * Run: npx tsx scripts/plan-catalog.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SUPPORTED_CHART_INDICATORS } from '../src/config/tradingViewIndicators.ts';
import {
  BASIC_DRAWING_TOOLS,
  BASIC_INDICATOR_ABBRS,
  CANONICAL_PLANS,
  FEATURE_ACCURACY,
  PLAN_CATALOG,
  PRACTICAL_CHART_SLOT_CAP,
  SILVER_INDICATOR_ABBRS,
  canonicalizePlanId,
  formatLimit,
  isDrawingToolAllowed,
  isIndicatorAllowed,
  isUnlimited,
  planOf,
  practicalChartSlots,
} from '../src/lib/planCatalog.ts';
import {
  FEATURE_MIN_TIER,
  TIER_RANK,
  hasFeatureForRank,
  tierRankOf,
  unlockedFeatures,
} from '../src/lib/entitlements.ts';
import { getCandleLimit } from '../src/config/tierLimits.ts';
import {
  capMarketSlots,
  createEmptyMarketSlots,
  MARKET_CHART_SLOT_COUNT_MAX,
} from '../src/constants/chartLayout.ts';
import {
  ALL_ADDONS_CENTS,
  FIRST_FREE_DAYS,
  LAUNCH_ACCESS_DAYS,
  MEMBERSHIP_PLANS,
  PLAN_TRIAL_DAYS,
  PLATINUM_CENTS,
  SILVER_ADDONS,
  SILVER_BASE_CENTS,
  SILVER_WITH_ALL_ADDONS_CENTS,
} from '../src/content/membershipPricing.ts';
import {
  LAUNCH_TRIAL_DAYS as STRIPE_LAUNCH_TRIAL_DAYS,
  PLAN_TRIAL_DAYS as STRIPE_PLAN_TRIAL_DAYS,
} from '../src/server/stripeService.ts';

assert.deepEqual([...CANONICAL_PLANS], ['basic', 'silver', 'gold', 'platinum']);
assert.deepEqual(MEMBERSHIP_PLANS.map((plan) => plan.priceCents), [0, 599, 999, 2499]);
assert.equal(SILVER_ADDONS.length, 7);
assert.equal(ALL_ADDONS_CENTS, 4493);
assert.equal(SILVER_BASE_CENTS, 599);
assert.equal(SILVER_WITH_ALL_ADDONS_CENTS, 5092);
assert.equal(PLATINUM_CENTS, 2499);
assert.equal(FIRST_FREE_DAYS, 30);
assert.equal(LAUNCH_ACCESS_DAYS, STRIPE_LAUNCH_TRIAL_DAYS);
assert.equal(PLAN_TRIAL_DAYS, STRIPE_PLAN_TRIAL_DAYS);
assert.equal(LAUNCH_ACCESS_DAYS + PLAN_TRIAL_DAYS, FIRST_FREE_DAYS);

for (const id of CANONICAL_PLANS) {
  const plan = PLAN_CATALOG[id] as Record<string, unknown>;
  assert.equal('priceMonthlyCents' in plan, false, `${id} must not publish a list price`);
  assert.equal('priceLabel' in plan, false, `${id} must not publish a price label`);
}

assert.equal(PLAN_CATALOG.basic.limits.chartsPerWindow, 1);
assert.equal(PLAN_CATALOG.silver.limits.chartsPerWindow, 4);
assert.equal(PLAN_CATALOG.gold.limits.chartsPerWindow, 10);
assert.ok(isUnlimited(PLAN_CATALOG.platinum.limits.chartsPerWindow));

assert.equal(PLAN_CATALOG.basic.limits.indicators, 5);
assert.equal(PLAN_CATALOG.silver.limits.indicators, 15);
assert.equal(PLAN_CATALOG.gold.limits.indicators, SUPPORTED_CHART_INDICATORS.length);
assert.equal(BASIC_INDICATOR_ABBRS.length, 5);
assert.equal(SILVER_INDICATOR_ABBRS.length, 15);

assert.equal(PLAN_CATALOG.basic.limits.alerts, 3);
assert.ok(isUnlimited(PLAN_CATALOG.silver.limits.alerts));
assert.equal(PLAN_CATALOG.basic.limits.watchlists, 5);
assert.ok(isUnlimited(PLAN_CATALOG.silver.limits.watchlists));
assert.ok(isUnlimited(PLAN_CATALOG.gold.limits.watchlists));
assert.ok(isUnlimited(PLAN_CATALOG.platinum.limits.watchlists));

assert.equal(PLAN_CATALOG.basic.limits.historicalYearsClaim, 7);
assert.equal(PLAN_CATALOG.silver.limits.historicalYearsClaim, null);
assert.equal(FEATURE_ACCURACY.historicalYearsClaim, 'vendor_capped');
assert.equal(getCandleLimit('basic'), 5000);
assert.equal(getCandleLimit('silver'), 5000);
assert.equal(getCandleLimit('platinum'), 5000);
assert.equal(getCandleLimit('BRONZE'), 5000);
assert.equal(getCandleLimit('VIP'), 5000);

assert.equal(PLAN_CATALOG.basic.limits.intradayCharts, false);
assert.equal(PLAN_CATALOG.silver.limits.intradayCharts, true);

assert.equal(PLAN_CATALOG.basic.flags.blackoutMode, false);
assert.equal(PLAN_CATALOG.silver.flags.blackoutMode, true);
assert.equal(PLAN_CATALOG.gold.flags.patternOverlay, true);
assert.equal(PLAN_CATALOG.silver.flags.patternOverlay, false);
assert.equal(PLAN_CATALOG.gold.flags.indaCreator, true);
assert.equal(PLAN_CATALOG.platinum.flags.aiPatternScanner, true);
assert.equal(PLAN_CATALOG.gold.flags.aiPatternScanner, false);
assert.equal(PLAN_CATALOG.platinum.flags.bots, true);
assert.equal(FEATURE_ACCURACY.marketReplay, 'partial');

assert.equal(canonicalizePlanId('pro'), 'silver');
assert.equal(canonicalizePlanId('proplus'), 'gold');
assert.equal(canonicalizePlanId('premium'), 'gold');
assert.equal(canonicalizePlanId('ultimate'), 'platinum');
assert.equal(canonicalizePlanId('VIP'), 'platinum');
assert.equal(tierRankOf('ultimate'), TIER_RANK.platinum);
assert.equal(tierRankOf('free'), 0);

assert.equal(hasFeatureForRank(0, 'alerts'), true);
assert.equal(hasFeatureForRank(0, 'multiChart'), false);
assert.equal(hasFeatureForRank(1, 'blackoutMode'), true);
assert.equal(hasFeatureForRank(2, 'indaCreator'), true);
assert.equal(hasFeatureForRank(2, 'aiScanner'), false);
assert.equal(hasFeatureForRank(3, 'aiScanner'), true);
assert.ok(unlockedFeatures('gold').includes('indaCreator'));
assert.equal(unlockedFeatures('basic').includes('encyclopedia'), false);

assert.equal(isIndicatorAllowed('basic', 'SMA'), true);
assert.equal(isIndicatorAllowed('basic', 'ICHIMOKU'), false);
assert.equal(isIndicatorAllowed('gold', 'ICHIMOKU'), true);
assert.equal(isDrawingToolAllowed('basic', 'trend'), true);
assert.equal(isDrawingToolAllowed('basic', 'fib'), false);
assert.equal(isDrawingToolAllowed('silver', 'fib'), true);
assert.equal(BASIC_DRAWING_TOOLS.includes('gann'), false);

assert.equal(practicalChartSlots('basic'), 1);
assert.equal(practicalChartSlots('silver'), 4);
assert.equal(practicalChartSlots('gold'), 10);
assert.equal(practicalChartSlots('platinum'), PRACTICAL_CHART_SLOT_CAP);
assert.equal(PRACTICAL_CHART_SLOT_CAP, MARKET_CHART_SLOT_COUNT_MAX);

const capped = capMarketSlots(createEmptyMarketSlots(3), 1);
assert.equal(capped.length, 1);
const grown = capMarketSlots(createEmptyMarketSlots(1), 4);
assert.equal(grown.length, 4);

assert.equal(formatLimit(PLAN_CATALOG.platinum.limits.watchlists), 'Unlimited');
assert.equal(planOf('plus').id, 'silver');
assert.equal(FEATURE_MIN_TIER.indaCreator, 'gold');
assert.equal(FEATURE_MIN_TIER.workspace, 'platinum');

const goldSheet = PLAN_CATALOG.gold.sheetLines.join(' ').toLowerCase();
assert.match(goldSheet, /pattern overlay/);
assert.match(goldSheet, /indacreator/);
assert.match(PLAN_CATALOG.platinum.sheetLines.join(' ').toLowerCase(), /bots/);

{
  const src = fs.readFileSync(new URL('../src/lib/planCatalog.ts', import.meta.url), 'utf8');
  const table = fs.readFileSync(new URL('../src/components/PlanComparisonTable.tsx', import.meta.url), 'utf8');
  const page = fs.readFileSync(new URL('../src/components/membership/MembershipPricingPage.tsx', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /8\.99|49\.99|89\.99/);
  assert.doesNotMatch(table, /8\.99|49\.99|89\.99/);
  assert.doesNotMatch(table, /label: 'Price'/);
  assert.match(page, /Visual \+ legal review stage/);
  assert.match(page, /Checkout remains disabled/);
  assert.match(page, /SILVER_WITH_ALL_ADDONS_CENTS/);
  assert.match(page, /Your first \{FIRST_FREE_DAYS\} days are free/);
  assert.match(app, /<MembershipPricingPage \/>/);
}

console.log('plan-catalog.selftest: ok');
