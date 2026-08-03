/**
 * Server-side identity risk checks for private registration.
 * Never trust the client — call this only from privateAuthService / routes.
 */

export type IdentityRiskLevel = 'clean' | 'suspect';

export type IdentityRiskResult = {
  risk: IdentityRiskLevel;
  reasons: string[];
};

const DISPOSABLE_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.org',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.org',
  'sharklasers.com',
  'grr.la',
  'yopmail.com',
  'yopmail.fr',
  'trashmail.com',
  'trashmail.me',
  'tempmail.com',
  'temp-mail.org',
  'tempmailo.com',
  '10minutemail.com',
  'throwaway.email',
  'fakeinbox.com',
  'getnada.com',
  'discard.email',
  'mailnesia.com',
  'maildrop.cc',
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
];

const JUNK_NAME_TOKENS = new Set([
  'test',
  'asdf',
  'fake',
  'none',
  'n/a',
  'na',
  'xxx',
  'abc',
  'user',
  'admin',
  'null',
  'undefined',
  'foo',
  'bar',
  'baz',
  'qwerty',
  'guest',
  'anonymous',
  'anon',
  'sample',
  'demo',
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

function assessEmail(emailRaw: string): string[] {
  const reasons: string[] = [];
  const email = normalizeEmail(emailRaw);
  if (!email.includes('@')) {
    reasons.push('invalid_email');
    return reasons;
  }

  const [local, domainRaw] = email.split('@');
  const domain = (domainRaw || '').trim();
  const localPart = (local || '').trim();

  if (!localPart || !domain || !domain.includes('.')) {
    reasons.push('invalid_email');
    return reasons;
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    reasons.push('disposable_domain');
  }

  for (const frag of DISPOSABLE_DOMAIN_SUBSTRINGS) {
    if (domain.includes(frag)) {
      reasons.push('disposable_domain_pattern');
      break;
    }
  }

  // Reserved / clearly fake labels like user@example or *.example
  if (domain === 'example' || domain.endsWith('.example') || domain.startsWith('example.')) {
    reasons.push('reserved_example_domain');
  }

  if (localPart === 'noreply' || localPart.startsWith('noreply+') || localPart.startsWith('no-reply')) {
    reasons.push('noreply_local');
  }

  if (/\+test\b|\+fake\b|\+spam\b/i.test(localPart) || localPart.includes('+test') || localPart.includes('+fake')) {
    reasons.push('test_plus_tag');
  }

  if (/^\d+$/.test(localPart)) {
    reasons.push('numeric_only_local');
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
  const reasons = [
    ...assessEmail(input.email),
    ...assessDisplayName(input.displayName),
  ];
  // De-dupe while preserving order
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
      r === 'noreply_local' ||
      r === 'test_plus_tag' ||
      r === 'numeric_only_local' ||
      r === 'invalid_email'
  );
}
