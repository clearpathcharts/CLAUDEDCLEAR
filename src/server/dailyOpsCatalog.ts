/**
 * Founder daily ops — updated 18 Aug 2026.
 *
 * This is the list Richard A. Floyd / ClearPath Market Sciences actually
 * still needs. Shipped work is recorded so it is not re-checked as if it
 * were unfinished. Human items are capped so a low-energy day can still
 * close the survival set.
 */

export type OpsSection =
  | "site"
  | "marketing"
  | "outreach"
  | "business"
  | "personal"
  | "eod";

export type CatalogItem = {
  id: string;
  title: string;
  why: string;
  kind: "auto" | "human";
  /** daily = every day; rotate = only listed Pacific weekdays (0=Sun); weekly = Sundays */
  cadence: "daily" | "rotate" | "weekly";
  weekdays?: number[];
  survival?: boolean;
  section: OpsSection;
  /** Optional text field (win of the day, tomorrow's 3). */
  input?: "text";
};

export const SHIPPED_AS_OF_2026_08_18: Array<{ id: string; title: string; evidence: string }> = [
  {
    id: "self_upgrade_button",
    title: "PRO STATUS / handleSelfUpgrade button removed",
    evidence: "PR #132 · commit 460eb44 on origin/main",
  },
  {
    id: "legacy_vip_ui",
    title: "Client vipStatus no longer grants Ultimate",
    evidence: "useMembership + MembershipTab now trust /api/membership/me only (18 Aug 2026)",
  },
  {
    id: "stripe_catalog",
    title: "Live membership catalog is Basic → Silver → Gold → Platinum (founder sheet)",
    evidence: "src/lib/planCatalog.ts + src/lib/entitlements.ts + MembershipTab comparison table",
  },
  {
    id: "founder_email",
    title: "Founder email reserved at register",
    evidence: "PR #171",
  },
  {
    id: "diagnostics_removed",
    title: "Public Diagnostics UI removed (was probing vendor APIs)",
    evidence: "PR #170 · /api/status is founder-locked",
  },
  {
    id: "site_doctor",
    title: "Site Doctor hourly detect+report in CEO Dashboard",
    evidence: "src/server/siteDoctor.ts",
  },
  {
    id: "private_login",
    title: "Private Login email+password restored",
    evidence: "PR #168",
  },
  {
    id: "cpt_buddy",
    title: "C.P.T. Buddy mentor widget (Groq)",
    evidence: "POST /api/mentor/chat",
  },
  {
    id: "indacreator",
    title: "INDACREATOR (River) Pine import + River Genie",
    evidence: "POST /api/river/genie/chat · catalog routes",
  },
  {
    id: "gold_bar",
    title: "Gold Bar ATR trailing-stop example in INDACREATOR",
    evidence: "RiverWorkstation starter indicator",
  },
  {
    id: "indicator_bank",
    title: "Live Indicator Bank math (not placeholder counts)",
    evidence: "src/config/tradingViewIndicators.ts",
  },
  {
    id: "neuro_profiles",
    title: "13 neuro-adaptive chart profiles",
    evidence: "src/lib/theme/profiles.ts (includes standard_red_green)",
  },
  {
    id: "education_quiz",
    title: "ClearPath Education quiz pass/fail engine",
    evidence: "QuizEngine compares score to passingScore",
  },
  {
    id: "legal_footer",
    title: "Educational-only legal positioning in footer",
    evidence: "LegalFooter — does not advise on financial decisions",
  },
  {
    id: "wcag_footer",
    title: "Accessibility · WCAG first in site footers",
    evidence: "PR #179 / #178",
  },
  {
    id: "affiliate_os",
    title: "Affiliate Operating System desk",
    evidence: "affiliate routes + share links",
  },
  {
    id: "mobile_charts",
    title: "Phone Market Terminal full-viewport charts",
    evidence: "PR #176 / #180",
  },
  {
    id: "pattern_scanner",
    title: "Pattern scanner + Structure Read (educational)",
    evidence: "PR pattern-scanner / compliance-safe Structure Read",
  },
];

/** Remaining site/product work — backlog / ops, not Daily Ops auto-checks.
 *  These do NOT clear when you merge a PR. Each needs its own action
 *  (Firebase CLI, product build, or a conscious “drop the claim”). */
export const OPEN_SITE_WORK: Array<{ id: string; title: string; why: string }> = [
  {
    id: "deploy_firestore_rules",
    title: "Deploy Firestore rules that lock vipStatus / membership fields",
    why: "Merging rules into GitHub is not enough — run `firebase deploy --only firestore:rules` against the production project (or confirm rules already match in Console).",
  },
  {
    id: "ava_voice",
    title: "Ava voice receptionist — not built yet",
    why: "Intentionally open product work. Daily Ops no longer paints WARN for missing Twilio; build Ava or drop the claim from marketing copy.",
  },
  {
    id: "google_flow_section_guides",
    title: "Upload Google Flow section-guide clips (7×~10s per tab)",
    why: "Catalog + player shipped; videoUrl slots are empty until Flow exports are hosted on HTTPS. Run `npm run section-guides:print`, then set URLs in catalog.ts.",
  },
  {
    id: "cloud_run_after_merge",
    title: "Redeploy Cloud Run after merging main",
    why: "GitHub merge ≠ live site. This host has no auto-deploy-on-merge. Build/push the new image and update the Cloud Run service, then tap Run today’s sweep.",
  },
];

export const CATALOG: CatalogItem[] = [
  // —— Automated site (every day) ——
  {
    id: "auto_site_doctor",
    title: "Site Doctor pulse (auth, feed, secrets, private storage)",
    why: "Catches Cloud Run / Firestore / Twelve Data failures without a fake green dashboard",
    kind: "auto",
    cadence: "daily",
    survival: true,
    section: "site",
  },
  {
    id: "auto_public_pages",
    title: "Public pages respond (home, accessibility, learn, FAQ)",
    why: "Overnight deploys can 500 the marketing site while the terminal looks fine",
    kind: "auto",
    cadence: "daily",
    survival: true,
    section: "site",
  },
  {
    id: "auto_github_actions",
    title: "GitHub Actions / Cloud Build on CLAUDEDCLEAR",
    why: "Failed overnight CI is how broken main ships",
    kind: "auto",
    cadence: "daily",
    survival: true,
    section: "site",
  },
  {
    id: "auto_groq",
    title: "Groq key live (C.P.T. Buddy + INDACREATOR Genie)",
    why: "Mentor/Genie fall back to offline stubs if the key dies",
    kind: "auto",
    cadence: "daily",
    section: "site",
  },
  {
    id: "auto_twilio_ava",
    title: "Twilio account (Ava voice is not in-repo — this is the stand-in)",
    why: "Confirms the SMS/voice vendor is authenticated; does not invent an Ava URL",
    kind: "auto",
    cadence: "daily",
    section: "site",
  },
  {
    id: "auto_stripe",
    title: "Stripe secret present (checkout, not fake MRR)",
    why: "Membership catalog is real; revenue numbers are not until charges exist",
    kind: "auto",
    cadence: "daily",
    section: "business",
  },
  {
    id: "auto_indicator_bank",
    title: "Indicator Bank count is live math, not a placeholder",
    why: "Placeholder 99/100-style counts crept in before; bank must stay sourced from code",
    kind: "auto",
    cadence: "daily",
    section: "site",
  },
  {
    id: "auto_a11y_profiles",
    title: "Neuro chart profiles = 13 (not 12)",
    why: "standard_red_green is the 13th; claiming 12 is stale",
    kind: "auto",
    cadence: "daily",
    section: "site",
  },
  {
    id: "auto_legacy_vip",
    title: "No client vipStatus / handleSelfUpgrade grant path",
    why: "Original hole patched; this check fails if the leftover grant is reintroduced",
    kind: "auto",
    cadence: "daily",
    survival: true,
    section: "site",
  },
  {
    id: "auto_legal",
    title: "Educational-only footer language intact",
    why: "SEC/FINRA posture: visualize, do not advise",
    kind: "auto",
    cadence: "daily",
    section: "business",
  },
  {
    id: "auto_quiz",
    title: "Education quiz pass/fail still uses passingScore",
    why: "Pass must not be a hard-coded true",
    kind: "auto",
    cadence: "daily",
    section: "site",
  },
  {
    id: "auto_secrets_scan",
    title: "No hardcoded live API keys in src/",
    why: "Keys belong in Cloud Run secrets, never in the bundle",
    kind: "auto",
    cadence: "daily",
    section: "site",
  },
  {
    id: "auto_investor",
    title: "Today’s researched investor (VC / angel / seed)",
    why: "One real firm per day with public-source notes — no invented AUM",
    kind: "auto",
    cadence: "daily",
    section: "outreach",
  },

  // —— Human site ——
  {
    id: "human_user_flow",
    title: "One full member flow: sign-in → chart → one indicator",
    why: "Automated pings miss chart touch and session bugs",
    kind: "human",
    cadence: "daily",
    survival: true,
    section: "site",
  },
  {
    id: "human_mobile",
    title: "Phone check: charts, scroll, touch (or skip if user-flow was on phone)",
    why: "Viewport work shipped; regression is still the #1 user-facing risk",
    kind: "human",
    cadence: "rotate",
    weekdays: [1, 3, 5],
    section: "site",
  },
  {
    id: "human_agent_output",
    title: "Review yesterday’s AI/agent claims — anything unverified?",
    why: "Unverified features are how fake data ships",
    kind: "human",
    cadence: "daily",
    survival: true,
    section: "site",
  },
  {
    id: "human_explain",
    title: "Spot-check 2 Explain Mode / encyclopedia sections for accuracy",
    why: "Educational product; one wrong popup is a trust hole",
    kind: "human",
    cadence: "rotate",
    weekdays: [2, 4],
    section: "site",
  },
  {
    id: "human_gold_bar",
    title: "Open a live chart and confirm Gold Bar still draws",
    why: "Feed + overlay regressions are silent",
    kind: "human",
    cadence: "rotate",
    weekdays: [3],
    section: "site",
  },
  {
    id: "human_one_profile",
    title: "Switch one neuro profile on a live chart (not all 13)",
    why: "Daily-all-12 was theater; one real switch catches theme breakage",
    kind: "human",
    cadence: "rotate",
    weekdays: [4],
    section: "site",
  },

  // —— Marketing: one public post, rotating channel ——
  {
    id: "human_post_x",
    title: "Post one ClearPath piece on X",
    why: "One native post beats four rushed ones",
    kind: "human",
    cadence: "rotate",
    weekdays: [1],
    section: "marketing",
  },
  {
    id: "human_post_ig",
    title: "Post one ClearPath piece on Instagram",
    why: "Rotate platforms; do not spray all four daily",
    kind: "human",
    cadence: "rotate",
    weekdays: [2],
    section: "marketing",
  },
  {
    id: "human_post_tt",
    title: "Post one ClearPath piece on TikTok",
    why: "Same cadence rule as X/IG",
    kind: "human",
    cadence: "rotate",
    weekdays: [3],
    section: "marketing",
  },
  {
    id: "human_post_yt",
    title: "Post one YouTube Short",
    why: "Thursday slot",
    kind: "human",
    cadence: "rotate",
    weekdays: [4],
    section: "marketing",
  },
  {
    id: "human_post_a11y",
    title: "Post the neurodivergent / accessibility differentiator",
    why: "Use it often, not as four extra posts on top of everything else",
    kind: "human",
    cadence: "rotate",
    weekdays: [5],
    section: "marketing",
  },
  {
    id: "human_post_ta",
    title: "Share one Trading Anarchy educational clip",
    why: "Methodology is the credibility layer",
    kind: "human",
    cadence: "rotate",
    weekdays: [6],
    section: "marketing",
  },
  {
    id: "human_encyclopedia_write",
    title: "Write one new Encyclopedia of Finance paragraph (or skip if energy is low)",
    why: "Content compounder — weekly-ish, not 75 other tasks first",
    kind: "human",
    cadence: "rotate",
    weekdays: [0],
    section: "marketing",
  },
  {
    id: "human_comments",
    title: "Reply to yesterday’s comments on the platform you posted",
    why: "Engagement > extra posting",
    kind: "human",
    cadence: "daily",
    section: "marketing",
  },
  {
    id: "human_calendar",
    title: "Confirm today’s content calendar slot (or mark none)",
    why: "Stops double-posting and blank days",
    kind: "human",
    cadence: "daily",
    section: "marketing",
  },
  {
    id: "human_fb_group",
    title: "One relevant Facebook group post — follow THAT group’s rules",
    why: "Daily blasting ~7,000 groups is spam/TOS. Weekly max.",
    kind: "human",
    cadence: "weekly",
    section: "marketing",
  },

  // —— Outreach: researched investor is auto; one extra human send ——
  {
    id: "human_investor_send",
    title: "Send (or skip) today’s researched investor note — copy from the desk, do not auto-mail",
    why: "Writes need a human. The desk researches; you send.",
    kind: "human",
    cadence: "daily",
    section: "outreach",
  },
  {
    id: "human_demo_followup",
    title: "Follow up one demo / trial request (or mark none pending)",
    why: "Warm inbound beats cold VC on conversion",
    kind: "human",
    cadence: "rotate",
    weekdays: [1],
    section: "outreach",
  },
  {
    id: "human_affiliate",
    title: "One affiliate / educator / creator outreach",
    why: "Distribution",
    kind: "human",
    cadence: "rotate",
    weekdays: [2],
    section: "outreach",
  },
  {
    id: "human_advocacy",
    title: "One neurodivergent advocacy / community note",
    why: "Differentiator needs real community, not just posts",
    kind: "human",
    cadence: "rotate",
    weekdays: [3],
    section: "outreach",
  },
  {
    id: "human_press",
    title: "One journalist / podcast / LinkedIn comment (not a like)",
    why: "Press and peer visibility",
    kind: "human",
    cadence: "rotate",
    weekdays: [4],
    section: "outreach",
  },
  {
    id: "human_ta_community",
    title: "Check Trading Anarchy community for unanswered questions",
    why: "Your credibility channel",
    kind: "human",
    cadence: "rotate",
    weekdays: [6],
    section: "outreach",
  },
  {
    id: "human_board",
    title: "Check in with one board member (Brian, Dustin, or Brent)",
    why: "Weekly, not daily nagging",
    kind: "human",
    cadence: "weekly",
    section: "outreach",
  },

  // —— Business (gated) ——
  {
    id: "human_mau",
    title: "Glance at MAU / new private members (CEO Members tab)",
    why: "Until Stripe MRR exists, members are the number",
    kind: "human",
    cadence: "rotate",
    weekdays: [5],
    section: "business",
  },
  {
    id: "human_support",
    title: "Support / complaints (or mark none)",
    why: "Password reset and login issues have been the real fire",
    kind: "human",
    cadence: "daily",
    section: "business",
  },
  {
    id: "human_competitor",
    title: "One competitor glance in Market Recon",
    why: "Weekly-ish; not a second full-time job",
    kind: "human",
    cadence: "rotate",
    weekdays: [2],
    section: "business",
  },

  // —— Personal (non-negotiable) ——
  {
    id: "human_break",
    title: "Decompression break (CPMS TV/Arcade counts)",
    why: "Sustainability is a ship criterion",
    kind: "human",
    cadence: "daily",
    survival: true,
    section: "personal",
  },
  {
    id: "human_outside",
    title: "Ten minutes outside / backyard",
    why: "Listed as non-negotiable",
    kind: "human",
    cadence: "daily",
    survival: true,
    section: "personal",
  },
  {
    id: "human_body",
    title: "Body check — seizure warning signs, rest if needed",
    why: "If this fails, stop the list",
    kind: "human",
    cadence: "daily",
    survival: true,
    section: "personal",
  },
  {
    id: "human_win",
    title: "Write one win from today",
    why: "Closes the day honestly",
    kind: "human",
    cadence: "daily",
    survival: true,
    section: "personal",
    input: "text",
  },
  {
    id: "human_two_streams",
    title: "Did not start more than 2 new major workstreams",
    why: "The old 75-item list violated this",
    kind: "human",
    cadence: "daily",
    survival: true,
    section: "personal",
  },
  {
    id: "human_charts_skill",
    title: "15 min Four Up Three Down (your credibility)",
    why: "Optional if body check failed",
    kind: "human",
    cadence: "rotate",
    weekdays: [1, 3, 5],
    section: "personal",
  },
  {
    id: "human_roblox",
    title: "15 min Roblox Market Islands — only if energy allows",
    why: "Creative outlet, not a guilt item",
    kind: "human",
    cadence: "rotate",
    weekdays: [0, 6],
    section: "personal",
  },

  // —— EOD ——
  {
    id: "human_deploy",
    title: "If you pushed to main: confirm Cloud Build / Actions succeeded",
    why: "Skip when you did not push",
    kind: "human",
    cadence: "daily",
    section: "eod",
  },
  {
    id: "human_tomorrow",
    title: "Tomorrow’s top 3 priorities",
    why: "Replaces re-reading a 75-item scroll",
    kind: "human",
    cadence: "daily",
    survival: true,
    section: "eod",
    input: "text",
  },
  {
    id: "human_unverified",
    title: "Anything claimed today without verification? If yes, it is tomorrow’s first item",
    why: "Closes the honesty loop",
    kind: "human",
    cadence: "daily",
    survival: true,
    section: "eod",
  },
];

export function pacificDateKey(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function pacificWeekday(at: Date = new Date()): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
  }).format(at);
  const i = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  return i >= 0 ? i : at.getDay();
}

export function itemsForDay(at: Date = new Date()): CatalogItem[] {
  const wd = pacificWeekday(at);
  return CATALOG.filter((item) => {
    if (item.cadence === "daily") return true;
    if (item.cadence === "weekly") return wd === 0;
    if (item.cadence === "rotate") return (item.weekdays || []).includes(wd);
    return false;
  });
}
