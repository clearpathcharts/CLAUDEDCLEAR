/**
 * Product packages — membership ladder plus founder-added add-ons.
 *
 * The handwritten Basic / Silver / Gold / Platinum sheet stays the membership
 * source of truth (`planCatalog.ts`). This catalog wraps those four as locked
 * packages and lets the founder add more packages later.
 *
 * No list prices. Billing stays off (`PAYMENTS_ENABLED`).
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
  locked: boolean;
  addedAt: string;
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
}
