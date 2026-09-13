/**
 * Google Flow production bible for Explain Mode.
 *
 * Each nav pill gets one 30–45s film. Flow / Veo still likes ~8–10s shots,
 * so every film is four stitchable scenes plus one continuous voice-over.
 *
 * Drop the finished stitch at public/explain-videos/{id}.mp4 (16:9, H.264).
 * Optional: {id}.jpg poster, {id}.vtt captions (print script can emit VTT).
 *
 * Voice: calm, plain English, neurodivergent-friendly, education-only.
 * Never buy/sell, never FOMO, never fake a live price or headline.
 */

import type { ExplainFlowSlotId } from './explainMedia';

export const EXPLAIN_FLOW_BRAND_LOOK =
  'ClearPath Trader aesthetic: calm dark terminal, black glass panels, electric cyan #00E5FF, magenta #FF1493, gold #FFD700, orange #FF6A00, violet #4D00FF. Cinzel serif labels, readable large UI, cinematic but quiet, neurodivergent-friendly pacing, soft fade in and out. 16:9 landscape. No casino neon chaos, no countdown timers, no FOMO badges, no buy/sell arrows, no guaranteed-profit text, no order tickets, no flashing sirens.';

export const EXPLAIN_FLOW_NEGATIVE =
  'No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout.';

export const EXPLAIN_FLOW_TARGET_MIN = 30;
export const EXPLAIN_FLOW_TARGET_MAX = 45;
export const EXPLAIN_FLOW_SHOT_COUNT = 4;

export type ExplainFlowShot = {
  id: string;
  title: string;
  /** Inclusive start, seconds from film zero. */
  startSeconds: number;
  /** Exclusive end. */
  endSeconds: number;
  /** Paste into Google Flow / Veo for this shot only. */
  flowPrompt: string;
  /** Spoken lines that sit on this shot (subset of the full narration). */
  narration: string;
  /** Optional large, quiet on-screen line. Keep under 6 words. */
  super?: string;
};

export type ExplainFlowScript = {
  id: ExplainFlowSlotId;
  /** Matches the nav pill the member sees. */
  navLabel: string;
  title: string;
  color: string;
  /** Finished stitch length. */
  targetSeconds: number;
  /** One sentence for the overlay eyebrow. */
  logline: string;
  /** Continuous VO — record once over the stitched film. */
  narrationScript: string;
  /** Master brief if generating / directing as one piece. */
  masterFlowPrompt: string;
  /** Four Flow shots to generate and concatenate in order. */
  shots: ExplainFlowShot[];
  music: string;
  captionsNote: string;
};

function shot(
  id: string,
  title: string,
  start: number,
  end: number,
  flow: string,
  narration: string,
  superText?: string,
): ExplainFlowShot {
  return {
    id,
    title,
    startSeconds: start,
    endSeconds: end,
    flowPrompt: `${EXPLAIN_FLOW_BRAND_LOOK} ${flow} Avoid: ${EXPLAIN_FLOW_NEGATIVE}`,
    narration,
    super: superText,
  };
}

function script(
  partial: Omit<ExplainFlowScript, 'masterFlowPrompt'> & { masterFlow: string },
): ExplainFlowScript {
  if (partial.shots.length !== EXPLAIN_FLOW_SHOT_COUNT) {
    throw new Error(`${partial.id} needs ${EXPLAIN_FLOW_SHOT_COUNT} shots`);
  }
  if (
    partial.targetSeconds < EXPLAIN_FLOW_TARGET_MIN ||
    partial.targetSeconds > EXPLAIN_FLOW_TARGET_MAX
  ) {
    throw new Error(`${partial.id} targetSeconds must be 30–45`);
  }
  return {
    ...partial,
    masterFlowPrompt: `${EXPLAIN_FLOW_BRAND_LOOK} ${partial.masterFlow} Avoid: ${EXPLAIN_FLOW_NEGATIVE}`,
  };
}

export const EXPLAIN_FLOW_SCRIPTS: Record<ExplainFlowSlotId, ExplainFlowScript> = {
  ceo: script({
    id: 'ceo',
    navLabel: 'CEO',
    title: 'CEO dashboard',
    color: '#FF2E9A',
    targetSeconds: 40,
    logline: 'Founder-only ops — Daily Ops, backups, members. Not on your chart.',
    masterFlow:
      'A 40-second quiet tour of a magenta founder console labeled CEO Dashboard. Camera glides from the glowing header, across a Daily Ops checklist and a calm Site Doctor pulse, then a Members table with a disaster-backup download, then four Choose Your Path study-desk cards. Educational, private, never a trading floor.',
    narrationScript:
      'This tab is CEO — the founder console. Only the person who runs ClearPath sees it. Daily Ops is a calm checklist for the site, marketing, and the end of the day. Site Doctor shows whether the platform is healthy. Members holds invites, account lists, and a disaster backup download, because Cloud Run forgets files when a container restarts. Choose Your Path still opens the four study desks. Nothing here changes anyone else’s charts, and nothing here is a trade. If you do not see CEO, you are not supposed to.',
    music: 'Very low analog pad, no beat drop. Room tone. Leave space after each sentence.',
    captionsNote: 'Burn-in optional. Prefer a matching .vtt so reduced-motion users can read.',
    shots: [
      shot(
        '01-console',
        'Founder console',
        0,
        10,
        'Opening shot: dark #09090b terminal. Magenta #FF00FF header reads “CEO Dashboard — Founder Console” with a soft glow, not a rave. Slow push-in past glass panels. No other people. Private ops room energy.',
        'This tab is CEO — the founder console. Only the person who runs ClearPath sees it.',
        'Founder console',
      ),
      shot(
        '02-daily-ops',
        'Daily Ops and Site Doctor',
        10,
        20,
        'Daily Ops desk: checklist groups labeled Site, Marketing, Outreach, Business, Personal, End of day — human checkboxes, no gamified streaks. Cut to Site Doctor — Hourly Pulse with calm green / amber / red dots. Serious, slow, readable type.',
        'Daily Ops is a calm checklist for the site, marketing, and the end of the day. Site Doctor shows whether the platform is healthy.',
      ),
      shot(
        '03-members-backup',
        'Members and backup',
        20,
        30,
        'Members / All Users table on glass: email column, display name, joined date — no password strings visible. Soft highlight on a teal button “Download disaster backup”. Tiny readable note: Cloud Run disk is ephemeral. Trust-first, never panic red.',
        'Members holds invites, account lists, and a disaster backup download, because Cloud Run forgets files when a container restarts.',
      ),
      shot(
        '04-desks-close',
        'Study desks, then still',
        30,
        40,
        'Choose Your Path row: Institutional, Fundamental, Retail, Neurodivergent — study-desk cards, not brokerage tickets. Pull back to the full CEO console. End on stillness. Soft caption energy: Founder ops. Not a trading desk.',
        'Choose Your Path still opens the four study desks. Nothing here changes anyone else’s charts, and nothing here is a trade. If you do not see CEO, you are not supposed to.',
        'Not a trading desk',
      ),
    ],
  }),

  home: script({
    id: 'home',
    navLabel: 'HOME',
    title: 'Home',
    color: '#6C5CE7',
    targetSeconds: 40,
    logline: 'The front door. Every glowing card is a real door.',
    masterFlow:
      'A 40-second walk through ClearPath Home: lava-soft dark hub, a quiet greeting, Choose Your Path desk cards, then a grid of doors labeled Charts, INDACREATOR, Y.W.C., News, Education, Memberships, C.P.T. Buddy. One card highlights. Nothing feels like a to-do list or a store.',
    narrationScript:
      'This is Home — the front door of ClearPath Trader. The greeting is just a map. Every glowing card is a real door: Charts, INDACREATOR, Y.W.C., News, Education, Memberships, and C.P.T. Buddy. Choose Your Path opens four study desks — Institutional, Fundamental, Retail, and Neurodivergent. Those desks show information. They do not place trades. Read the line under a card, then tap when you are ready. You can always come back here from the top nav. Home is a map, not a to-do list, and not a broker.',
    music: 'Warm low drone, faint vinyl air. No percussion hits on card highlights.',
    captionsNote: 'Keep supers to the card names already on screen. Do not add slogan bursts.',
    shots: [
      shot(
        '01-hub',
        'What Home is',
        0,
        10,
        'HOME / Discovery hub fills the frame — dark glass, pink/orange/cyan lava blurs in the corners, a badge “ClearPath Home”, a short greeting. Uncluttered. Slow establishing move, no text overload.',
        'This is Home — the front door of ClearPath Trader. The greeting is just a map.',
        'Every card is a door',
      ),
      shot(
        '02-choose-path',
        'Choose Your Path',
        10,
        20,
        'Choose Your Path row: three path cards plus a Neurodivergent banner. Labels: Institutional Trader, Fundamental Trader, Retail Trader, Neurodivergent Traders. Soft cyan outlines. Educational study energy — no order tickets, no “start trading now”.',
        'Choose Your Path opens four study desks — Institutional, Fundamental, Retail, and Neurodivergent. Those desks show information. They do not place trades.',
      ),
      shot(
        '03-grid',
        'Nav cards',
        20,
        30,
        'Camera glides across hub tiles: Charts, INDACREATOR, Y.W.C., News, Board, ClearPath Education, Memberships, C.P.T. Personal Buddy. Each tile has a one-line subtitle. Soft accent glows. One tile gently highlights. Calm click, no urgency.',
        'Every glowing card is a real door: Charts, INDACREATOR, Y.W.C., News, Education, Memberships, and C.P.T. Buddy.',
      ),
      shot(
        '04-choose',
        'Read, then choose',
        30,
        40,
        'Soft focus ring on the line under the Charts card, then a gentle tap hint. Brief peek toward the Charts workspace, then a reversible return to the Home grid. End still. Quiet. Map, not a checklist.',
        'Read the line under a card, then tap when you are ready. You can always come back here from the top nav. Home is a map, not a to-do list, and not a broker.',
        'Take your time',
      ),
    ],
  }),

  ywc: script({
    id: 'ywc',
    navLabel: 'Y.W.C.',
    title: 'Y.W.C. — Your World Connected',
    color: '#FF2E9A',
    targetSeconds: 42,
    logline: 'News, magazines, and a chart on one lava desk — a workspace, not signals.',
    masterFlow:
      'A 42-second tour of Your World Connected: warm lava-pink glass desk, section chips, a story reader, a personal chart tucked on the side, optional Media Pantry. Inclusive, calm, never a signal service or panic newsroom.',
    narrationScript:
      'Y.W.C. means Your World Connected. It is one lava desk for news sections, magazines, and a live chart so you are not jumping between apps. Use the section chips — World, Sports, Finance, Magazines, Relief — one at a time. Expand a story to read it. Your personal chart stays nearby. Media Pantry and social tools are optional. This is a workspace, not a signal service. Some feeds here are editorial. The News tab is the live wire. When the noise rises, leave. The chart will still be here.',
    music: 'Soft analog warmth, slightly pink. No news-stinger brass.',
    captionsNote: 'Do not put “BREAKING” on screen. Section chip names are enough.',
    shots: [
      shot(
        '01-desk',
        'What Y.W.C. is',
        0,
        10,
        'Y.W.C. lava-styled desk — magenta #FF0080 and orange #FF4500 glass bentos, brand mark “Your World Connected”. Warm community energy without noise. Inclusive, calm. A quiet live chart peeks at the edge.',
        'Y.W.C. means Your World Connected. It is one lava desk for news sections, magazines, and a live chart so you are not jumping between apps.',
        'Your World Connected',
      ),
      shot(
        '02-filters',
        'Section chips',
        10,
        21,
        'Section filter chips highlight one at a time: ALL NEWS, WORLD SPORTS, WORLD HUB, RELIEF / HUMANITARIAN, GLOBAL FINANCE, CRYPTO, MAGAZINE EDITS. Soft selection. No clutter pile-up. Readable labels on dark glass.',
        'Use the section chips — World, Sports, Finance, Magazines, Relief — one at a time.',
      ),
      shot(
        '03-reader-chart',
        'Story and chart',
        21,
        32,
        'A hero story card opens into a calm reader modal. Then focus shifts to YwcPersonalCharts — a live educational chart nestled in the desk, soft cyan crosshair, no trade arrows. Context and price structure share one screen.',
        'Expand a story to read it. Your personal chart stays nearby.',
      ),
      shot(
        '04-optional',
        'Optional extras, then leave',
        32,
        42,
        'Brief, quiet look at CPMS Media Pantry and optional social connect chips — labeled as optional, no notification spam. Pull back to the full lava desk. Soft fade. End on stillness.',
        'Media Pantry and social tools are optional. This is a workspace, not a signal service. Some feeds here are editorial. The News tab is the live wire. When the noise rises, leave. The chart will still be here.',
        'Leave when it is loud',
      ),
    ],
  }),

  indacreator: script({
    id: 'indacreator',
    navLabel: 'INDACREATOR',
    title: 'INDACREATOR',
    color: '#00E5FF',
    targetSeconds: 42,
    logline: 'A Pine workshop. Compile honestly. Apply when you are ready.',
    masterFlow:
      'A 42-second studio tour: code editor and chart side by side on dark glass, an upload zone, a compile glow, honest-limits cards, River Genie on the right, then a calm overlay appearing on charts. Technical and empowering. Not a hacker movie. Not a signal service.',
    narrationScript:
      'INDACREATOR is the workshop for indicator code — sometimes still called The River. Upload a Pine file, paste code, or start with the Gold Bar example. Press compile. If something cannot run, you will see a real error, not a fake overlay. Read the honest limits and the inputs. River Genie can draft or fix a script, but you still choose when to apply. Apply to All Charts puts the study on your charts. Then open CHARTS to look at it. This studio does not place trades. Compile first. Apply when you are ready.',
    music: 'Clean digital bed, very quiet. A single soft confirmation tone on compile — not a fanfare.',
    captionsNote: 'Show real UI words: Compile, Apply to All Charts, River Genie. No “signals unlocked”.',
    shots: [
      shot(
        '01-studio',
        'What it is',
        0,
        10,
        'INDACREATOR workstation establishing shot — code editor and chart side by side on #050505 glass, cyan #00D9FF accents. Technical, empowering, not flashy hacker tropes. Title readable: INDACREATOR.',
        'INDACREATOR is the workshop for indicator code — sometimes still called The River.',
        'A studio, not a signal',
      ),
      shot(
        '02-upload-compile',
        'Upload and compile',
        10,
        21,
        'Upload / paste / drag-drop zone for a .pine file highlights. A small file icon drops into the editor. Compile button soft-press; cyan success glow; an inputs panel and honest notes appear. No confetti. If showing failure, show a calm line-numbered error — never a fake overlay.',
        'Upload a Pine file, paste code, or start with the Gold Bar example. Press compile. If something cannot run, you will see a real error, not a fake overlay.',
      ),
      shot(
        '03-genie',
        'River Genie',
        21,
        32,
        'River Genie co-pilot panel on the right — a short chat drafting Pine in a code block, then a quiet path back to compile. Helpful, not pushy. Honest-limits bento cards visible: what River can and cannot do.',
        'Read the honest limits and the inputs. River Genie can draft or fix a script, but you still choose when to apply.',
      ),
      shot(
        '04-apply',
        'Apply, then study',
        32,
        42,
        'Apply to All Charts — gold-quiet CTA, not neon hard-sell. Indicator overlays fade onto a chart. Chart remains the focus. End still on the workstation. Soft line: compile first, apply when ready.',
        'Apply to All Charts puts the study on your charts. Then open CHARTS to look at it. This studio does not place trades. Compile first. Apply when you are ready.',
        'Compile first',
      ),
    ],
  }),

  charts: script({
    id: 'charts',
    navLabel: 'CHARTS',
    title: 'Charts',
    color: '#FF7B00',
    targetSeconds: 44,
    logline: 'Live market structure, comfort profiles, study tools — not a broker.',
    masterFlow:
      'A 44-second educational tour of the MARKET TERMINAL: multi-slot candlesticks on dark glass, a neuro-profile picker cycling looks while price structure stays identical, a timeframe bar, pattern tools labeled as study, then a quieter Blackout dual-chart. No signal arrows. Footer legal energy without shouting.',
    narrationScript:
      'This is Charts — ClearPath’s live market desk. Each candle is one block of time. Search a symbol. Pick a timeframe. Neuro-Adaptive Profiles change colors, spacing, and motion so different brains can read the same data more comfortably. They never change the price. Pattern Scanner and drawing tools are for study. Blackout Mode hides extra chrome when you want a quieter dual-chart view. The footer is clear: visualization, not advice. ClearPath is not a broker. Start with Calm Focus if you are unsure. Take your time.',
    music: 'Almost silent. A distant room tone. Let candle motion be the only rhythm.',
    captionsNote: 'If a candle is labeled, say “one block of time” — never “buy this”.',
    shots: [
      shot(
        '01-terminal',
        'What Charts is',
        0,
        11,
        'Wide shot of MARKET TERMINAL — multi-slot candlestick charts on dark glass, orange timeframe accents. Educational market structure, no signal arrows, no P&L. Soft establishing push.',
        'This is Charts — ClearPath’s live market desk. Each candle is one block of time.',
        'Study, not brokerage',
      ),
      shot(
        '02-symbol-time',
        'Symbol and timeframe',
        11,
        22,
        'Focus ring on symbol search “Search your chart…”, then on the timeframe bar from 1m toward YTD. Calm pointer. Candles redraw after a timeframe change. Quiet, technical, no flashing CTAs.',
        'Search a symbol. Pick a timeframe.',
      ),
      shot(
        '03-neuro',
        'Neuro-Adaptive Profiles',
        22,
        33,
        'Close on Neuro-Adaptive Chart Profiles picker. Softly cycle three looks — Calm Focus cyan, Low Stimulation muted gray, Standard red/green — while the same price structure stays identical. Presentation-only. No medical imagery.',
        'Neuro-Adaptive Profiles change colors, spacing, and motion so different brains can read the same data more comfortably. They never change the price.',
      ),
      shot(
        '04-tools-blackout',
        'Study tools and Blackout',
        33,
        44,
        'Left rail: Pattern Scanner and drawing tools, labeled as study tools not advice. Then UI chrome softens into Blackout Mode — dual charts, quieter chrome, more chart area. End on a still candle silhouette and a tiny legal-footer feel: visualization, not advice.',
        'Pattern Scanner and drawing tools are for study. Blackout Mode hides extra chrome when you want a quieter dual-chart view. The footer is clear: visualization, not advice. ClearPath is not a broker. Start with Calm Focus if you are unsure. Take your time.',
        'Profiles never change prices',
      ),
    ],
  }),

  news: script({
    id: 'news',
    navLabel: 'NEWS',
    title: 'News',
    color: '#4D6FFF',
    targetSeconds: 36,
    logline: 'The live wire. If the vendor is down, the list stays empty.',
    masterFlow:
      'A 36-second walk through a dark-terminal news wire: honest status pill, a Refresh control, readable headline cards with source · category · date, then a brief empty-state that tells the truth. Serious journalism energy, never breaking-news panic.',
    narrationScript:
      'News is the live reading wire. The header tells you if it is live, empty, or offline. Honest status beats fake urgency. Each card shows source, category, date, title, and a short description. Refresh when you want a fresh pull. Open a headline to read the publisher. If the vendor is down, ClearPath leaves the list empty. We never invent a story. Headlines are context, not instructions. Skim, then close the tab.',
    music: 'None, or a faint paper-room tone. No news-music stabs.',
    captionsNote: 'Do not invent a real headline on screen. Use generic placeholder titles.',
    shots: [
      shot(
        '01-wire',
        'What News is',
        0,
        9,
        'News feed UI on a dark terminal — clean headlines, timestamps, soft cyan/blue rules. Header: News · Live wire. Serious journalism energy, not panic red or sirens.',
        'News is the live reading wire.',
        'Live wire',
      ),
      shot(
        '02-status',
        'Honest status',
        9,
        18,
        'Header status pill shows “12 items”, then calmly “Empty”, then “Offline” — no red sirens. Refresh control highlights; last-updated stamp visible. Soft press animation.',
        'The header tells you if it is live, empty, or offline. Honest status beats fake urgency. Refresh when you want a fresh pull.',
      ),
      shot(
        '03-cards',
        'How to read a card',
        18,
        27,
        'Headline list scrolls slowly: source · category · date · title · short description. Readable typography. One headline soft-focuses as if opening externally. Stay calm. No tab-explosion montage.',
        'Each card shows source, category, date, title, and a short description. Open a headline to read the publisher.',
      ),
      shot(
        '04-empty',
        'Empty is honest',
        27,
        36,
        'Honest empty state on glass: “News feed unavailable” / headlines are never fabricated. Return to a still headline list. Soft fade. No crisis colors.',
        'If the vendor is down, ClearPath leaves the list empty. We never invent a story. Headlines are context, not instructions. Skim, then close the tab.',
        'Context, not orders',
      ),
    ],
  }),

  memberships: script({
    id: 'memberships',
    navLabel: 'MEMBERSHIPS',
    title: 'Memberships',
    color: '#FFE600',
    targetSeconds: 38,
    logline: 'Read the plan sheet. Checkout is off. This is not a store right now.',
    masterFlow:
      'A 38-second calm walk across a gold-outlined membership sheet: billing-off banner, a comparison table of feature rows, Basic through Platinum, no prices flashing, no countdown. Decision energy without pressure.',
    narrationScript:
      'Memberships is the plan sheet. Public checkout is off, so looking at this tab does not charge a card. Compare what each tier includes — charts, indicators, education, INDACREATOR, blackout, and more. Accuracy dots tell you what is enforced versus still on the sheet. Affiliate rewards, if you have them, show as discount or credit. Upgrade only if a feature clearly helps you learn. This tab is not investment advice, and it is not a store right now. Take your time, then go back to the desk.',
    music: 'Soft gold air. No cash-register hits.',
    captionsNote: 'Do not put dollar amounts on screen. The live product has billing removed.',
    shots: [
      shot(
        '01-sheet',
        'What it is',
        0,
        9,
        'Memberships layout on glass — gold #FFD700 outlines, emerald shield hero. Banner energy that billing is removed / education and charts only. Calm decision room. No flashing timers.',
        'Memberships is the plan sheet. Public checkout is off, so looking at this tab does not charge a card.',
        'Checkout is off',
      ),
      shot(
        '02-table',
        'Compare rows',
        9,
        19,
        'Slow pan across a comparison table: charts per window, indicators, drawing tools, neuro layouts, blackout, education, encyclopedia, IndaCreator. Accuracy dots are quiet and readable. No FOMO badges, no “most popular” explosions.',
        'Compare what each tier includes — charts, indicators, education, INDACREATOR, blackout, and more. Accuracy dots tell you what is enforced versus still on the sheet.',
      ),
      shot(
        '03-tiers',
        'Tiers without pressure',
        19,
        29,
        'Pan across Basic, Silver, Gold, Platinum column headers. Basic highlighted as already useful. No list prices. No checkout button pulsing. Soft gold light only.',
        'Affiliate rewards, if you have them, show as discount or credit. Upgrade only if a feature clearly helps you learn.',
      ),
      shot(
        '04-leave',
        'Leave when ready',
        29,
        38,
        'Still comparison layout. Soft “Back to the desk” control. End card energy: not advice, not a store right now. Fade out.',
        'This tab is not investment advice, and it is not a store right now. Take your time, then go back to the desk.',
        'Take your time',
      ),
    ],
  }),

  explain: script({
    id: 'explain',
    navLabel: 'Explain on',
    title: 'Need extra understanding',
    color: '#00E5FF',
    targetSeconds: 36,
    logline: 'Turn the play badges on. Short clips, plain words, one quiet question.',
    masterFlow:
      'A 36-second how-to for Explain Mode: the top-nav pill “Need extra understanding” becomes “Explain on”, tiny YouTube-style play badges appear beside tab pills, a cinema overlay opens with a 16:9 stage, plain text, and one quiz. Missing clip shows a storyboard frame, never a fake video.',
    narrationScript:
      'This pill says Need extra understanding. Tap it once and it becomes Explain on. Small play badges appear next to every tab. Tap a badge to open a short cinema overlay — a Google Flow clip, plain words, and one quiet quiz question. If a clip is not uploaded yet, you will see a storyboard, not a fake video. This is extra explanation for people who want a slower walkthrough. It is not trading advice. Tap the pill again to hide the badges. You can leave Explain on as long as it helps.',
    music: 'Soft cyan shimmer, then silence under the overlay shot.',
    captionsNote: 'Show the real labels: Need extra understanding / Explain on.',
    shots: [
      shot(
        '01-toggle',
        'The pill',
        0,
        9,
        'Desktop ClearNav primary row. A cyan-outlined pill with a tiny play-rectangle icon reads “Need extra understanding”. A calm tap. The pill becomes “Explain on” with a soft cyan fill. No other motion.',
        'This pill says Need extra understanding. Tap it once and it becomes Explain on.',
        'Explain on',
      ),
      shot(
        '02-badges',
        'Play badges',
        9,
        18,
        'Tiny play-badge icons fade in beside HOME, Y.W.C., INDACREATOR, CHARTS, NEWS, MEMBERSHIPS — matching each pill’s color. Slow pan. Educational, not a row of ads.',
        'Small play badges appear next to every tab.',
      ),
      shot(
        '03-overlay',
        'The cinema overlay',
        18,
        27,
        'A cinema-style overlay: dark blur backdrop, 16:9 stage with film-corner brackets, title “How Charts works”, a short paragraph, and a Quick check question. Quiet. Then a matching empty stage that says the clip is coming — storyboard, not a fake player.',
        'Tap a badge to open a short cinema overlay — a Google Flow clip, plain words, and one quiet quiz question. If a clip is not uploaded yet, you will see a storyboard, not a fake video.',
      ),
      shot(
        '04-off',
        'Leave it on or off',
        27,
        36,
        'Return to the nav. The pill toggles back toward “Need extra understanding” and badges fade. End still on the cyan play icon. Soft, optional, never required.',
        'This is extra explanation for people who want a slower walkthrough. It is not trading advice. Tap the pill again to hide the badges. You can leave Explain on as long as it helps.',
        'Optional, not advice',
      ),
    ],
  }),

  profile: script({
    id: 'profile',
    navLabel: 'PROFILE',
    title: 'Profile',
    color: '#FF2E9A',
    targetSeconds: 38,
    logline: 'Your account space. Identity, not an order ticket.',
    masterFlow:
      'A 38-second respectful tour of a private profile control room: avatar sidebar, display name, handle, bio, save confirmation. Pink accents. No public-leaderboard flex. No trade blotter.',
    narrationScript:
      'Profile is your account space — how you appear on ClearPath. Set a display name, a public handle for a /u/ link if you want one, a bio, and an avatar or cover. Social links and password live here too. You can keep the profile private. Saving settings does not place a trade. If you use a broker connect panel, that is your licensed broker — ClearPath does not hold your money. Update only what you want others to see. Then head back to Home or Charts.',
    music: 'Quiet pink pad. Intimate, not glamorous.',
    captionsNote: 'Do not show a real email or password field filled in.',
    shots: [
      shot(
        '01-room',
        'What Profile is',
        0,
        9,
        'Profile / biography control room — avatar sidebar, calm form fields, pink #FF1493 accents. Private, respectful, simple. Title energy: your account space.',
        'Profile is your account space — how you appear on ClearPath.',
        'Your account space',
      ),
      shot(
        '02-fields',
        'What you can edit',
        9,
        19,
        'Fields highlight in turn: display name, profile URL / handle, Instagram type, publish status, bio. Avatar and banner upload controls soft-glow. Gentle file-pick hint. No celebrity montage.',
        'Set a display name, a public handle for a /u/ link if you want one, a bio, and an avatar or cover. Social links and password live here too.',
      ),
      shot(
        '03-save',
        'Save and privacy',
        19,
        29,
        'Save Profile Settings press; soft confirmation. A short readable compliance note. Publish status sits on Private. Quiet. No confetti.',
        'You can keep the profile private. Saving settings does not place a trade.',
      ),
      shot(
        '04-broker-leave',
        'Broker note, then leave',
        29,
        38,
        'A small Broker Connect panel labeled as an external licensed broker — ClearPath is the interface, not the custodian. Then a soft handoff back toward Home / Charts. Still fade.',
        'If you use a broker connect panel, that is your licensed broker — ClearPath does not hold your money. Update only what you want others to see. Then head back to Home or Charts.',
        'Not an order ticket',
      ),
    ],
  }),

  affiliate: script({
    id: 'affiliate',
    navLabel: 'AFFILIATE',
    title: 'Affiliate',
    color: '#FF2E9A',
    targetSeconds: 40,
    logline: 'Your /r/ code when you are ready. Referrals, not market payouts.',
    masterFlow:
      'A 40-second trust-first tour of the Affiliate terminal: a dormant then live share URL, an agreement activate control, plain metric numbers, a lava sidebar of extra rooms. No get-rich imagery. No yacht. No “passive income” stamp.',
    narrationScript:
      'Affiliate is the referral desk. Private accounts get a personal /r/ code. The link stays dormant until you accept the Affiliate Program Agreement. Then you can copy a share URL. The ledger shows signups, discount or credit, and badge progress in plain numbers. The sidebar cockpit has extra rooms — feeds, guilds, ranks, compliance. Those are extras. This is not a brokerage payout from the market, and it does not place anyone’s trades. Activate only when you are ready to share calmly.',
    music: 'Low lava warmth. No trap beat, no cash sound.',
    captionsNote: 'Show /r/CODE as a generic pattern, not a real member code.',
    shots: [
      shot(
        '01-desk',
        'What it is',
        0,
        10,
        'Affiliate Network dashboard — share URL, gentle rewards ladder, lava-orange #ff5a1f and pink glass, dark #0a0c16. Trust-first. No get-rich imagery, no cars, no yachts.',
        'Affiliate is the referral desk. Private accounts get a personal /r/ code.',
        'Referral desk',
      ),
      shot(
        '02-activate',
        'Agreement, then copy',
        10,
        20,
        'Affiliate Program Agreement activate control highlights. Link visually “DORMANT” until accepted, then “LIVE”. Copy share link button soft-press; brief “copied” confirmation. No fireworks.',
        'The link stays dormant until you accept the Affiliate Program Agreement. Then you can copy a share URL.',
      ),
      shot(
        '03-ledger',
        'Plain numbers',
        20,
        30,
        'Metrics row: referral code, share URL, month signups, discount or credit, badge progress — calm numbers, no slot-machine spin. Education-first caption energy.',
        'The ledger shows signups, discount or credit, and badge progress in plain numbers.',
      ),
      shot(
        '04-cockpit',
        'Extras, then still',
        30,
        40,
        'Sidebar cockpit chips: Desk Feed, Guilds, Live Rooms, Chart Desks, Ranks, Compliance, Settings — overview only. Pull back to the still affiliate desk. Trust-first end card.',
        'The sidebar cockpit has extra rooms — feeds, guilds, ranks, compliance. Those are extras. This is not a brokerage payout from the market, and it does not place anyone’s trades. Activate only when you are ready to share calmly.',
        'Share calmly',
      ),
    ],
  }),

  cinema: script({
    id: 'cinema',
    navLabel: 'CLEARPATH CINEMA',
    title: 'ClearPath cinema',
    color: '#00E5FF',
    targetSeconds: 38,
    logline: 'In-terminal theater. Direct streams. Not a buy-room.',
    masterFlow:
      'A 38-second cinema tour: amber italic CLEARPATH CINEMA header, category shelves, a featured play, an in-app player with seek and fullscreen, Continue Watching. Theatre dark. No YouTube chrome. No live trading chat.',
    narrationScript:
      'ClearPath Cinema is the in-terminal theater. Browse category shelves. Start a featured title or pick a thumbnail. Videos play in ClearPath’s own player — seek, volume, fullscreen — using direct streams, not a YouTube embed. Continue Watching keeps recent titles close. If a live stream is down, the player says so. Founder media tools stay out of the way. Choose one title, watch with full attention, then return to Charts or Education. These are product and education clips, not a room that tells you what to buy.',
    music: 'Soft theatre hush. A distant projector air. No trailer-voice boom.',
    captionsNote: 'Player chrome only. No fake “live P&L” overlay on the film.',
    shots: [
      shot(
        '01-library',
        'What Cinema is',
        0,
        9,
        'ClearPath Cinema library — amber italic header, pantry shelf of titles, soft ambient cyan/amber. Large video-stage energy. Dark theatre, not a brokerage.',
        'ClearPath Cinema is the in-terminal theater. Browse category shelves.',
        'In-terminal theater',
      ),
      shot(
        '02-pick',
        'Pick a title',
        9,
        19,
        'Featured hero soft-highlights Play. Thumbnail shelves wait below — Finance TV, Indicator TV style rows. A+/A− text scale controls visible. Calm browsing.',
        'Start a featured title or pick a thumbnail.',
      ),
      shot(
        '03-player',
        'The player',
        19,
        29,
        'Full in-app player — seek bar, volume, fullscreen. Direct stream / HLS feel. No YouTube iframe chrome. If showing an error, a calm “Live stream temporarily unavailable” on glass.',
        'Videos play in ClearPath’s own player — seek, volume, fullscreen — using direct streams, not a YouTube embed. If a live stream is down, the player says so.',
      ),
      shot(
        '04-continue',
        'One title, then return',
        29,
        38,
        'Continue Watching row. Tiny note that Media Cabinet is founder tooling. Still player fading to black with soft cyan residual. End.',
        'Continue Watching keeps recent titles close. Founder media tools stay out of the way. Choose one title, watch with full attention, then return to Charts or Education. These are product and education clips, not a room that tells you what to buy.',
        'Watch, then return',
      ),
    ],
  }),

  education: script({
    id: 'education',
    navLabel: 'CLEARPATH EDUCATION',
    title: 'ClearPath education',
    color: '#00E5FF',
    targetSeconds: 42,
    logline: 'Schools, units, lessons, a short quiz — then the libraries if you want depth.',
    masterFlow:
      'A 42-second educator’s tour: school grid on dark glass, a unit list with lock/unlock, a lesson reader, a gentle quiz pass, then three library doors — Encyclopedia of Finance, Encyclopedia of Indicators, Literacy OS. Warm, academic, no streak pressure.',
    narrationScript:
      'ClearPath Education is structured learning. Pick a school — Crypto, Stocks, Forex, and more. Open an unlocked unit. Read the lessons like a calm textbook. At the end, a short quiz checks understanding. Passing unlocks the next unit. Progress is saved. Passing does not mean you should trade. It means you understood that page. From here you can also open three libraries: Encyclopedia of Finance, Encyclopedia of Indicators, and Literacy OS. One unit at a time. Then come back when you want the next door.',
    music: 'Warm educator piano, very low. No level-up chime that sounds like a slot.',
    captionsNote: 'School names on cards are enough. No “you are now a trader” stamp.',
    shots: [
      shot(
        '01-schools',
        'What Education is',
        0,
        10,
        'ClearPath Education school grid on dark #0A0E14 glass — Crypto, Stocks, Forex, Futures, Commodities, Bonds, Options, Funds, Indices, Economic Indicators. Cyan headings. Warm educator presence. No gamified streak rings.',
        'ClearPath Education is structured learning. Pick a school — Crypto, Stocks, Forex, and more.',
        'One school at a time',
      ),
      shot(
        '02-unit',
        'Units and lessons',
        10,
        21,
        'Open a school into a unit list with lock/unlock and pass states shown calmly. Then a lesson reader with breadcrumb navigation and comfortable reading typography. Soft page turn.',
        'Open an unlocked unit. Read the lessons like a calm textbook.',
      ),
      shot(
        '03-quiz',
        'Quiz, not a license',
        21,
        31,
        'QuizEngine — one simple question, a teal check on pass, a gentle unlock glow on the next unit. Not a slot machine. Academic warmth.',
        'At the end, a short quiz checks understanding. Passing unlocks the next unit. Progress is saved. Passing does not mean you should trade. It means you understood that page.',
      ),
      shot(
        '04-libraries',
        'Three libraries',
        31,
        42,
        'Three desk cards: Encyclopedia of Finance, Encyclopedia of Indicators, Literacy OS. Soft cyan outlines. Return to the school grid. Soft fade.',
        'From here you can also open three libraries: Encyclopedia of Finance, Encyclopedia of Indicators, and Literacy OS. One unit at a time. Then come back when you want the next door.',
        'Study, then rest',
      ),
    ],
  }),

  exit: script({
    id: 'exit',
    navLabel: 'EXIT',
    title: 'Exit',
    color: '#FF4D4D',
    targetSeconds: 32,
    logline: 'One tap signs you out of ClearPath. Nothing else.',
    masterFlow:
      'A 32-second calm explanation of the red EXIT pill on the second nav row: it signs out of this session only. It does not close a broker, delete a profile, or place a last trade. End on a still signed-out door, not a slam.',
    narrationScript:
      'EXIT is the red pill on the second nav row. It signs you out of your ClearPath session. It does not close a broker account you connected elsewhere. It does not delete your profile. It does not place a last trade. Tap it when you are done for now. Next visit, sign in again from the usual door. If you only wanted another tab, use Home or Charts instead. EXIT means leave this session — calmly, completely, and only for this site.',
    music: 'None. A single soft door-close air at the end, not a slam.',
    captionsNote: 'Red is the brand of the pill, not an emergency. Keep it quiet.',
    shots: [
      shot(
        '01-pill',
        'Find EXIT',
        0,
        8,
        'Secondary ClearNav row on black: PROFILE, AFFILIATE, CLEARPATH CINEMA, CLEARPATH EDUCATION, then a red-outlined pill EXIT with a small logout icon. Slow push to the red pill. No alarm strobe.',
        'EXIT is the red pill on the second nav row.',
        'EXIT',
      ),
      shot(
        '02-what-it-does',
        'What it does',
        8,
        16,
        'A calm tap on EXIT. The terminal chrome fades toward a signed-out door / login greeting. No data-shred animation. No skull icons. Quiet.',
        'It signs you out of your ClearPath session.',
      ),
      shot(
        '03-what-it-does-not',
        'What it does not',
        16,
        24,
        'Three quiet glass cards fade in: does not close a broker account / does not delete your profile / does not place a last trade. Readable. Then they fade.',
        'It does not close a broker account you connected elsewhere. It does not delete your profile. It does not place a last trade.',
      ),
      shot(
        '04-choose',
        'Leave or stay',
        24,
        32,
        'If the pointer hesitates, HOME and CHARTS pills glow softly as the alternative. Then EXIT remains. End still. Calm, complete, only this site.',
        'Tap it when you are done for now. Next visit, sign in again from the usual door. If you only wanted another tab, use Home or Charts instead. EXIT means leave this session — calmly, completely, and only for this site.',
        'Only this session',
      ),
    ],
  }),

  literacy: script({
    id: 'literacy',
    navLabel: 'Literacy OS',
    title: 'Literacy OS',
    color: '#00E5FF',
    targetSeconds: 40,
    logline: 'A personal market-science desk. Rooms for notes, sources, and study.',
    masterFlow:
      'A 40-second walk through Literacy OS: Morning Brief stats, room chips, Thesis Vault and Concept Wiki, a peek at Source Sentinel. Education lab, not brokerage.',
    narrationScript:
      'Literacy OS is your personal market-science desk. Morning Brief is a gentle landing — it shows what you have archived, not what you must do. Use the room chips to move. Thesis Vault holds your theses. Concept Wiki holds ideas in plain language. Source Sentinel helps you notice page changes. Other rooms wait until you need them — media, listening, pins, Pattern Studio. This is education only. Archive what you learn before you chase a new tab.',
    music: 'Dawn-cyan air. Slow.',
    captionsNote: 'Room chip names on screen are the lesson.',
    shots: [
      shot(
        '01-brief',
        'What it is',
        0,
        10,
        'Literacy OS desk establishing shot — “ClearPath Literacy OS / Market science for learners”. Morning Brief with quiet stats for vault, lessons, sentinel, wiki. Soft dawn-cyan light. Education lab, not brokerage.',
        'Literacy OS is your personal market-science desk. Morning Brief is a gentle landing — it shows what you have archived, not what you must do.',
        'Learning desk',
      ),
      shot(
        '02-rooms',
        'Room chips',
        10,
        20,
        'Tab chips highlight: Thesis Vault, Concept Wiki, Source Sentinel, Neuro LMS, Media Pantry, Listen→Learn. Soft selection. Not overwhelming.',
        'Use the room chips to move.',
      ),
      shot(
        '03-vault-wiki',
        'Vault, Wiki, Sentinel',
        20,
        30,
        'Thesis Vault notes, then Concept Wiki cards, then Source Sentinel page-diff view. Calm archival energy. Lab aesthetic.',
        'Thesis Vault holds your theses. Concept Wiki holds ideas in plain language. Source Sentinel helps you notice page changes.',
      ),
      shot(
        '04-more',
        'More rooms, then still',
        30,
        40,
        'Quick calm montage: Media Pantry, Listen→Learn, Idea Pins, Pattern Studio, Encyclopedia bridge. Soft dissolves. Return to Morning Brief. Fade.',
        'Other rooms wait until you need them — media, listening, pins, Pattern Studio. This is education only. Archive what you learn before you chase a new tab.',
        'Patience first',
      ),
    ],
  }),

  encyclopedia: script({
    id: 'encyclopedia',
    navLabel: 'Encyclopedia of Finance',
    title: 'Encyclopedia of finance',
    color: '#00E5FF',
    targetSeconds: 40,
    logline: 'A calm file-browser for markets. Teaching pages, not a buy list.',
    masterFlow:
      'A 40-second library tour: glass shelves, a left sidebar of topics, Beginner through Economist tabs, a long-form article, a Scholar Tutor corner. Academic, not flashy.',
    narrationScript:
      'The Encyclopedia of Finance is ClearPath’s deep knowledge library — a calm file-browser for markets. The left sidebar is your index. Pick one topic. Choose a reading level — Beginner through Economist — so the same idea can meet you where you are. You will see an article or a lab in the main stage. Open the Scholar Tutor only when a term still feels foggy. Cards are teaching pages, not a researched list of every company on earth. One topic, one level, then step back.',
    music: 'Library hush. Distant page air.',
    captionsNote: 'Do not stamp “10,000 issuers verified”. Teaching library only.',
    shots: [
      shot(
        '01-library',
        'What it is',
        0,
        10,
        'Encyclopedia of Finance — glass library shelves with soft cyan index labels. Academic, cinematic, not flashy. Establishing wide shot.',
        'The Encyclopedia of Finance is ClearPath’s deep knowledge library — a calm file-browser for markets.',
        'Study library',
      ),
      shot(
        '02-sidebar',
        'Index and level',
        10,
        20,
        'Left sidebar topics: Home, Markets, Stocks, Forex, Crypto, Economy, Labs, Glossary. Then pedagogy tabs: Beginner / Trader / Analyst / Economist — soft underline selection.',
        'The left sidebar is your index. Pick one topic. Choose a reading level — Beginner through Economist — so the same idea can meet you where you are.',
      ),
      shot(
        '03-article',
        'Article or lab',
        20,
        30,
        'Main article / lab surface with a back/exit HUD. Readable long-form. Brief calm peek at a lab labeled education only.',
        'You will see an article or a lab in the main stage.',
      ),
      shot(
        '04-tutor',
        'Tutor, then leave',
        30,
        40,
        'ClearPath Scholar Tutor slide-out — plain-English Q&A. Quiet helper, not a hype bot. Return to sidebar + article. Soft fade.',
        'Open the Scholar Tutor only when a term still feels foggy. Cards are teaching pages, not a researched list of every company on earth. One topic, one level, then step back.',
        'Depth without overwhelm',
      ),
    ],
  }),

  indicators: script({
    id: 'indicators',
    navLabel: 'Encyclopedia of Indicators',
    title: 'Encyclopedia of indicators',
    color: '#00E5FF',
    targetSeconds: 38,
    logline: 'What a study is, how to read it, what it cannot promise.',
    masterFlow:
      'A 38-second directory tour: filter rail, SVG indicator cards, a detail article with formula and limitations, a live-overlay badge that still is not a trade. Teal #00FFD1. Honest.',
    narrationScript:
      'The Encyclopedia of Indicators explains chart studies — RSI, moving averages, and more — with a picture, a formula, how to read it, and typical settings. Use the left filters to search or pick a category. Open a card for the study article. A live-overlay badge means that model can sit on Charts. An indicator describes past price. It does not promise the next move. Overlaying a study still does not place a trade. Read the limitations. Then go back to the terminal desktop.',
    music: 'Quiet teal tone. Technical, not hype.',
    captionsNote: 'SVG chart illustrations only — no fake live videos on the cards.',
    shots: [
      shot(
        '01-grid',
        'What it is',
        0,
        9,
        'Encyclopedia of Indicators card grid on a dark directory — teal #00FFD1 accents, standard SVG chart illustrations, no videos. Establishing shot.',
        'The Encyclopedia of Indicators explains chart studies — RSI, moving averages, and more — with a picture, a formula, how to read it, and typical settings.',
        'Studies of past price',
      ),
      shot(
        '02-filters',
        'Filters',
        9,
        19,
        'Left rail: search, category chips, max complexity slider, live-overlay toggle, sort. Soft, readable, not a slot panel.',
        'Use the left filters to search or pick a category.',
      ),
      shot(
        '03-article',
        'Open a card',
        19,
        28,
        'Detail panel: description, formula, how to read, limitations, typical settings. Live overlay badge if chart-addable. Academic. Honest limitations paragraph in focus.',
        'Open a card for the study article. A live-overlay badge means that model can sit on Charts. An indicator describes past price. It does not promise the next move.',
      ),
      shot(
        '04-back',
        'Back to the desk',
        28,
        38,
        'Back to Terminal Desktop control. Optional soft handoff toward Charts with an overlay already on — still no order ticket. Fade.',
        'Overlaying a study still does not place a trade. Read the limitations. Then go back to the terminal desktop.',
        'Describe, do not order',
      ),
    ],
  }),
};

export const EXPLAIN_FLOW_NAV_ORDER: ExplainFlowSlotId[] = [
  'ceo',
  'home',
  'ywc',
  'indacreator',
  'charts',
  'news',
  'memberships',
  'explain',
  'profile',
  'affiliate',
  'cinema',
  'education',
  'exit',
];

export function getExplainFlowScript(id: string): ExplainFlowScript | undefined {
  return EXPLAIN_FLOW_SCRIPTS[id as ExplainFlowSlotId];
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function explainFlowShotSeconds(shot: ExplainFlowShot): number {
  return shot.endSeconds - shot.startSeconds;
}

/** Simple WebVTT from the four shot narrations. */
export function explainFlowToVtt(script: ExplainFlowScript): string {
  const lines = ['WEBVTT', ''];
  script.shots.forEach((s, i) => {
    lines.push(String(i + 1));
    lines.push(`${vttStamp(s.startSeconds)} --> ${vttStamp(s.endSeconds)}`);
    lines.push(s.narration.trim());
    lines.push('');
  });
  return lines.join('\n');
}

function vttStamp(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  const whole = Math.floor(s);
  const frac = Math.round((s - whole) * 1000);
  return `00:${pad(m)}:${pad(whole)}.${String(frac).padStart(3, '0')}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
