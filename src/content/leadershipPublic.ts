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
    bio: `Richard Floyd founded ClearPath Trader after more than twenty-five years studying and trading markets. He built the platform he needed for clarity over noise — including neurodivergent-friendly design — as a self-taught developer. ClearPath is education and market intelligence, not a brokerage and not financial advice.`,
  },
  {
    id: 'brent',
    displayName: 'Brent',
    jobTitle: 'Chief Communications Officer',
    roleLine: 'Board of Directors',
    imageUrl: '/team/brent.jpg',
    schemaKey: 'brent-cco',
    boardLoginName: 'Brent',
    bio: `Brent leads member and customer communications for ClearPath Trader and serves on the board of directors. He helps align outreach with the company’s educational mission and member experience.`,
  },
  {
    id: 'brian-weber',
    displayName: 'Brian Weber',
    jobTitle: 'Chief Financial Officer',
    imageUrl: '/team/brian-weber.jpg',
    schemaKey: 'brian-weber-cfo',
    boardLoginName: 'Brian Weber',
    bio: `Brian Weber oversees financial planning and reporting for Clear Path Markets Science Corp. as Chief Financial Officer, supporting the company’s educational platform operations.`,
  },
];

export function leaderById(id: string): PublicLeader | undefined {
  return PUBLIC_LEADERS.find((l) => l.id === id);
}

export const FOUNDER_LEADER = PUBLIC_LEADERS[0];
