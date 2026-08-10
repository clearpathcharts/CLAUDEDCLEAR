/**
 * Per-section guide videos for ClearPath Trader.
 *
 * Format: each nav section has exactly 7 short beats (~10s each, ≈70s total).
 * Produce each beat in Google Flow (Veo), export MP4, host on HTTPS (GCS / CDN),
 * then set that beat’s `videoUrl`. Empty URL = “coming soon” for that beat only.
 *
 * Voice: calm, plain English, neurodivergent-friendly, education-only.
 * No casino hype, FOMO, or fake trading signals.
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

/** Exactly seven beats per section. */
export const SECTION_GUIDE_BEAT_COUNT = 7;

/** Default target length per beat (seconds). */
export const SECTION_GUIDE_BEAT_TARGET_SECONDS = 10;

export type SectionGuideBeat = {
  /** Stable id within the section, e.g. `01-what-it-is`. */
  id: string;
  /** Short on-screen title for the beat list. */
  title: string;
  /** Target length for Flow export (~10s). */
  targetSeconds: number;
  /** Direct MP4/HLS URL after upload. Empty = not shipped yet. */
  videoUrl: string;
  posterUrl?: string;
  /** Paste into Google Flow as the scene / film brief. */
  flowPrompt: string;
  /** Spoken narration (keep plain English, ND-friendly, ~1–2 sentences). */
  narrationScript: string;
};

export type SectionGuideEntry = {
  tabId: SectionGuideId;
  /** Short label matching nav language. */
  title: string;
  /** One calm sentence for the offer strip. */
  blurb: string;
  /**
   * Sum of beat targets (≈70s). Kept for offer copy / tests;
   * prefer summing `beats` when editing lengths.
   */
  targetSeconds: number;
  /** Exactly {@link SECTION_GUIDE_BEAT_COUNT} titled clips, in play order. */
  beats: SectionGuideBeat[];
};

const BRAND_LOOK =
  'ClearPath Trader aesthetic: calm dark terminal, electric cyan #00E5FF and soft pink accents, glass panels, no casino neon chaos, no hype text on screen, educational tone, neurodivergent-friendly pacing, readable large UI mock overlays, cinematic but quiet. Clip length about 10 seconds. Soft fade in and out. No buy/sell arrows, no countdown timers, no FOMO badges.';

type BeatDraft = {
  id: string;
  title: string;
  flow: string;
  narration: string;
  targetSeconds?: number;
};

function makeBeats(drafts: BeatDraft[]): SectionGuideBeat[] {
  if (drafts.length !== SECTION_GUIDE_BEAT_COUNT) {
    throw new Error(
      `Section guides require exactly ${SECTION_GUIDE_BEAT_COUNT} beats, got ${drafts.length}`
    );
  }
  return drafts.map((d) => ({
    id: d.id,
    title: d.title,
    targetSeconds: d.targetSeconds ?? SECTION_GUIDE_BEAT_TARGET_SECONDS,
    videoUrl: '',
    flowPrompt: `${BRAND_LOOK} ${d.flow}`,
    narrationScript: d.narration,
  }));
}

function sumTargets(beats: SectionGuideBeat[]): number {
  return beats.reduce((n, b) => n + b.targetSeconds, 0);
}

function entry(
  tabId: SectionGuideId,
  title: string,
  blurb: string,
  drafts: BeatDraft[]
): SectionGuideEntry {
  const beats = makeBeats(drafts);
  return {
    tabId,
    title,
    blurb,
    targetSeconds: sumTargets(beats),
    beats,
  };
}

export const SECTION_GUIDES: Record<SectionGuideId, SectionGuideEntry> = {
  Discovery: entry(
    'Discovery',
    'Home',
    'Seven short clips: what Home is, where to click, and how to move without rushing.',
    [
      {
        id: '01-what-it-is',
        title: 'What Home is',
        flow: 'HOME / Discovery hub fills the frame — dark glass dashboard, soft cyan glow, no text overload. Gentle establishing shot of the ClearPath home screen.',
        narration:
          'This is Home — your ClearPath hub. Every card is a door into another part of the terminal.',
      },
      {
        id: '02-where-you-land',
        title: 'Where you land',
        flow: 'Slow push into the hero greeting area with member name and a short “every card is a door” line. Calm, welcoming, uncluttered.',
        narration:
          'You land on a quiet greeting and a short map of the product. Nothing here is a to-do list.',
      },
      {
        id: '03-nav-cards',
        title: 'Nav cards',
        flow: 'Camera glides across hub tiles labeled Charts, INDACREATOR, Education, Literacy OS, Memberships, C.P.T. Buddy. Soft cyan outlines. One tile gently highlights.',
        narration:
          'These tiles are shortcuts. Charts for markets. INDACREATOR for Pine. Education and Literacy OS for learning.',
      },
      {
        id: '04-where-to-click',
        title: 'Where to click',
        flow: 'Cursor or soft focus ring taps the Charts tile; brief transition hint toward the Charts workspace. Calm click, no urgency.',
        narration:
          'Tap any card when you are ready. Start with Charts or Education if you want a clear next step.',
      },
      {
        id: '05-what-you-see',
        title: 'What you will see',
        flow: 'After a tap, the destination tab chrome appears briefly — Charts workspace peek — then soft return hint to Home tiles. Show that navigation is reversible.',
        narration:
          'You will jump into that section. Use the side nav anytime to come back to Home.',
      },
      {
        id: '06-appealing-additions',
        title: 'Practice sandboxes',
        flow: 'Brief glance at Appealing Additions sandboxes — budget, cash-flow, concept flask — labeled as practice, not brokerage. Soft educational lab vibe.',
        narration:
          'Below the doors, practice sandboxes let you explore ideas without pressure. They are learning tools, not brokerage.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Return to a still Home frame. Soft cyan pulse under one card label. End card: “Read the line under each card — then choose.” Fade out.',
        narration:
          'Calm tip: read the line under each card before you tap. Home is a map — take your time.',
      },
    ]
  ),

  StrictlyCharts: entry(
    'StrictlyCharts',
    'Charts',
    'Seven short clips on the live chart desk — profiles, timeframes, and comfort tools.',
    [
      {
        id: '01-what-it-is',
        title: 'What Charts is',
        flow: 'Wide shot of the Clear Path Command Terminal — multi-slot candlestick charts on dark glass, cyan accents. Educational market structure, no signal arrows.',
        narration:
          'This is Charts — ClearPath’s live market desk. You are looking at structure, not tips.',
      },
      {
        id: '02-neuro-profiles',
        title: 'Neuro-Adaptive Profiles',
        flow: 'Close on Neuro-Adaptive Chart Profiles picker. Softly cycle visual themes (calm cyan, low stimulation muted, high contrast) while price structure stays identical.',
        narration:
          'Neuro-Adaptive Profiles change colors, spacing, and motion so different brains can read the same data more comfortably.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Focus ring on the profile control, then on the timeframe bar (1m → YTD). Calm pointer movement. No flashing CTAs.',
        narration:
          'Open Profiles when the look feels harsh. Use the timeframe bar to change how much history you see.',
      },
      {
        id: '04-slots-and-symbols',
        title: 'Slots and symbols',
        flow: 'Three chart slots visible; soft highlight on symbol search in one slot. Brief drag-arrange hint on desktop. Quiet, technical.',
        narration:
          'Each slot can hold a symbol. Search to change it. On desktop you can rearrange slots when you want a clearer layout.',
      },
      {
        id: '05-what-you-see',
        title: 'What you will see',
        flow: 'Candles redraw after a timeframe change; left rail shows Pattern Scanner and drawing tools lightly — labeled as study tools, not advice.',
        narration:
          'You will see the same market through a clearer lens. Pattern tools and drawings are for study — they do not place trades.',
      },
      {
        id: '06-blackout-mode',
        title: 'Blackout Mode',
        flow: 'UI chrome softens into Blackout Mode — dual charts, quieter chrome, more chart area. Calm focus energy.',
        narration:
          'Blackout Mode hides extra chrome when you want a quieter dual-chart view. Exit anytime.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Still chart frame. Soft caption energy: profiles never change prices. Fade out on calm cyan candle silhouette.',
        narration:
          'Calm tip: start with Calm Focus if you are unsure. Profiles never change prices or tell you what to do.',
      },
    ]
  ),

  TheRiver: entry(
    'TheRiver',
    'INDACREATOR',
    'Seven short clips: Pine upload, compile, Genie, and applying indicators calmly.',
    [
      {
        id: '01-what-it-is',
        title: 'What INDACREATOR is',
        flow: 'INDACREATOR workstation establishing shot — code editor and chart side by side on dark glass. Technical, empowering, not flashy hacker tropes.',
        narration:
          'INDACREATOR is where you bring Pine Script indicators into ClearPath — a studio, not a signal service.',
      },
      {
        id: '02-honest-limits',
        title: 'Honest limits',
        flow: 'Brief focus on River honest-limits bento cards — what River can and cannot do. Soft cyan check and quiet “cannot” lines. Trust-first.',
        narration:
          'Start with the honest limits. River helps with scripts and charts; it does not trade for you.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Upload / paste / drag-drop zone for a .pine file highlights gently. Cursor drops a small file icon into the editor.',
        narration:
          'Upload a .pine file, paste code, or drag and drop. That is your first click when you have a script ready.',
      },
      {
        id: '04-compile',
        title: 'Compile',
        flow: 'Compile button soft-press; cyan success glow; inputs panel and honest notes appear. No celebration confetti.',
        narration:
          'Press compile. Read the inputs and honest notes before you decide to apply anything.',
      },
      {
        id: '05-what-you-see',
        title: 'What you will see',
        flow: 'Indicator overlays fade onto a chart after Apply to All Charts. Calm reveal. Chart remains the focus.',
        narration:
          'After you apply, overlays appear on your charts. Open Charts anytime to study them at your pace.',
      },
      {
        id: '06-river-genie',
        title: 'River Genie',
        flow: 'River Genie co-pilot panel on the right — draft or fix script chat, then a soft path back to compile. Helpful, not pushy.',
        narration:
          'River Genie can help draft or fix scripts. You still choose when to compile and when to apply.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Still workstation frame. Soft end line. Note that Pro+ may gate the full studio — shown calmly, no FOMO.',
        narration:
          'Calm tip: compile first, read the notes, apply when you are ready. Some studio features need a higher plan — Basic still lets you learn elsewhere.',
      },
    ]
  ),

  Yours: entry(
    'Yours',
    'Y.W.C.',
    'Seven short clips for Your World Connected — context, chart, and filters without noise.',
    [
      {
        id: '01-what-it-is',
        title: 'What Y.W.C. is',
        flow: 'Y.W.C. lava-styled desk — warm community energy without noise. Brand hero for Your World Connected. Inclusive, calm.',
        narration:
          'Y.W.C. means Your World Connected — news, magazines, and a live chart on one desk.',
      },
      {
        id: '02-where-you-land',
        title: 'Where you land',
        flow: 'Hero area with brand mark and a quiet live chart workspace peeking below. Soft ambient motion only.',
        narration:
          'You land on the brand hero and your personal chart space. Context and markets share one screen.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Section filter chips highlight in turn: Sports, World, Finance, Magazines — soft selection, no clutter pile-up.',
        narration:
          'Use the section filters to choose a feed — World, Finance, Magazines, and more — one at a time.',
      },
      {
        id: '04-what-you-see',
        title: 'What you will see',
        flow: 'Hero story card opens into a calm story reader. Magazines/hub panel visible. Serious reading energy, not panic red.',
        narration:
          'You will see a hero story and a reader. Open what interests you; close it when you are done.',
      },
      {
        id: '05-personal-chart',
        title: 'Personal chart',
        flow: 'Focus shifts to YwcPersonalCharts — a live chart nestled in the Y.W.C. desk. Soft cyan crosshair, educational.',
        narration:
          'Your personal chart stays nearby so context and price structure can sit side by side.',
      },
      {
        id: '06-rss-and-social',
        title: 'Feeds and social',
        flow: 'Brief RSS sync / social connect controls glow softly — labeled as optional. No notification spam visuals.',
        narration:
          'RSS and social tools are optional. Use them when you want more context — skip them when you need quiet.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Pull back to the full Y.W.C. desk. Soft fade. End on stillness.',
        narration:
          'Calm tip: leave when the noise rises. The chart will still be here when you return.',
      },
    ]
  ),

  News: entry(
    'News',
    'News',
    'Seven short clips on the live wire — refresh, read, and leave without pressure.',
    [
      {
        id: '01-what-it-is',
        title: 'What News is',
        flow: 'News feed UI on a dark terminal — clean headlines, timestamps, soft cyan rules. Serious journalism energy, not breaking-news panic.',
        narration:
          'News is ClearPath’s live reading wire for platform and market headlines.',
      },
      {
        id: '02-live-status',
        title: 'Live status',
        flow: 'Header shows live status — item count or Offline / Empty — calmly. No red sirens.',
        narration:
          'The header tells you if the wire is live, empty, or offline. Honest status beats fake urgency.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Refresh control highlights; last-updated stamp visible. Soft press animation.',
        narration:
          'Tap Refresh when you want a fresh pull. The feed also updates quietly on its own.',
      },
      {
        id: '04-what-you-see',
        title: 'What you will see',
        flow: 'Headline list scrolls slowly: source · category · date · title · short description. Readable typography.',
        narration:
          'You will see source, category, date, title, and a short description for each item.',
      },
      {
        id: '05-open-a-story',
        title: 'Open a story',
        flow: 'One headline link soft-focuses as if opening externally; stay calm, no tab explosion montage.',
        narration:
          'Open a headline when you want the full story. Skim first — you do not need every article.',
      },
      {
        id: '06-empty-states',
        title: 'Empty and offline',
        flow: 'Honest empty/error state appears briefly when the vendor key is missing — clear, non-blaming copy on glass.',
        narration:
          'If the wire is empty or offline, ClearPath says so plainly. That is a configuration moment, not a crisis.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Return to a still headline list. Soft fade out.',
        narration:
          'Calm tip: skim for context, then close the tab. Headlines are information, not instructions.',
      },
    ]
  ),

  Membership: entry(
    'Membership',
    'Memberships',
    'Seven short clips on plans — compare calmly, no countdown pressure.',
    [
      {
        id: '01-what-it-is',
        title: 'What Memberships is',
        flow: 'Memberships layout on glass — tier cards with soft cyan outlines. Calm decision energy. No flashing timers.',
        narration:
          'Memberships is where you compare ClearPath plans. Clear choices, no countdown clock.',
      },
      {
        id: '02-your-status',
        title: 'Your status',
        flow: 'Current membership or trial status banner at the top. Quiet, factual.',
        narration:
          'Your current plan or trial shows at the top so you always know where you stand.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Month ↔ Year billing toggle soft-switches. Feature lists stay readable.',
        narration:
          'Toggle month or year billing, then read what each tier includes before any checkout click.',
      },
      {
        id: '04-tier-cards',
        title: 'Tier cards',
        flow: 'Pan across Basic, Pro, Pro+, Premium, Ultimate cards. Basic highlighted as already useful. No FOMO badges.',
        narration:
          'Tiers run from Basic through Ultimate. Basic already opens charts and education.',
      },
      {
        id: '05-what-you-see',
        title: 'What you will see',
        flow: 'Checkout success/cancel banner after a calm Stripe return hint — no confetti spam. Soft confirmation.',
        narration:
          'If you checkout, you return here with a clear success or cancel message. No pressure either way.',
      },
      {
        id: '06-affiliate-strip',
        title: 'Affiliate rewards',
        flow: 'Affiliate reward strip — discount or credit — with a gentle link toward the Affiliate desk. Trust-first.',
        narration:
          'If you have affiliate rewards, they appear here as discount or account credit. Details live on the Affiliate desk.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Still comparison layout. Soft end card energy. Fade out.',
        narration:
          'Calm tip: upgrade only when a feature clearly helps your learning. Take your time.',
      },
    ]
  ),

  ClearPathEducation: entry(
    'ClearPathEducation',
    'Education',
    'Seven short clips: schools, units, lessons, quizzes — one step at a time.',
    [
      {
        id: '01-what-it-is',
        title: 'What Education is',
        flow: 'ClearPath Education school grid on dark glass — Crypto, Stocks, Forex, and more. Warm educator presence.',
        narration:
          'ClearPath Education is structured learning — schools, units, lessons, then a short quiz.',
      },
      {
        id: '02-school-grid',
        title: 'School grid',
        flow: 'Slow pan across school cards. One school soft-highlights. Readable labels, no gamified streak pressure.',
        narration:
          'Pick a school that matches what you want to understand. One path at a time is enough.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Open a school into a unit list with lock/unlock and pass states shown calmly.',
        narration:
          'Open a school, then choose an unlocked unit. Locked units wait until you are ready.',
      },
      {
        id: '04-lessons',
        title: 'Lessons',
        flow: 'Lesson reader with breadcrumb navigation. Comfortable reading typography. Soft page turn.',
        narration:
          'Lessons read like a calm textbook. Use the breadcrumb when you want to step back.',
      },
      {
        id: '05-what-you-see',
        title: 'What you will see',
        flow: 'QuizEngine appears — simple question, checkmark on pass. Unlock glow on the next unit — gentle, not slot-machine.',
        narration:
          'At the end of a unit, a short quiz checks understanding. Passing unlocks the next unit. Progress is saved.',
      },
      {
        id: '06-human-framed',
        title: 'Human-written framing',
        flow: 'Soft focus on “written by humans” / curriculum framing copy. Academic warmth.',
        narration:
          'Curriculum here is written for clarity. Methodology ideas you hear elsewhere — like Four Up, Three Down — are taught with patience, not hype.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Return to school grid. Soft fade.',
        narration:
          'Calm tip: one unit at a time. Pass the quiz when the ideas feel settled — not when you feel hurried.',
      },
    ]
  ),

  LiteracyOS: entry(
    'LiteracyOS',
    'Literacy OS',
    'Seven short clips for your market-science desk — vault, wiki, sentinel, and study rooms.',
    [
      {
        id: '01-what-it-is',
        title: 'What Literacy OS is',
        flow: 'Literacy OS desk establishing shot — education lab vibe, not brokerage. Soft cyan room chips.',
        narration:
          'Literacy OS is your personal market-science learning desk — rooms for notes, sources, and study.',
      },
      {
        id: '02-morning-brief',
        title: 'Morning Brief',
        flow: 'Morning Brief landing with quiet stats for vault, lessons, sentinel, wiki. Soft dawn-cyan light.',
        narration:
          'Morning Brief is a gentle landing. It shows what you have archived — not what you must do.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Tab chips highlight: Thesis Vault, Concept Wiki, Source Sentinel. Soft selection.',
        narration:
          'Use the room chips to move. Start with Thesis Vault or Concept Wiki when you want to capture an idea.',
      },
      {
        id: '04-vault-and-wiki',
        title: 'Vault and Wiki',
        flow: 'Thesis Vault notes appear, then Concept Wiki cards. Calm archival energy.',
        narration:
          'The Vault holds your theses. The Wiki holds concepts in plain language. Both are for you.',
      },
      {
        id: '05-what-you-see',
        title: 'What you will see',
        flow: 'Source Sentinel page-diff view, then a peek at Pattern Studio and Study Coach. Lab aesthetic.',
        narration:
          'Source Sentinel helps you notice page changes. Pattern Studio and Study Coach support practice — education only.',
      },
      {
        id: '06-more-rooms',
        title: 'More rooms',
        flow: 'Quick calm montage: Media Pantry, Listen→Learn, Idea Pins, Encyclopedia bridge. Not overwhelming — soft dissolves.',
        narration:
          'More rooms exist when you need them — media, listening, pins, and a bridge into the Encyclopedia.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Still Morning Brief. Soft fade.',
        narration:
          'Calm tip: archive what you learn before you chase new tabs. Literacy OS rewards patience.',
      },
    ]
  ),

  Encyclopedia: entry(
    'Encyclopedia',
    'Encyclopedia',
    'Seven short clips for the finance library — sidebar, levels, articles, and tutor.',
    [
      {
        id: '01-what-it-is',
        title: 'What it is',
        flow: 'Encyclopedia of Finance — glass library shelves with soft cyan index labels. Academic, not flashy.',
        narration:
          'The Encyclopedia of Finance is ClearPath’s deep knowledge library — a calm file-browser for markets.',
      },
      {
        id: '02-sidebar',
        title: 'Sidebar topics',
        flow: 'Left sidebar CORE INSTRUMENTS list: Home, Markets, Stocks, Forex, Crypto, Economy, Labs, Glossary. Soft scroll.',
        narration:
          'The left sidebar is your index. Pick one topic — Stocks, Forex, Economy, Labs, and more.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Pedagogy persona tabs: Beginner / Trader / Analyst / Economist — soft underline selection.',
        narration:
          'Choose a reading level tab — Beginner through Economist — so the same topic meets you where you are.',
      },
      {
        id: '04-what-you-see',
        title: 'What you will see',
        flow: 'Main article / lab surface opens with back/exit HUD visible. Readable long-form layout.',
        narration:
          'You will see an article or lab in the main stage. Use back when you want to leave the page.',
      },
      {
        id: '05-tutor',
        title: 'Scholar Tutor',
        flow: 'ClearPath Scholar Tutor slide-out chat corner — plain-English Q&A. Quiet helper, not a hype bot.',
        narration:
          'Open the Scholar Tutor when a term still feels foggy. Ask for plain English — then return to reading.',
      },
      {
        id: '06-labs',
        title: 'Deep labs',
        flow: 'Brief calm montage of deep labs — order book, central bank, correlations — labeled as education labs.',
        narration:
          'Labs go deeper when you want models and history. Explore one lab, then step back to the index.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Return to sidebar + article composition. Soft fade.',
        narration:
          'Calm tip: one sidebar topic, one level tab, ask the tutor only when needed. Depth without overwhelm.',
      },
    ]
  ),

  CpmsApk: entry(
    'CpmsApk',
    'Cinema',
    'Seven short clips for ClearPath Cinema — find a title, play, and return to your desk.',
    [
      {
        id: '01-what-it-is',
        title: 'What Cinema is',
        flow: 'ClearPath Cinema library — large video stage energy, pantry shelf of titles, soft ambient cyan.',
        narration:
          'ClearPath Cinema is where platform educational media lives — watch without leaving the terminal.',
      },
      {
        id: '02-library',
        title: 'Library and search',
        flow: 'Brand header, library search field, A+/A− text scale controls. Calm browsing UI.',
        narration:
          'Search the library, and use text size controls if reading chrome feels small.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Featured hero soft-highlights Play Masterclass / Watch. Thumbnail shelf waits below.',
        narration:
          'Start with the featured title, or pick any thumbnail from the shelves below.',
      },
      {
        id: '04-what-you-see',
        title: 'What you will see',
        flow: 'Full in-app player — seek bar, fullscreen. Direct stream / HLS feel. No YouTube iframe chrome.',
        narration:
          'Videos play here in ClearPath’s player — seek, fullscreen, then exit when you are done.',
      },
      {
        id: '05-continue-watching',
        title: 'Continue Watching',
        flow: 'Continue Watching row and category shelves. Soft horizontal browse.',
        narration:
          'Continue Watching keeps recent titles close. Categories help you browse by theme.',
      },
      {
        id: '06-media-cabinet-note',
        title: 'Members vs cabinet',
        flow: 'Member browse/play focus. Tiny calm note that Media Cabinet is founder tooling — not needed for watching.',
        narration:
          'Members browse and play. Founder media tools stay out of the way unless you need them.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Still player frame fading to black with soft cyan residual. End.',
        narration:
          'Calm tip: choose one title, watch with full attention, then return to Charts or Education.',
      },
    ]
  ),

  Biography: entry(
    'Biography',
    'Profile',
    'Seven short clips for your account space — name, bio, avatar, and save.',
    [
      {
        id: '01-what-it-is',
        title: 'What Profile is',
        flow: 'Profile / biography control room — avatar sidebar, calm form fields. Private, respectful, simple.',
        narration:
          'Profile is your account space — the quiet control room for how you appear on ClearPath.',
      },
      {
        id: '02-sidebar',
        title: 'Your sidebar',
        flow: 'Avatar and display name in the sidebar. Optional contractor badge area shown softly.',
        narration:
          'Your avatar and display name live in the sidebar. That is what others recognize first.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Profile Settings fields highlight in turn: display name, profile URL, Instagram type, publish status, bio.',
        narration:
          'Edit display name, profile URL, publish status, and bio in Profile Settings.',
      },
      {
        id: '04-uploads',
        title: 'Avatar and cover',
        flow: 'Avatar and banner/cover upload controls soft-glow. Gentle file-pick hint.',
        narration:
          'Upload an avatar and cover when you want a visual refresh. Skip them if you prefer minimal.',
      },
      {
        id: '05-what-you-see',
        title: 'What you will see',
        flow: 'Save Profile Settings press; soft confirmation. Compliance/consent note visible and readable.',
        narration:
          'Save when you are ready. You will see a calm confirmation — and a short compliance note to read once.',
      },
      {
        id: '06-affiliate-shortcut',
        title: 'Affiliate shortcut',
        flow: 'Affiliate Network shortcut button from Profile. Soft handoff energy to the affiliate desk.',
        narration:
          'Need your referral desk? The Affiliate Network shortcut is here when you want it.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Still profile form. Soft fade.',
        narration:
          'Calm tip: update only what you want others to see — then head back to Home or Charts.',
      },
    ]
  ),

  AffiliateNetwork: entry(
    'AffiliateNetwork',
    'Affiliate Network',
    'Seven short clips on your referral desk — activate, copy, and share calmly.',
    [
      {
        id: '01-what-it-is',
        title: 'What it is',
        flow: 'Affiliate Network dashboard — share URL, gentle rewards ladder, trust-first aesthetic. No get-rich imagery.',
        narration:
          'Affiliate Network is your referral desk — share ClearPath when it feels right.',
      },
      {
        id: '02-metrics',
        title: 'Live metrics',
        flow: 'Metrics row: referral code, share URL, month signups, discount/credit, badge progress, payout — calm numbers, no slot-machine spin.',
        narration:
          'You will see your code, share link, signups, credits, and badge progress in plain numbers.',
      },
      {
        id: '03-where-to-click',
        title: 'Where to click',
        flow: 'Affiliate Program Agreement activate control highlights. Link stays visually “dormant” until accepted.',
        narration:
          'Activate by accepting the Affiliate Program Agreement. Your link stays dormant until you do.',
      },
      {
        id: '04-copy-link',
        title: 'Copy share link',
        flow: 'Copy share link button soft-press; brief “copied” confirmation. No fireworks.',
        narration:
          'Copy your share link when you are ready. Paste it only in places you trust.',
      },
      {
        id: '05-what-you-see',
        title: 'What you will see',
        flow: 'After activation, metrics feel “live”; rewards ladder ticks gently. Education-first caption energy.',
        narration:
          'Once active, referrals can earn account credit per the program rules. ClearPath stays education-first.',
      },
      {
        id: '06-cockpit',
        title: 'Sidebar cockpit',
        flow: 'Sidebar cockpit chips: Desk Feed, Guilds, Live Rooms, Chart Desks, Ranks, Compliance, Settings — overview only, not a tour of each.',
        narration:
          'The sidebar cockpit holds extras — feeds, rooms, ranks, compliance, settings. Open one when you need it.',
      },
      {
        id: '07-calm-tip',
        title: 'Calm tip',
        flow: 'Still affiliate desk. Soft fade. Trust-first end card.',
        narration:
          'Calm tip: activate only when you are ready to share calmly. No rush — credit follows the rules, not hype.',
      },
    ]
  ),
};

export const SECTION_GUIDE_TAB_IDS = Object.keys(SECTION_GUIDES) as SectionGuideId[];

export function getSectionGuide(tabId: string): SectionGuideEntry | null {
  if (!tabId || !(tabId in SECTION_GUIDES)) return null;
  return SECTION_GUIDES[tabId as SectionGuideId];
}

export function sectionGuideBeatHasVideo(beat: SectionGuideBeat): boolean {
  return Boolean(beat.videoUrl && /^https?:\/\//i.test(beat.videoUrl.trim()));
}

/** True if at least one beat in the section has a playable URL. */
export function sectionGuideHasVideo(entry: SectionGuideEntry): boolean {
  return entry.beats.some(sectionGuideBeatHasVideo);
}

export function sectionGuideReadyBeatCount(entry: SectionGuideEntry): number {
  return entry.beats.filter(sectionGuideBeatHasVideo).length;
}

export function getSectionGuideBeat(
  entry: SectionGuideEntry,
  index: number
): SectionGuideBeat | null {
  if (index < 0 || index >= entry.beats.length) return null;
  return entry.beats[index] ?? null;
}
