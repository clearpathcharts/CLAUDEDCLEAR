import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data', 'intelligence');

export type IntelligenceBriefingRecord = {
  id: string;
  receivedAt: string;
  source: string;
  runMode?: string;
  activeNeuroProfile?: string;
  publishMode?: string;
  assetUniverse?: string;
  briefingMarkdown?: string;
  localizedBriefingMarkdown?: string;
  artifacts?: Record<string, string>;
  meta?: Record<string, unknown>;
  rawPayload: unknown;
};

type ParsedPayload = {
  source: string;
  runMode?: string;
  activeNeuroProfile?: string;
  publishMode?: string;
  assetUniverse?: string;
  briefingMarkdown?: string;
  localizedBriefingMarkdown?: string;
  artifacts?: Record<string, string>;
  meta?: Record<string, unknown>;
};

function ensureDataDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function recordPath(id: string): string {
  return path.join(DATA_DIR, `${id}.json`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function extractMarkdown(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (!isRecord(value)) return undefined;
  return (
    asString(value.markdown) ||
    asString(value.content) ||
    asString(value.text) ||
    asString(value.body)
  );
}

function extractArtifacts(body: Record<string, unknown>): Record<string, string> | undefined {
  const artifacts: Record<string, string> = {};
  const keys = [
    'competitor_pain_matrix',
    'social_pulse_report',
    'clearpath_daily_briefing',
    'clearpath_daily_briefing_localized',
  ];

  for (const key of keys) {
    const value = body[key];
    const markdown = extractMarkdown(value);
    if (markdown) artifacts[key] = markdown;
  }

  const nested = body.artifacts;
  if (isRecord(nested)) {
    for (const [key, value] of Object.entries(nested)) {
      const markdown = extractMarkdown(value);
      if (markdown) artifacts[key] = markdown;
    }
  }

  return Object.keys(artifacts).length ? artifacts : undefined;
}

function parsePayload(payload: unknown): ParsedPayload {
  const root = isRecord(payload) ? payload : {};
  const inputs = isRecord(root.inputs) ? root.inputs : {};
  const result = isRecord(root.result) ? root.result : {};
  const data = isRecord(root.data) ? root.data : {};
  const outputs = isRecord(root.outputs) ? root.outputs : {};

  const source = asString(root.source) || 'webhook';

  const runMode =
    asString(inputs.run_mode) ||
    asString(root.run_mode) ||
    asString(root.runMode);

  const activeNeuroProfile =
    asString(inputs.active_neuro_profile) ||
    asString(root.active_neuro_profile) ||
    asString(root.activeNeuroProfile);

  const publishMode =
    asString(inputs.publish_mode) ||
    asString(root.publish_mode) ||
    asString(root.publishMode);

  const assetUniverse =
    asString(inputs.asset_universe) ||
    asString(root.asset_universe) ||
    asString(root.assetUniverse);

  const briefingMarkdown =
    extractMarkdown(root.briefing) ||
    extractMarkdown(root.briefingMarkdown) ||
    extractMarkdown(root.clearpath_daily_briefing) ||
    extractMarkdown(outputs.clearpath_daily_briefing) ||
    extractMarkdown(result.clearpath_daily_briefing) ||
    extractMarkdown(data.clearpath_daily_briefing) ||
    extractMarkdown(root.output) ||
    extractMarkdown(result.output) ||
    extractMarkdown(result.raw) ||
    (typeof root === 'string' ? root : undefined);

  const localizedBriefingMarkdown =
    extractMarkdown(root.localizedBriefing) ||
    extractMarkdown(root.clearpath_daily_briefing_localized) ||
    extractMarkdown(outputs.clearpath_daily_briefing_localized) ||
    extractMarkdown(result.clearpath_daily_briefing_localized);

  const artifacts = extractArtifacts(root) || extractArtifacts(result) || extractArtifacts(outputs);

  const meta: Record<string, unknown> = {};
  if (isRecord(root.meta)) Object.assign(meta, root.meta);
  if (asString(root.status)) meta.status = root.status;

  return {
    source,
    runMode,
    activeNeuroProfile,
    publishMode,
    assetUniverse,
    briefingMarkdown,
    localizedBriefingMarkdown,
    artifacts,
    meta: Object.keys(meta).length ? meta : undefined,
  };
}

export function verifyIntelligenceWebhookSecret(header?: string): boolean {
  const secret = process.env.INTELLIGENCE_WEBHOOK_SECRET?.trim();
  const isProd = process.env.NODE_ENV === 'production';
  if (!secret) {
    if (isProd) {
      console.error(
        '[Intelligence Webhook] INTELLIGENCE_WEBHOOK_SECRET missing in production — rejecting all webhook writes.'
      );
      return false;
    }
    console.warn(
      '[Intelligence Webhook] INTELLIGENCE_WEBHOOK_SECRET not set — accepting unauthenticated requests (non-production only).'
    );
    return true;
  }
  if (!header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  const { timingSafeEqual } = require('crypto') as typeof import('crypto');
  return timingSafeEqual(a, b);
}

export async function ingestIntelligenceWebhook(payload: unknown): Promise<IntelligenceBriefingRecord> {
  ensureDataDir();

  const parsed = parsePayload(payload);
  const id = crypto.randomUUID();
  const receivedAt = new Date().toISOString();

  const record: IntelligenceBriefingRecord = {
    id,
    receivedAt,
    source: parsed.source,
    runMode: parsed.runMode,
    activeNeuroProfile: parsed.activeNeuroProfile,
    publishMode: parsed.publishMode,
    assetUniverse: parsed.assetUniverse,
    briefingMarkdown: parsed.briefingMarkdown,
    localizedBriefingMarkdown: parsed.localizedBriefingMarkdown,
    artifacts: parsed.artifacts,
    meta: parsed.meta,
    rawPayload: payload,
  };

  fs.writeFileSync(recordPath(id), JSON.stringify(record, null, 2), 'utf8');

  if (record.briefingMarkdown) {
    fs.writeFileSync(
      path.join(DATA_DIR, `${id}_briefing.md`),
      record.briefingMarkdown,
      'utf8'
    );
  }
  if (record.localizedBriefingMarkdown) {
    fs.writeFileSync(
      path.join(DATA_DIR, `${id}_briefing_localized.md`),
      record.localizedBriefingMarkdown,
      'utf8'
    );
  }

  return record;
}

function readRecordFile(filePath: string): IntelligenceBriefingRecord | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as IntelligenceBriefingRecord;
  } catch {
    return null;
  }
}

export function listIntelligenceBriefings(limit = 20): IntelligenceBriefingRecord[] {
  ensureDataDir();
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({
      name,
      mtime: fs.statSync(path.join(DATA_DIR, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, Math.max(1, Math.min(limit, 100)));

  const records: IntelligenceBriefingRecord[] = [];
  for (const file of files) {
    const record = readRecordFile(path.join(DATA_DIR, file.name));
    if (record) records.push(record);
  }
  return records;
}

export function getIntelligenceBriefing(id: string): IntelligenceBriefingRecord | null {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return null;
  return readRecordFile(recordPath(id));
}
