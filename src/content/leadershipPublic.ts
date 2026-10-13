/**
 * Public leadership copy — single source for /leadership, schema, and aligned in-app board display.
 * Brent: first name only (clearance). No personal social URLs.
 */

export type PublicLeader = {
  id: string;
  /** Display on site and Person schema name */
  displayName: string;
  jobTitle: string;
  /** Optional second line (e.g. board) */
  roleLine?: string;
  imageUrl: string;
  bio: string;
  /** Stable schema @id fragment key */
  schemaKey: string;
  /** Internal board login key (must match BoardLoginTerminal codes) */
  boardLoginName?: string;
};

export const PUBLIC_LEADERS: PublicLeader[] = [
  {
    id: 'richard-floyd',
    displayName: 'Richard Anthony Floyd',
    jobTitle: 'Founder & Chief Executive Officer',
    imageUrl: '/team/richard-floyd.jpg',
    schemaKey: 'founder-richard-floyd',
    boardLoginName: 'Richard Anthony Floyd',
    bio: `Richard Floyd founded ClearPath Trader after more than twenty-five years studying and trading markets. Living with autism, ADHD, and the lasting effects of a traumatic brain injury (TBI), he built the chart-first platform he wished existed — less noise, more room for disciplined analysis, including neurodivergent-friendly design. He is a self-taught developer (no CS degree or venture team) and leads Clear Path Markets Science Corp. as founder and CEO. ClearPath is education and market intelligence, not a brokerage and not financial advice.`,
  },
  {
    id: 'brent',
    displayName: 'Brent',
    jobTitle: 'Chief Communications Officer',
    roleLine: 'Board of Directors',
    imageUrl: '/team/brent.jpg',
    schemaKey: 'brent-cco',
    boardLoginName: 'Brent',
    bio: `Brent serves on the board of directors and leads communications as Chief Communications Officer. His focus is clear, permission-based outreach to members — explaining the platform honestly, without hype — and keeping public messaging aligned with ClearPath’s educational mission.`,
  },
  {
    id: 'brian-weber',
    displayName: 'Brian Weber',
    jobTitle: 'CFO Advisor',
    imageUrl: '/team/brian-weber.jpg',
    schemaKey: 'brian-weber-cfo',
    boardLoginName: 'Brian Weber',
    bio: `Brian Weber serves as CFO advisor to Clear Path Markets Science Corp., supporting budgeting, financial reporting, and operational finance guidance for ClearPath Trader’s education and analytics platform. He advises the company; he does not provide investment advice to users and is not a registered investment adviser.`,
  },
  {
    id: 'dustin-shorr',
    displayName: 'Dustin Shorr',
    jobTitle: 'Public Relations',
    roleLine: 'Board of Directors',
    imageUrl: '/team/dustin-shorr.jpg',
    schemaKey: 'dustin-shorr-board-pr',
    boardLoginName: 'Dustin Shorr',
    bio: `Dustin Shorr serves on the board of directors and leads public relations for Clear Path Markets Science Corp. He helps present ClearPath Trader’s educational mission clearly to the public, media, and community partners — accurately, professionally, and without hype.`,
  },
];

export function leaderById(id: string): PublicLeader | undefined {
  return PUBLIC_LEADERS.find((l) => l.id === id);
}

export const FOUNDER_LEADER = PUBLIC_LEADERS[0];
