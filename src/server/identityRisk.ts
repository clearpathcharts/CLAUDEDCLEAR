/**
 * Server-side identity risk + hard registration blocklist.
 * Never trust the client — call only from privateAuthService / registrationService.
 *
 * Hard block = no account / waitlist entry created.
 * Soft suspect = quarantine (pending_confirm) for milder name issues.
 */

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
    | 'disposable_domain'
    | 'reserved_domain'
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
];

/** Local-part usernames that are never real customers (before +tag). */
const BLOCKED_LOCAL_PARTS = new Set([
  'test',
  'testing',
  'tester',
  'demo',
  'sample',
  'example',
  'probe',
  'placeholder',
  'fake',
  'unknown',
  'anonymous',
  'guest',
  'admin',
  'administrator',
  'root',
  'null',
  'none',
  'nobody',
  'user',
  'username',
  'temp',
  'temporary',
  'default',
  'foo',
  'bar',
  'foobar',
  'asdf',
  'qwerty',
  'abc123',
  'xxxxx',
  '123456',
  '111111',
  '000000',
  'noreply',
  'no-reply',
  'no_reply',
]);

const JUNK_NAME_TOKENS = new Set([
  'test',
  'testing',
  'tester',
  'asdf',
  'fake',
  'none',
  'n/a',
  'na',
  'xxx',
  'xxxxx',
  'abc',
  'abc123',
  'user',
  'username',
  'admin',
  'administrator',
  'root',
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
]);

const PLACEHOLDER_FULL_NAMES = new Set([
  'john doe',
  'jane doe',
  'john smith',
  'jane smith',
  'first last',
  'firstlast',
  'fname lname',
  'test user',
  'test test',
  'fake name',
  'fake user',
  'asdf asdf',
  'xxx xxx',
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
    domain.endsWith('.local')
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

  return { blocked: false };
}

/** Throws Error with .status = 400 when email is on the no-entry list. */
export function assertRegistrationEmailAllowed(emailRaw: string): void {
  const block = getRegistrationEmailBlock(emailRaw);
  if (!block.blocked) return;
  const err = new Error(block.reason || 'This email is not allowed for registration.') as Error & {
    status?: number;
    code?: string;
  };
  err.status = 400;
  err.code = block.code;
  throw err;
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
  const name = normalizeName(nameRaw);
  if (name.length < 2) {
    reasons.push('name_too_short');
    return reasons;
  }

  if (!/[a-z]/i.test(name)) {
    reasons.push('name_no_letters');
  }

  if (PLACEHOLDER_FULL_NAMES.has(name)) {
    reasons.push('placeholder_full_name');
  }

  const tokens = name.split(' ').filter(Boolean);
  if (tokens.length === 1 && JUNK_NAME_TOKENS.has(tokens[0]!)) {
    reasons.push('junk_single_name');
  }

  if (tokens.length >= 2) {
    const allJunk = tokens.every((t) => JUNK_NAME_TOKENS.has(t) || isRepeatedCharToken(t));
    if (allJunk) reasons.push('junk_multi_name');
  }

  for (const t of tokens) {
    if (isRepeatedCharToken(t)) {
      reasons.push('repeated_char_name');
      break;
    }
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
      r === 'noreply_local' ||
      r === 'test_plus_tag' ||
      r === 'numeric_only_local' ||
      r === 'invalid_email'
  );
}
