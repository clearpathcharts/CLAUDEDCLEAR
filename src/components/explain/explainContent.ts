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
 * (see explainMedia.ts + flowScripts.ts). Leave videoUrl empty unless the clip lives elsewhere.
 */
export const explainContentLibrary: Record<string, ExplainContent> = {
  home: {
    id: 'home',
    title: 'Home',
    color: '#6C5CE7',
    text:
      'Home is the front door of ClearPath Trader. The greeting is just a map. Every glowing card is a real door: Charts, INDACREATOR, Y.W.C., News, Education, Memberships, and C.P.T. Buddy. Choose Your Path opens four study desks — Institutional, Fundamental, Retail, and Neurodivergent. Those desks show information. They do not place trades. Read the line under a card, then tap when you are ready. You can always come back here from the top nav. Home is a map, not a to-do list, and not a broker.',
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
      'Y.W.C. means Your World Connected. It is one lava desk for news sections, magazines, and a live chart so you are not jumping between apps. Use the section chips — World, Sports, Finance, Magazines, Relief — one at a time. Expand a story to read it. Your personal chart stays nearby. Media Pantry and social tools are optional. This is a workspace, not a signal service. Some feeds here are editorial. The News tab is the live wire. When the noise rises, leave. The chart will still be here.',
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
      'INDACREATOR is the workshop for indicator code — sometimes still called The River. Upload a Pine file, paste code, or start with the Gold Bar example. Press compile. If something cannot run, you will see a real error, not a fake overlay. Read the honest limits and the inputs. River Genie can draft or fix a script, but you still choose when to apply. Apply to All Charts puts the study on your charts. Then open CHARTS to look at it. This studio does not place trades. Compile first. Apply when you are ready.',
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
      'This is Charts — ClearPath’s live market desk. Each candle is one block of time. A green (or up-color) candle means price finished higher than it started; a red (or down-color) candle means it finished lower. Search a symbol. Pick a timeframe. Neuro-Adaptive Profiles change colors, spacing, and motion so different brains can read the same data more comfortably. They never change the price. Pattern Scanner and drawing tools are for study. Blackout Mode hides extra chrome when you want a quieter dual-chart view. ClearPath is not a broker. Start with Calm Focus if you are unsure.',
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
      'News is the live reading wire. The header tells you if it is live, empty, or offline. Honest status beats fake urgency. Each card shows source, category, date, title, and a short description. Refresh when you want a fresh pull. Open a headline to read the publisher. If the vendor is down, ClearPath leaves the list empty. We never invent a story. Headlines are context, not instructions. Skim, then close the tab.',
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
      'Memberships is the plan sheet. Public checkout is off, so looking at this tab does not charge a card. Compare what each tier includes — charts, indicators, education, INDACREATOR, blackout, and more. Accuracy dots tell you what is enforced versus still on the sheet. Affiliate rewards, if you have them, show as discount or credit. Upgrade only if a feature clearly helps you learn. This tab is not investment advice, and it is not a store right now.',
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
      'Profile is your account space — how you appear on ClearPath. Set a display name, a public handle for a /u/ link if you want one, a bio, and an avatar or cover. Social links and password live here too. You can keep the profile private. Saving settings does not place a trade. If you use a broker connect panel, that is your licensed broker — ClearPath does not hold your money. Update only what you want others to see. Then head back to Home or Charts.',
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
      'Affiliate is the referral desk. Private accounts get a personal /r/ code. The link stays dormant until you accept the Affiliate Program Agreement. Then you can copy a share URL. The ledger shows signups, discount or credit, and badge progress in plain numbers. The sidebar cockpit has extra rooms — feeds, guilds, ranks, compliance. Those are extras. This is not a brokerage payout from the market, and it does not place anyone’s trades. Activate only when you are ready to share calmly. Rewards only apply when the product’s affiliate rules say they do.',
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
      'This tab is CEO — the founder console. Only the person who runs ClearPath sees it. Daily Ops is a calm checklist for the site, marketing, and the end of the day. Site Doctor shows whether the platform is healthy. Members holds invites, account lists, and a disaster backup download, because Cloud Run forgets files when a container restarts. Choose Your Path still opens the four study desks. Nothing here changes anyone else’s charts, and nothing here is a trade. If you do not see CEO, you are not supposed to.',
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
      'ClearPath Cinema is the in-terminal theater. Browse category shelves. Start a featured title or pick a thumbnail. Videos play in ClearPath’s own player — seek, volume, fullscreen — using direct streams, not a YouTube embed. Continue Watching keeps recent titles close. If a live stream is down, the player says so. Founder media tools stay out of the way. Choose one title, watch with full attention, then return to Charts or Education. These are product and education clips, not a room that tells you what to buy.',
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
      'ClearPath Education is structured learning. Pick a school — Crypto, Stocks, Forex, and more. Open an unlocked unit. Read the lessons like a calm textbook. At the end, a short quiz checks understanding. Passing unlocks the next unit. Progress is saved. Passing does not mean you should trade. It means you understood that page. From here you can also open three libraries: Encyclopedia of Finance, Encyclopedia of Indicators, and Literacy OS. One unit at a time.',
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
      'Literacy OS is your personal market-science desk. Morning Brief is a gentle landing — it shows what you have archived, not what you must do. Use the room chips to move. Thesis Vault holds your theses. Concept Wiki holds ideas in plain language. Source Sentinel helps you notice page changes. Other rooms wait until you need them — media, listening, pins, Pattern Studio. It is education only — not brokerage, not advice.',
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
      'The Encyclopedia of Finance is ClearPath’s deep knowledge library — a calm file-browser for markets. The left sidebar is your index. Pick one topic. Choose a reading level — Beginner through Economist — so the same idea can meet you where you are. You will see an article or a lab in the main stage. Open the Scholar Tutor only when a term still feels foggy. Cards are teaching pages, not a researched list of every company on earth. One topic, one level, then step back.',
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
      'The Encyclopedia of Indicators explains chart studies — RSI, moving averages, and more — with a picture, a formula, how to read it, and typical settings. Use the left filters to search or pick a category. Open a card for the study article. A live-overlay badge means that model can sit on Charts. An indicator describes past price. It does not promise the next move. Overlaying a study still does not place a trade. Read the limitations. Then go back to the terminal desktop.',
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

  explain: {
    id: 'explain',
    title: 'Need extra understanding',
    color: '#00E5FF',
    text:
      'This pill says Need extra understanding. Tap it once and it becomes Explain on. Small play badges appear next to every tab. Tap a badge to open a short cinema overlay — a Google Flow clip, plain words, and one quiet quiz question. If a clip is not uploaded yet, you will see a storyboard, not a fake video. This is extra explanation for people who want a slower walkthrough. It is not trading advice. Tap the pill again to hide the badges. You can leave Explain on as long as it helps.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What do the little play badges do?',
        options: [
          { id: 'a', text: 'Open a slower how-this-tab-works guide' },
          { id: 'b', text: 'Place a trade for you' },
          { id: 'c', text: 'Delete your account' },
        ],
        correctOptionId: 'a',
        explanation: 'Each badge opens a short explanation of that tab. It is optional, not advice.',
      },
    ],
  },

  exit: {
    id: 'exit',
    title: 'Exit',
    color: '#FF4D4D',
    text:
      'EXIT is the red pill on the second nav row. It signs you out of your ClearPath session. It does not close a broker account you connected elsewhere. It does not delete your profile. It does not place a last trade. Tap it when you are done for now. Next visit, sign in again from the usual door. If you only wanted another tab, use Home or Charts instead. EXIT means leave this session — calmly, completely, and only for this site.',
    quiz: [
      {
        id: 'q1',
        prompt: 'What does EXIT do?',
        options: [
          { id: 'a', text: 'Signs you out of this ClearPath session' },
          { id: 'b', text: 'Closes your broker account forever' },
          { id: 'c', text: 'Places one last trade' },
        ],
        correctOptionId: 'a',
        explanation: 'EXIT only ends the ClearPath session. Your profile and any external broker stay where they were.',
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
  ExplainMode: 'explain',
  Exit: 'exit',
};

const ALIASES: Record<string, string> = {
  river: 'indacreator',
  river_genie: 'indacreator',
  the_river: 'indacreator',
  strictlycharts: 'charts',
  home: 'home',
  explain_on: 'explain',
  'need extra understanding': 'explain',
  logout: 'exit',
};

export function getExplainContent(id: string): ExplainContent | undefined {
  const key = ALIASES[id] || NAV_TAB_EXPLAIN_IDS[id] || id;
  return explainContentLibrary[key];
}

export function explainColorForNavTab(tabId: string): string {
  return getExplainContent(tabId)?.color || '#00E5FF';
}
