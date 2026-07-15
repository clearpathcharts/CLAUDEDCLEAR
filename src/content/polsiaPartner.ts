/** Shared Polsia partner / referral constants for public ad + internal referral desk. */

export const POLSIA_REFERRAL_URL = 'https://polsia.com/?ref=5FFKGF4D';
export const POLSIA_REF_CODE = '5FFKGF4D';

export const POLSIA_PARTNER = {
  name: 'Polsia',
  tagline: 'AI that runs your company while you sleep',
  /** Short lead — previous partner statement */
  blurb:
    'Polsia is an AI teammate for founders — roadmap, code, ads, customer replies, deals, and social — one system covering the roles a solo operator usually juggles alone.',
  /**
   * Full write-up: previous statement expanded in ClearPath's own words
   * for the public ad + referral desk.
   */
  writeup:
    'Polsia is an AI teammate for founders — roadmap, code, ads, customer replies, deals, and social — one system covering the roles a solo operator usually juggles alone. It is an autonomous AI platform built for founders and solo operators whose pitch is simple: AI that runs your company while you sleep. Instead of hiring a full early team, you describe the business you want to build, and Polsia deploys specialized AI agents to handle the day-to-day — planning the roadmap, shipping code, running ads, answering customers, helping close deals, and posting updates. In short, Polsia is a standing army for the one-person company: not a single chatbot, but a set of agents meant to plan, build, market, and operate alongside you.',
  bullets: [
    'Plans your roadmap',
    'Ships your code',
    'Runs your ads',
    'Replies to customers',
    'Helps close deals',
    'Posts your updates',
  ],
  cta: 'Open Polsia with our referral link',
  disclosure:
    'Paid partnership / referral. ClearPath may earn a commission when you sign up through this link. Polsia is an independent product — not owned by ClearPath Trader.',
} as const;
