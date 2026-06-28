// ============================================================================
// ClearPath Education — Quiz Data (Layer 2)
// ----------------------------------------------------------------------------
// One quiz per unit. A quiz is keyed by the unit's id (from curriculumData.ts),
// e.g. "crypto-u1". Passing a unit's quiz unlocks the next unit.
//
// HOW TO ADD A QUIZ:
//   1. Use the EXACT unit id from curriculumData.ts as the key.
//   2. Give it 3+ questions. Each question has:
//        - q:       the question text
//        - options: array of answer strings
//        - answer:  the INDEX (0-based) of the correct option
//        - why:     short plain-language explanation shown after answering
//   3. passingScore is the number correct needed to pass (defaults to ~70%).
//
// Crypto units 1–3 are written in full so you can test the whole flow.
// The remaining units follow the identical shape — copy a block and edit.
// ============================================================================

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number; // index into options
  why: string;
};

export type Quiz = {
  unitId: string;          // must match a unit id in curriculumData.ts
  passingScore: number;    // number of correct answers required to pass
  questions: QuizQuestion[];
};

export const QUIZZES: Record<string, Quiz> = {
  // ==========================================================================
  // CRYPTO — Unit 1: Before You Touch Crypto
  // ==========================================================================
  "crypto-u1": {
    unitId: "crypto-u1",
    passingScore: 3,
    questions: [
      {
        q: "What is a cryptocurrency, in the simplest honest terms?",
        options: [
          "A digital entry on a shared, tamper-resistant ledger that no single party controls",
          "A government-issued digital version of the dollar",
          "A guaranteed investment that always increases in value",
          "A type of stock in a technology company",
        ],
        answer: 0,
        why: "Crypto is value recorded on a decentralized ledger. It is not government-issued, not a stock, and never guaranteed to rise.",
      },
      {
        q: "Bitcoin was created in response to which event?",
        options: [
          "The 2008 financial crisis and loss of trust in banks",
          "The dot-com crash of 2000",
          "The introduction of credit cards",
          "The launch of online banking",
        ],
        answer: 0,
        why: "Bitcoin's whitepaper appeared in 2008, proposing money that didn't depend on trusting banks or governments.",
      },
      {
        q: "Which statement about crypto risk is TRUE?",
        options: [
          "You can lose your entire investment, and scams are common",
          "Crypto is insured like a bank deposit",
          "Prices are stable and rarely move much",
          "A government will refund you if a coin fails",
        ],
        answer: 0,
        why: "Crypto is volatile and largely uninsured. Total loss is possible, and the space attracts scams.",
      },
      {
        q: "Why does a 'ledger' matter to how crypto works?",
        options: [
          "It records who owns what, so balances can't be secretly changed",
          "It sets the price of each coin every morning",
          "It is a customer-service phone line",
          "It stores your password for you",
        ],
        answer: 0,
        why: "The shared ledger is the record of ownership. Its tamper-resistance is what removes the need for a trusted middleman.",
      },
    ],
  },

  // ==========================================================================
  // CRYPTO — Unit 2: How Blockchains Work
  // ==========================================================================
  "crypto-u2": {
    unitId: "crypto-u2",
    passingScore: 3,
    questions: [
      {
        q: "A blockchain is best described as…",
        options: [
          "A shared notebook where new pages link to all the pages before them",
          "A single company's private database",
          "A type of cryptocurrency wallet",
          "A government registry of bank accounts",
        ],
        answer: 0,
        why: "Each block links to the one before via a hash, forming a chain that's hard to alter without redoing everything after it.",
      },
      {
        q: "What is the role of a 'private key'?",
        options: [
          "It proves ownership and authorizes spending — never share it",
          "It is your public username others can see",
          "It is the price you paid for a coin",
          "It is a refund code from the exchange",
        ],
        answer: 0,
        why: "The private key controls the funds. Anyone with it can spend your crypto, so it must stay secret.",
      },
      {
        q: "Which wallet type means YOU hold the keys (and the responsibility)?",
        options: [
          "Self-custody (non-custodial) wallet",
          "Custodial exchange wallet",
          "A bank savings account",
          "A credit card",
        ],
        answer: 0,
        why: "Self-custody means you hold the keys directly. Custodial means a company holds them for you.",
      },
      {
        q: "What are 'gas fees'?",
        options: [
          "The cost paid to have a transaction processed on the network",
          "A tax charged by your government",
          "The price of the coin itself",
          "A penalty for selling too early",
        ],
        answer: 0,
        why: "Gas fees compensate the network for processing and recording your transaction.",
      },
    ],
  },

  // ==========================================================================
  // CRYPTO — Unit 3: Mining
  // ==========================================================================
  "crypto-u3": {
    unitId: "crypto-u3",
    passingScore: 3,
    questions: [
      {
        q: "What is crypto mining, fundamentally?",
        options: [
          "Competing to solve a puzzle for the right to add the next block and earn a reward",
          "Digging physical coins out of the ground",
          "Buying coins at a discount from a broker",
          "Printing new money like a central bank",
        ],
        answer: 0,
        why: "Miners expend computing work to win the right to add a block, and are paid the block reward plus fees.",
      },
      {
        q: "Why does Monero (XMR) try to stay CPU-mineable?",
        options: [
          "To resist ASICs so ordinary people can still mine fairly",
          "Because CPUs are faster than every other hardware",
          "Because it is legally required to",
          "Because CPUs use no electricity",
        ],
        answer: 0,
        why: "Monero deliberately resists ASICs so mining isn't captured by a few industrial players with specialized machines.",
      },
      {
        q: "Which hardware type is purpose-built for one mining job and most powerful for it?",
        options: ["ASIC", "CPU", "A web browser", "A hard drive"],
        answer: 0,
        why: "ASICs are application-specific — maximum power for one algorithm, but inflexible and expensive.",
      },
      {
        q: "As of 2026, which country has an explicit nationwide ban on crypto mining?",
        options: ["China", "Canada", "Australia", "The United States"],
        answer: 0,
        why: "China banned mining nationwide in 2021 and the ban still holds. Canada, Australia, and the US allow it (with local rules).",
      },
    ],
  },

  // ==========================================================================
  // TEMPLATE FOR THE REMAINING UNITS
  // --------------------------------------------------------------------------
  // Copy the block below, set unitId to the exact id from curriculumData.ts
  // (e.g. "crypto-u4", "stocks-u1", "forex-u1"), and fill in real questions.
  //
  // "crypto-u4": {
  //   unitId: "crypto-u4",
  //   passingScore: 3,
  //   questions: [
  //     { q: "...", options: ["...", "...", "...", "..."], answer: 0, why: "..." },
  //   ],
  // },
  // ==========================================================================
};

// Lookups used by the quiz engine.
export const getQuiz = (unitId: string): Quiz | undefined => QUIZZES[unitId];
export const hasQuiz = (unitId: string): boolean => unitId in QUIZZES;
