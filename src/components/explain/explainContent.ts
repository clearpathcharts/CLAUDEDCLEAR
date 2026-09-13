import { EXPLAIN_FLOW_SCRIPTS } from './flowScripts';

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

function vo(id: keyof typeof EXPLAIN_FLOW_SCRIPTS): string {
  return EXPLAIN_FLOW_SCRIPTS[id].narrationScript;
}

/**
 * Fifth-grade overlay copy = the same voice-over as the 45–60s Flow film.
 * Never tell the user what to buy, sell, or do with their money.
 */
export const explainContentLibrary: Record<string, ExplainContent> = {
  home: {
    id: 'home',
    title: 'Home',
    color: '#6C5CE7',
    text: vo('home'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What is the purple HOME button?',
        options: [
          { id: 'a', text: 'The front door of this website' },
          { id: 'b', text: 'A button that buys things for you' },
          { id: 'c', text: 'A password reset page' },
        ],
        correctOptionId: 'a',
        explanation: 'HOME is the front door. You can always click it if you get lost.',
      },
    ],
  },

  ywc: {
    id: 'ywc',
    title: 'Y.W.C. — Your World Connected',
    color: '#FF2E9A',
    text: vo('ywc'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What is the Y.W.C. room for?',
        options: [
          { id: 'a', text: 'Stories, magazines, and a price picture on one page' },
          { id: 'b', text: 'Buying and selling for you' },
          { id: 'c', text: 'Replacing your bank' },
        ],
        correctOptionId: 'a',
        explanation: 'It is one room so you do not open ten other websites. It does not tell you what to buy.',
      },
    ],
  },

  indacreator: {
    id: 'indacreator',
    title: 'INDACREATOR',
    color: '#00E5FF',
    text: vo('indacreator'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What does Compile mean here?',
        options: [
          { id: 'a', text: 'Please check this recipe' },
          { id: 'b', text: 'Buy something now' },
          { id: 'c', text: 'Delete the website' },
        ],
        correctOptionId: 'a',
        explanation: 'Compile just checks the recipe. A red error means fix the words — you did not break the site.',
      },
    ],
  },

  charts: {
    id: 'charts',
    title: 'Charts',
    color: '#FF7B00',
    text: vo('charts'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What does a green-ish candle block mean?',
        options: [
          { id: 'a', text: 'The price finished higher in that chunk of time' },
          { id: 'b', text: 'The price finished lower in that chunk of time' },
          { id: 'c', text: 'The store is closed' },
        ],
        correctOptionId: 'a',
        explanation: 'Green-ish means finished higher. Red-ish means finished lower. Still not a buy button.',
      },
    ],
  },

  news: {
    id: 'news',
    title: 'News',
    color: '#4D6FFF',
    text: vo('news'),
    quiz: [
      {
        id: 'q1',
        prompt: 'If the News list is empty, what does that mean?',
        options: [
          { id: 'a', text: 'We did not make up fake stories' },
          { id: 'b', text: 'You must buy something' },
          { id: 'c', text: 'The headlines are secret orders' },
        ],
        correctOptionId: 'a',
        explanation: 'Empty is honest. Making up news would be lying. Headlines are posters, not orders.',
      },
    ],
  },

  memberships: {
    id: 'memberships',
    title: 'Memberships',
    color: '#FFE600',
    text: vo('memberships'),
    quiz: [
      {
        id: 'q1',
        prompt: 'Does opening the gold MEMBERSHIPS page charge your card right now?',
        options: [
          { id: 'a', text: 'No — looking does not charge a card' },
          { id: 'b', text: 'Yes, it always charges right away' },
          { id: 'c', text: 'It trades the market for you' },
        ],
        correctOptionId: 'a',
        explanation: 'Checkout is off. Gold is just a color, not a prize timer.',
      },
    ],
  },

  profile: {
    id: 'profile',
    title: 'Profile',
    color: '#FF2E9A',
    text: vo('profile'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What is the pink PROFILE room?',
        options: [
          { id: 'a', text: 'Your locker — name, photo, save' },
          { id: 'b', text: 'A place that buys things' },
          { id: 'c', text: 'Other people’s bank logins' },
        ],
        correctOptionId: 'a',
        explanation: 'It is your locker. Saving a name is not shopping.',
      },
    ],
  },

  affiliate: {
    id: 'affiliate',
    title: 'Affiliate',
    color: '#FF2E9A',
    text: vo('affiliate'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What is the AFFILIATE room for?',
        options: [
          { id: 'a', text: 'Sharing a special /r/ link if you want to' },
          { id: 'b', text: 'Placing other people’s trades' },
          { id: 'c', text: 'Hiding the school pages' },
        ],
        correctOptionId: 'a',
        explanation: 'Sharing is optional. Copy means the computer remembers the words. Not a market game.',
      },
    ],
  },

  ceo: {
    id: 'ceo',
    title: 'CEO dashboard',
    color: '#FF2E9A',
    text: vo('ceo'),
    quiz: [
      {
        id: 'q1',
        prompt: 'Who is the hot-pink CEO button for?',
        options: [
          { id: 'a', text: 'Only the person who built this website' },
          { id: 'b', text: 'Every visitor' },
          { id: 'c', text: 'A store that buys and sells' },
        ],
        correctOptionId: 'a',
        explanation: 'Most people will not see it. That is normal. Click purple HOME and keep going.',
      },
    ],
  },

  cinema: {
    id: 'cinema',
    title: 'ClearPath cinema',
    color: '#00E5FF',
    text: vo('cinema'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What is the cyan CINEMA room?',
        options: [
          { id: 'a', text: 'A movie theater inside the website' },
          { id: 'b', text: 'A chat that buys things for you' },
          { id: 'c', text: 'A button that deletes school' },
        ],
        correctOptionId: 'a',
        explanation: 'Click a picture. A player is a box that shows the movie. Movies teach. They do not tell you what to buy.',
      },
    ],
  },

  education: {
    id: 'education',
    title: 'ClearPath education',
    color: '#00E5FF',
    text: vo('education'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What does passing a school quiz mean?',
        options: [
          { id: 'a', text: 'You understood that page' },
          { id: 'b', text: 'The website will spend money for you now' },
          { id: 'c', text: 'You must buy a gold plan' },
        ],
        correctOptionId: 'a',
        explanation: 'A quiz is practice. One lesson, then rest. Not a license to spend.',
      },
    ],
  },

  literacy: {
    id: 'literacy',
    title: 'Literacy OS',
    color: '#00E5FF',
    text: vo('literacy'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What is Literacy OS?',
        options: [
          { id: 'a', text: 'A notebook desk with rooms for ideas' },
          { id: 'b', text: 'A live store for buying' },
          { id: 'c', text: 'A bank wire screen' },
        ],
        correctOptionId: 'a',
        explanation: 'Notebook desk. Save one idea. Then rest. Not a store.',
      },
    ],
  },

  encyclopedia: {
    id: 'encyclopedia',
    title: 'Encyclopedia of finance',
    color: '#00E5FF',
    text: vo('encyclopedia'),
    quiz: [
      {
        id: 'q1',
        prompt: 'How should you read a library card here?',
        options: [
          { id: 'a', text: 'As a teaching page, like a chapter in a book' },
          { id: 'b', text: 'As a list of companies you must buy' },
          { id: 'c', text: 'As a buy button' },
        ],
        correctOptionId: 'a',
        explanation: 'It is a library of money words. Beginner means easy words. Not a shopping list.',
      },
    ],
  },

  indicators: {
    id: 'indicators',
    title: 'Encyclopedia of indicators',
    color: '#00E5FF',
    text: vo('indicators'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What is a chart helper here?',
        options: [
          { id: 'a', text: 'A picture of prices that already happened' },
          { id: 'b', text: 'A machine that promises tomorrow' },
          { id: 'c', text: 'A buy button' },
        ],
        correctOptionId: 'a',
        explanation: 'Helpers talk about yesterday. They cannot promise tomorrow. They do not buy or sell.',
      },
    ],
  },

  explain: {
    id: 'explain',
    title: 'Need extra understanding',
    color: '#00E5FF',
    text: vo('explain'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What do the little play badges do?',
        options: [
          { id: 'a', text: 'Open a help movie and easy words for that button' },
          { id: 'b', text: 'Buy something for you' },
          { id: 'c', text: 'Delete your name' },
        ],
        correctOptionId: 'a',
        explanation: 'Click the tiny play picture, not the big word. You cannot fail your account.',
      },
    ],
  },

  exit: {
    id: 'exit',
    title: 'Exit',
    color: '#FF4D4D',
    text: vo('exit'),
    quiz: [
      {
        id: 'q1',
        prompt: 'What does the red EXIT button do?',
        options: [
          { id: 'a', text: 'Hangs up — the website forgets you are signed in' },
          { id: 'b', text: 'Deletes your name forever' },
          { id: 'c', text: 'Buys one last thing' },
        ],
        correctOptionId: 'a',
        explanation: 'Like hanging up a phone. Your name stays. If you wanted pictures, click orange CHARTS instead.',
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
