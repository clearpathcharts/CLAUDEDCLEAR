/**
 * Public leadership copy — single source for /meet-the-board, schema, and board portal display.
 * Brent Miller: public CTO biography supplied by the founder. No personal social URLs.
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
  /** Fine-tune object-cover when source art is waist-up or off-center */
  portraitObjectPosition?: string;
  /** Zoom within the portrait frame (1 = default) */
  portraitZoom?: number;
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
    displayName: 'Brent Miller',
    jobTitle: 'Chief Technology Officer',
    imageUrl: '/team/brent.jpg',
    portraitObjectPosition: '50% 20%',
    schemaKey: 'brent-miller',
    boardLoginName: 'Brent Miller',
    bio: `Brent Miller is the Chief Technology Officer of ClearPath Markets Science, doing business as ClearPath Trader. With 27 years of experience in aerospace and defense engineering, he brings a practical, people-focused approach to technology, product development, and leadership.

Brent began his career as an entry-level engineer, learning to design, build, integrate, and test complex defense systems. Today, he serves as a senior principal engineer and has held roles as a chief engineer, team lead, and manager. Throughout his career, he has led design teams working on missile components and complete missile systems, translating ambitious goals into clear requirements and actionable plans.

His experience also includes program management, cost accounting, and project execution on programs ranging from a few million dollars to $20–50 million. Known for his approachable leadership style, Brent helps teams work through challenges, communicate clearly, and stay focused on their goals. He values recognizing each person's strengths and bringing the right people together to move a project forward.

Brent's connection to ClearPath Trader began with CEO Rick Floyd, whom he met in 2020. As Rick introduced him to trading, Brent recognized a familiar way of thinking: breaking down complex information to find a clearer path forward. After the two reconnected, Brent became intrigued by what Rick was building and offered to help, drawing on his experience testing software to identify website issues and support improvements.

Brent understands how intimidating trading platforms can feel. Having experienced the noise and complexity himself, he is passionate about helping build a platform that users can customize to their needs—one that makes it easier to monitor markets, explore trends, and learn from historical patterns.

As CTO, Brent supports the company's current technology needs while shaping its long-term strategy. His focus includes defining the infrastructure, systems, and team that can support ClearPath Trader as its user base grows.

Brent earned a bachelor's degree in electrical engineering, with minors in mathematics and computer science, from Embry-Riddle Aeronautical University in 1999. He completed his MBA at the University of Phoenix in 2006.`,
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
    id: 'sarah-weber',
    displayName: 'Sarah Weber, LSCSW',
    jobTitle: 'Behavioral Therapist · Board Member',
    roleLine: 'Board of Directors',
    imageUrl: '/team/sarah-weber.jpg',
    schemaKey: 'sarah-weber-board',
    // Public board page only until a portal passcode is issued.
    portraitObjectPosition: '50% 18%',
    bio: `Sarah Weber, LSCSW, serves on the board of Clear Path Markets Science Corp. As a licensed clinical social worker and behavioral therapist, she advises ClearPath Trader on how adults learn, retain, and apply information — so the platform adapts to the trader rather than forcing traders to adapt to a single “norm.” She does not provide investment advice.`,
  },
];

export function leaderById(id: string): PublicLeader | undefined {
  return PUBLIC_LEADERS.find((l) => l.id === id);
}

export const FOUNDER_LEADER = PUBLIC_LEADERS[0];
