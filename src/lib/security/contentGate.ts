// src/lib/security/contentGate.ts

import { ADULT_DOMAINS, ADULT_KEYWORDS } from "./adultBlocklist";

export function isAdultDomain(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();

    return ADULT_DOMAINS.some(domain =>
      host.includes(domain)
    );
  } catch {
    // If it's not a valid URL, it might just be a domain string
    const host = urlString.toLowerCase();
    return ADULT_DOMAINS.some(domain => host.includes(domain));
  }
}

export function containsAdultKeyword(urlString: string): boolean {
  const lower = urlString.toLowerCase();
  return ADULT_KEYWORDS.some(keyword =>
    lower.includes(keyword)
  );
}

export function isBlockedContent(urlString: string): boolean {
  const lower = (urlString || "").toLowerCase();
  if (lower.includes("tradingview")) {
    return true;
  }
  return isAdultDomain(urlString) || containsAdultKeyword(urlString);
}
