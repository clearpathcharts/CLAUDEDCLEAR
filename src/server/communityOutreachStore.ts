/**
 * Durable overlays for Clear Path Community Outreach.
 * Seed content stays Proposed / In Development until an authorized admin updates records.
 *
 * Security:
 * - Founder overlays (status, evidence notes, download URLs) live in `state.json` /
 *   Firestore `app_state/community_outreach` and are never mixed with public inquiries.
 * - Public inquiries live in a separate file / Firestore doc so spam cannot bloat the
 *   founder overlay document past Firestore limits.
 * - Public snapshot never returns approvalSource / evidenceNote.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  DIRECTORY_INSTITUTIONS,
  DOCUMENT_CENTER,
  EDUCATIONAL_RESOURCES,
  INQUIRY_CATEGORIES,
  INSTITUTION_STATUSES,
  type InstitutionStatus,
  type InquiryCategory,
  type PublicationStatus,
} from '../content/communityOutreach';
import { getAdminFirestore } from './firebaseAdmin';

const DIR = path.join(process.cwd(), 'data', 'community-outreach');
const STATE_FILE = path.join(DIR, 'state.json');
const INQUIRIES_FILE = path.join(DIR, 'inquiries.json');
const FIRESTORE_STATE_DOC = 'app_state/community_outreach';
const FIRESTORE_INQUIRIES_DOC = 'app_state/community_outreach_inquiries';

const INQUIRY_LIMIT = 200;
const INQUIRY_MESSAGE_MAX = 2000;
const HISTORY_LIMIT = 200;

export type InstitutionOverlay = {
  id: string;
  status: InstitutionStatus;
  proposedRelationship?: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvalSource?: string | null;
  lastVerifiedDate?: string;
  evidenceNote?: string | null;
};

export type ResourceOverlay = {
  id: string;
  publicationStatus: PublicationStatus;
  revisionDate?: string;
  downloadUrl?: string | null;
};

export type DocumentOverlay = {
  id: string;
  approvalStatus: PublicationStatus;
  version?: string;
  publicationDate?: string;
  downloadUrl?: string | null;
};

export type OutreachInquiry = {
  id: string;
  name: string;
  organization: string;
  businessEmail: string;
  category: InquiryCategory;
  message: string;
  createdAt: string;
  userAgent?: string;
};

export type OutreachChangeEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  targetType: 'institution' | 'resource' | 'document' | 'inquiry';
  targetId: string;
  detail: string;
};

/** Founder-only overlays + change history. Never stores public inquiry bodies. */
export type CommunityOutreachState = {
  institutions: InstitutionOverlay[];
  resources: ResourceOverlay[];
  documents: DocumentOverlay[];
  history: OutreachChangeEvent[];
  updatedAt: string;
};

type InquiryStore = {
  inquiries: OutreachInquiry[];
  updatedAt: string;
};

export class CommunityOutreachError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

const PUBLICATION_STATUSES: PublicationStatus[] = [
  'In Development',
  'Draft',
  'Approved for Public Distribution',
  'Published',
];

function emptyState(): CommunityOutreachState {
  return {
    institutions: [],
    resources: [],
    documents: [],
    history: [],
    updatedAt: new Date().toISOString(),
  };
}

function emptyInquiries(): InquiryStore {
  return { inquiries: [], updatedAt: new Date().toISOString() };
}

function readJsonFile<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile(file: string, value: unknown): void {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function normalizeState(raw: Partial<CommunityOutreachState> & { inquiries?: unknown }): CommunityOutreachState {
  return {
    ...emptyState(),
    ...raw,
    institutions: Array.isArray(raw.institutions) ? raw.institutions : [],
    resources: Array.isArray(raw.resources) ? raw.resources : [],
    documents: Array.isArray(raw.documents) ? raw.documents : [],
    history: Array.isArray(raw.history) ? raw.history : [],
    // Drop any legacy inquiries that were previously embedded in the overlay doc.
  };
}

function readLocalState(): CommunityOutreachState {
  const raw = readJsonFile<Partial<CommunityOutreachState> & { inquiries?: unknown }>(STATE_FILE, {});
  return normalizeState(raw);
}

function readLocalInquiries(): InquiryStore {
  const dedicated = readJsonFile<Partial<InquiryStore>>(INQUIRIES_FILE, {});
  if (Array.isArray(dedicated.inquiries)) {
    return {
      inquiries: dedicated.inquiries.slice(0, INQUIRY_LIMIT),
      updatedAt: dedicated.updatedAt || new Date().toISOString(),
    };
  }
  // One-time migration: pull legacy inquiries out of the old combined state file.
  const legacy = readJsonFile<{ inquiries?: OutreachInquiry[] }>(STATE_FILE, {});
  if (Array.isArray(legacy.inquiries) && legacy.inquiries.length) {
    return {
      inquiries: legacy.inquiries.slice(0, INQUIRY_LIMIT),
      updatedAt: new Date().toISOString(),
    };
  }
  return emptyInquiries();
}

async function loadState(): Promise<CommunityOutreachState> {
  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db.doc(FIRESTORE_STATE_DOC).get();
      if (snap.exists) {
        return normalizeState(snap.data() as Partial<CommunityOutreachState>);
      }
      // Doc missing: seed from local if present, otherwise empty. Never treat a
      // failed read as empty — that path is handled in the catch below.
      return readLocalState();
    } catch (err) {
      console.error('[community-outreach] Firestore state read failed; refusing mutation fallback.', err);
      throw new CommunityOutreachError('Community outreach state temporarily unavailable.', 503);
    }
  }
  return readLocalState();
}

async function loadInquiries(): Promise<InquiryStore> {
  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db.doc(FIRESTORE_INQUIRIES_DOC).get();
      if (snap.exists) {
        const data = snap.data() as Partial<InquiryStore>;
        return {
          inquiries: Array.isArray(data.inquiries) ? data.inquiries.slice(0, INQUIRY_LIMIT) : [],
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      }
      return readLocalInquiries();
    } catch (err) {
      console.error('[community-outreach] Firestore inquiries read failed; refusing mutation fallback.', err);
      throw new CommunityOutreachError('Community outreach inquiries temporarily unavailable.', 503);
    }
  }
  return readLocalInquiries();
}

async function saveState(state: CommunityOutreachState): Promise<void> {
  state.updatedAt = new Date().toISOString();
  // Never persist inquiries on the founder overlay document.
  const payload: CommunityOutreachState = {
    institutions: state.institutions,
    resources: state.resources,
    documents: state.documents,
    history: state.history.slice(0, HISTORY_LIMIT),
    updatedAt: state.updatedAt,
  };
  writeJsonFile(STATE_FILE, payload);
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.doc(FIRESTORE_STATE_DOC).set(payload, { merge: false });
    } catch (err) {
      console.error('[community-outreach] Firestore state write failed.', err);
      throw new CommunityOutreachError('Could not persist outreach admin state.', 503);
    }
  }
}

async function saveInquiries(store: InquiryStore): Promise<void> {
  store.updatedAt = new Date().toISOString();
  store.inquiries = store.inquiries.slice(0, INQUIRY_LIMIT);
  writeJsonFile(INQUIRIES_FILE, store);
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.doc(FIRESTORE_INQUIRIES_DOC).set(store, { merge: false });
    } catch (err) {
      console.error('[community-outreach] Firestore inquiries write failed.', err);
      throw new CommunityOutreachError('Could not persist inquiry.', 503);
    }
  }
}

function pushHistory(
  state: CommunityOutreachState,
  event: Omit<OutreachChangeEvent, 'id' | 'at'>,
): void {
  state.history.unshift({
    id: `coh_${crypto.randomBytes(8).toString('hex')}`,
    at: new Date().toISOString(),
    ...event,
  });
  state.history = state.history.slice(0, HISTORY_LIMIT);
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
}

const SENSITIVE_PATTERNS = [
  /\bebt\b/i,
  /\bssn\b/i,
  /social\s*security/i,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /case\s*number/i,
  /student\s*record/i,
  /routing\s*number/i,
  /account\s*number/i,
];

export function validateInquiryInput(input: {
  name?: unknown;
  organization?: unknown;
  businessEmail?: unknown;
  category?: unknown;
  message?: unknown;
}): Omit<OutreachInquiry, 'id' | 'createdAt' | 'userAgent'> {
  const name = String(input.name || '').trim();
  const organization = String(input.organization || '').trim();
  const businessEmail = String(input.businessEmail || '')
    .trim()
    .toLowerCase();
  const category = String(input.category || '').trim() as InquiryCategory;
  const message = String(input.message || '')
    .replace(/\r\n/g, '\n')
    .trim();

  if (!name || name.length > 120) throw new CommunityOutreachError('Name is required (max 120 characters).');
  if (!organization || organization.length > 200) {
    throw new CommunityOutreachError('Organization is required (max 200 characters).');
  }
  if (!isEmail(businessEmail)) throw new CommunityOutreachError('A valid business email is required.');
  if (!INQUIRY_CATEGORIES.includes(category)) {
    throw new CommunityOutreachError('Select a valid inquiry category.');
  }
  if (!message || message.length > INQUIRY_MESSAGE_MAX) {
    throw new CommunityOutreachError(`Message is required (max ${INQUIRY_MESSAGE_MAX} characters).`);
  }
  const blob = `${name} ${organization} ${message}`;
  if (SENSITIVE_PATTERNS.some((re) => re.test(blob))) {
    throw new CommunityOutreachError(
      'Do not include EBT, SSN, case numbers, student records, or financial account details.',
    );
  }
  return { name, organization, businessEmail, category, message };
}

export async function getPublicOutreachSnapshot() {
  const state = await loadState();
  const institutionMap = new Map(state.institutions.map((i) => [i.id, i]));
  const resourceMap = new Map(state.resources.map((r) => [r.id, r]));
  const documentMap = new Map(state.documents.map((d) => [d.id, d]));

  const institutions = DIRECTORY_INSTITUTIONS.map((seed) => {
    const overlay = institutionMap.get(seed.id);
    return {
      ...seed,
      status: overlay?.status || seed.status,
      proposedRelationship: overlay?.proposedRelationship || seed.proposedRelationship,
      lastVerifiedDate: overlay?.lastVerifiedDate || seed.lastVerifiedDate,
      submittedAt: overlay?.submittedAt || null,
      approvedAt: overlay?.approvedAt || null,
      // Intentionally omit approvalSource / evidenceNote from the public API.
    };
  });

  const resources = EDUCATIONAL_RESOURCES.map((seed) => {
    const overlay = resourceMap.get(seed.id);
    const downloadUrl =
      overlay?.downloadUrl !== undefined ? overlay.downloadUrl : seed.downloadUrl;
    const publicationStatus = overlay?.publicationStatus || seed.publicationStatus;
    const canDownload =
      !!downloadUrl &&
      (publicationStatus === 'Approved for Public Distribution' || publicationStatus === 'Published');
    return {
      ...seed,
      publicationStatus,
      revisionDate: overlay?.revisionDate || seed.revisionDate,
      downloadUrl: canDownload ? downloadUrl : null,
    };
  });

  const documents = DOCUMENT_CENTER.map((seed) => {
    const overlay = documentMap.get(seed.id);
    const downloadUrl =
      overlay?.downloadUrl !== undefined ? overlay.downloadUrl : seed.downloadUrl;
    const approvalStatus = overlay?.approvalStatus || seed.approvalStatus;
    const canDownload =
      !!downloadUrl &&
      (approvalStatus === 'Approved for Public Distribution' || approvalStatus === 'Published');
    return {
      ...seed,
      approvalStatus,
      version: overlay?.version || seed.version,
      publicationDate: overlay?.publicationDate || seed.publicationDate,
      downloadUrl: canDownload ? downloadUrl : null,
    };
  });

  return {
    updatedAt: state.updatedAt,
    institutions,
    resources,
    documents,
  };
}

export async function submitOutreachInquiry(input: {
  name?: unknown;
  organization?: unknown;
  businessEmail?: unknown;
  category?: unknown;
  message?: unknown;
  userAgent?: string;
}): Promise<{ ok: true; id: string }> {
  const validated = validateInquiryInput(input);
  const store = await loadInquiries();
  const row: OutreachInquiry = {
    id: `inq_${crypto.randomBytes(8).toString('hex')}`,
    ...validated,
    createdAt: new Date().toISOString(),
    userAgent: input.userAgent?.slice(0, 300),
  };
  store.inquiries.unshift(row);
  await saveInquiries(store);

  // Record a short, non-sensitive history line on the founder overlay only.
  const state = await loadState();
  pushHistory(state, {
    actor: 'public',
    action: 'inquiry_submitted',
    targetType: 'inquiry',
    targetId: row.id,
    detail: `${row.category} from ${row.organization}`,
  });
  try {
    await saveState(state);
  } catch {
    // Inquiry already persisted separately; history write is best-effort.
  }
  return { ok: true, id: row.id };
}

export async function getAdminOutreachState() {
  const [state, inquiryStore, publicSnap] = await Promise.all([
    loadState(),
    loadInquiries(),
    getPublicOutreachSnapshot(),
  ]);
  const resourceOverlay = new Map(state.resources.map((r) => [r.id, r]));
  const documentOverlay = new Map(state.documents.map((d) => [d.id, d]));

  // Admin forms must see ungated draft download URLs so a save cannot wipe them.
  const resources = EDUCATIONAL_RESOURCES.map((seed) => {
    const overlay = resourceOverlay.get(seed.id);
    return {
      ...seed,
      publicationStatus: overlay?.publicationStatus || seed.publicationStatus,
      revisionDate: overlay?.revisionDate || seed.revisionDate,
      downloadUrl: overlay?.downloadUrl !== undefined ? overlay.downloadUrl : seed.downloadUrl,
    };
  });
  const documents = DOCUMENT_CENTER.map((seed) => {
    const overlay = documentOverlay.get(seed.id);
    return {
      ...seed,
      approvalStatus: overlay?.approvalStatus || seed.approvalStatus,
      version: overlay?.version || seed.version,
      publicationDate: overlay?.publicationDate || seed.publicationDate,
      downloadUrl: overlay?.downloadUrl !== undefined ? overlay.downloadUrl : seed.downloadUrl,
    };
  });

  return {
    ...publicSnap,
    resources,
    documents,
    institutions: publicSnap.institutions.map((inst) => {
      const overlay = state.institutions.find((i) => i.id === inst.id);
      return {
        ...inst,
        approvalSource: overlay?.approvalSource || null,
        evidenceNote: overlay?.evidenceNote || null,
      };
    }),
    inquiries: inquiryStore.inquiries.slice(0, INQUIRY_LIMIT),
    history: state.history.slice(0, HISTORY_LIMIT),
    overlays: {
      institutions: state.institutions,
      resources: state.resources,
      documents: state.documents,
    },
  };
}

export async function updateInstitutionStatus(input: {
  id: string;
  status: InstitutionStatus;
  actor: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvalSource?: string | null;
  evidenceNote?: string | null;
  lastVerifiedDate?: string;
  proposedRelationship?: string;
}): Promise<InstitutionOverlay> {
  if (!DIRECTORY_INSTITUTIONS.some((i) => i.id === input.id)) {
    throw new CommunityOutreachError('Unknown institution id.', 404);
  }
  if (!INSTITUTION_STATUSES.includes(input.status)) {
    throw new CommunityOutreachError('Invalid institution status.');
  }
  if (
    (input.status === 'Approved' || input.status === 'Active') &&
    !String(input.approvalSource || '').trim()
  ) {
    throw new CommunityOutreachError(
      'Approved/Active status requires an approvalSource describing documented authorization.',
    );
  }
  const state = await loadState();
  const existing = state.institutions.find((i) => i.id === input.id);
  const next: InstitutionOverlay = {
    id: input.id,
    status: input.status,
    proposedRelationship: input.proposedRelationship ?? existing?.proposedRelationship,
    submittedAt: input.submittedAt !== undefined ? input.submittedAt : existing?.submittedAt ?? null,
    approvedAt: input.approvedAt !== undefined ? input.approvedAt : existing?.approvedAt ?? null,
    approvalSource:
      input.approvalSource !== undefined ? input.approvalSource : existing?.approvalSource ?? null,
    lastVerifiedDate: input.lastVerifiedDate || new Date().toISOString().slice(0, 10),
    evidenceNote: input.evidenceNote !== undefined ? input.evidenceNote : existing?.evidenceNote ?? null,
  };
  state.institutions = [...state.institutions.filter((i) => i.id !== input.id), next];
  pushHistory(state, {
    actor: input.actor,
    action: 'institution_status_updated',
    targetType: 'institution',
    targetId: input.id,
    detail: `status=${input.status}`,
  });
  await saveState(state);
  return next;
}

export async function updateResourceRecord(input: {
  id: string;
  actor: string;
  publicationStatus: PublicationStatus;
  revisionDate?: string;
  downloadUrl?: string | null;
}): Promise<ResourceOverlay> {
  if (!EDUCATIONAL_RESOURCES.some((r) => r.id === input.id)) {
    throw new CommunityOutreachError('Unknown resource id.', 404);
  }
  if (!PUBLICATION_STATUSES.includes(input.publicationStatus)) {
    throw new CommunityOutreachError('Invalid publication status.');
  }
  if (
    input.downloadUrl &&
    (input.publicationStatus === 'Approved for Public Distribution' ||
      input.publicationStatus === 'Published')
  ) {
    if (!/^https:\/\/|^\/docs\//i.test(input.downloadUrl)) {
      throw new CommunityOutreachError('Download URL must be https:// or a /docs/ path.');
    }
  }
  const state = await loadState();
  const next: ResourceOverlay = {
    id: input.id,
    publicationStatus: input.publicationStatus,
    revisionDate: input.revisionDate || new Date().toISOString().slice(0, 10),
    downloadUrl: input.downloadUrl ?? null,
  };
  state.resources = [...state.resources.filter((r) => r.id !== input.id), next];
  pushHistory(state, {
    actor: input.actor,
    action: 'resource_updated',
    targetType: 'resource',
    targetId: input.id,
    detail: `status=${input.publicationStatus}`,
  });
  await saveState(state);
  return next;
}

export async function updateDocumentRecord(input: {
  id: string;
  actor: string;
  approvalStatus: PublicationStatus;
  version?: string;
  publicationDate?: string;
  downloadUrl?: string | null;
}): Promise<DocumentOverlay> {
  if (!DOCUMENT_CENTER.some((d) => d.id === input.id)) {
    throw new CommunityOutreachError('Unknown document id.', 404);
  }
  if (!PUBLICATION_STATUSES.includes(input.approvalStatus)) {
    throw new CommunityOutreachError('Invalid approval status.');
  }
  if (
    input.downloadUrl &&
    (input.approvalStatus === 'Approved for Public Distribution' ||
      input.approvalStatus === 'Published')
  ) {
    if (!/^https:\/\/|^\/docs\//i.test(input.downloadUrl)) {
      throw new CommunityOutreachError('Download URL must be https:// or a /docs/ path.');
    }
  }
  const state = await loadState();
  const next: DocumentOverlay = {
    id: input.id,
    approvalStatus: input.approvalStatus,
    version: input.version,
    publicationDate: input.publicationDate || '—',
    downloadUrl: input.downloadUrl ?? null,
  };
  state.documents = [...state.documents.filter((d) => d.id !== input.id), next];
  pushHistory(state, {
    actor: input.actor,
    action: 'document_updated',
    targetType: 'document',
    targetId: input.id,
    detail: `status=${input.approvalStatus}`,
  });
  await saveState(state);
  return next;
}
