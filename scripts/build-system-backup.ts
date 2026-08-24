/**
 * Pack frontend + backend source (and a founder data JSON) into one archive.
 *
 * Cloud Run images do not contain src/ — this must run from a git checkout.
 * Never packs .env, secrets, node_modules, or .git.
 *
 * Run: npx tsx scripts/build-system-backup.ts
 * Optional: CLEARPATH_BACKUP_OUT=/path/to/dir
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const OUT_DIR =
  process.env.CLEARPATH_BACKUP_OUT ||
  (fs.existsSync('/opt/cursor/artifacts') ? '/opt/cursor/artifacts' : path.join(ROOT, 'backups'));
const ARCHIVE_NAME = `clearpath-full-system-backup-${STAMP}.tar.gz`;
const STAGE = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-system-backup-'));
const TREE = path.join(STAGE, 'clearpathtrader');

const EXCLUDES = [
  'node_modules',
  '.git',
  'dist',
  'coverage',
  'backups',
  '.env',
  '.env.local',
  'secrets',
  '*.log',
  '.DS_Store',
  'android/app/build',
  'android/build',
  'data/private_accounts',
  'data/registrations',
  'data/intelligence',
  'data/profiles',
  'data/affiliate',
  'data/chart-pulse',
  'data/daily-ops',
];

function run(cmd: string, args: string[], cwd = ROOT) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed (${r.status})`);
  }
}

function copyTree() {
  fs.mkdirSync(TREE, { recursive: true });
  const excludeArgs = EXCLUDES.flatMap((p) => ['--exclude', p]);
  const stagingTar = path.join(STAGE, 'tree.tar');
  run('tar', ['-C', ROOT, ...excludeArgs, '-cf', stagingTar, '.']);
  run('tar', ['-C', TREE, '-xf', stagingTar]);
  fs.rmSync(stagingTar, { force: true });
}

async function writeFounderData() {
  const destDir = path.join(TREE, 'FOUNDER-DATA');
  fs.mkdirSync(destDir, { recursive: true });
  process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN =
    process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN || '1';
  const { buildFounderBackupPackage } = await import('../src/server/founderBackupService.ts');
  const pkg = await buildFounderBackupPackage({ includeStripeCustomerEmails: false });
  const jsonName = `clearpath-founder-backup-${STAMP}.json`;
  fs.writeFileSync(path.join(destDir, jsonName), JSON.stringify(pkg, null, 2), 'utf8');
  fs.writeFileSync(
    path.join(destDir, 'README.txt'),
    [
      'FOUNDER-ONLY member/waitlist/invite snapshot.',
      'Contains password hashes. Keep offline. Never post in chat.',
      'Restore: CEO Dashboard → Import members, or POST /api/admin/backup/restore',
      `Private accounts in this file: ${pkg.privateAccounts.count}`,
      `Waitlist rows: ${pkg.waitlist.count}`,
      `Invites: ${pkg.invites.count}`,
      '',
    ].join('\n'),
    'utf8',
  );
  return pkg;
}

function writeRestoreGuide(counts: {
  privateAccounts: number;
  waitlist: number;
  invites: number;
}) {
  const body = `# ClearPath full system backup

Created: ${new Date().toISOString()}
Archive: ${ARCHIVE_NAME}

This archive is the **frontend + backend source** (React/Vite SPA, Express \`server.ts\`,
Android shell, scripts) plus a **founder data JSON** under \`FOUNDER-DATA/\`.

Cloud Run disk is temporary. Keep this file on a drive you control.

## What is not in this file (on purpose)

- \`node_modules\` — run \`npm install\`
- \`.git\` — clone GitHub if you need history
- \`.env\` / secrets / Twilio / Firebase keys — copy from Cloud Run or your password manager
- Runtime folders under \`data/private_accounts\` (those records are in \`FOUNDER-DATA/\`)

## Restore the app

\`\`\`bash
tar -xzf ${ARCHIVE_NAME}
cd clearpathtrader
cp .env.example .env
# paste keys you already have (never commit them)
npm install
npm run dev
\`\`\`

Production image is \`npm run build\` then \`npm start\` (see Dockerfile).

## Restore members

CEO Dashboard → Import members, or:

\`\`\`bash
curl -X POST https://clearpathtrader.com/api/admin/backup/restore \\
  -H "Content-Type: application/json" \\
  --data-binary @FOUNDER-DATA/clearpath-founder-backup-${STAMP}.json
\`\`\`

This snapshot: ${counts.privateAccounts} private accounts, ${counts.waitlist} waitlist, ${counts.invites} invites.
`;
  fs.writeFileSync(path.join(TREE, 'RESTORE-SYSTEM-BACKUP.md'), body, 'utf8');
  fs.writeFileSync(path.join(STAGE, 'MANIFEST.txt'), body, 'utf8');
}

function pack() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, ARCHIVE_NAME);
  run('tar', ['-czf', outPath, '-C', STAGE, 'clearpathtrader', 'MANIFEST.txt']);
  const bytes = fs.statSync(outPath).size;
  return { outPath, bytes };
}

const counts = {
  privateAccounts: 0,
  waitlist: 0,
  invites: 0,
};

copyTree();
const pkg = await writeFounderData();
counts.privateAccounts = pkg.privateAccounts.count;
counts.waitlist = pkg.waitlist.count;
counts.invites = pkg.invites.count;
writeRestoreGuide(counts);
const { outPath, bytes } = pack();
fs.rmSync(STAGE, { recursive: true, force: true });

console.log(
  JSON.stringify(
    {
      ok: true,
      archive: outPath,
      bytes,
      megabytes: Number((bytes / (1024 * 1024)).toFixed(2)),
      stamp: STAMP,
      counts,
    },
    null,
    2,
  ),
);
