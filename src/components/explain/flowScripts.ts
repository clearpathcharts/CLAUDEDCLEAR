/**
 * Google Flow production bible for Explain Mode.
 *
 * Each nav pill gets one 45–60s film. Flow / Veo still likes ~8–10s shots,
 * so every film is SIX stitchable scenes plus one continuous fifth-grade VO.
 * Do not ship a single 3-second clip — stitch all six.
 *
 * Drop the finished stitch at public/explain-videos/{id}.mp4 (16:9, H.264).
 *
 * Voice: fifth grade. Assume the viewer has never used a website.
 * Name the color. Point at the button. Say “click.” Pause.
 * Never buy/sell, never FOMO, never fake a live price or headline.
 */

import type { ExplainFlowSlotId } from './explainMedia';

export const EXPLAIN_FLOW_BRAND_LOOK =
  'FIFTH-GRADE FIELD TRIP through ClearPath Trader: VERY colorful glowing candy-button pills on a dark night sky — electric violet #4D00FF, hot pink #FF1493, lava orange #FF6A00, trophy gold #FFD700, electric cyan #00E5FF, stop-sign red #FF4D4D. Giant friendly cartoon mouse cursor with a white glove. Huge easy words. One thing lights up at a time like a kids science museum. Saturated color washes. Slow. Joyful. 16:9. Soft sparkles are museum glitter, not a casino. No strobe, no sirens, no gambling.';

export const EXPLAIN_FLOW_NEGATIVE =
  'No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer pointing at candles, no fake breaking-news siren, no invented ticker prices as advice, no confetti checkout, no slot-machine spin, no 3-second jump-cut montage that skips the lesson.';

export const EXPLAIN_FLOW_TARGET_MIN = 45;
export const EXPLAIN_FLOW_TARGET_MAX = 60;
export const EXPLAIN_FLOW_SHOT_COUNT = 6;

export type ExplainFlowShot = {
  id: string;
  title: string;
  startSeconds: number;
  endSeconds: number;
  flowPrompt: string;
  narration: string;
  super?: string;
};

export type ExplainFlowScript = {
  id: ExplainFlowSlotId;
  navLabel: string;
  title: string;
  color: string;
  targetSeconds: number;
  logline: string;
  narrationScript: string;
  masterFlowPrompt: string;
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
    throw new Error(`${partial.id} targetSeconds must be 45–60`);
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
    targetSeconds: 54,
    logline: 'The hot-pink button only the website builder sees.',
    masterFlow:
      'A full 54-second colorful museum tour of a hot-pink CEO button and a magenta control room. Giant cursor. Sixth-grade-slow. Six shots. Never a 3-second flash.',
    narrationScript:
      'Look at the very top of the screen. See the row of colorful buttons? Find the hot-pink one that says CEO. Most people will not see this button. It is only for the person who built this website. If you see it, move your mouse — that is the little arrow — onto the pink button and click. You will see pink checklists and a list of members. There is a teal button that saves a backup copy, like making a photocopy of important papers. This pink room does not buy anything. It does not sell anything. It does not change other people’s pictures. If you do not see a pink CEO button, that is normal. Click the purple HOME button and keep going.',
    music: 'Soft pink-pad, like a night-light. Leave a full breath after every sentence.',
    captionsNote: 'Huge words. Color the word PINK whenever you say pink.',
    shots: [
      shot(
        '01-find-pink',
        'Find the pink button',
        0,
        9,
        'Extreme close-up of the top row of candy-colored pills. A giant white-glove cursor slowly slides to a glowing hot-pink CEO pill. The rest of the row dims. Color wash of magenta fills the frame. Kid-museum lighting.',
        'Look at the very top of the screen. See the row of colorful buttons? Find the hot-pink one that says CEO.',
        'Hot-pink button',
      ),
      shot(
        '02-who',
        'Only the builder',
        9,
        18,
        'The pink CEO pill sparkles once, then a simple picture: one person at a desk, everyone else faded out. Friendly, not scary. Giant caption energy: only the builder.',
        'Most people will not see this button. It is only for the person who built this website.',
      ),
      shot(
        '03-click',
        'Click the pink one',
        18,
        27,
        'Giant cursor clicks the squishy pink pill. The screen blooms into a magenta founder console. Slow. Satisfying click sound implied, no explosion.',
        'If you see it, move your mouse — that is the little arrow — onto the pink button and click.',
        'Mouse = little arrow',
      ),
      shot(
        '04-see',
        'Checklists and members',
        27,
        36,
        'Bright checklist boxes in pink glass, then a simple member table. A teal “Download disaster backup” button glows like a stamp machine. Photocopy metaphor: papers stacking safely.',
        'You will see pink checklists and a list of members. There is a teal button that saves a backup copy, like making a photocopy of important papers.',
      ),
      shot(
        '05-not-a-store',
        'Not a store',
        36,
        45,
        'Three big kid cards fade in with simple icons: no shopping cart, no money flying, no other kids’ charts changing. Soft, clear, colorful.',
        'This pink room does not buy anything. It does not sell anything. It does not change other people’s pictures.',
        'Not a store',
      ),
      shot(
        '06-go-home',
        'No pink? Go Home',
        45,
        54,
        'If the pink pill is missing, the purple HOME pill pulses happily. Giant cursor clicks HOME. Warm front-door light. End still on the colorful row.',
        'If you do not see a pink CEO button, that is normal. Click the purple HOME button and keep going.',
        'No pink? Click HOME',
      ),
    ],
  }),

  home: script({
    id: 'home',
    navLabel: 'HOME',
    title: 'Home',
    color: '#6C5CE7',
    targetSeconds: 56,
    logline: 'The purple front door. Every card is another room.',
    masterFlow:
      'A 56-second purple front-door tour. Giant cursor, glowing home cards, lava-soft color. Slow enough for a fifth grader who has never clicked a website.',
    narrationScript:
      'Look at the top of the screen. That row of colorful buttons is how you walk around this website. Find the purple one that says HOME. Purple HOME is the front door of the house. Click it. You will see big glowing cards — purple, orange, gold, cyan. Each card is a door to another room. Read the tiny sentence under a card. Then click the card you want. You do not have to click every card. Nothing on this page spends your money. If you get lost later, come back here. Click the purple HOME button again. You can always return to the front door. Remember: purple button, top of the screen, click. Take your time.',
    music: 'Warm welcome hum. No beat drops when a card lights up.',
    captionsNote: 'Point at PURPLE. Spell HOME on screen in huge letters.',
    shots: [
      shot(
        '01-row',
        'The colorful row',
        0,
        9,
        'Wide shot of the whole candy-button nav row on a dark sky — violet, pink, orange, gold, cyan, red — each pill glowing like a night-light. Slow pan left to right. Giant caption: these buttons move you around.',
        'Look at the top of the screen. That row of colorful buttons is how you walk around this website.',
        'Buttons at the top',
      ),
      shot(
        '02-purple',
        'Find purple HOME',
        9,
        18,
        'Giant white-glove cursor travels to the glowing violet HOME pill with a little house icon. The pill blooms brighter. Purple color wash. Kid-friendly front-door illustration behind it.',
        'Find the purple one that says HOME. Purple HOME is the front door of the house.',
        'Purple = front door',
      ),
      shot(
        '03-click',
        'Click it',
        18,
        27,
        'Cursor clicks. The pill squishes. The Home hub explodes softly into colorful lava-corner cards — not fireworks, more like opening a toy box of glowing doors.',
        'Click it. You will see big glowing cards — purple, orange, gold, cyan.',
      ),
      shot(
        '04-cards',
        'Cards are doors',
        27,
        36,
        'Camera glides across huge readable cards: Charts, INDACREATOR, Y.W.C., News, Education, Memberships, C.P.T. Buddy. Each one lights its own color. A tiny sentence under each card is readable.',
        'Each card is a door to another room. Read the tiny sentence under a card. Then click the card you want.',
        'One card = one room',
      ),
      shot(
        '05-safe',
        'You can skip cards',
        36,
        46,
        'Most cards stay un-clicked. A soft “you can skip” feeling. No shopping cart. A crossed-out money icon, friendly not scary. Choose Your Path four colorful desk cards sit quietly.',
        'You do not have to click every card. Nothing on this page spends your money.',
        'No money leaves',
      ),
      shot(
        '06-lost',
        'Lost? Purple again',
        46,
        56,
        'A kid-simple maze resolves as the purple HOME pill pulses. Cursor clicks it again. Front door. Stillness. End on the colorful row.',
        'If you get lost later, come back here. Click the purple HOME button again. You can always return to the front door.',
        'Lost? Click HOME',
      ),
    ],
  }),

  ywc: script({
    id: 'ywc',
    navLabel: 'Y.W.C.',
    title: 'Y.W.C. — Your World Connected',
    color: '#FF2E9A',
    targetSeconds: 56,
    logline: 'The lava-pink room: stories, magazines, and a price picture together.',
    masterFlow:
      'A 56-second lava-pink tour of Your World Connected. Colorful filter chips, a story book opening, a little chart on the side. Fifth-grade slow.',
    narrationScript:
      'Find the warm orange-pink button that says Y.W.C. Those letters mean Your World Connected. Click it. This room puts stories, magazines, and a price picture on one page so you do not have to open ten other websites. See the colorful chips? Those are filters — like sorting crayons by color. Click one chip. Try Sports, or Magazines, or Relief. Then click a story to read it. The little chart on the side is only a picture of prices. This room does not tell you what to buy. If the page feels loud or busy, that is okay. Click the purple HOME button and leave. Remember: orange-pink button, click a chip, read one story. Take your time.',
    music: 'Warm lava-pink pad. No news horns.',
    captionsNote: 'Write Your World Connected in big letters once.',
    shots: [
      shot(
        '01-find',
        'Find Y.W.C.',
        0,
        9,
        'Top row. Giant cursor finds the lava orange-pink Y.W.C. pill. People-icon. Magenta and orange glow like sunset candy. Slow.',
        'Find the warm orange-pink button that says Y.W.C. Those letters mean Your World Connected.',
        'Your World Connected',
      ),
      shot(
        '02-click',
        'Click into the lava room',
        9,
        18,
        'Click. The desk blooms into hot pink, orange, and lime glass boxes. Inclusive, colorful, not a panic newsroom. Brand mark readable.',
        'Click it. This room puts stories, magazines, and a price picture on one page so you do not have to open ten other websites.',
      ),
      shot(
        '03-chips',
        'Colorful filter chips',
        18,
        27,
        'Huge filter chips light one at a time like piano keys: Sports, World, Finance, Magazines, Relief — each a different bright color. Cursor clicks Magazines. Soft.',
        'See the colorful chips? Those are filters — like sorting crayons by color. Click one chip. Try Sports, or Magazines, or Relief.',
        'Chips = crayon sorts',
      ),
      shot(
        '04-story',
        'Open a story',
        27,
        36,
        'A story card opens like a picture book. Calm reading light. Then a small live chart on the side with a soft cyan crosshair — a picture, not a game.',
        'Then click a story to read it. The little chart on the side is only a picture of prices.',
      ),
      shot(
        '05-not-signals',
        'Not a buy room',
        36,
        46,
        'Friendly crossed-out megaphone / no shopping cart. Media Pantry and social icons sit in a “optional toys” box on the side.',
        'This room does not tell you what to buy.',
        'Stories, not orders',
      ),
      shot(
        '06-leave',
        'Too loud? Leave',
        46,
        56,
        'The lava desk stays, but the purple HOME pill pulses at the top. Cursor clicks HOME. Quiet front door. End still.',
        'If the page feels loud or busy, that is okay. Click the purple HOME button and leave.',
        'Too loud? HOME',
      ),
    ],
  }),

  indacreator: script({
    id: 'indacreator',
    navLabel: 'INDACREATOR',
    title: 'INDACREATOR',
    color: '#00E5FF',
    targetSeconds: 58,
    logline: 'The workshop that draws helpers on your price pictures.',
    masterFlow:
      'A 58-second cyan workshop tour. File drops like a paper into a box, a check-the-recipe button, a helper robot, then drawings on a chart. Fifth grade. Colorful. Slow.',
    narrationScript:
      'Find the button that says INDACREATOR. That is a long word. It means indicator creator — a workshop that draws helper lines on your price pictures. Click it. You can drop a file into the box, or paste words, or try the Gold Bar example. Then click Compile. Compile means please check this recipe. If the recipe is broken, you will see a red error. That is okay. You did not break the website. A helper named River Genie can fix the words. When you are ready, click Apply to All Charts. Then click the orange CHARTS button to see the drawing. This workshop never spends money. Remember: long-word button, click Compile, then click orange CHARTS. Take your time.',
    music: 'Clean cyan tone. One soft ding on compile — a school bell, not a jackpot.',
    captionsNote: 'Show the real words Compile and Apply to All Charts in huge type.',
    shots: [
      shot(
        '01-find',
        'The long word',
        0,
        9,
        'Giant cursor on a glowing cyan INDACREATOR pill. The letters are huge. A simple workshop / toolbox icon. Cyan wash.',
        'Find the button that says INDACREATOR. That is a long word. It means indicator creator — a workshop that draws helper lines on your price pictures.',
        'Workshop button',
      ),
      shot(
        '02-click',
        'Open the workshop',
        9,
        18,
        'Click. Split screen: a colorful code notebook on the left, a chart on the right, like an art desk beside a window. Kid-maker space, not a hacker movie.',
        'Click it. You can drop a file into the box, or paste words, or try the Gold Bar example.',
      ),
      shot(
        '03-compile',
        'Compile = check the recipe',
        18,
        28,
        'A paper-airplane file drops into a glowing box. A big friendly Compile button. Cyan check, or a calm red “oops” on one line. No fake drawing if it failed.',
        'Then click Compile. Compile means please check this recipe. If the recipe is broken, you will see a red error. That is okay. You did not break the website.',
        'Compile = check recipe',
      ),
      shot(
        '04-genie',
        'River Genie helps',
        28,
        38,
        'A friendly cyan helper panel named River Genie — more lamp-genie cute than corporate AI. It writes in a notebook, then points back to Compile.',
        'A helper named River Genie can fix the words.',
      ),
      shot(
        '05-apply',
        'Apply, then Charts',
        38,
        48,
        'Gold-quiet Apply to All Charts. Soft colorful lines fade onto a chart like stickers. Then the orange CHARTS pill lights up at the top.',
        'When you are ready, click Apply to All Charts. Then click the orange CHARTS button to see the drawing.',
        'Then click CHARTS',
      ),
      shot(
        '06-no-money',
        'No money',
        48,
        58,
        'Workshop still. Crossed-out shopping cart in a friendly kid icon. End on the cyan pill.',
        'This workshop never spends money.',
        'Never spends money',
      ),
    ],
  }),

  charts: script({
    id: 'charts',
    navLabel: 'CHARTS',
    title: 'Charts',
    color: '#FF7B00',
    targetSeconds: 58,
    logline: 'The orange room of building-block candles. School, not a store.',
    masterFlow:
      'A 58-second orange market-picture tour. Candles as colorful building blocks. A giant search box. Color-theme buttons. Fifth grade. Very colorful. Very slow.',
    narrationScript:
      'Find the bright orange button that says CHARTS. Click it. You will see boxes that look like building blocks. Grown-ups call them candles. Each block is one chunk of time. A green-ish block means the price finished higher. A red-ish block means it finished lower. At the top, click the search box and type a name if you want a different picture. The colorful profile buttons change colors and spacing so the picture is easier on your eyes. They do not change the real price. Drawing tools are like crayons on the picture. This is school, not a store. You cannot buy or sell from this page. If the screen feels too busy, try the Calm Focus colors, or click purple HOME.',
    music: 'Almost none. Soft orange air. Speak even slower on the candle colors.',
    captionsNote: 'Show a green-ish block and a red-ish block with kid labels: finished higher / finished lower.',
    shots: [
      shot(
        '01-orange',
        'Find orange CHARTS',
        0,
        9,
        'Giant lava-orange CHARTS pill with a bar-chart icon, glowing like a sunset candy. Cursor approaches slowly. Orange wash across the dark sky.',
        'Find the bright orange button that says CHARTS. Click it.',
        'Orange = pictures',
      ),
      shot(
        '02-blocks',
        'Building-block candles',
        9,
        19,
        'Huge colorful candlesticks as toy building blocks on dark glass. One green-mint block labeled “finished higher.” One coral-red block labeled “finished lower.” Educational, playful, not a signal arrow.',
        'You will see boxes that look like building blocks. Grown-ups call them candles. Each block is one chunk of time. A green-ish block means the price finished higher. A red-ish block means it finished lower.',
        'Blocks of time',
      ),
      shot(
        '03-search',
        'The search box',
        19,
        29,
        'A giant friendly search box. Cursor types slowly. The picture changes to another colorful chart. No urgency.',
        'At the top, click the search box and type a name if you want a different picture.',
      ),
      shot(
        '04-colors',
        'Color buttons for your eyes',
        29,
        39,
        'A rainbow of profile buttons. Cycle Calm Focus cyan, Low Stimulation gray, Standard red-green. Same block shapes, different clothes. Eyes-friendly. No medical crosses.',
        'The colorful profile buttons change colors and spacing so the picture is easier on your eyes. They do not change the real price.',
        'Colors, not prices',
      ),
      shot(
        '05-crayons',
        'Crayons, not shopping',
        39,
        49,
        'Drawing tools as a crayon box on the left. Pattern tools as study stickers. Then a crossed-out store / no shopping cart. Blackout Mode quietly dims extra chrome.',
        'Drawing tools are like crayons on the picture. This is school, not a store. You cannot buy or sell from this page.',
        'School, not a store',
      ),
      shot(
        '06-too-busy',
        'Too busy? Calm or Home',
        49,
        58,
        'Calm Focus button glows softly, or the purple HOME pill pulses. Viewer choice. Slow fade on a still orange chart.',
        'If the screen feels too busy, try the Calm Focus colors, or click purple HOME.',
        'Too busy? HOME',
      ),
    ],
  }),

  news: script({
    id: 'news',
    navLabel: 'NEWS',
    title: 'News',
    color: '#4D6FFF',
    targetSeconds: 54,
    logline: 'The blue list of real headlines. Empty means we did not make stuff up.',
    masterFlow:
      'A 54-second blue news-list tour. Honest status light. Kid-simple cards. No sirens. Colorful but calm.',
    narrationScript:
      'Find the blue-purple button that says NEWS. Click it. This page is a list of real headlines from the internet. Look at the very top. A little light will say if the list is working, empty, or turned off. If it is empty, we did not make up fake stories. Making up news would be lying. Each card shows who wrote it, the date, and a short bit. Click a title if you want the whole story on their website. Headlines are just information, like a poster on a wall. They are not orders. They do not tell you what to buy. When you are done reading, click the purple HOME button.',
    music: 'None. Soft paper rustle at most. No news stingers.',
    captionsNote: 'Never invent a real headline. Use “Sample story” if you must show a title.',
    shots: [
      shot(
        '01-find',
        'Find blue NEWS',
        0,
        9,
        'Giant blue-purple NEWS pill with a newspaper icon, glowing softly. Cursor travels. Blue wash.',
        'Find the blue-purple button that says NEWS. Click it.',
        'Blue = headlines',
      ),
      shot(
        '02-list',
        'A list, not a siren',
        9,
        18,
        'A clean colorful list of cards on dark glass. Serious but not panic-red. Header: News. Kid museum of papers.',
        'This page is a list of real headlines from the internet.',
      ),
      shot(
        '03-light',
        'The status light',
        18,
        27,
        'A big traffic-light style pill: working (soft green), empty (soft gray), turned off (soft blue). No sirens. Refresh button as a circular arrow a kid would understand.',
        'Look at the very top. A little light will say if the list is working, empty, or turned off. If it is empty, we did not make up fake stories. Making up news would be lying.',
        'Empty = we did not lie',
      ),
      shot(
        '04-card',
        'How to read a card',
        27,
        36,
        'One card zooms: who wrote it, date, title, short bit — each in a different pastel chip. Cursor clicks the title. A gentle “goes to their website” door.',
        'Each card shows who wrote it, the date, and a short bit. Click a title if you want the whole story on their website.',
      ),
      shot(
        '05-poster',
        'A poster, not an order',
        36,
        45,
        'Headline cards turn into wall posters. No shopping cart. Kid-simple: information on a wall.',
        'Headlines are just information, like a poster on a wall. They are not orders. They do not tell you what to buy.',
        'Posters, not orders',
      ),
      shot(
        '06-home',
        'Done? Purple HOME',
        45,
        54,
        'Purple HOME pill pulses. Cursor clicks. Front door. Still.',
        'When you are done reading, click the purple HOME button.',
        'Done? Click HOME',
      ),
    ],
  }),

  memberships: script({
    id: 'memberships',
    navLabel: 'MEMBERSHIPS',
    title: 'Memberships',
    color: '#FFE600',
    targetSeconds: 54,
    logline: 'The gold trophy page. Looking does not charge a card.',
    masterFlow:
      'A 54-second gold plan-sheet tour. Trophy gold, no prices, no countdown. Fifth grade. Colorful comparison boxes.',
    narrationScript:
      'Find the shiny gold button that says MEMBERSHIPS. Gold like a trophy, not like a race. Click it. This page is a big chart of what each plan includes — how many pictures, school lessons, and tools. Public checkout is turned off. That means clicking here will not charge a credit card. You can look. You do not have to pick anything. The little dots tell you what is really working versus what is only written on the paper. Gold is just a color. It is not a prize timer. When you are done looking, click Back to the desk, or click the purple HOME button. Remember: gold button, looking is free, no card gets charged. Take your time.',
    music: 'Soft gold air. No cash register.',
    captionsNote: 'Do not put dollar signs on screen.',
    shots: [
      shot(
        '01-gold',
        'Find gold MEMBERSHIPS',
        0,
        9,
        'Giant trophy-gold MEMBERSHIPS pill with a crown, glowing warmly. Cursor. Gold wash. No countdown numbers.',
        'Find the shiny gold button that says MEMBERSHIPS. Gold like a trophy, not like a race. Click it.',
        'Gold = plan chart',
      ),
      shot(
        '02-sheet',
        'A chart of features',
        9,
        18,
        'A colorful comparison sheet: columns like crayons — Basic, Silver, Gold, Platinum. Rows of simple icons for pictures, lessons, tools. Kid-readable.',
        'This page is a big chart of what each plan includes — how many pictures, school lessons, and tools.',
      ),
      shot(
        '03-no-charge',
        'Looking is free',
        18,
        27,
        'A giant friendly sign: checkout is off. A credit card with a soft X. No prices. Relief, not shame.',
        'Public checkout is turned off. That means clicking here will not charge a credit card. You can look. You do not have to pick anything.',
        'Looking is free',
      ),
      shot(
        '04-dots',
        'The little dots',
        27,
        36,
        'Accuracy dots as quiet colorful stickers on rows. One sticker means “this really works,” another means “only on the paper.” Slow, readable.',
        'The little dots tell you what is really working versus what is only written on the paper.',
      ),
      shot(
        '05-not-a-timer',
        'Not a prize timer',
        36,
        45,
        'Gold glow stays still. A crossed-out stopwatch. No FOMO badges.',
        'Gold is just a color. It is not a prize timer.',
        'Not a timer',
      ),
      shot(
        '06-leave',
        'Back to the desk',
        45,
        54,
        'Back to the desk control, or purple HOME pulses. Cursor chooses HOME. Front door.',
        'When you are done looking, click Back to the desk, or click the purple HOME button.',
        'Done looking? HOME',
      ),
    ],
  }),

  explain: script({
    id: 'explain',
    navLabel: 'Explain on',
    title: 'Need extra understanding',
    color: '#00E5FF',
    targetSeconds: 56,
    logline: 'The cyan play button turns on extra help movies.',
    masterFlow:
      'A 56-second cyan how-to for the play badges. Extremely visual: badges popping on like Christmas lights, one at a time. Fifth grade. Full minute energy, not a 3-second flash.',
    narrationScript:
      'See the bright cyan button that looks like a tiny movie play square? It says Need extra understanding. Click it one time. Now it says Explain on. Little play badges appear next to every colorful button — like tiny TVs. Those badges are extra help movies. Click a tiny play badge — not the big word, the little play picture beside it. A big card pops up. Inside you get a movie, easy words, and one quiz question. A quiz here is just practice. You cannot fail your account. If the movie is not ready yet, you still get the words. Click the same cyan button again to hide the badges. You can leave the help on as long as you want.',
    music: 'Soft cyan shimmer. Long pauses so a kid can find the badge.',
    captionsNote: 'Show the two real labels: Need extra understanding / Explain on.',
    shots: [
      shot(
        '01-cyan',
        'The tiny movie button',
        0,
        9,
        'Extreme close-up of the cyan play-rectangle pill. It looks like a little TV. Glowing #00E5FF. Cursor hovers. Huge readable words: Need extra understanding.',
        'See the bright cyan button that looks like a tiny movie play square? It says Need extra understanding.',
        'Cyan play square',
      ),
      shot(
        '02-on',
        'Click once: Explain on',
        9,
        18,
        'Cursor clicks. The pill fills with cyan and the words change to Explain on. Satisfying, slow. No other motion yet.',
        'Click it one time. Now it says Explain on.',
        'Explain on',
      ),
      shot(
        '03-badges',
        'Tiny TVs appear',
        18,
        28,
        'Tiny colorful play badges pop in one by one beside HOME, Y.W.C., INDACREATOR, CHARTS, NEWS, MEMBERSHIPS — each badge matches that pill’s color, like Christmas lights turning on slowly. Not a strobe.',
        'Little play badges appear next to every colorful button — like tiny TVs. Those badges are extra help movies.',
        'Tiny TVs = help',
      ),
      shot(
        '04-click-badge',
        'Click the little play',
        28,
        38,
        'Cursor carefully clicks the tiny play beside CHARTS, not the CHARTS word. A big colorful card pops up: 16:9 movie stage, easy words, one quiz. Museum-slow.',
        'Click a tiny play badge — not the big word, the little play picture beside it. A big card pops up. Inside you get a movie, easy words, and one quiz question.',
        'Click the tiny play',
      ),
      shot(
        '05-quiz-safe',
        'Quiz is practice',
        38,
        47,
        'The quiz looks like a school worksheet with three big buttons. A gold star for trying, not a failing grade. Storyboard frame if no movie yet.',
        'A quiz here is just practice. You cannot fail your account. If the movie is not ready yet, you still get the words.',
        'Practice, not a test',
      ),
      shot(
        '06-off',
        'Turn it off anytime',
        47,
        56,
        'Cyan pill clicks again. Badges fade away like lights-out at a museum. Optional. End still on the play square.',
        'Click the same cyan button again to hide the badges. You can leave the help on as long as you want.',
        'On or off is okay',
      ),
    ],
  }),

  profile: script({
    id: 'profile',
    navLabel: 'PROFILE',
    title: 'Profile',
    color: '#FF2E9A',
    targetSeconds: 54,
    logline: 'The pink locker with your name and photo.',
    masterFlow:
      'A 54-second pink locker tour. Name, photo, save. Fifth grade. Colorful form fields that light up one at a time.',
    narrationScript:
      'Find the pink button that says PROFILE. Click it. This room is your locker. Type the name you want people to see. You can add a photo of your face, or skip the photo. You can write a short bio — that means two or three sentences about you. You can keep the locker private so strangers do not see it. When you are done, click the Save button. Saving your name does not buy anything. It does not sell anything. Then click the purple HOME button or the orange CHARTS button to go back to the other rooms. Remember: pink locker, type a name, click Save. Photo is optional. Take your time.',
    music: 'Quiet pink night-light pad.',
    captionsNote: 'Do not show a real email or a filled password.',
    shots: [
      shot(
        '01-pink',
        'Find pink PROFILE',
        0,
        9,
        'Second row of pills. Giant cursor finds glowing pink PROFILE. Locker / nametag icon. Pink wash.',
        'Find the pink button that says PROFILE. Click it.',
        'Pink = your locker',
      ),
      shot(
        '02-locker',
        'Your locker',
        9,
        18,
        'A colorful locker opens: empty nametag, empty photo circle. Friendly. Kid bedroom desk energy, not a dating app.',
        'This room is your locker. Type the name you want people to see.',
      ),
      shot(
        '03-photo-bio',
        'Photo and bio are optional',
        18,
        27,
        'Photo circle glows, then a skip stamp. Bio box lights up with three short lines. Optional stickers.',
        'You can add a photo of your face, or skip the photo. You can write a short bio — that means two or three sentences about you.',
        'Photo is optional',
      ),
      shot(
        '04-private',
        'You can stay private',
        27,
        36,
        'A publish switch sits on Private. A little curtain closes. Safe, colorful.',
        'You can keep the locker private so strangers do not see it.',
      ),
      shot(
        '05-save',
        'Click Save',
        36,
        45,
        'Huge Save button. Soft confirmation star. No confetti cannon. Crossed-out shopping cart in the corner.',
        'When you are done, click the Save button. Saving your name does not buy anything. It does not sell anything.',
        'Save ≠ shopping',
      ),
      shot(
        '06-leave',
        'Back to other rooms',
        45,
        54,
        'Purple HOME and orange CHARTS pulse. Cursor picks HOME. Front door.',
        'Then click the purple HOME button or the orange CHARTS button to go back to the other rooms.',
        'Then HOME or CHARTS',
      ),
    ],
  }),

  affiliate: script({
    id: 'affiliate',
    navLabel: 'AFFILIATE',
    title: 'Affiliate',
    color: '#FF2E9A',
    targetSeconds: 56,
    logline: 'The pink share-a-link room. Optional. Not a market game.',
    masterFlow:
      'A 56-second lava-pink share-link tour. A sleeping link wakes up after a yes. Fifth grade. No get-rich pictures.',
    narrationScript:
      'Find the pink button that says AFFILIATE. Click it. This room is for sharing a special link with friends if you want to. The link looks like /r/ and then some letters. The link stays asleep until you read the rules and click yes. Then you can copy the link. Copy means the computer remembers the words so you can paste them somewhere else later. The numbers on the page are just counts, like tally marks. They are not a video game. This room does not buy or sell in the market. If you do not want to share, that is fine. Click the purple HOME button and leave. Remember: pink share button, rules first, sharing is optional. Take your time.',
    music: 'Low lava warmth. No cash, no trap beat.',
    captionsNote: 'Show /r/CODE as a cartoon pattern, not a real code. No yachts.',
    shots: [
      shot(
        '01-find',
        'Find pink AFFILIATE',
        0,
        9,
        'Second-row pink AFFILIATE pill with a network / share icon. Lava glow. Cursor. No money piles.',
        'Find the pink button that says AFFILIATE. Click it.',
        'Pink share room',
      ),
      shot(
        '02-link',
        'A special link',
        9,
        18,
        'A big friendly /r/CODE block, sleeping with Zzz. Kid-simple. Dark colorful cockpit around it.',
        'This room is for sharing a special link with friends if you want to. The link looks like /r/ and then some letters.',
      ),
      shot(
        '03-wake',
        'Rules, then yes',
        18,
        28,
        'A rules card. Cursor clicks yes. The link wakes up — DORMANT to LIVE — like a lamp turning on. Soft.',
        'The link stays asleep until you read the rules and click yes.',
        'Asleep until yes',
      ),
      shot(
        '04-copy',
        'Copy means remember',
        28,
        37,
        'Copy button. A little paper duplicate flies into a pocket. Kid metaphor for clipboard. Brief “copied” star.',
        'Then you can copy the link. Copy means the computer remembers the words so you can paste them somewhere else later.',
        'Copy = remember',
      ),
      shot(
        '05-tally',
        'Numbers are tallies',
        37,
        46,
        'Plain colorful tally marks, not spinning slots. Crossed-out game controller / no yacht.',
        'The numbers on the page are just counts, like tally marks. They are not a video game. This room does not buy or sell in the market.',
        'Tallies, not a game',
      ),
      shot(
        '06-skip',
        'Skipping is fine',
        46,
        56,
        'Purple HOME pulses. Cursor leaves the lava room. Front door. Relief.',
        'If you do not want to share, that is fine. Click the purple HOME button and leave.',
        'Sharing is optional',
      ),
    ],
  }),

  cinema: script({
    id: 'cinema',
    navLabel: 'CLEARPATH CINEMA',
    title: 'ClearPath cinema',
    color: '#00E5FF',
    targetSeconds: 54,
    logline: 'The cyan movie theater inside the website.',
    masterFlow:
      'A 54-second cyan-amber theater tour. Shelves of glowing posters. A simple player. Fifth grade. Colorful dark theater.',
    narrationScript:
      'Find the cyan button that says CLEARPATH CINEMA. Click it. This room is a movie theater inside the website. You will see rows of pictures, like shelves of movies. Click one picture. A player opens. Player means a box that shows the movie. You can drag the little bar at the bottom to skip ahead. You can make it full screen so the movie is big. These movies teach. They do not tell you what to buy. If a live show is broken, the page will say so in plain words. Watch one movie. Then click the cyan EDUCATION button or the orange CHARTS button. Remember: cyan theater, click one picture, watch one movie. Take your time.',
    music: 'Theatre hush. Soft amber. No trailer boom.',
    captionsNote: 'No YouTube logo. No fake live P&L on the film.',
    shots: [
      shot(
        '01-find',
        'Find cyan CINEMA',
        0,
        9,
        'Cyan CLEARPATH CINEMA pill, amber italic glow, little TV icon. Cursor. Cyan-amber wash like theater lights dimming.',
        'Find the cyan button that says CLEARPATH CINEMA. Click it.',
        'Cyan = theater',
      ),
      shot(
        '02-shelves',
        'Shelves of pictures',
        9,
        18,
        'Rows of colorful movie posters on dark shelves. Kid video-store joy. Readable titles. No blood, no hype stamps.',
        'This room is a movie theater inside the website. You will see rows of pictures, like shelves of movies.',
      ),
      shot(
        '03-player',
        'Click a picture',
        18,
        27,
        'Cursor clicks a poster. A big player box opens. Seek bar as a simple crayon line. Fullscreen corners glow.',
        'Click one picture. A player opens. Player means a box that shows the movie. You can drag the little bar at the bottom to skip ahead. You can make it full screen so the movie is big.',
        'Player = movie box',
      ),
      shot(
        '04-teach',
        'Movies that teach',
        27,
        36,
        'A calm educational still on the player. Crossed-out shopping cart. Friendly.',
        'These movies teach. They do not tell you what to buy.',
      ),
      shot(
        '05-broken',
        'If it is broken',
        36,
        45,
        'Honest glass sign: this show is not working right now. Pick another poster. No angry red siren.',
        'If a live show is broken, the page will say so in plain words.',
        'Broken? It will say so',
      ),
      shot(
        '06-next',
        'Then school or pictures',
        45,
        54,
        'Cyan EDUCATION and orange CHARTS pulse. Cursor may pick either. End still.',
        'Watch one movie. Then click the cyan EDUCATION button or the orange CHARTS button.',
        'One movie, then go',
      ),
    ],
  }),

  education: script({
    id: 'education',
    navLabel: 'CLEARPATH EDUCATION',
    title: 'ClearPath education',
    color: '#00E5FF',
    targetSeconds: 58,
    logline: 'The cyan school. One lesson. Then a tiny quiz. Then rest.',
    masterFlow:
      'A 58-second cyan school tour. Subject cards like classroom doors. A book. A three-question quiz with a sticker, not a slot. Fifth grade. Very colorful.',
    narrationScript:
      'Find the cyan button that says CLEARPATH EDUCATION. Click it. This is school inside the website. You will see subject cards — Crypto, Stocks, Forex, and more — like classroom doors. Click one subject. Then click a lesson that is unlocked. Unlocked means the door is open. Read it like a short book. At the end there is a tiny quiz. A quiz is just to see if the words made sense. Passing does not mean you should spend money. It only means you understood that page. There are also three libraries for extra reading. Do one lesson. Then rest. If your brain is tired, click the purple HOME button.',
    music: 'Warm classroom piano, very low. No level-up slot chime.',
    captionsNote: 'No “you are a trader now” stamp.',
    shots: [
      shot(
        '01-find',
        'Find cyan EDUCATION',
        0,
        9,
        'Cyan CLEARPATH EDUCATION pill with a book icon, glowing like a classroom night-light. Cursor. Cyan wash.',
        'Find the cyan button that says CLEARPATH EDUCATION. Click it.',
        'Cyan = school',
      ),
      shot(
        '02-doors',
        'Classroom doors',
        9,
        19,
        'A grid of colorful subject doors: Crypto, Stocks, Forex, Futures, Commodities, Bonds, Options, Funds, Indices, Economic Indicators. Each door a different candy color. Kid school hallway.',
        'This is school inside the website. You will see subject cards — Crypto, Stocks, Forex, and more — like classroom doors.',
        'Cards = classroom doors',
      ),
      shot(
        '03-lesson',
        'Open an unlocked door',
        19,
        29,
        'An unlocked padlock turns teal. A short book opens with huge readable type and a breadcrumb trail of big crumbs.',
        'Click one subject. Then click a lesson that is unlocked. Unlocked means the door is open. Read it like a short book.',
      ),
      shot(
        '04-quiz',
        'Tiny quiz',
        29,
        39,
        'Three giant answer buttons. A teal sticker star on pass. Next door unlocks gently. Not a slot machine.',
        'At the end there is a tiny quiz. A quiz is just to see if the words made sense. Passing does not mean you should spend money. It only means you understood that page.',
        'Quiz = did the words click?',
      ),
      shot(
        '05-libraries',
        'Three extra libraries',
        39,
        49,
        'Three glowing library doors: Encyclopedia of Finance, Encyclopedia of Indicators, Literacy OS. Optional. Soft.',
        'There are also three libraries for extra reading.',
      ),
      shot(
        '06-rest',
        'One lesson, then rest',
        49,
        58,
        'School grid dims to rest. Purple HOME pulses. Cursor may leave. Kind ending.',
        'Do one lesson. Then rest. If your brain is tired, click the purple HOME button.',
        'One lesson, then rest',
      ),
    ],
  }),

  exit: script({
    id: 'exit',
    navLabel: 'EXIT',
    title: 'Exit',
    color: '#FF4D4D',
    targetSeconds: 52,
    logline: 'The red stop-sign button. It hangs up. It does not delete you.',
    masterFlow:
      'A 52-second red stop-sign tour of EXIT. Second row. Very clear. Fifth grade. Colorful warning without panic strobe.',
    narrationScript:
      'Look at the second row of buttons, under the first row. The last button is red. It says EXIT. Red means stop, like a stop sign on the street. Click EXIT only when you want to leave this website for now. EXIT logs you out. That means the website forgets you are signed in, like hanging up a phone. It does not delete your name. It does not close a bank. It does not buy or sell anything. If you meant to look at pictures, do not click EXIT. Click the orange CHARTS button instead. If you meant the front door, click purple HOME. Remember: red is stop. Only click it when you are done for now.',
    music: 'None. One soft door-close at the end. No slam. No alarm.',
    captionsNote: 'Red is a stop sign, not an emergency siren.',
    shots: [
      shot(
        '01-second-row',
        'Look under the first row',
        0,
        8,
        'Camera drops from the colorful top row to the second row. PROFILE pink, AFFILIATE pink, CINEMA cyan, EDUCATION cyan, then stop-sign red EXIT. Slow. Giant cursor.',
        'Look at the second row of buttons, under the first row. The last button is red. It says EXIT.',
        'Second row, last button',
      ),
      shot(
        '02-stop',
        'Red = stop sign',
        8,
        17,
        'The red EXIT pill becomes a friendly street stop sign, then back to a pill. No blood. No skull. Kid-safety poster.',
        'Red means stop, like a stop sign on the street. Click EXIT only when you want to leave this website for now.',
        'Red = stop',
      ),
      shot(
        '03-hang-up',
        'Like hanging up a phone',
        17,
        26,
        'A simple colorful phone hangs up. The website fades to a signed-out door. Calm. No shredder.',
        'EXIT logs you out. That means the website forgets you are signed in, like hanging up a phone.',
        'Hang up, not delete',
      ),
      shot(
        '04-not-these',
        'It does not do these',
        26,
        35,
        'Three kid cards: nametag stays, bank stays, no shopping. Bright icons. Clear.',
        'It does not delete your name. It does not close a bank. It does not buy or sell anything.',
        'Name stays',
      ),
      shot(
        '05-wrong-button',
        'If you wanted pictures',
        35,
        44,
        'Orange CHARTS and purple HOME glow as the “oops I meant these” choices. Cursor hovers, does not click EXIT.',
        'If you meant to look at pictures, do not click EXIT. Click the orange CHARTS button instead.',
      ),
      shot(
        '06-home',
        'Or go to the front door',
        44,
        52,
        'Purple HOME pulses. Still colorful row. End. Choice stays with the viewer.',
        'If you meant the front door, click purple HOME.',
        'Or click HOME',
      ),
    ],
  }),

  literacy: script({
    id: 'literacy',
    navLabel: 'Literacy OS',
    title: 'Literacy OS',
    color: '#00E5FF',
    targetSeconds: 54,
    logline: 'A cyan notebook desk with rooms for ideas.',
    masterFlow:
      'A 54-second cyan notebook-desk tour. Room chips like classroom stations. Fifth grade. Colorful. Slow.',
    narrationScript:
      'Literacy OS is a notebook desk you open from school. Click the cyan Literacy OS card. Morning Brief is the first page. It shows what you already saved. It is not a to-do list that yells at you. The colorful chips are rooms. Click Thesis Vault to keep your big ideas. Click Concept Wiki for words explained in easy language. Click Source Sentinel to notice when a page on the internet changes. Other rooms can wait. This desk is school. It is not a store. Save one idea. Then rest. Purple HOME is always at the top if you want out. Remember: cyan notebook, one room, one idea. Take your time.',
    music: 'Dawn-cyan air. Slow.',
    captionsNote: 'Room names on chips are the lesson.',
    shots: [
      shot(
        '01-door',
        'Open from school',
        0,
        9,
        'From the cyan Education grid, a Literacy OS door glows. Cursor clicks. Notebook-desk color wash.',
        'Literacy OS is a notebook desk you open from school. Click the cyan Literacy OS card.',
        'Notebook desk',
      ),
      shot(
        '02-brief',
        'Morning Brief',
        9,
        18,
        'Morning Brief with quiet colorful stat stickers. Dawn light. No yelling checklist.',
        'Morning Brief is the first page. It shows what you already saved. It is not a to-do list that yells at you.',
      ),
      shot(
        '03-chips',
        'Rooms as chips',
        18,
        27,
        'Candy chips light one at a time: Thesis Vault, Concept Wiki, Source Sentinel. Kid stations in a classroom.',
        'The colorful chips are rooms. Click Thesis Vault to keep your big ideas. Click Concept Wiki for words explained in easy language.',
      ),
      shot(
        '04-sentinel',
        'Source Sentinel',
        27,
        36,
        'Two page pictures with a gentle “this part changed” highlight. Detective-kid energy, not spyware scary.',
        'Click Source Sentinel to notice when a page on the internet changes.',
      ),
      shot(
        '05-wait',
        'Other rooms can wait',
        36,
        45,
        'More chips stay dim on purpose. Crossed-out store. Soft.',
        'Other rooms can wait. This desk is school. It is not a store.',
        'School, not a store',
      ),
      shot(
        '06-rest',
        'Save one idea',
        45,
        54,
        'One note saved. Purple HOME pulses. Rest.',
        'Save one idea. Then rest. Purple HOME is always at the top if you want out.',
        'One idea, then rest',
      ),
    ],
  }),

  encyclopedia: script({
    id: 'encyclopedia',
    navLabel: 'Encyclopedia of Finance',
    title: 'Encyclopedia of finance',
    color: '#00E5FF',
    targetSeconds: 54,
    logline: 'A cyan library of money words. Teaching pages, not a shopping list.',
    masterFlow:
      'A 54-second cyan library tour. Bookshelves, a level picker like reading levels, a tutor. Fifth grade. Colorful academic.',
    narrationScript:
      'The Encyclopedia of Finance is a library of money words. Open it from school. The list on the left is the index — like the contents page in a book. Click one topic. Then pick a reading level. Beginner is the easy words. You can climb later. The middle of the screen is the article, like a chapter. If a word still feels foggy, open the Scholar Tutor and ask in regular English. These cards are for learning. They are not a list of companies you must buy. Read one topic. Then click back, or click purple HOME. Remember: left list, one topic, Beginner first. Then stop. Take your time.',
    music: 'Library hush with a hint of cyan.',
    captionsNote: 'Do not stamp “thousands of real companies verified.”',
    shots: [
      shot(
        '01-library',
        'A library',
        0,
        9,
        'Glass bookshelves with cyan labels. Kid library wonder. Establishing wide shot.',
        'The Encyclopedia of Finance is a library of money words. Open it from school.',
        'Library of money words',
      ),
      shot(
        '02-index',
        'The left list',
        9,
        18,
        'Left sidebar lights: Markets, Stocks, Forex, Crypto, Economy — each a color. Contents-page metaphor.',
        'The list on the left is the index — like the contents page in a book. Click one topic.',
      ),
      shot(
        '03-levels',
        'Reading levels',
        18,
        27,
        'Tabs: Beginner / Trader / Analyst / Economist as reading-level stickers. Beginner glows first. Same book, easier words.',
        'Then pick a reading level. Beginner is the easy words. You can climb later.',
        'Beginner = easy words',
      ),
      shot(
        '04-chapter',
        'The chapter',
        27,
        36,
        'A long-form page with huge type. Back button as a big arrow.',
        'The middle of the screen is the article, like a chapter.',
      ),
      shot(
        '05-tutor',
        'Ask the tutor',
        36,
        45,
        'A friendly tutor corner. Speech bubble in plain English. Not a hype robot.',
        'If a word still feels foggy, open the Scholar Tutor and ask in regular English. These cards are for learning. They are not a list of companies you must buy.',
        'Ask in easy words',
      ),
      shot(
        '06-back',
        'One topic, then back',
        45,
        54,
        'Back arrow or purple HOME. Still library. End.',
        'Read one topic. Then click back, or click purple HOME.',
        'One topic, then stop',
      ),
    ],
  }),

  indicators: script({
    id: 'indicators',
    navLabel: 'Encyclopedia of Indicators',
    title: 'Encyclopedia of indicators',
    color: '#00E5FF',
    targetSeconds: 54,
    logline: 'A teal picture-book of chart helpers. They describe yesterday, not tomorrow.',
    masterFlow:
      'A 54-second teal directory tour. SVG picture cards. A formula as a recipe card. Fifth grade. Colorful. Honest.',
    narrationScript:
      'The Encyclopedia of Indicators is a picture book of chart helpers. Helpers have names like RSI or moving average. Open it from school. Use the filters on the left to search, like picking a flavor. Click a card. You will see a picture, a recipe, how to read it, and what it cannot do. A live-overlay badge means you can stick that helper on CHARTS. A helper only talks about prices that already happened. It cannot promise tomorrow. Sticking a helper on a picture still does not buy or sell. Read the “what it cannot do” part. Then go back to the terminal desktop, or click orange CHARTS. Remember: pick a flavor, click a card, read what it cannot do.',
    music: 'Quiet teal tone.',
    captionsNote: 'SVG pictures only. No fake live videos on the cards.',
    shots: [
      shot(
        '01-book',
        'A picture book',
        0,
        9,
        'Teal card grid of simple SVG chart pictures. Kid picture-book energy. Establishing.',
        'The Encyclopedia of Indicators is a picture book of chart helpers. Helpers have names like RSI or moving average. Open it from school.',
        'Picture book of helpers',
      ),
      shot(
        '02-filters',
        'Filters on the left',
        9,
        18,
        'Left rail as ice-cream flavor picks: search, category chips, a simple slider. Playful, not a slot panel.',
        'Use the filters on the left to search, like picking a flavor.',
      ),
      shot(
        '03-card',
        'Open a card',
        18,
        27,
        'Detail page: picture, recipe card, how-to, limitations in a yellow “cannot do” box. Honest.',
        'Click a card. You will see a picture, a recipe, how to read it, and what it cannot do.',
      ),
      shot(
        '04-sticker',
        'A sticker for Charts',
        27,
        36,
        'Live-overlay badge as a sticker. It flies toward the orange CHARTS pill. Cute. Not a trade.',
        'A live-overlay badge means you can stick that helper on CHARTS.',
        'Sticker, not a purchase',
      ),
      shot(
        '05-yesterday',
        'Yesterday, not tomorrow',
        36,
        45,
        'A calendar on yesterday circled. Tomorrow is gray. Crossed-out crystal ball. Crossed-out shopping cart.',
        'A helper only talks about prices that already happened. It cannot promise tomorrow. Sticking a helper on a picture still does not buy or sell.',
        'Yesterday only',
      ),
      shot(
        '06-back',
        'Back or Charts',
        45,
        54,
        'Back to Terminal Desktop, or orange CHARTS. End still.',
        'Read the “what it cannot do” part. Then go back to the terminal desktop, or click orange CHARTS.',
        'Read “cannot do”',
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
