/**
 * Server-side identity risk + hard registration blocklist.
 * Never trust the client — call only from privateAuthService / registrationService.
 *
 * Hard block = no account / waitlist entry created.
 * Soft suspect = quarantine (pending_confirm) for milder residual issues.
 */

import dns from 'node:dns/promises';

export type IdentityRiskLevel = 'clean' | 'suspect';

export type IdentityRiskResult = {
  risk: IdentityRiskLevel;
  reasons: string[];
};

export type RegistrationBlockResult = {
  blocked: boolean;
  code?:
    | 'blocked_email'
    | 'blocked_domain'
    | 'blocked_local'
    | 'blocked_name'
    | 'disposable_domain'
    | 'reserved_domain'
    | 'keyboard_smash'
    | 'repeated_chars'
    | 'no_mx'
    | 'invalid_email';
  reason?: string;
};

/** Exact emails — never accept for real customer entry. */
const BLOCKED_EXACT_EMAILS = new Set([
  'example@example.com',
  'test@test.com',
  'test@example.com',
  'admin@example.com',
  'user@example.com',
  'mail@example.com',
  'email@example.com',
  'demo@example.com',
  'sample@example.com',
  'hello@example.com',
  'info@example.com',
  'support@example.com',
  'contact@example.com',
  'noreply@example.com',
  'no-reply@example.com',
  'probe@example.com',
  'placeholder@example.com',
  'fake@example.com',
  'dummy@example.com',
  'null@example.com',
  'none@example.com',
  'unknown@example.com',
  'asdf@example.com',
  'qwerty@example.com',
  'foo@example.com',
  'bar@example.com',
  'foobar@example.com',
  'john@example.com',
  'jane@example.com',
  'john.doe@example.com',
  'jane.doe@example.com',
  'your@email.com',
  'yourname@example.com',
  'yourname@domain.com',
  'name@example.com',
  'someone@example.com',
  'person@example.com',
  'abc@example.com',
  'xyz@example.com',
  'temp@example.com',
  'temp@temp.com',
  'temporary@example.com',
  'testing@example.com',
  'test123@example.com',
  'example@test.com',
  'example@localhost',
  'root@localhost',
  'admin@localhost',
  'user@localhost',
  'noreply@localhost',
  'root@test',
  'admin@test',
  'test@test.test',
]);

/** Reserved / RFC example / non-customer domains — block entire domain. */
const BLOCKED_DOMAINS = new Set([
  'example.com',
  'example.net',
  'example.org',
  'invalid',
  'localhost',
  'test',
  'test.local',
  'local',
  'domain.invalid',
  'example.invalid',
  'invalid.invalid',
  'localdomain',
  'test.com',
  'test.org',
  'temp.com',
  'email.com',
  'domain.com',
]);

/** Disposable / throwaway providers — block entire domain. */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.org',
  'guerrillamailblock.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'tempmailo.com',
  'trashmail.com',
  'trashmail.me',
  'yopmail.com',
  'yopmail.fr',
  'sharklasers.com',
  'grr.la',
  'guerrillamail.biz',
  'maildrop.cc',
  'getnada.com',
  'throwawaymail.com',
  'throwaway.email',
  'dispostable.com',
  'mintemail.com',
  'spamgourmet.com',
  'emailondeck.com',
  'fakeinbox.com',
  'discard.email',
  'mailnesia.com',
  'moakt.com',
  'moakt.cc',
  'tempail.com',
  'mailcatch.com',
  'mytemp.email',
  'tempinbox.com',
]);

const DISPOSABLE_DOMAIN_SUBSTRINGS = [
  'tempmail',
  'trashmail',
  'guerrillamail',
  'mailinator',
  'yopmail',
  'throwaway',
  'fakeinbox',
  'disposable',
  '10minutemail',
  'moakt',
];

/** Local-part usernames that are never real customers (before +tag). */
const BLOCKED_LOCAL_PARTS = new Set([
  'test',
  'testing',
  'tester',
  'test1',
  'test123',
  'demo',
  'sample',
  'example',
  'probe',
  'placeholder',
  'fake',
  'dummy',
  'unknown',
  'anonymous',
  'guest',
  'admin',
  'administrator',
  'root',
  'system',
  'default',
  'null',
  'none',
  'nobody',
  'user',
  'username',
  'temp',
  'temporary',
  'mail',
  'email',
  'contact',
  'support',
  'info',
  'hello',
  'foo',
  'bar',
  'foobar',
  'asdf',
  'qwerty',
  'abc',
  'abc123',
  'xxxx',
  'xxxxx',
  '123',
  '1234',
  '12345',
  '123456',
  '111111',
  '000000',
  'noreply',
  'no-reply',
  'no_reply',
]);

/** Keyboard-smash / bot local-parts and name tokens. */
const KEYBOARD_SMASH_TOKENS = new Set([
  'asdf',
  'asdfasdf',
  'asdfgh',
  'asdfghjkl',
  'qwerty',
  'qwertyuiop',
  'qweqwe',
  'zxcvbn',
  'zxcvbnm',
  'poiuy',
  'lkjhg',
  'hjkl',
  'aaaaaa',
  'bbbbbb',
  'cccccc',
  'dddddd',
  'eeeeee',
  'ffffff',
  'gggggg',
  'hhhhhh',
  'iiiiii',
  'jjjjjj',
  'kkkkkk',
  'llllll',
  'mmmmmm',
  'nnnnnn',
  'oooooo',
  'pppppp',
  'qqqqqq',
  'rrrrrr',
  'ssssss',
  'tttttt',
  'uuuuuu',
  'vvvvvv',
  'wwwwww',
  'xxxxxx',
  'yyyyyy',
  'zzzzzz',
  '111111',
  '000000',
  '123123',
  '321321',
  '654321',
  '123321',
  'abcabc',
  'xyzxyz',
  'aaa',
  'bbb',
  'ccc',
  'xxx',
  'yyy',
  'zzz',
]);

const JUNK_NAME_TOKENS = new Set([
  'test',
  'testing',
  'tester',
  'asdf',
  'fake',
  'dummy',
  'none',
  'n/a',
  'na',
  'xxx',
  'xxxx',
  'xxxxx',
  'abc',
  'abc123',
  'user',
  'username',
  'admin',
  'administrator',
  'root',
  'system',
  'null',
  'undefined',
  'foo',
  'bar',
  'baz',
  'foobar',
  'qwerty',
  'guest',
  'anonymous',
  'anon',
  'sample',
  'demo',
  'example',
  'probe',
  'placeholder',
  'unknown',
  'temp',
  'temporary',
  'default',
  'nobody',
  'name',
]);

const PLACEHOLDER_FULL_NAMES = new Set([
  'john doe',
  'jane doe',
  'john smith',
  'jane smith',
  'first last',
  'firstlast',
  'fname lname',
  'your name',
  'no name',
  'test user',
  'test test',
  'fake name',
  'fake user',
  'dummy user',
  'example user',
  'sample user',
  'demo user',
  'foo bar',
  'asdf asdf',
  'xxx xxx',
  'anonymous',
  'guest',
  'administrator',
  'root',
  'unknown',
  'null',
  'none',
]);

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function normalizeName(name: string): string {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function isRepeatedCharToken(token: string): boolean {
  if (token.length < 3) return false;
  return /^(.)\1+$/.test(token);
}

/** aaaaaa / 11111111 / xxxxxxxx — 6+ identical chars. */
function isLongRepeatedChars(value: string): boolean {
  return /^(.)\1{5,}$/.test(value);
}

/** abcabc / qweqwe / 123123 — short chunk repeated. */
function isRepeatedChunk(value: string): boolean {
  if (value.length < 4) return false;
  for (let size = 1; size <= Math.floor(value.length / 2); size++) {
    if (value.length % size !== 0) continue;
    const chunk = value.slice(0, size);
    if (chunk.repeat(value.length / size) === value && value.length / size >= 2) {
      // single-char repeats already covered; require chunk length >= 2 or total >= 6
      if (size >= 2 || value.length >= 6) return true;
    }
  }
  return false;
}

function isKeyboardSmashToken(token: string): boolean {
  const t = token.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!t) return false;
  if (KEYBOARD_SMASH_TOKENS.has(t)) return true;
  if (isLongRepeatedChars(t)) return true;
  if (isRepeatedChunk(t) && t.length >= 6) return true;
  // Common row runs
  if (/^(asdf|qwer|zxcv|poiuy|lkjh){2,}$/i.test(t)) return true;
  return false;
}

function domainIsBlocked(domain: string): RegistrationBlockResult | null {
  if (!domain) return { blocked: true, code: 'invalid_email', reason: 'Invalid email domain.' };

  if (BLOCKED_DOMAINS.has(domain) || DISPOSABLE_DOMAINS.has(domain)) {
    return {
      blocked: true,
      code: DISPOSABLE_DOMAINS.has(domain) ? 'disposable_domain' : 'blocked_domain',
      reason: 'This email domain is not allowed for registration.',
    };
  }

  // Reserved labels / RFC examples
  if (
    domain === 'example' ||
    domain.endsWith('.example') ||
    domain.startsWith('example.') ||
    domain.endsWith('.invalid') ||
    domain.endsWith('.localhost') ||
    domain.endsWith('.test') ||
    domain.endsWith('.local') ||
    domain === 'localdomain' ||
    domain.endsWith('.localdomain')
  ) {
    return {
      blocked: true,
      code: 'reserved_domain',
      reason: 'Reserved or test email domains are not allowed.',
    };
  }

  for (const frag of DISPOSABLE_DOMAIN_SUBSTRINGS) {
    if (domain.includes(frag)) {
      return {
        blocked: true,
        code: 'disposable_domain',
        reason: 'Disposable email addresses are not allowed.',
      };
    }
  }

  return null;
}

/**
 * Hard block — no waitlist / private account entry.
 * Use before creating any registration record.
 */
export function getRegistrationEmailBlock(emailRaw: string): RegistrationBlockResult {
  const email = normalizeEmail(emailRaw);
  if (!email.includes('@')) {
    return { blocked: true, code: 'invalid_email', reason: 'Enter a valid email address.' };
  }

  if (BLOCKED_EXACT_EMAILS.has(email)) {
    return {
      blocked: true,
      code: 'blocked_email',
      reason: 'This email address is not allowed for registration.',
    };
  }

  const at = email.lastIndexOf('@');
  const localRaw = email.slice(0, at);
  const domain = email.slice(at + 1);
  const localBase = localRaw.split('+')[0] || '';

  if (!localBase || !domain) {
    return { blocked: true, code: 'invalid_email', reason: 'Enter a valid email address.' };
  }

  // Domains without a dot (except allowlisted reserved single-labels already blocked)
  if (!domain.includes('.') && !BLOCKED_DOMAINS.has(domain)) {
    return { blocked: true, code: 'invalid_email', reason: 'Enter a valid email address.' };
  }

  const domainBlock = domainIsBlocked(domain);
  if (domainBlock) return domainBlock;

  if (BLOCKED_LOCAL_PARTS.has(localBase)) {
    return {
      blocked: true,
      code: 'blocked_local',
      reason: 'This email username is not allowed for registration.',
    };
  }

  if (/^\d+$/.test(localBase)) {
    return {
      blocked: true,
      code: 'blocked_local',
      reason: 'Numeric-only email usernames are not allowed.',
    };
  }

  if (isKeyboardSmashToken(localBase) || isLongRepeatedChars(localBase.replace(/[^a-z0-9]/gi, ''))) {
    return {
      blocked: true,
      code: 'keyboard_smash',
      reason: 'This email username looks like a test or random entry.',
    };
  }

  return { blocked: false };
}

/** Hard-block obvious fake / placeholder display names. */
export function getRegistrationNameBlock(nameRaw: string): RegistrationBlockResult {
  const name = normalizeName(nameRaw);
  if (!name || name.length < 2) {
    return { blocked: true, code: 'blocked_name', reason: 'Enter a real name.' };
  }

  if (PLACEHOLDER_FULL_NAMES.has(name)) {
    return {
      blocked: true,
      code: 'blocked_name',
      reason: 'This name is not allowed for registration.',
    };
  }

  const tokens = name.split(' ').filter(Boolean);
  const compact = name.replace(/\s+/g, '');

  if (isLongRepeatedChars(compact) || isKeyboardSmashToken(compact)) {
    return {
      blocked: true,
      code: 'repeated_chars',
      reason: 'This name looks like a test or random entry.',
    };
  }

  if (tokens.length === 1) {
    const t = tokens[0]!;
    if (JUNK_NAME_TOKENS.has(t) || KEYBOARD_SMASH_TOKENS.has(t) || isRepeatedCharToken(t)) {
      return {
        blocked: true,
        code: 'blocked_name',
        reason: 'This name is not allowed for registration.',
      };
    }
  }

  if (tokens.length >= 2) {
    const allJunk = tokens.every(
      (t) => JUNK_NAME_TOKENS.has(t) || KEYBOARD_SMASH_TOKENS.has(t) || isRepeatedCharToken(t)
    );
    if (allJunk) {
      return {
        blocked: true,
        code: 'blocked_name',
        reason: 'This name is not allowed for registration.',
      };
    }
  }

  for (const t of tokens) {
    if (isLongRepeatedChars(t) || isKeyboardSmashToken(t)) {
      return {
        blocked: true,
        code: 'repeated_chars',
        reason: 'This name looks like a test or random entry.',
      };
    }
  }

  return { blocked: false };
}

function throwBlock(block: RegistrationBlockResult): never {
  const err = new Error(block.reason || 'This email is not allowed for registration.') as Error & {
    status?: number;
    code?: string;
  };
  err.status = 400;
  err.code = block.code;
  throw err;
}

/** Throws Error with .status = 400 when email is on the no-entry list. */
export function assertRegistrationEmailAllowed(emailRaw: string): void {
  const block = getRegistrationEmailBlock(emailRaw);
  if (block.blocked) throwBlock(block);
}

/** Throws when display/first name is an obvious fake placeholder. */
export function assertRegistrationNameAllowed(nameRaw: string): void {
  const block = getRegistrationNameBlock(nameRaw);
  if (block.blocked) throwBlock(block);
}

const MX_TIMEOUT_MS = 2500;

function dnsCode(err: unknown): string {
  return String((err as { code?: string })?.code || '');
}

async function resolveWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error('dns_timeout'), { code: 'ETIMEOUT' })), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Verify domain has MX (or A/AAAA fallback). Fail-open on timeout/transient DNS errors
 * so flaky networks do not lock out real customers. Hard-block NXDOMAIN / empty hosts.
 */
export async function getRegistrationDomainDnsBlock(emailRaw: string): Promise<RegistrationBlockResult> {
  if (process.env.IDENTITY_SKIP_MX === '1' || process.env.IDENTITY_SKIP_MX === 'true') {
    return { blocked: false };
  }

  const email = normalizeEmail(emailRaw);
  const at = email.lastIndexOf('@');
  if (at < 0) {
    return { blocked: true, code: 'invalid_email', reason: 'Enter a valid email address.' };
  }
  const domain = email.slice(at + 1);
  if (!domain || domainIsBlocked(domain)) {
    // Already covered by sync blocklist; don't double-message via DNS.
    return { blocked: false };
  }

  const transient = new Set(['ETIMEOUT', 'ESERVFAIL', 'ECONNREFUSED', 'EAI_AGAIN']);

  try {
    const mx = await resolveWithTimeout(dns.resolveMx(domain), MX_TIMEOUT_MS);
    if (Array.isArray(mx) && mx.length > 0) return { blocked: false };
  } catch (err) {
    if (transient.has(dnsCode(err))) return { blocked: false }; // fail-open
    // ENODATA / ENOTFOUND on MX — try A/AAAA fallback
  }

  try {
    const a = await resolveWithTimeout(dns.resolve4(domain), MX_TIMEOUT_MS);
    if (Array.isArray(a) && a.length > 0) return { blocked: false };
  } catch (err) {
    if (transient.has(dnsCode(err))) return { blocked: false };
  }

  try {
    const aaaa = await resolveWithTimeout(dns.resolve6(domain), MX_TIMEOUT_MS);
    if (Array.isArray(aaaa) && aaaa.length > 0) return { blocked: false };
  } catch (err) {
    if (transient.has(dnsCode(err))) return { blocked: false };
  }

  // No MX and no A/AAAA → nonexistent / non-mail host
  return {
    blocked: true,
    code: 'no_mx',
    reason: 'This email domain does not appear to accept mail.',
  };
}

/** Sync blocklist + DNS/MX check. */
export async function assertRegistrationEmailAllowedAsync(emailRaw: string): Promise<void> {
  assertRegistrationEmailAllowed(emailRaw);
  const dnsBlock = await getRegistrationDomainDnsBlock(emailRaw);
  if (dnsBlock.blocked) throwBlock(dnsBlock);
}

function assessEmail(emailRaw: string): string[] {
  const reasons: string[] = [];
  const block = getRegistrationEmailBlock(emailRaw);
  if (block.blocked) {
    reasons.push(block.code || 'blocked_email');
    return reasons;
  }

  const email = normalizeEmail(emailRaw);
  const [local] = email.split('@');
  const localPart = (local || '').trim();

  if (localPart === 'noreply' || localPart.startsWith('noreply+') || localPart.startsWith('no-reply')) {
    reasons.push('noreply_local');
  }

  if (/\+test\b|\+fake\b|\+spam\b/i.test(localPart) || localPart.includes('+test') || localPart.includes('+fake')) {
    reasons.push('test_plus_tag');
  }

  return reasons;
}

function assessDisplayName(nameRaw: string): string[] {
  const reasons: string[] = [];
  const nameBlock = getRegistrationNameBlock(nameRaw);
  if (nameBlock.blocked) {
    reasons.push(nameBlock.code || 'blocked_name');
    // Keep legacy reason tags for CEO/debug visibility
    const name = normalizeName(nameRaw);
    if (PLACEHOLDER_FULL_NAMES.has(name)) reasons.push('placeholder_full_name');
    const tokens = name.split(' ').filter(Boolean);
    if (tokens.length === 1 && (JUNK_NAME_TOKENS.has(tokens[0]!) || isRepeatedCharToken(tokens[0]!))) {
      if (isRepeatedCharToken(tokens[0]!)) reasons.push('repeated_char_name');
      else reasons.push('junk_single_name');
    }
    return [...new Set(reasons)];
  }

  const name = normalizeName(nameRaw);
  if (!/[a-z]/i.test(name)) {
    reasons.push('name_no_letters');
  }

  return reasons;
}

/** Assess email + display name. Returns clean only when both look legitimate. */
export function assessIdentityRisk(input: {
  email: string;
  displayName: string;
}): IdentityRiskResult {
  const reasons = [...assessEmail(input.email), ...assessDisplayName(input.displayName)];
  const unique = [...new Set(reasons)];
  return {
    risk: unique.length ? 'suspect' : 'clean',
    reasons: unique,
  };
}

export function emailRiskReasons(reasons: string[]): boolean {
  return reasons.some(
    (r) =>
      r === 'disposable_domain' ||
      r === 'disposable_domain_pattern' ||
      r === 'reserved_example_domain' ||
      r === 'reserved_domain' ||
      r === 'blocked_email' ||
      r === 'blocked_domain' ||
      r === 'blocked_local' ||
      r === 'blocked_name' ||
      r === 'keyboard_smash' ||
      r === 'repeated_chars' ||
      r === 'no_mx' ||
      r === 'noreply_local' ||
      r === 'test_plus_tag' ||
      r === 'numeric_only_local' ||
      r === 'invalid_email'
  );
}
