/**
 * Product packages — membership ladder plus Silver add-ons.
 *
 * Membership (Basic → Platinum) stays the handwritten feature sheet and
 * publishes no list prices. Add-ons are a separate sheet: Silver + extras.
 * Add-on cents are founder-sheet amounts, not live checkout.
 *
 * Billing stays off (`PAYMENTS_ENABLED`).
 */

import {
  CANONICAL_PLANS,
  FEATURE_ACCURACY,
  PLAN_CATALOG,
  type CanonicalPlanId,
  type FeatureAccuracy,
  type PlanFlags,
} from './planCatalog';

export const PACKAGE_KINDS = ['membership', 'add_on'] as const;
export type PackageKind = (typeof PACKAGE_KINDS)[number];

export const PACKAGE_STATUSES = ['shipped', 'partial', 'planned', 'draft'] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export type ProductPackage = {
  id: string;
  name: string;
  kind: PackageKind;
  status: PackageStatus;
  summary: string;
  includes: string[];
  /** Membership packages map onto the founder sheet. */
  planId?: CanonicalPlanId;
  /** Sheet add-ons stack on Silver. */
  stacksOn?: CanonicalPlanId;
  /** Add-ons only. Membership packages must omit this. */
  priceMonthlyCents?: number;
  locked: boolean;
  addedAt: string;
};

/** Founder sheet — Custom Package (Silver + add-ons). Not membership tiers. */
export const SHEET_ADD_ONS = [
  {
    id: 'addon-unlimited-charts',
    name: 'Unlimited Charts',
    priceMonthlyCents: 699,
    status: 'enforced' as const,
    includes: ['Unlimited charts per window on top of Silver'],
  },
  {
    id: 'addon-unlimited-indicators',
    name: 'Unlimited Indicators',
    priceMonthlyCents: 699,
    status: 'enforced' as const,
    includes: ['Full indicator bank on top of Silver’s 15'],
  },
  {
    id: 'addon-unlimited-watchlist',
    name: 'Unlimited Watchlist',
    priceMonthlyCents: 199,
    status: 'enforced' as const,
    includes: ['Unlimited watchlists on top of Silver’s 8'],
  },
  {
    id: 'addon-market-replay',
    name: 'Market Replay',
    priceMonthlyCents: 599,
    status: 'planned' as const,
    includes: ['Historical bar replay on the desk you are using'],
  },
  {
    id: 'addon-indacreator',
    name: 'IndaCreator',
    priceMonthlyCents: 599,
    status: 'enforced' as const,
    includes: ['INDACREATOR / River — build and explain custom indicators'],
  },
  {
    id: 'addon-pattern-overlay',
    name: 'Pattern Overlay',
    priceMonthlyCents: 1299,
    status: 'enforced' as const,
    includes: ['Educational pattern overlay on the live chart'],
  },
  {
    id: 'addon-ai-pattern-scanner',
    name: 'AI Pattern Scanner',
    priceMonthlyCents: 1499,
    status: 'partial' as const,
    includes: ['Pattern scanner + Structure Read (educational)'],
  },
  {
    id: 'addon-bots',
    name: 'Ability to add Bots',
    priceMonthlyCents: 599,
    status: 'partial' as const,
    includes: ['Bot / automation slot — not live broker execution'],
  },
] as const;

const ADDON_STATUS: Record<(typeof SHEET_ADD_ONS)[number]['status'], PackageStatus> = {
  enforced: 'shipped',
  planned: 'planned',
  partial: 'partial',
};

function flagAccuracy(flags: PlanFlags): FeatureAccuracy[] {
  return (Object.keys(flags) as (keyof PlanFlags)[])
    .filter((k) => flags[k])
    .map((k) => FEATURE_ACCURACY[k]);
}

/** A membership package is partial until every claimed flag is enforced. */
export function membershipPackageStatus(planId: CanonicalPlanId): PackageStatus {
  const acc = flagAccuracy(PLAN_CATALOG[planId].flags);
  if (acc.includes('planned') || acc.includes('partial')) return 'partial';
  return 'shipped';
}

export function membershipPackages(): ProductPackage[] {
  return CANONICAL_PLANS.map((id) => {
    const plan = PLAN_CATALOG[id];
    return {
      id: `membership-${id}`,
      name: `ClearPath ${plan.label}`,
      kind: 'membership' as const,
      status: membershipPackageStatus(id),
      summary: `${plan.label} membership — feature unlocks from the founder sheet. No list price.`,
      includes: [...plan.sheetLines],
      planId: id,
      locked: true,
      addedAt: '2026-08-18T00:00:00.000Z',
    };
  });
}

export function sheetAddOnPackages(): ProductPackage[] {
  return SHEET_ADD_ONS.map((row) => ({
    id: row.id,
    name: row.name,
    kind: 'add_on' as const,
    status: ADDON_STATUS[row.status],
    summary: `Silver add-on only — not a membership tier. Sheet price $${(row.priceMonthlyCents / 100).toFixed(2)} / mo. Checkout is off.`,
    includes: [...row.includes],
    stacksOn: 'silver' as const,
    priceMonthlyCents: row.priceMonthlyCents,
    locked: true,
    addedAt: '2026-09-04T00:00:00.000Z',
  }));
}

export function isSheetAddOnId(id: string): boolean {
  return SHEET_ADD_ONS.some((row) => row.id === id);
}

export function formatAddonPrice(cents: number | undefined): string | null {
  if (typeof cents !== 'number' || !Number.isFinite(cents) || cents <= 0) return null;
  return `$${(cents / 100).toFixed(2)} / mo`;
}

export function isPackageKind(value: unknown): value is PackageKind {
  return typeof value === 'string' && (PACKAGE_KINDS as readonly string[]).includes(value);
}

export function isPackageStatus(value: unknown): value is PackageStatus {
  return typeof value === 'string' && (PACKAGE_STATUSES as readonly string[]).includes(value);
}

export function slugifyPackageId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'package';
}

const LIST_PRICE_KEYS = ['price', 'priceLabel', 'monthlyCents', 'yearlyCents'] as const;

export function assertNoListPrice(pkg: ProductPackage): void {
  const rec = pkg as unknown as Record<string, unknown>;
  for (const key of LIST_PRICE_KEYS) {
    if (key in rec) {
      throw new Error(`${pkg.id} must not publish a list price`);
    }
  }
  if (pkg.kind === 'membership' && pkg.priceMonthlyCents != null) {
    throw new Error(`${pkg.id} membership must not publish a list price`);
  }
}
