/**
 * Server-trusted membership resolution + feature gates for paid API routes.
 */
import type { Request, Response } from 'express';
import { ensureAdminApp } from './firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { getPrivateSessionUser } from './authGuards';
import { isFounderEmail, isFounderFirebaseUid } from '../lib/founder';
import { readProfile, refreshProfileFromDurable, writeProfile } from './profileStore';
import { grantReportForEmails } from './membershipGrants';
import {
  getMembershipStatus,
  pickRicherMembershipReport,
  reconcileStripeMembershipForUid,
  type MembershipStatusReport,
} from './stripeService';
import { hasFeatureForRank, tierRankOf, type FeatureKey, FEATURE_MIN_TIER, TIER_LABEL } from '../lib/entitlements';

export async function collectAuthorizedMembershipUids(req: Request): Promise<Set<string>> {
  return (await collectAuthorizedMembers(req)).uids;
}

/** Signed-in uids plus emails trusted for complimentary grants (private session, or a verified Google email). */
async function collectAuthorizedMembers(req: Request): Promise<{ uids: Set<string>; emails: Set<string> }> {
  const sessionUser = getPrivateSessionUser(req);
  const uids = new Set<string>();
  const emails = new Set<string>();
  if (sessionUser?.uid) uids.add(sessionUser.uid);
  if (sessionUser?.uid && sessionUser.email) emails.add(sessionUser.email.trim().toLowerCase());

  const header = req.get('authorization') || '';
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  if (bearer?.[1] && ensureAdminApp()) {
    try {
      const decoded = await getAuth().verifyIdToken(bearer[1].trim());
      const bearerEmail = String(decoded.email || '').trim().toLowerCase();
      const sessionEmail = String(sessionUser?.email || '').trim().toLowerCase();
      const sameInbox = Boolean(bearerEmail && sessionEmail && bearerEmail === sessionEmail);
      if (decoded.uid && (!sessionUser?.uid || sameInbox)) {
        uids.add(decoded.uid);
        if (bearerEmail && decoded.email_verified === true) emails.add(bearerEmail);
      }
    } catch {
      /* private cookie can still authorize */
    }
  }
  return { uids, emails };
}

async function founderBypass(req: Request): Promise<boolean> {
  const header = req.get('authorization') || '';
  const bearer = header.match(/^Bearer\s+(.+)$/i);
  if (!bearer?.[1] || !ensureAdminApp()) return false;
  try {
    const decoded = await getAuth().verifyIdToken(bearer[1].trim());
    const email = String(decoded.email || '').trim().toLowerCase();
    const uid = String(decoded.uid || '');
    return isFounderEmail(email) && isFounderFirebaseUid(uid);
  } catch {
    return false;
  }
}

export async function hydrateMembershipUids(uids: Set<string>): Promise<void> {
  for (const uid of uids) await refreshProfileFromDurable(uid);
  for (const uid of [...uids]) {
    for (const extra of readProfile(uid)?.membershipLinkedUids || []) {
      if (extra) uids.add(extra);
    }
  }
  for (const uid of uids) await refreshProfileFromDurable(uid);
  if (uids.size > 1) {
    for (const id of uids) {
      const others = [...uids].filter((uid) => uid !== id);
      const prev = readProfile(id)?.membershipLinkedUids || [];
      const merged = [...new Set([...prev, ...others])];
      if (merged.length > prev.length) writeProfile(id, { membershipLinkedUids: merged });
    }
  }
}

export async function resolveMembershipReportForRequest(req: Request, options?: { syncStripe?: boolean }): Promise<{
  uids: Set<string>;
  status: MembershipStatusReport;
}> {
  const { uids, emails } = await collectAuthorizedMembers(req);
  if (uids.size === 0) {
    return { uids, status: { active: false, tier: null, status: null } };
  }
  await hydrateMembershipUids(uids);
  if (options?.syncStripe !== false) {
    for (const uid of uids) {
      try {
        await reconcileStripeMembershipForUid(uid);
      } catch (err) {
        console.warn('[membership] Stripe reconcile skipped:', err);
      }
    }
  }
  const reports = [...uids].map((uid) => getMembershipStatus(uid));
  const grant = await grantReportForEmails(emails);
  const status = pickRicherMembershipReport(grant ? [...reports, grant] : reports);
  return { uids, status };
}

/**
 * Enforce a plan feature on a paid API route. Founder Google token bypasses gates.
 */
export async function requireMembershipFeature(
  req: Request,
  res: Response,
  feature: FeatureKey,
): Promise<{ ok: true; status: MembershipStatusReport; primaryUid: string } | { ok: false }> {
  if (await founderBypass(req)) {
    return {
      ok: true,
      status: { active: true, tier: 'platinum', status: 'founder' },
      primaryUid: getPrivateSessionUser(req)?.uid || 'founder',
    };
  }
  const { uids, status } = await resolveMembershipReportForRequest(req);
  if (uids.size === 0) {
    res.status(401).json({ error: 'Sign in to use this feature.' });
    return { ok: false };
  }
  const effectiveTier = status.active ? status.tier : 'basic';
  const rank = tierRankOf(effectiveTier);
  if (!hasFeatureForRank(rank, feature)) {
    const need = FEATURE_MIN_TIER[feature];
    res.status(403).json({
      error: 'MEMBERSHIP_REQUIRED',
      feature,
      requiredPlan: need,
      requiredLabel: TIER_LABEL[need],
      message: `${TIER_LABEL[need]} or above is required for this feature.`,
    });
    return { ok: false };
  }
  return { ok: true, status, primaryUid: [...uids][0]! };
}
