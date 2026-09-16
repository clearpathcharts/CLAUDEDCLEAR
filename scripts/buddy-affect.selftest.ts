/**
 * Smoke test for C.P.T. Buddy affect + bond helpers.
 * Run: npm run test:buddy-affect
 */
import assert from 'node:assert/strict';
import {
  formatAffectForPrompt,
  formatBondForPrompt,
  heuristicAffectReading,
  normalizeAffectReading,
  normalizeBondProfile,
} from '../src/server/buddyAffect.ts';
import { mergeBondProfile, offlineCompanionAnswer } from '../src/server/buddyMentorService.ts';
import { CPT_COMPANION_GUIDE } from '../src/server/buddyCompanionGuide.ts';
import {
  fallbackConversationBullet,
  mergeMemoryLines,
  sanitizeConversationBullet,
} from '../src/lib/buddyMemory.ts';

assert.match(CPT_COMPANION_GUIDE, /platonic/i);
assert.match(CPT_COMPANION_GUIDE, /ZERO sexuality/i);
assert.match(CPT_COMPANION_GUIDE, /ADHD/);

const happy = heuristicAffectReading('I am feeling good today, actually happy');
assert.equal(happy.primary, 'happiness');
assert.equal(happy.crisis, false);

const frustr = heuristicAffectReading('Ugh this is so frustrating and annoying');
assert.equal(frustr.primary, 'frustration');
assert.ok(frustr.intensity >= 2);

const grief = heuristicAffectReading('My dad passed away last week and I am grieving');
assert.equal(grief.primary, 'grief_loss');

const crisis = heuristicAffectReading('I want to kill myself');
assert.equal(crisis.crisis, true);

const normalized = normalizeAffectReading({
  primary: 'ANGRY',
  intensity: 9,
  secondary: ['frustration', 'nope'],
  channels: { emotional: 'hot', mental: 'stuck', visual: 'busy' },
  crisis: false,
  confidence: 0.8,
  evidence: ['caps'],
});
assert.equal(normalized.primary, 'anger');
assert.equal(normalized.intensity, 5);
assert.ok(formatAffectForPrompt(normalized).includes('anger'));

const bond = normalizeBondProfile({
  conversationDepth: 12,
  knownNeuro: ['ADHD'],
  emotionalThemes: ['loss'],
  likesDayCheckIn: true,
  preferredPace: 'warm',
});
assert.equal(bond.knownNeuro?.[0], 'ADHD');
assert.match(formatBondForPrompt('Alex', bond), /ADHD/);
assert.match(formatBondForPrompt('Alex', bond), /platonic/i);

const merged = mergeBondProfile(bond, {
  knownNeuro: ['autism'],
  emotionalThemes: ['fear'],
  growthNotes: ['Prefers short steps when overwhelmed'],
});
assert.ok(merged.knownNeuro?.includes('ADHD'));
assert.ok(merged.knownNeuro?.includes('autism'));
assert.ok((merged.conversationDepth || 0) >= 13);

const offline = offlineCompanionAnswer({
  question: 'I feel so lonely tonight',
  displayName: 'Sam',
  affect: heuristicAffectReading('I feel so lonely tonight'),
});
assert.ok(offline && /Sam/.test(offline));

assert.equal(sanitizeConversationBullet('  • Asked how COT works  '), 'Asked how COT works');
assert.equal(fallbackConversationBullet('hi'), null);
assert.match(fallbackConversationBullet('How do I open the institutional desk?') || '', /institutional desk/i);
const mergedBullets = mergeMemoryLines(
  ['You said: first topic'],
  ['You said: first topic', 'Asked about neuro chart profiles'],
  40,
);
assert.equal(mergedBullets.length, 2);
assert.ok(mergedBullets.includes('Asked about neuro chart profiles'));

console.log('buddy-affect.selftest: OK');
