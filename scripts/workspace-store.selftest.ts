/**
 * GoogleDesk workspace persistence without Cloud SQL.
 * Covers backend selection (SQL_HOST gate), local-file + Firestore stores, user scoping, dedupe, validation.
 *
 * Run: npx tsx scripts/workspace-store.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-workspace-'));
process.chdir(tmp);
process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
process.env.CLEARPATH_WORKSPACE_DATA_DIR = path.join(tmp, 'ws');
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
delete process.env.SQL_HOST;

type Doc = Record<string, any>;

function createFakeFirestore() {
  const store = new Map<string, Doc>();
  const coll = (prefix: string) => ({
    doc(id: string) {
      const key = `${prefix}/${id}`;
      return {
        collection: (name: string) => coll(`${key}/${name}`),
        async get() {
          const data = store.get(key);
          return { exists: Boolean(data), data: () => data };
        },
        async set(data: Doc) {
          store.set(key, { ...data });
        },
        async create(data: Doc) {
          if (store.has(key)) {
            const err: any = new Error('6 ALREADY_EXISTS: Document already exists');
            err.code = 6;
            throw err;
          }
          store.set(key, { ...data });
        },
        async delete() {
          store.delete(key);
        },
      };
    },
    async get() {
      const docs = [...store.entries()]
        .filter(([k]) => k.startsWith(`${prefix}/`) && !k.slice(prefix.length + 1).includes('/'))
        .map(([k, v]) => ({ id: k.slice(prefix.length + 1), data: () => v }));
      return { docs };
    },
  });
  return {
    db: { collection: (name: string) => coll(name) } as any,
    raw: store,
  };
}

async function exerciseStore(label: string, store: any) {
  const alice = `alice-${label}`;
  const bob = `bob-${label}`;

  assert.deepEqual(await store.listAssets(alice), [], `${label}: empty list for new user`);
  assert.equal(await store.addAsset(alice, { assetId: 'drive-1', title: 'Plan', type: 'DRIVE' }), 'created');
  assert.equal(
    await store.addAsset(alice, { assetId: 'drive-1', title: 'Plan again', type: 'DRIVE' }),
    'exists',
    `${label}: duplicate asset must report exists (route returns 409)`,
  );
  assert.equal(await store.addAsset(alice, { assetId: 'sheet-1', title: 'Sheet', type: 'SHEET' }), 'created');
  assert.equal(await store.addAsset(bob, { assetId: 'drive-1', title: 'Bob Plan', type: 'DRIVE' }), 'created');

  const aliceAssets = await store.listAssets(alice);
  assert.equal(aliceAssets.length, 2);
  assert.ok(aliceAssets.every((a: any) => Number.isSafeInteger(a.id)), `${label}: numeric ids for the client`);
  assert.equal(new Set(aliceAssets.map((a: any) => a.id)).size, 2, `${label}: ids unique`);
  const bobAssets = await store.listAssets(bob);
  assert.equal(bobAssets.length, 1);
  assert.equal(bobAssets[0].title, 'Bob Plan');

  assert.equal(await store.deleteAsset(bob, aliceAssets[0].id), false, `${label}: cannot delete another user's asset`);
  assert.equal((await store.listAssets(alice)).length, 2);
  assert.equal(await store.deleteAsset(alice, aliceAssets[0].id), true);
  assert.equal(await store.deleteAsset(alice, aliceAssets[0].id), false, `${label}: second delete is not found`);
  assert.equal((await store.listAssets(alice)).length, 1);

  assert.deepEqual(await store.listNotes(alice), []);
  await store.upsertNote(alice, 'drive-1', 'first');
  await store.upsertNote(alice, 'drive-1', 'second');
  await store.upsertNote(alice, 'a/b/../c', 'odd id is just data');
  const notes = await store.listNotes(alice);
  assert.equal(notes.length, 2, `${label}: upsert replaces by associatedId`);
  assert.equal(notes.find((n: any) => n.associatedId === 'drive-1')?.content, 'second');
  assert.deepEqual(await store.listNotes(bob), [], `${label}: notes are user scoped`);

  await store.addAsset('__proto__', { assetId: 'x', title: 'x', type: 'DRIVE' });
  assert.equal(({} as any).assets, undefined, `${label}: prototype untouched`);
}

async function main() {
  const ws = await import('../src/server/workspaceStore.ts');

  process.env.NODE_ENV = 'test';
  assert.equal(ws.resolveWorkspaceBackend(), 'local', 'no SQL_HOST + no Firestore creds: local file in dev');
  assert.ok(ws.getWorkspaceStore(), 'dev store is available');

  process.env.NODE_ENV = 'production';
  assert.equal(ws.resolveWorkspaceBackend(), 'unavailable', 'production without SQL/Firestore must be unavailable, not local');
  assert.equal(ws.getWorkspaceStore(), null);

  process.env.SQL_HOST = '10.0.0.5';
  assert.equal(ws.resolveWorkspaceBackend(), 'postgres', 'SQL_HOST selects Postgres');
  delete process.env.SQL_HOST;
  process.env.NODE_ENV = 'test';

  await exerciseStore('local', ws.createLocalWorkspaceStoreForTests());
  assert.ok(fs.existsSync(path.join(tmp, 'ws', 'workspace.json')), 'local fallback wrote its file');

  const fake = createFakeFirestore();
  await exerciseStore('firestore', ws.createFirestoreStore(() => fake.db));
  const keys = [...fake.raw.keys()];
  assert.ok(keys.every((k) => k.startsWith('workspace_users/u_')), 'Firestore docs live under workspace_users/{encoded uid}');
  assert.ok(keys.every((k) => !/alice|bob/.test(k)), 'raw uids are not used as document ids');

  assert.throws(() => ws.validateAssetInput({ assetId: 'a', title: '', type: 'DRIVE' }), ws.WorkspaceInputError);
  assert.throws(() => ws.validateAssetInput({ assetId: 5, title: 't', type: 'DRIVE' }), ws.WorkspaceInputError);
  assert.throws(
    () => ws.validateAssetInput({ assetId: 'x'.repeat(ws.WORKSPACE_LIMITS.assetId + 1), title: 't', type: 'DRIVE' }),
    ws.WorkspaceInputError,
  );
  assert.throws(() => ws.validateNoteInput({ content: 'hi' }), ws.WorkspaceInputError);
  assert.throws(
    () => ws.validateNoteInput({ associatedId: 'a', content: 'x'.repeat(ws.WORKSPACE_LIMITS.noteContent + 1) }),
    ws.WorkspaceInputError,
  );
  assert.deepEqual(ws.validateNoteInput({ associatedId: ' a ', content: 'hi' }), { associatedId: 'a', content: 'hi' });

  const serverSrc = fs.readFileSync(path.join(repoRoot, 'server.ts'), 'utf8');
  const routeBlock = serverSrc.slice(
    serverSrc.indexOf('// GOOGLE WORKSPACE PERSISTENCE API'),
    serverSrc.indexOf("app.post('/api/log_error'"),
  );
  assert.ok(routeBlock.length > 500, 'workspace route block found');
  assert.equal(
    (routeBlock.match(/requireMembershipFeature\(req, res, 'workspace'\)/g) || []).length,
    5,
    'all five workspace routes keep the membership gate',
  );
  assert.equal(
    (routeBlock.match(/await resolveAuthenticatedUid\(req\)/g) || []).length,
    5,
    'all five workspace routes keep strict uid auth',
  );
  assert.doesNotMatch(routeBlock, /message:\s*error\.message/, 'workspace routes must not echo raw internal error messages');
  assert.doesNotMatch(routeBlock, /\bdb\./, 'routes go through the store, not direct SQL');

  console.log('workspace-store.selftest: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
