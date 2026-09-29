/**
 * Community rooms follow the paid feature ladder.
 * Run: npx tsx scripts/community-rooms.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  COMMUNITY_ROOMS,
  canAccessCommunityRoom,
  communityRoomById,
  sanitizeCommunityPost,
} from '../src/lib/communityRooms.ts';

assert.equal(COMMUNITY_ROOMS.length, 8);
assert.equal(canAccessCommunityRoom('basic', 'education'), false);
assert.equal(canAccessCommunityRoom('silver', 'education'), true);
assert.equal(canAccessCommunityRoom('silver', 'encyclopedia'), true);
assert.equal(canAccessCommunityRoom('silver', 'affiliate'), true);
assert.equal(canAccessCommunityRoom('silver', 'gold-bar'), true);
assert.equal(canAccessCommunityRoom('silver', 'patterns'), false);
assert.equal(canAccessCommunityRoom('gold', 'patterns'), true);
assert.equal(canAccessCommunityRoom('gold', 'indacreator'), true);
assert.equal(canAccessCommunityRoom('gold', 'bots'), false);
assert.equal(canAccessCommunityRoom('platinum', 'ai-scanner'), true);
assert.equal(canAccessCommunityRoom('platinum', 'bots'), true);
assert.equal(canAccessCommunityRoom('basic', 'bots', true), true);
assert.equal(canAccessCommunityRoom('platinum', 'nope'), false);
assert.equal(communityRoomById('education')?.minTier, 'silver');
assert.equal(communityRoomById('patterns')?.minTier, 'gold');

assert.equal(sanitizeCommunityPost('  hi there  ').ok, true);
assert.equal(sanitizeCommunityPost('<b>nope</b>').ok && (sanitizeCommunityPost('<b>nope</b>') as { text: string }).text, 'bnope/b');
const empty = sanitizeCommunityPost('  ');
assert.equal(empty.ok, false);
assert.equal(sanitizeCommunityPost('x'.repeat(801)).ok, false);

console.log('community-rooms.selftest: ok');
