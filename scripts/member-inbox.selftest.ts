/**
 * Member inbox: validation, targeting, read state, and route guards.
 * Run: npx tsx scripts/member-inbox.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN = '1';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-inbox-'));
process.chdir(tmp);

const inbox = await import('../src/server/memberInboxService.ts');
const { createInboxMessage, deleteInboxMessage, getMemberInbox, markMemberMessagesRead, parseRecipientList, InboxError } = inbox;

assert.throws(() => inbox.validateNewMessage({ subject: '', body: 'x' }), InboxError);
assert.throws(() => inbox.validateNewMessage({ subject: 'x', body: '' }), InboxError);
assert.throws(() => inbox.validateNewMessage({ subject: 'x'.repeat(141), body: 'x' }), InboxError);
assert.throws(() => inbox.validateNewMessage({ subject: 's', body: 'b', audience: 'list', recipients: '' }), InboxError);
assert.throws(() => parseRecipientList('ok@x.com, not-an-email'), /not-an-email/);
assert.deepEqual(parseRecipientList('A@X.com, a@x.com\nb@y.com'), ['a@x.com', 'b@y.com']);
assert.equal(inbox.validateNewMessage({ subject: 's', body: 'b', severity: 'evil' }).severity, 'info');

const all = await createInboxMessage({ subject: 'Site update', body: 'New charts.', severity: 'update' }, 'founder');
await new Promise((r) => setTimeout(r, 5));
const targeted = await createInboxMessage(
  { subject: 'Security notice', body: 'Change your password.', severity: 'security', audience: 'list', recipients: 'alice@example.com' },
  'founder',
);

const alice = await getMemberInbox('Alice@Example.com');
assert.equal(alice.messages.length, 2);
assert.equal(alice.unread, 2);
assert.equal(alice.messages[0].id, targeted.id, 'newest first');
assert.ok(!('recipients' in alice.messages[0]), 'members never see the recipient list');

const bob = await getMemberInbox('bob@example.com');
assert.deepEqual(bob.messages.map((m) => m.id), [all.id], 'targeted message only reaches its recipients');

assert.equal(await markMemberMessagesRead('bob@example.com', [targeted.id]), 0, 'cannot mark a message you cannot see');
assert.equal(await markMemberMessagesRead('alice@example.com', [targeted.id]), 1);
assert.equal((await getMemberInbox('alice@example.com')).unread, 1);
assert.equal(await markMemberMessagesRead('alice@example.com', 'all'), 2);
assert.equal((await getMemberInbox('alice@example.com')).unread, 0);
assert.equal((await getMemberInbox('bob@example.com')).unread, 1);

assert.equal(await deleteInboxMessage(all.id), true);
assert.equal((await getMemberInbox('bob@example.com')).messages.length, 0);
assert.deepEqual(await getMemberInbox('not an email'), { messages: [], unread: 0 });

const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(server, /app\.post\('\/api\/admin\/member-messages', requireFounderOrCatalogAdmin, requireFounderActionHeader/);
assert.match(server, /app\.delete\('\/api\/admin\/member-messages\/:id', requireFounderOrCatalogAdmin, requireFounderActionHeader/);
assert.match(server, /app\.get\('\/api\/admin\/member-messages', requireFounderOrCatalogAdmin/);
assert.match(server, /app\.get\('\/api\/member\/inbox', memberInboxLimiter[\s\S]{0,200}resolveAuthenticatedMemberEmail/);

const bell = fs.readFileSync(path.join(root, 'src/components/inbox/MemberInboxBell.tsx'), 'utf8');
assert.doesNotMatch(bell, /dangerouslySetInnerHTML/, 'message bodies must render as text');

const guards = fs.readFileSync(path.join(root, 'src/server/authGuards.ts'), 'utf8');
assert.match(guards, /email_verified !== true/, 'Firebase members need a verified email to read an inbox');

process.chdir(root);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('member-inbox.selftest: ok');
