/**
 * Public + admin API for Clear Path Community Outreach.
 * Public: snapshot + inquiry form.
 * Admin: status / resource / document updates (mounted behind founder auth).
 */
import { Router } from 'express';
import { requireFounderActionHeader } from './authGuards';
import {
  CommunityOutreachError,
  getAdminOutreachState,
  getPublicOutreachSnapshot,
  submitOutreachInquiry,
  updateDocumentRecord,
  updateInstitutionStatus,
  updateResourceRecord,
} from './communityOutreachStore';
import { INSTITUTION_STATUSES, type InstitutionStatus, type PublicationStatus } from '../content/communityOutreach';

function actorFromReq(req: { session?: { privateUser?: { email?: string } }; headers: Record<string, unknown> }): string {
  const email = req.session?.privateUser?.email;
  if (email) return String(email);
  return 'founder-admin';
}

export function createPublicCommunityOutreachRouter(): Router {
  const router = Router();

  router.get('/snapshot', async (_req, res) => {
    try {
      const snapshot = await getPublicOutreachSnapshot();
      res.json({ ok: true, ...snapshot });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Snapshot failed' });
    }
  });

  router.post('/inquiry', async (req, res) => {
    try {
      const result = await submitOutreachInquiry({
        ...(req.body || {}),
        userAgent: String(req.headers['user-agent'] || ''),
      });
      res.json(result);
    } catch (err: any) {
      const status = err instanceof CommunityOutreachError ? err.status : 500;
      res.status(status).json({ error: err?.message || 'Inquiry failed' });
    }
  });

  return router;
}

export function createAdminCommunityOutreachRouter(): Router {
  const router = Router();

  router.get('/state', async (_req, res) => {
    try {
      const state = await getAdminOutreachState();
      res.json({ ok: true, ...state });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Admin state failed' });
    }
  });

  router.post('/institutions/:id', requireFounderActionHeader, async (req, res) => {
    try {
      const status = String(req.body?.status || '') as InstitutionStatus;
      if (!INSTITUTION_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const row = await updateInstitutionStatus({
        id: String(req.params.id || ''),
        status,
        actor: actorFromReq(req as any),
        submittedAt: req.body?.submittedAt ?? undefined,
        approvedAt: req.body?.approvedAt ?? undefined,
        approvalSource: req.body?.approvalSource ?? undefined,
        evidenceNote: req.body?.evidenceNote ?? undefined,
        lastVerifiedDate: req.body?.lastVerifiedDate,
        proposedRelationship: req.body?.proposedRelationship,
      });
      res.json({ ok: true, institution: row });
    } catch (err: any) {
      const status = err instanceof CommunityOutreachError ? err.status : 500;
      res.status(status).json({ error: err?.message || 'Update failed' });
    }
  });

  router.post('/resources/:id', requireFounderActionHeader, async (req, res) => {
    try {
      const row = await updateResourceRecord({
        id: String(req.params.id || ''),
        actor: actorFromReq(req as any),
        publicationStatus: String(req.body?.publicationStatus || '') as PublicationStatus,
        revisionDate: req.body?.revisionDate,
        downloadUrl: req.body?.downloadUrl ?? null,
      });
      res.json({ ok: true, resource: row });
    } catch (err: any) {
      const status = err instanceof CommunityOutreachError ? err.status : 500;
      res.status(status).json({ error: err?.message || 'Update failed' });
    }
  });

  router.post('/documents/:id', requireFounderActionHeader, async (req, res) => {
    try {
      const row = await updateDocumentRecord({
        id: String(req.params.id || ''),
        actor: actorFromReq(req as any),
        approvalStatus: String(req.body?.approvalStatus || '') as PublicationStatus,
        version: req.body?.version,
        publicationDate: req.body?.publicationDate,
        downloadUrl: req.body?.downloadUrl ?? null,
      });
      res.json({ ok: true, document: row });
    } catch (err: any) {
      const status = err instanceof CommunityOutreachError ? err.status : 500;
      res.status(status).json({ error: err?.message || 'Update failed' });
    }
  });

  return router;
}
