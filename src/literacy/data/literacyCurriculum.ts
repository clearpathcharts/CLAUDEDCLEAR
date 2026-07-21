export interface LiteracyLesson {
  id: string;
  title: string;
  minutes: number;
  body: string;
  unlocksWikiIds: string[];
  neuroHint: string;
}

export interface LiteracyTrack {
  id: string;
  title: string;
  summary: string;
  lessons: LiteracyLesson[];
}

export const LITERACY_TRACKS: LiteracyTrack[] = [
  {
    id: "track_observe",
    title: "Observe Without Concluding",
    summary: "Build the habit of describing charts and concepts before judging them.",
    lessons: [
      {
        id: "obs_1",
        title: "Name what you see",
        minutes: 5,
        body: "Open a chart and write five neutral observations (range, swing, candle size). No forecasts. Archive the note in Thesis Vault.",
        unlocksWikiIds: ["wiki_candles", "wiki_structure"],
        neuroHint: "Use Low Stimulation or Calm Focus if the desk feels loud.",
      },
      {
        id: "obs_2",
        title: "Timeframe matching",
        minutes: 8,
        body: "Pick one question (trend vs. noise) and choose a timeframe that fits. Write why that timeframe answers the question.",
        unlocksWikiIds: ["wiki_timeframes"],
        neuroHint: "Executive Function Support helps break this into steps.",
      },
      {
        id: "obs_3",
        title: "Uncertainty phrases",
        minutes: 6,
        body: "Rewrite a confident headline into uncertainty language: conditions, ranges, and unknowns. Pin it with decay so you revisit it.",
        unlocksWikiIds: ["wiki_risk_language"],
        neuroHint: "Reading Support profile softens dense text.",
      },
    ],
  },
  {
    id: "track_patterns",
    title: "Pattern Literacy Studio",
    summary: "Treat auto-detected structures as teaching moments, not instructions.",
    lessons: [
      {
        id: "pat_1",
        title: "Label geometry",
        minutes: 7,
        body: "When Pattern Literacy Studio highlights a structure, describe the geometry in plain language and link it to a Concept Wiki node.",
        unlocksWikiIds: ["wiki_patterns", "wiki_structure"],
        neuroHint: "Autism Predictable keeps layout stable while you study.",
      },
      {
        id: "pat_2",
        title: "Counter-examples",
        minutes: 10,
        body: "Find a chart that looks similar but fails the pattern definition. Archive both as a vault pair titled ‘lookalike vs. definition’.",
        unlocksWikiIds: ["wiki_patterns"],
        neuroHint: "ADHD Balanced Energy for short sprints with a coach cooldown.",
      },
    ],
  },
  {
    id: "track_sources",
    title: "Primary Source Hygiene",
    summary: "Watch public pages change; archive diffs for study.",
    lessons: [
      {
        id: "src_1",
        title: "First Sentinel check",
        minutes: 5,
        body: "Run Source Sentinel on at least one Fed, SEC, or Treasury page. Save any change excerpt into Thesis Vault.",
        unlocksWikiIds: ["wiki_risk_language"],
        neuroHint: "Reduced Signal Load if alerts feel noisy.",
      },
      {
        id: "src_2",
        title: "Morning Brief ritual",
        minutes: 8,
        body: "Open Personal Morning Brief. Review vault, sentinel diffs, open lessons, and pantry items — then stop. No action items beyond learning.",
        unlocksWikiIds: ["wiki_psychology"],
        neuroHint: "Hyperfocus profile for a single-composition brief.",
      },
    ],
  },
];
