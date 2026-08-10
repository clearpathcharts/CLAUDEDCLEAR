/**
 * Per-section guide videos for ClearPath Trader.
 *
 * Production: generate each clip in Google Flow (Veo), export MP4 ≤ 3 min,
 * host on HTTPS (GCS / CDN), then set `videoUrl` here.
 * Until `videoUrl` is set, the offer still appears and the player shows “coming soon”.
 */

export type SectionGuideId =
  | 'Discovery'
  | 'StrictlyCharts'
  | 'TheRiver'
  | 'Yours'
  | 'News'
  | 'Membership'
  | 'ClearPathEducation'
  | 'LiteracyOS'
  | 'Encyclopedia'
  | 'CpmsApk'
  | 'Biography'
  | 'AffiliateNetwork';

export type SectionGuideEntry = {
  tabId: SectionGuideId;
  /** Short label matching nav language. */
  title: string;
  /** One calm sentence for the offer strip. */
  blurb: string;
  /** Target length for Flow export (never over 180s). */
  targetSeconds: number;
  /** Direct MP4/HLS URL after upload. Empty = not shipped yet. */
  videoUrl: string;
  posterUrl?: string;
  /** Paste into Google Flow as the scene / film brief. */
  flowPrompt: string;
  /** Spoken narration outline (keep plain English, ND-friendly). */
  narrationScript: string;
};

const BRAND_LOOK =
  'ClearPath Trader aesthetic: calm dark terminal, electric cyan #00E5FF and soft pink accents, glass panels, no casino neon chaos, no hype text on screen, educational tone, neurodivergent-friendly pacing, readable large UI mock overlays, cinematic but quiet.';

export const SECTION_GUIDES: Record<SectionGuideId, SectionGuideEntry> = {
  Discovery: {
    tabId: 'Discovery',
    title: 'Home',
    blurb: 'A short walk through your ClearPath home hub and where everything lives.',
    targetSeconds: 120,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} Opening tour of the ClearPath Trader HOME / Discovery hub. Slow camera over a dark glass dashboard with hub tiles: Charts, INDACREATOR, Education, Literacy OS, Encyclopedias, Memberships, C.P.T. Buddy. Soft cyan light. No text overload. End on a gentle invite to explore.`,
    narrationScript: [
      'Welcome to ClearPath Trader — this is Home.',
      'These tiles are shortcuts. Charts for live markets. INDACREATOR for Pine indicators.',
      'Education and Literacy OS are where you learn. Encyclopedias go deeper.',
      'Memberships is plans. C.P.T. Buddy is your in-app guide anytime.',
      'Take your time. Nothing here is rushing you.',
    ].join(' '),
  },
  StrictlyCharts: {
    tabId: 'StrictlyCharts',
    title: 'Charts',
    blurb: 'How live charts work — and how neuro-adaptive profiles change the look, not the data.',
    targetSeconds: 150,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} ClearPath Charts workspace. Candlestick chart filling the frame, then a calm UI panel labeled Neuro-Adaptive Chart Profiles. Softly cycle visual themes (calm cyan, low stimulation muted, high contrast reading support) while price structure stays the same. Emphasize comfort, not signals. No buy/sell arrows.`,
    narrationScript: [
      'This is Charts — live market structure on ClearPath.',
      'Neuro-Adaptive Chart Profiles change colors, spacing, and motion so different brains can read the same data more comfortably.',
      'They do not change prices or give advice. Switch anytime. Start with Calm Focus if you are unsure.',
    ].join(' '),
  },
  TheRiver: {
    tabId: 'TheRiver',
    title: 'INDACREATOR',
    blurb: 'Upload or paste Pine Script, compile it, and apply indicators to your charts.',
    targetSeconds: 150,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} INDACREATOR workstation: code editor with //@version=5 Pine Script, compile success glow in cyan, then indicator overlays appearing on a chart. Brief glimpse of River Genie co-pilot panel on the right. Calm, technical, empowering — not flashy hacker tropes.`,
    narrationScript: [
      'INDACREATOR is where you bring Pine Script indicators into ClearPath.',
      'Upload a file or paste code, wait for compile, adjust inputs if shown, then apply.',
      'River Genie can help write or fix scripts — you still choose when to apply.',
      'Open Charts afterward to see your indicator on the workspace.',
    ].join(' '),
  },
  Yours: {
    tabId: 'Yours',
    title: 'Y.W.C.',
    blurb: 'Yours / World / Community — your hub for personal and shared ClearPath spaces.',
    targetSeconds: 100,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} Y.W.C. hub — warm community energy without noise. Three soft zones fading in: Yours, World, Community. Abstract network nodes in cyan/pink on dark glass. Inclusive, calm.`,
    narrationScript: [
      'Y.W.C. means Yours, World, and Community.',
      'It is your hub for personal charts and shared ClearPath spaces.',
      'Explore at your own pace — community without pressure.',
    ].join(' '),
  },
  News: {
    tabId: 'News',
    title: 'News',
    blurb: 'Where ClearPath posts market and platform updates you can actually read.',
    targetSeconds: 90,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} News feed UI on a dark terminal — clean headlines, timestamps, soft cyan rules. Slow scroll. Serious journalism energy, not breaking-news panic red.`,
    narrationScript: [
      'News is the ClearPath reading feed for platform and market updates.',
      'Skim headlines when you want context. Nothing here forces a trade.',
    ].join(' '),
  },
  Membership: {
    tabId: 'Membership',
    title: 'Memberships',
    blurb: 'Plans and membership options — clear choices, no countdown pressure.',
    targetSeconds: 100,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} Memberships comparison layout on glass cards, soft cyan outlines, no flashing timers, no FOMO badges. Calm decision energy.`,
    narrationScript: [
      'Memberships is where you compare ClearPath plans.',
      'Read what each tier includes. Take your time — there is no countdown clock here.',
    ].join(' '),
  },
  ClearPathEducation: {
    tabId: 'ClearPathEducation',
    title: 'Education',
    blurb: 'Schools, lessons, and quizzes that unlock as you learn — including Four Up, Three Down.',
    targetSeconds: 150,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} ClearPath Education: school → unit → lesson pages, then a simple quiz checkmark. Abstract chart geometry suggesting Four Up Three Down structure without claiming guaranteed profits. Warm educator presence.`,
    narrationScript: [
      'ClearPath Education is structured learning — schools, units, lessons, then a short quiz.',
      'Passing unlocks the next unit. Progress is saved.',
      'This is where Four Up, Three Down is taught with patience, not hype.',
    ].join(' '),
  },
  LiteracyOS: {
    tabId: 'LiteracyOS',
    title: 'Literacy OS',
    blurb: 'Your personal market-science desk — vault, wiki, sentinel, pattern studio, and study tools.',
    targetSeconds: 160,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} Literacy OS desk montage: Thesis Vault notes, Concept Wiki cards, Source Sentinel page diffs, Pattern Literacy studio, Study Coach. Education lab vibe — not brokerage.`,
    narrationScript: [
      'Literacy OS is your personal market-science learning desk.',
      'Use the vault, wiki, Source Sentinel, pattern studio, and study coach to archive and verify ideas.',
      'It is education only — not brokerage or advice.',
    ].join(' '),
  },
  Encyclopedia: {
    tabId: 'Encyclopedia',
    title: 'Encyclopedia',
    blurb: 'Deep finance knowledge library — browse topics, labs, and the AI tutor when you want more.',
    targetSeconds: 120,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} Encyclopedia of Finance — vast but calm library shelves made of glass panels and soft cyan index labels. Open an article panel. Optional small AI tutor chat corner. Academic, not flashy.`,
    narrationScript: [
      'The Encyclopedia of Finance is ClearPath’s deep knowledge library.',
      'Browse sections, open articles, and ask the tutor when you want a plain-English explanation.',
      'Go as deep as you like — then return to Charts or Education when you are ready.',
    ].join(' '),
  },
  CpmsApk: {
    tabId: 'CpmsApk',
    title: 'Cinema',
    blurb: 'ClearPath Cinema and media pantry — how to watch without leaving the terminal.',
    targetSeconds: 100,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} ClearPath Cinema player UI — large video stage, pantry shelf of titles, soft ambient cyan. Focus on how to pick and play media inside the app.`,
    narrationScript: [
      'ClearPath Cinema is where platform media lives.',
      'Pick a title from the pantry, play it here, and return to your desk when you are done.',
    ].join(' '),
  },
  Biography: {
    tabId: 'Biography',
    title: 'Profile',
    blurb: 'Your account and biography settings — the quiet control room for you.',
    targetSeconds: 90,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} Profile / biography settings panel — avatar, display name, calm form fields. Private, respectful, simple.`,
    narrationScript: [
      'Profile is your account space — name, biography, and personal settings.',
      'Update what you want others to see, then head back to Charts or Home.',
    ].join(' '),
  },
  AffiliateNetwork: {
    tabId: 'AffiliateNetwork',
    title: 'Affiliate Network',
    blurb: 'Your referral link, rewards, and how ClearPath affiliate sharing works.',
    targetSeconds: 120,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} Affiliate Network dashboard — share URL, gentle rewards ladder, trust-first aesthetic. No get-rich imagery.`,
    narrationScript: [
      'Affiliate Network is your referral desk.',
      'Every private account gets a share link. Friends who join can earn you account credit per the program rules.',
      'Share only when it feels right — ClearPath stays education-first.',
    ].join(' '),
  },
};

export const SECTION_GUIDE_TAB_IDS = Object.keys(SECTION_GUIDES) as SectionGuideId[];

export function getSectionGuide(tabId: string): SectionGuideEntry | null {
  if (!tabId || !(tabId in SECTION_GUIDES)) return null;
  return SECTION_GUIDES[tabId as SectionGuideId];
}

export function sectionGuideHasVideo(entry: SectionGuideEntry): boolean {
  return Boolean(entry.videoUrl && /^https?:\/\//i.test(entry.videoUrl.trim()));
}
