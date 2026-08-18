// ============================================================================
// ClearPath Education — Lesson bodies
// Authored content is keyed by lesson id. Anything without an entry still
// opens via buildFallbackLesson() so every chapter is readable.
// ============================================================================

import type { LessonVisualSpec } from "./shapeDiagrams";

export type LessonSection = {
  heading: string;
  paragraphs: string[];
};

export type LessonBody = {
  summary: string;
  sections: LessonSection[];
  takeaways: string[];
  visual?: LessonVisualSpec;
};

const AUTHORED: Record<string, LessonBody> = {
  "shapes-u1-l1": {
    summary:
      "Do not name the candles first. Name the two lines. Each line is either a ramp (it tilts) or a wall (it is flat). That is the whole trick.",
    visual: { kind: "rule" },
    sections: [
      {
        heading: "Look at the picture, not the story",
        paragraphs: [
          "A chart can look busy. Ignore the story for a minute. Draw one line across the tops. Draw one line across the bottoms. Now you have two lines. That is the pattern.",
          "If both lines tilt the same way, it is a wedge. If one line is flat like a floor or a ceiling, it is an ascending or descending triangle.",
        ],
      },
      {
        heading: "Kid check",
        paragraphs: [
          "Ramp = the line goes uphill or downhill. Wall = the line stays at the same height, like a floor or a ceiling.",
          "Wedge = two ramps that squeeze toward a point. Triangle (this kind) = one ramp running into one wall.",
        ],
      },
    ],
    takeaways: [
      "Two lines decide the name. Not the candles. Not your feeling.",
      "Two ramps = wedge. One ramp + one wall = triangle.",
    ],
  },
  "shapes-u1-l2": {
    summary:
      "A wedge is two ramps pointing the same way. They get closer and closer until they almost meet. That meeting place is the point.",
    visual: { kind: "compare", left: "rising-wedge", right: "falling-wedge" },
    sections: [
      {
        heading: "Coming to a point",
        paragraphs: [
          "Look at the pictures. The top line tilts. The bottom line tilts the same direction. The space between them gets smaller. That squeeze is the wedge.",
          "If the ramps both go up, it is a rising wedge. If the ramps both go down, it is a falling wedge. The name follows the ramps, not the ending.",
        ],
      },
      {
        heading: "The trap",
        paragraphs: [
          "A rising wedge looks strong because price is still making higher spots. It usually breaks down anyway. A falling wedge looks weak because price is still making lower spots. It usually breaks up anyway. The look and the usual ending are opposites.",
        ],
      },
    ],
    takeaways: [
      "Wedge = both lines tilt the same way and squeeze to a point.",
      "Rising wedge usually goes down. Falling wedge usually goes up.",
    ],
  },
  "shapes-u1-l3": {
    summary:
      "An ascending or descending triangle is not two ramps. It is one ramp hitting a wall. The wall is the flat line. That is how you tell it from a wedge.",
    visual: { kind: "compare", left: "ascending-triangle", right: "descending-triangle" },
    sections: [
      {
        heading: "Coming to a wall, not a point of two ramps",
        paragraphs: [
          "Look at the pictures. One line does not tilt. It sits still, like a floor or a ceiling people keep bumping into. The other line is a ramp that walks toward that wall.",
          "If the wall is on top, it is an ascending triangle. If the wall is on the bottom, it is a descending triangle.",
        ],
      },
      {
        heading: "Why people mix this up with a wedge",
        paragraphs: [
          "Both shapes get tighter over time. From far away they can look like they 'come to a point.' Zoom in on the flat side. If you can lay a ruler across equal highs or equal lows, it is a wall. If both edges keep tilting, it is a wedge.",
        ],
      },
    ],
    takeaways: [
      "Triangle here = one flat wall + one ramp.",
      "Flat top = ascending triangle. Flat bottom = descending triangle.",
    ],
  },
  "shapes-u1-l4": {
    summary:
      "A rising wedge has two ramps going up. It looks like the market is climbing. The usual ending is down.",
    visual: { kind: "shape", id: "rising-wedge" },
    sections: [
      {
        heading: "What you should see",
        paragraphs: [
          "Tops are getting higher. Bottoms are getting higher even faster. Both pink and purple lines tilt up. They squeeze toward a point on the right.",
          "There is no flat ceiling. If the tops are parked at the same price, you are looking at an ascending triangle, not this.",
        ],
      },
      {
        heading: "What it usually does",
        paragraphs: [
          "The climb is running out of room. The usual break is down through the lower ramp. Treat that as the textbook ending, not a promise. Patterns fail. This lesson is how to name the picture.",
        ],
      },
    ],
    takeaways: [
      "Rising wedge = two ramps up, coming to a point.",
      "Looks up. Usually goes down.",
    ],
  },
  "shapes-u1-l5": {
    summary:
      "A falling wedge has two ramps going down. It looks like the market is sliding. The usual ending is up.",
    visual: { kind: "shape", id: "falling-wedge" },
    sections: [
      {
        heading: "What you should see",
        paragraphs: [
          "Tops are getting lower. Bottoms are getting lower too — but not as fast. Both lines tilt down. They squeeze toward a point.",
          "There is no flat floor. If the bottoms keep tapping the same price, you are looking at a descending triangle, not this.",
        ],
      },
      {
        heading: "What it usually does",
        paragraphs: [
          "Selling is getting tired. The usual break is up through the upper ramp. That is why a falling wedge 'looks down' and still usually goes up. Do not short it just because it looks weak.",
        ],
      },
    ],
    takeaways: [
      "Falling wedge = two ramps down, coming to a point.",
      "Looks down. Usually goes up.",
    ],
  },
  "shapes-u1-l6": {
    summary:
      "An ascending triangle has a flat ceiling and a rising floor. Buyers keep stepping up into a wall. The usual ending is up through that wall.",
    visual: { kind: "shape", id: "ascending-triangle" },
    sections: [
      {
        heading: "What you should see",
        paragraphs: [
          "The tops keep hitting almost the same price. That is the wall. The bottoms keep rising. That is the ramp.",
          "If the tops are clearly climbing too, it is not this pattern. That is a rising wedge.",
        ],
      },
      {
        heading: "What it usually does",
        paragraphs: [
          "The usual break is up through the ceiling. The wall was the fight. When the wall gives, the picture is an ascending triangle that resolved the way the textbook says. It can also fail and break the rising floor instead. Name it from the wall, not from hope.",
        ],
      },
    ],
    takeaways: [
      "Ascending triangle = flat top wall + rising ramp.",
      "Usually goes up through the ceiling.",
    ],
  },
  "shapes-u1-l7": {
    summary:
      "A descending triangle has a flat floor and a falling roof. Sellers keep stepping down into a wall. The usual ending is down through that wall.",
    visual: { kind: "shape", id: "descending-triangle" },
    sections: [
      {
        heading: "What you should see",
        paragraphs: [
          "The bottoms keep hitting almost the same price. That is the wall — a floor. The tops keep getting lower. That is the ramp.",
          "If the bottoms are clearly falling too, it is not this pattern. That is a falling wedge.",
        ],
      },
      {
        heading: "What it usually does",
        paragraphs: [
          "The usual break is down through the floor. Same-looking 'coming to a point' from far away is a falling wedge, which usually goes the other way. The floor is the tell. No floor, not this triangle.",
        ],
      },
    ],
    takeaways: [
      "Descending triangle = flat bottom wall + falling ramp.",
      "Usually goes down through the floor.",
    ],
  },
  "shapes-u1-l8": {
    summary:
      "This is the mix-up. A falling wedge usually goes up. A descending triangle usually goes down. Both can look like they come to a point. Check the bottom line.",
    visual: { kind: "compare", left: "falling-wedge", right: "descending-triangle" },
    sections: [
      {
        heading: "Same slant on top. Different bottom.",
        paragraphs: [
          "Left picture: falling wedge. Top slants down. Bottom also slants down. Two ramps. Comes to a point. Usually goes up.",
          "Right picture: descending triangle. Top slants down. Bottom is a flat wall. One ramp into a floor. Usually goes down through that floor.",
        ],
      },
      {
        heading: "The one-second test",
        paragraphs: [
          "Put your finger on the lows. Do they keep dropping, or do they bounce off the same shelf? Dropping lows = falling wedge. Same shelf = descending triangle.",
          "If you only look at the falling highs, you will call them the same thing — and you will have the ending backwards half the time.",
        ],
      },
    ],
    takeaways: [
      "Falling highs are not enough. Read the lows.",
      "Two ramps down = falling wedge = usually up. Flat floor = descending triangle = usually down.",
    ],
  },
  "shapes-u1-l9": {
    summary:
      "The other mix-up. Both have rising lows. A rising wedge usually goes down. An ascending triangle usually goes up. Check the top line.",
    visual: { kind: "compare", left: "rising-wedge", right: "ascending-triangle" },
    sections: [
      {
        heading: "Same ramp on the bottom. Different top.",
        paragraphs: [
          "Left picture: rising wedge. Tops climb. Bottoms climb. Two ramps. Comes to a point. Usually goes down.",
          "Right picture: ascending triangle. Tops sit on a flat ceiling. Bottoms climb into that wall. Usually goes up through the ceiling.",
        ],
      },
      {
        heading: "The one-second test",
        paragraphs: [
          "Put your finger on the highs. Do they keep rising, or do they bump the same ceiling? Rising highs = rising wedge. Same ceiling = ascending triangle.",
        ],
      },
    ],
    takeaways: [
      "Rising lows are not enough. Read the highs.",
      "Two ramps up = rising wedge = usually down. Flat ceiling = ascending triangle = usually up.",
    ],
  },
  "shapes-u1-l10": {
    summary:
      "Cover the name. Look at the two lines. Ramp or wall? Then pick the name. Then check whether the usual ending matches the picture.",
    visual: { kind: "practice" },
    sections: [
      {
        heading: "How to play",
        paragraphs: [
          "Tap the name that matches the picture. You get an instant yes or no, then the labels appear. Hit Next picture and do it again until the four shapes feel obvious.",
          "If you hesitate, go back to the mix-up chapters. Falling wedge vs descending triangle is the one that fools people. Check the bottom line.",
        ],
      },
    ],
    takeaways: [
      "Family first: two ramps or one wall.",
      "Then name it. Then remember the usual ending — it is a textbook, not a guarantee.",
    ],
  },
  "stocks-u4-l5": {
    summary:
      "Most 'chart pattern' confusion is four shapes: rising wedge, falling wedge, ascending triangle, descending triangle. Learn them as pictures in Chart Shapes school before you memorize a list.",
    visual: { kind: "compare", left: "falling-wedge", right: "descending-triangle" },
    sections: [
      {
        heading: "Start with the mix-up that costs people the most",
        paragraphs: [
          "A falling wedge looks like it is going down and usually goes up. A descending triangle looks similar from far away and usually goes down. The difference is the bottom line: two ramps vs a flat floor.",
          "Open the Chart Shapes school in ClearPath Education. Every chapter is a labeled picture. Read the two lines, then name it.",
        ],
      },
      {
        heading: "The rest of the pattern zoo can wait",
        paragraphs: [
          "Double tops, cups, flags, and the rest are later vocabulary. If you cannot tell a ramp from a wall, more pattern names will only add noise.",
        ],
      },
    ],
    takeaways: [
      "Name wedges and triangles from the two boundary lines.",
      "Chart Shapes school is the picture lab for this.",
    ],
  },
  "forex-u4-l5": {
    summary:
      "Currency charts use the same four shapes. A falling wedge on a pair usually resolves up. A descending triangle usually resolves down. Check whether the bottom is a ramp or a wall.",
    visual: { kind: "compare", left: "falling-wedge", right: "descending-triangle" },
    sections: [
      {
        heading: "Same pictures, 24-hour tape",
        paragraphs: [
          "Forex does not get a private geometry. Two ramps that squeeze to a point are still a wedge. One flat wall with a ramp into it is still an ascending or descending triangle.",
          "Study the labeled pictures in Chart Shapes school, then look at your pair. If you cannot point to the wall, do not call it a triangle.",
        ],
      },
    ],
    takeaways: [
      "Ramp vs wall works on any market, including forex.",
      "Falling wedge ≠ descending triangle. The bottom line decides.",
    ],
  },
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

function buildFallbackLesson(
  lessonTitle: string,
  schoolName: string,
  unitTitle: string
): LessonBody {
  const topic = lessonTitle.replace(/\s+/g, " ").trim();
  return {
    summary: `${topic} sits inside ${schoolName}'s path (${unitTitle}). Read it as a calm building block — not a trade signal.`,
    sections: [
      {
        heading: "What this chapter is about",
        paragraphs: [
          `${topic} is one idea you need before the next chapter makes sense. In ClearPath Education we strip jargon first, then add only the detail that changes how you think about risk, process, or market structure.`,
          `Stay inside the ${schoolName} school framing: plain language, honest tradeoffs, and no promises of profit.`,
        ],
      },
      {
        heading: "Core idea",
        paragraphs: [
          `When professionals talk about "${topic}", they are usually pointing at a mechanism (how something works), a risk (how you can get hurt), or a decision rule (what to check before you act). Name which of those three this chapter is for you.`,
          "Write one sentence in your own words. If you cannot, re-read slowly — the goal is ownership of the idea, not finishing the list.",
        ],
      },
      {
        heading: "Why it matters in real markets",
        paragraphs: [
          "Markets punish confusion. People who skip foundations misread charts, misuse leverage, trust the wrong intermediary, or copy a strategy that does not match their constraints.",
          `Connecting "${topic}" to the rest of ${unitTitle} helps you see the system instead of isolated tips.`,
        ],
      },
      {
        heading: "How to practice this",
        paragraphs: [
          "1) Restate the idea to a friend without buzzwords. 2) Find one real-world example (a chart, a news print, a product fee). 3) Note one mistake this chapter is trying to prevent. 4) Only then move to the next lesson.",
        ],
      },
    ],
    takeaways: [
      `${topic} is a foundation idea inside ${schoolName}.`,
      "Understand the mechanism or risk before you act on it.",
      "If you cannot explain it simply, you are not done with the chapter.",
    ],
  };
}

export function getLessonBody(
  lessonId: string,
  lessonTitle: string,
  schoolName: string,
  unitTitle: string
): LessonBody {
  return AUTHORED[lessonId] ?? buildFallbackLesson(lessonTitle, schoolName, unitTitle);
}
