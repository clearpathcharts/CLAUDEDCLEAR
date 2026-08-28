/** Clear Path Trader monthly operating budget — August 2026 snapshot. */

export type BudgetLine = {
  vendor: string;
  monthly: string;
  status: string;
  note: string;
};

export const MONTHLY_BUDGET = {
  month: "August 2026",
  source: "src/data/monthlyBudget.ts — edit this file; a sheet/API import can replace it later",
  named: 1282,
  missingLiveTotal: 113,
  operatingFloor: 1395,
  twelveDataSharePct: 78,
  warning:
    "The gap is not another $499 data vendor. Twelve Data is the expensive line. Missing is Zapier, Gemini API (not Flow), rest of GCP, and two domains. Do not add FMP or NewsData until members pay.",
  namedBills: [
    {
      vendor: "Twelve Data Venture x2",
      monthly: "$998",
      status: "Paying",
      note: "$499 × 2. Business Venture is the commercial/display plan the live site needs.",
    },
    {
      vendor: "Google Cloud Run (quoted)",
      monthly: "$125",
      status: "Paying",
      note: "Live project has four services, not one.",
    },
    {
      vendor: "Google Flow / AI Ultra 5x",
      monthly: "$99",
      status: "Paying",
      note: "Veo video studio — not the trader Gemini API.",
    },
    {
      vendor: "Cursor Pro+",
      monthly: "$60",
      status: "Paying",
      note: "Named $60.",
    },
  ] satisfies BudgetLine[],
  missingLiveBills: [
    {
      vendor: "Zapier Professional",
      monthly: "$30",
      status: "$20–$70",
      note: "MCP is live. Free is 100 tasks; each MCP call burns 2.",
    },
    {
      vendor: "Gemini / Vertex AI",
      monthly: "$40",
      status: "$20–$80",
      note: "Mentor/search/voice. Separate from Flow $99.",
    },
    {
      vendor: "Rest of GCP",
      monthly: "$45",
      status: "$25–$80",
      note: "Firestore, Storage, Artifact Registry, Cloud Build, logging. Confirm vs the $125 Cloud Run line.",
    },
    {
      vendor: "Domains",
      monthly: "$3",
      status: "~$3",
      note: "clearpathtrader.com + fuckweasel.net, amortized.",
    },
  ] satisfies BudgetLine[],
  cloudRun: [
    {
      service: "clear-path-markets-science",
      region: "europe-west1",
      job: "Live trader / clearpathtrader.com",
      risk: "Keep — this is the product",
    },
    {
      service: "clearpath-automation-console",
      region: "europe-west1",
      job: "Publisher console",
      risk: "Keep one region",
    },
    {
      service: "clearpath-automation-console",
      region: "us-central1",
      job: "Same console, second region",
      risk: "Likely waste — delete if unused",
    },
    {
      service: "clearpath-voice-os",
      region: "us-central1",
      job: "Ava / Gemini TTS",
      risk: "Keep only if voice is shipping",
    },
  ],
  cover: {
    proMembers: 70,
    ultimateMembers: 20,
  },
};
