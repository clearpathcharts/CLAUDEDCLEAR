// ============================================================================
// ClearPath Education — Lesson bodies
// Authored content is keyed by lesson id. Anything without an entry still
// opens via buildFallbackLesson() so every chapter is readable.
// ============================================================================

export type LessonSection = {
  heading: string;
  paragraphs: string[];
};

export type LessonBody = {
  summary: string;
  sections: LessonSection[];
  takeaways: string[];
};

const AUTHORED: Record<string, LessonBody> = {
  "crypto-u1-l1": {
    summary:
      "Crypto is not magic money and it is not a stock. It is ownership recorded on a shared digital ledger that no single bank or company fully controls.",
    sections: [
      {
        heading: "The plain-English definition",
        paragraphs: [
          "A cryptocurrency is a digital entry on a shared, tamper-resistant ledger. That ledger is maintained by a network of computers instead of one central bookkeeper. When you 'own' bitcoin or another coin, what you really own is the ability to move a balance that the network agrees belongs to your keys.",
          "It is not government-issued cash. It is not equity in a company. It is not insured like a bank deposit. Those differences matter more than any hype headline.",
        ],
      },
      {
        heading: "What it is not",
        paragraphs: [
          "Crypto is not a guaranteed investment. Prices can collapse. Projects can fail. Scams are common. Treat every coin as something that can go to zero.",
          "Crypto is also not anonymous by default for most major coins. Many chains are public: anyone can see addresses and amounts, even if they do not know your legal name yet.",
        ],
      },
      {
        heading: "Why people use it anyway",
        paragraphs: [
          "Some people want money that moves across borders without a bank's permission. Some want a scarce digital asset as a store of value. Some want programmable money for apps and markets. The reasons differ — the risk does not disappear.",
        ],
      },
    ],
    takeaways: [
      "Crypto = digital ownership on a shared ledger, not a bank account and not a stock certificate.",
      "No single party fully controls the best-known networks — that is the point, and also the source of risk.",
      "Nothing about crypto guarantees profit.",
    ],
  },
  "crypto-u1-l2": {
    summary:
      "Bitcoin was invented after trust in banks and bailouts collapsed in 2008. It proposed money that did not require trusting a middleman.",
    sections: [
      {
        heading: "The 2008 problem",
        paragraphs: [
          "In 2008, major financial institutions failed or needed rescue. Ordinary people learned that 'safe' systems can hide risk until it is too late. Trust in banks, rating agencies, and policymakers took a hit.",
          "Bitcoin's whitepaper appeared in that climate. It described electronic cash that could be sent peer-to-peer without going through a financial institution.",
        ],
      },
      {
        heading: "What Bitcoin tried to fix",
        paragraphs: [
          "Traditional digital money always needed a trusted ledger-keeper — a bank, a payment company, a government. Bitcoin's design tries to replace that trusted party with math, open rules, and a network that checks itself.",
          "It did not invent cryptography. It combined existing ideas into a working system for scarce digital cash with a fixed issuance schedule.",
        ],
      },
      {
        heading: "What it did not fix",
        paragraphs: [
          "Bitcoin did not remove volatility, scams, or human greed. It removed one kind of middleman risk and introduced new ones: key management, exchange failures, and speculative mania.",
        ],
      },
    ],
    takeaways: [
      "Bitcoin was a response to lost trust after the 2008 crisis.",
      "Its core claim is peer-to-peer money without a bank in the middle.",
      "New design ≠ risk-free money.",
    ],
  },
  "crypto-u1-l3": {
    summary:
      "Money works because people trust the record of who owns what. A ledger is that record. Crypto's bet is that a shared ledger can be trusted without a single owner.",
    sections: [
      {
        heading: "What a ledger is",
        paragraphs: [
          "A ledger is a record of balances and transfers. Your bank account is an entry in a bank's ledger. Your Venmo balance is an entry in a company's ledger. If the ledger is wrong, your 'money' is wrong.",
          "Historically, ledgers were private. You trusted the institution that held them. Crypto publishes (or shares) the ledger across many machines so no one party can quietly rewrite history.",
        ],
      },
      {
        heading: "Why trust matters",
        paragraphs: [
          "Without a trustworthy record, you cannot know who can spend what. Counterfeiting, double-spending, and hidden liabilities all attack the integrity of that record.",
          "Crypto networks spend enormous energy and engineering effort on one job: making unauthorized edits to the ledger extremely hard.",
        ],
      },
      {
        heading: "The tradeoff",
        paragraphs: [
          "A public shared ledger is transparent and hard to censor. It is also unforgiving: send to the wrong address and there is usually no customer-service reversal. Trust moves from institutions to software, keys, and your own careful habits.",
        ],
      },
    ],
    takeaways: [
      "Money is a trusted record of ownership.",
      "Crypto replaces a private institutional ledger with a shared network ledger.",
      "Fewer middlemen means more personal responsibility.",
    ],
  },
  "crypto-u1-l4": {
    summary:
      "If you only remember one lesson before buying crypto, remember this: you can lose everything, scams are common, and nobody is required to bail you out.",
    sections: [
      {
        heading: "Volatility is not a bug in the marketing — it is the market",
        paragraphs: [
          "Major coins regularly swing double-digit percentages. Smaller coins can move far more. Leverage multiplies both gains and wipeouts. Price charts that look exciting also describe how fast capital can vanish.",
        ],
      },
      {
        heading: "Scams and social engineering",
        paragraphs: [
          "Fake support agents, phishing sites, 'guaranteed return' groups, rug-pull tokens, and drained wallet approvals are routine. If someone urgently needs your seed phrase, it is a scam. If a stranger promises risk-free yield, it is a scam.",
        ],
      },
      {
        heading: "Total loss is possible",
        paragraphs: [
          "Coins can fail. Exchanges can freeze withdrawals or collapse. You can lose keys. Regulators can restrict access where you live. There is generally no FDIC-style protection for crypto held on a chain or on many platforms.",
          "Only risk money you can afford to lose completely. That is not a slogan — it is the realistic floor.",
        ],
      },
    ],
    takeaways: [
      "Volatility can erase large portions of value quickly.",
      "Scams target beginners specifically.",
      "Plan for the possibility of total loss before you buy anything.",
    ],
  },
  "crypto-u1-l5": {
    summary:
      "Before your first satoshi, you need a purpose, a risk budget, a secure way to receive assets, and a habit of verifying every address and website.",
    sections: [
      {
        heading: "Decide why you are here",
        paragraphs: [
          "Learning? Long-term holding? Trading? Speculating on small coins? Each path needs different tools and different emotional bandwidth. Mixing them without a plan is how people panic-sell and chase scams.",
        ],
      },
      {
        heading: "Practical checklist",
        paragraphs: [
          "1) Write down a maximum loss you can tolerate and do not exceed it. 2) Use a reputable on-ramp only after checking what is legal where you live. 3) Create a wallet you control and back up the seed phrase offline — never in screenshots or cloud notes. 4) Practice sending a tiny test amount before a large transfer. 5) Bookmark official sites; do not trust search-ad links.",
        ],
      },
      {
        heading: "What 'ready' looks like",
        paragraphs: [
          "You are ready when you can explain, in your own words, what you bought, where it lives, how you would recover access, and what you will do if the price drops 50%. If you cannot answer those, wait.",
        ],
      },
    ],
    takeaways: [
      "Purpose + risk budget come before any purchase.",
      "Self-custody means you are the backup plan.",
      "Test small. Verify everything. Move slowly on purpose.",
    ],
  },
};

const STUDY_ANGLES = [
  'mechanism — how the thing works before anyone prices it',
  'risk — how you can get hurt if you skip the definition',
  'process — the checklist professionals run before they size a position',
  'vocabulary — the words you need so a chart or filing is readable',
  'structure — where this idea sits relative to the rest of the unit',
  'constraints — capital, time, attention, and custody limits that change the answer',
  'evidence — what would count as a real observation versus a story',
  'failure — the common mistake this chapter is trying to prevent',
] as const;

function angleForLesson(lessonId: string): (typeof STUDY_ANGLES)[number] {
  let h = 2166136261;
  for (let i = 0; i < lessonId.length; i++) {
    h ^= lessonId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return STUDY_ANGLES[Math.abs(h) % STUDY_ANGLES.length];
}

function buildFallbackLesson(
  lessonId: string,
  lessonTitle: string,
  schoolName: string,
  unitTitle: string
): LessonBody {
  const topic = lessonTitle.replace(/\s+/g, ' ').trim();
  const angle = angleForLesson(lessonId);
  return {
    summary: `${topic} (${schoolName} · ${unitTitle}) is a ClearPath Education chapter on ${angle}. Not a trade signal. Missing live cells stay DATA UNAVAILABLE.`,
    sections: [
      {
        heading: `What “${topic}” is in this school`,
        paragraphs: [
          `${topic} is the ${angle.split('—')[0].trim()} chapter inside ${schoolName}'s ${unitTitle} unit. ClearPath writes it as a building block — not a brokerage note and not a promise of profit.`,
          `Stay inside this school’s framing: plain language, honest tradeoffs, and DATA UNAVAILABLE for any vendor cell this page does not fill.`,
        ],
      },
      {
        heading: 'Core idea for this lesson',
        paragraphs: [
          `This chapter’s study angle is ${angle}. When professionals mention “${topic}”, they are usually pointing at that angle — not a guaranteed setup.`,
          `Write one sentence that uses the words “${topic}” and names the angle. If you cannot, re-read slowly — the goal is ownership of the idea, not finishing the list.`,
        ],
      },
      {
        heading: 'Why it matters in real markets',
        paragraphs: [
          `Skipping “${topic}” in ${unitTitle} is how people misread charts, misuse leverage, trust the wrong intermediary, or copy a strategy that does not match their constraints.`,
          `Connect this lesson to the previous and next chapters in ${schoolName} so you see a system instead of isolated tips.`,
        ],
      },
      {
        heading: 'How to practice this chapter',
        paragraphs: [
          `1) Restate “${topic}” without buzzwords. 2) Find one real-world example that matches the ${angle.split('—')[0].trim()} angle. 3) Note one mistake this chapter is trying to prevent. 4) Only then open the next lesson.`,
        ],
      },
    ],
    takeaways: [
      `${topic} is a ${angle.split('—')[0].trim()} idea inside ${schoolName}.`,
      'Understand the mechanism or risk before you act on it.',
      'If you cannot explain it simply, you are not done with the chapter.',
    ],
  };
}

export function getLessonBody(
  lessonId: string,
  lessonTitle: string,
  schoolName: string,
  unitTitle: string
): LessonBody {
  return AUTHORED[lessonId] ?? buildFallbackLesson(lessonId, lessonTitle, schoolName, unitTitle);
}
