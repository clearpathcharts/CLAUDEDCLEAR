export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface ExplainContent {
  id: string;
  title: string;
  color: string;
  text: string;
  videoUrl?: string;
  posterUrl?: string;
  quiz: QuizQuestion[];
}

/**
 * CONTENT RULE: every entry describes what a screen does and how to read it.
 * Never tell the user what to buy, sell, or do with their money.
 * That line is what keeps this feature education, not advice.
 *
 * Colors match the nav-tab video-badge mock (Home purple, Y.W.C. pink,
 * Charts orange, Memberships gold, learn desks cyan).
 *
 * Google Flow: drop 16:9 MP4s at public/explain-videos/{id}.mp4
 * (see explainMedia.ts). Leave videoUrl empty unless the clip lives elsewhere.
 */
export const explainContentLibrary: Record<string, ExplainContent> = {
  home: {
    id: 'home',
    title: 'Home',
    color: '#6C5CE7',
    text:
      'Home is the front door of ClearPath. From here you can open charts, learning desks, community, and your profile without hunting through hidden menus. Nothing on Home places a trade. It is a map of the rest of the site.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What is Home for?',
        options: [
          { id: 'a', text: 'A map to the rest of ClearPath' },
          { id: 'b', text: 'A place that buys and sells for you' },
          { id: 'c', text: 'A password reset page' },
        ],
        correctOptionId: 'a',
        explanation: 'Home is the starting map. You choose where to go next.',
      },
    ],
  },

  ywc: {
    id: 'ywc',
    title: 'Y.W.C. — Your World Connected',
    color: '#FF2E9A',
    text:
      'Y.W.C. is a hub for news, social feeds, and a live chart on the same screen so you do not have to jump between apps. It is a workspace, not a signal service. You pick what to pin.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What does Y.W.C. try to do?',
        options: [
          { id: 'a', text: 'Keep news, feeds, and a chart in one place' },
          { id: 'b', text: 'Auto-trade your account' },
          { id: 'c', text: 'Replace your bank' },
        ],
        correctOptionId: 'a',
        explanation: 'It gathers things you already check during the day onto one desk.',
      },
    ],
  },

  indacreator: {
    id: 'indacreator',
    title: 'INDACREATOR',
    color: '#00E5FF',
    text:
      'INDACREATOR (also called The River) is a workshop for indicator code. You can paste or upload Pine-style instructions, compile them, and attach the result to a chart. It does not place trades. If the code cannot compile, you will see an error instead of a fake overlay.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What does INDACREATOR do?',
        options: [
          { id: 'a', text: 'Helps you import or build a custom indicator' },
          { id: 'b', text: 'Places trades automatically' },
          { id: 'c', text: 'Deletes your account' },
        ],
        correctOptionId: 'a',
        explanation: 'It compiles indicator instructions and can attach them to charts — nothing else.',
      },
    ],
  },

  charts: {
    id: 'charts',
    title: 'Charts',
    color: '#FF7B00',
    text:
      'This screen shows price moving over time. Each candle is one block of time. A green (or up-color) candle means price finished higher than it started. A red (or down-color) candle means price finished lower. You can change how much time each candle covers. Charts here are for study. They are not a broker and they do not tell you what to trade.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What does a green (up) candle mean?',
        options: [
          { id: 'a', text: 'Price went up during that time' },
          { id: 'b', text: 'Price went down during that time' },
          { id: 'c', text: 'The market is closed' },
        ],
        correctOptionId: 'a',
        explanation:
          'Green / up means the price ended higher than where it started for that block of time.',
      },
    ],
  },

  news: {
    id: 'news',
    title: 'News',
    color: '#4D6FFF',
    text:
      'News is a feed of headlines and market-related stories. Read it as context, not as a command. A headline can be late, incomplete, or wrong. ClearPath does not turn news into a buy or sell instruction.',
    quiz: [
      {
        id: 'q1',
        prompt: 'How should you treat a news headline here?',
        options: [
          { id: 'a', text: 'As context to read, not as a trade order' },
          { id: 'b', text: 'As a guaranteed price prediction' },
          { id: 'c', text: 'As a button that buys for you' },
        ],
        correctOptionId: 'a',
        explanation: 'Headlines are information. They are not orders.',
      },
    ],
  },

  memberships: {
    id: 'memberships',
    title: 'Memberships',
    color: '#FFE600',
    text:
      'Memberships describes ClearPath plan options. Public checkout is currently off, so you can read the desk without being charged on this site. If billing is restored later, it will say so clearly. This tab is not investment advice.',
    quiz: [
      {
        id: 'q1',
        prompt: 'Does opening Memberships charge your card right now?',
        options: [
          { id: 'a', text: 'No — public checkout is off on this site' },
          { id: 'b', text: 'Yes, it always charges immediately' },
          { id: 'c', text: 'It trades the market for you' },
        ],
        correctOptionId: 'a',
        explanation: 'You can look at the membership desk without a live public checkout.',
      },
    ],
  },

  profile: {
    id: 'profile',
    title: 'Profile',
    color: '#FF2E9A',
    text:
      'Profile is your account page: name, photo, and settings that belong to you. It is not a public leaderboard unless you choose to share a public /u/ link. Changing a password or photo here does not place a trade.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What lives on Profile?',
        options: [
          { id: 'a', text: 'Your account details and settings' },
          { id: 'b', text: 'Live order tickets' },
          { id: 'c', text: 'Other people’s bank logins' },
        ],
        correctOptionId: 'a',
        explanation: 'It is your desk identity, not a trading ticket.',
      },
    ],
  },

  affiliate: {
    id: 'affiliate',
    title: 'Affiliate',
    color: '#FF2E9A',
    text:
      'Affiliate is ClearPath’s referral desk. Private accounts can share a personal /r/ code. If someone you invited later joins, the desk can track that relationship. It is not a brokerage payout from the market. Rewards only apply when the product’s affiliate rules say they do.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What is the Affiliate tab for?',
        options: [
          { id: 'a', text: 'Sharing your referral link / code' },
          { id: 'b', text: 'Placing other people’s trades' },
          { id: 'c', text: 'Hiding the education pages' },
        ],
        correctOptionId: 'a',
        explanation: 'It is a referral desk, not a trading desk.',
      },
    ],
  },

  ceo: {
    id: 'ceo',
    title: 'CEO dashboard',
    color: '#FF2E9A',
    text:
      'The CEO dashboard is founder-only operations: backups, invites, site health. If you do not see this tab, you are not supposed to. It does not change anyone else’s charts.',
    quiz: [
      {
        id: 'q1',
        prompt: 'Who is the CEO dashboard for?',
        options: [
          { id: 'a', text: 'The founder running the site' },
          { id: 'b', text: 'Every visitor' },
          { id: 'c', text: 'A broker that executes trades' },
        ],
        correctOptionId: 'a',
        explanation: 'It is an ops desk for the person who owns the product.',
      },
    ],
  },

  cinema: {
    id: 'cinema',
    title: 'ClearPath cinema',
    color: '#00E5FF',
    text:
      'ClearPath Cinema is the video / APK desk for watching and installing the app experience. Videos here are product or education clips, not live trading rooms that tell you what to buy.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What is Cinema for?',
        options: [
          { id: 'a', text: 'Video and app viewing for ClearPath' },
          { id: 'b', text: 'A live broker chat that places orders' },
          { id: 'c', text: 'Deleting encyclopedias' },
        ],
        correctOptionId: 'a',
        explanation: 'It is a watch / install desk, not a trade blotter.',
      },
    ],
  },

  education: {
    id: 'education',
    title: 'ClearPath education',
    color: '#00E5FF',
    text:
      'ClearPath Education is structured lessons and quizzes about how markets and this site work. Finish a lesson at your own pace. Passing a quiz does not mean you should trade. It means you understood the words on that page.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What does finishing an Education lesson mean?',
        options: [
          { id: 'a', text: 'You practiced the idea on that page' },
          { id: 'b', text: 'ClearPath will trade for you now' },
          { id: 'c', text: 'You must buy a membership' },
        ],
        correctOptionId: 'a',
        explanation: 'Lessons are study. They are not a license to trade.',
      },
    ],
  },

  literacy: {
    id: 'literacy',
    title: 'Literacy OS',
    color: '#00E5FF',
    text:
      'Literacy OS is a personal study desk: notes, sources, briefs, and practice tools. It is built for people who want extra time and extra explanation. It is education only — not brokerage, not advice.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What is Literacy OS?',
        options: [
          { id: 'a', text: 'A personal learning desk' },
          { id: 'b', text: 'A live order-entry platform' },
          { id: 'c', text: 'A bank wire screen' },
        ],
        correctOptionId: 'a',
        explanation: 'It is study infrastructure, not a broker.',
      },
    ],
  },

  encyclopedia: {
    id: 'encyclopedia',
    title: 'Encyclopedia of finance',
    color: '#00E5FF',
    text:
      'This encyclopedia is a study library of finance ideas, markets, and labs. Cards are teaching pages. Generated stock cards are not a researched list of thousands of real issuers. Read a card, then decide for yourself whether you need another source.',
    quiz: [
      {
        id: 'q1',
        prompt: 'How should you read an encyclopedia card?',
        options: [
          { id: 'a', text: 'As a study page, not a research report on every company' },
          { id: 'b', text: 'As a guaranteed list of 9,586 issuers' },
          { id: 'c', text: 'As a buy ticket' },
        ],
        correctOptionId: 'a',
        explanation: 'These are teaching cards. They are not a complete issuer database.',
      },
    ],
  },

  indicators: {
    id: 'indicators',
    title: 'Encyclopedia of indicators',
    color: '#00E5FF',
    text:
      'This encyclopedia explains chart studies (RSI, moving averages, and more) with a picture, a formula, how to read it, and typical settings. An indicator describes past price. It does not promise the next move. Overlaying a study on a live chart still does not place a trade.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What is an indicator here?',
        options: [
          { id: 'a', text: 'A study of past price, for reading a chart' },
          { id: 'b', text: 'A guaranteed next-price machine' },
          { id: 'c', text: 'A broker order' },
        ],
        correctOptionId: 'a',
        explanation: 'Indicators describe. They do not order.',
      },
    ],
  },
};

/** ClearNav / MobileCommandCenter tab id → explainContent id */
export const NAV_TAB_EXPLAIN_IDS: Record<string, string> = {
  Discovery: 'home',
  Yours: 'ywc',
  TheRiver: 'indacreator',
  StrictlyCharts: 'charts',
  News: 'news',
  Membership: 'memberships',
  Biography: 'profile',
  AffiliateNetwork: 'affiliate',
  CeoDashboard: 'ceo',
  CpmsApk: 'cinema',
  ClearPathEducation: 'education',
  LiteracyOS: 'literacy',
  Encyclopedia: 'encyclopedia',
  EncyclopediaOfIndicators: 'indicators',
};

const ALIASES: Record<string, string> = {
  river: 'indacreator',
  river_genie: 'indacreator',
  the_river: 'indacreator',
  strictlycharts: 'charts',
  home: 'home',
};

export function getExplainContent(id: string): ExplainContent | undefined {
  const key = ALIASES[id] || NAV_TAB_EXPLAIN_IDS[id] || id;
  return explainContentLibrary[key];
}

export function explainColorForNavTab(tabId: string): string {
  return getExplainContent(tabId)?.color || '#00E5FF';
}
