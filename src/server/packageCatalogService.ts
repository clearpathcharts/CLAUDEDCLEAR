/**
 * Persist founder-added product packages (file-backed).
 * Membership packages stay derived from the plan catalog — they are not stored here.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  isPackageStatus,
  membershipPackages,
  slugifyPackageId,
  type PackageStatus,
  type ProductPackage,
} from '../lib/packageCatalog';

const DEFAULT_FILE = path.join(process.cwd(), 'data', 'packages', 'added.json');

function packagesFile(): string {
  return process.env.CLEARPATH_PACKAGES_FILE?.trim() || DEFAULT_FILE;
}

function ensureDir(file: string) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readAdded(): ProductPackage[] {
  const file = packagesFile();
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(parsed) ? parsed.filter(isStoredPackage) : [];
  } catch {
    return [];
  }
}

function writeAdded(entries: ProductPackage[]) {
  const file = packagesFile();
  ensureDir(file);
  fs.writeFileSync(file, JSON.stringify(entries, null, 2));
}

function isStoredPackage(value: unknown): value is ProductPackage {
  if (!value || typeof value !== 'object') return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec.id === 'string' &&
    typeof rec.name === 'string' &&
    rec.kind === 'add_on' &&
    isPackageStatus(rec.status) &&
    typeof rec.summary === 'string' &&
    Array.isArray(rec.includes) &&
    rec.locked === false &&
    typeof rec.addedAt === 'string' &&
    !('price' in rec) &&
    !('priceLabel' in rec) &&
    !('priceMonthlyCents' in rec)
  );
}

function clip(text: unknown, max: number): string {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export type AddPackageInput = {
  name?: unknown;
  summary?: unknown;
  includes?: unknown;
  status?: unknown;
};

export function listPackages(): ProductPackage[] {
  return [...membershipPackages(), ...readAdded()];
}

export function addPackage(input: AddPackageInput): ProductPackage {
  const name = clip(input.name, 80);
  if (name.length < 2) {
    throw Object.assign(new Error('Package name must be at least 2 characters.'), { status: 400 });
  }

  const reserved = new Set(listPackages().map((p) => p.id));
  let id = `addon-${slugifyPackageId(name)}`;
  if (reserved.has(id)) {
    id = `${id}-${Date.now().toString(36)}`;
  }

  const includesRaw = Array.isArray(input.includes) ? input.includes : [];
  const includes = includesRaw
    .map((line) => clip(line, 120))
    .filter(Boolean)
    .slice(0, 20);

  const status: PackageStatus = isPackageStatus(input.status) ? input.status : 'draft';

  const pkg: ProductPackage = {
    id,
    name,
    kind: 'add_on',
    status,
    summary: clip(input.summary, 280) || 'Add-on package — no list price.',
    includes,
    locked: false,
    addedAt: new Date().toISOString(),
  };

  const next = [...readAdded(), pkg];
  writeAdded(next);
  return pkg;
}

export function removePackage(id: string): boolean {
  const key = String(id || '').trim();
  if (!key) return false;
  if (membershipPackages().some((p) => p.id === key)) {
    throw Object.assign(new Error('Membership packages are locked to the founder sheet.'), { status: 400 });
  }
  const current = readAdded();
  const next = current.filter((p) => p.id !== key);
  if (next.length === current.length) return false;
  writeAdded(next);
  return true;
}
