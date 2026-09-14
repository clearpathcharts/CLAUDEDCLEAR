/**
 * Google Flow production bible for Explain Mode.
 *
 * EACH shot is its own Google Flow job. Hard cap: 8.00 seconds.
 * Do not let Flow fade out at 3 seconds — the prompt says HOLD THE FRAME.
 *
 * Twelve clips × 8s = 96s per tab. Teach one tiny idea per clip.
 * Fifth grade. Name the color. Point. Say “click.”
 *
 * Drop the stitch at public/explain-videos/{id}.mp4 (16:9, H.264).
 */

import type { ExplainFlowSlotId } from './explainMedia';

export const EXPLAIN_FLOW_BRAND_LOOK =
  'FIFTH-GRADE FIELD TRIP through ClearPath Trader, 16:9 landscape, exactly eight seconds, no early cutoff. VERY colorful candy-button pills on a dark night sky: electric violet #4D00FF, hot pink #FF1493, lava orange #FF6A00, trophy gold #FFD700, electric cyan #00E5FF, stop-sign red #FF4D4D. Giant friendly cartoon mouse cursor with a big white glove, large enough a child can track it. Huge easy words, one idea on screen. Saturated color wash of THIS clip’s color. Kids science-museum lighting. Soft glitter, not a casino. Slow enough to count “one-Mississippi” eight times.';

export const EXPLAIN_FLOW_NEGATIVE =
  'No buy button, no sell button, no order ticket, no P&L fireworks, no countdown clock, no “last chance”, no influencer, no fake breaking-news siren, no invented prices as advice, no confetti checkout, no slot-machine spin, no 3-second jump-cut, no ending the clip before eight seconds.';

export const EXPLAIN_FLOW_HOLD =
  'DURATION LOCK: this clip is EIGHT SECONDS, not three. Keep the camera moving slowly for the whole eight. Hold the last frame until 8.00. Do not fade at 3 seconds. If the model wants to fade early, ignore it and keep the same picture living.';

export const EXPLAIN_FLOW_CLIP_SECONDS = 8;
export const EXPLAIN_FLOW_SHOT_COUNT = 12;
export const EXPLAIN_FLOW_TARGET_MIN = 96;
export const EXPLAIN_FLOW_TARGET_MAX = 96;

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

type ClipDraft = {
  id: string;
  title: string;
  visual: string;
  narration: string;
  super?: string;
  /** Optional second-by-second picture. If omitted we still lock 0–2 / 2–4 / 4–6 / 6–8. */
  beats?: [string, string, string, string];
};

function buildFloatingFlowPrompt(args: {
  tabId: string;
  navLabel: string;
  color: string;
  index: number;
  draft: ClipDraft;
}): string {
  const n = String(args.index + 1).padStart(2, '0');
  const superLine = args.draft.super ?? args.draft.title;
  const beats = args.draft.beats ?? [
    `Establish ONLY this clip’s one idea. Dark night-sky ClearPath terminal. Saturated ${args.color} color wash. Huge rounded kid super “${superLine}” already on screen. Camera is already inside the scene — no logo card, no 3-second fade-in from black.`,
    `Perform the action described in the full picture notes. Move as if a child is counting one-Mississippi, two-Mississippi. If a mouse is needed, it is a GIANT cartoon white-glove cursor, bigger than the button, crawling, never teleporting.`,
    `Keep the SAME action going, twenty percent slower. Do not introduce a second lesson. Soft museum glitter only — not casino sparks, not slot-machine lights.`,
    `HOLD the clearest, most readable frame until 8.00. Super still huge. Do not fade to black. Do not smash-cut. If the model wants to end at three seconds, ignore it and keep this exact picture living through eight.`,
  ];
  return [
    `GOOGLE FLOW — ONE FLOATING EIGHT-SECOND JOB.`,
    `Tab: ${args.navLabel} (${args.tabId}). Clip ${n} of 12 — “${args.draft.title}”.`,
    `Paste this prompt ALONE. Do not paste the other eleven clips into the same job.`,
    `Aspect: 16:9 landscape. Duration slider: 8 seconds. If Flow offers 5s or 6s, pick 8 or regenerate until the clip holds to 8.00.`,
    EXPLAIN_FLOW_BRAND_LOOK,
    EXPLAIN_FLOW_HOLD,
    `ACCENT LOCK: every rim light, glow, and color wash is ${args.color}.`,
    `ONE IDEA ONLY: ${args.draft.title}. Tell them little. If a second idea appears, delete it.`,
    `0.00–2.00s: ${beats[0]}`,
    `2.00–4.00s: ${beats[1]}`,
    `4.00–6.00s: ${beats[2]}`,
    `6.00–8.00s: ${beats[3]}`,
    `FULL PICTURE NOTES (use for the whole eight seconds, not a 3-second postcard): ${args.draft.visual}`,
    `ON-SCREEN SUPER (≤6 words, huge rounded letters, ${args.color} fill, white outline): ${superLine}`,
    `SOUND: silent picture. Fifth-grade voiceover is recorded later over the stitch. Do not burn captions into the pixels.`,
    `Avoid: ${EXPLAIN_FLOW_NEGATIVE}`,
  ].join(' ');
}

function clip(
  index: number,
  draft: ClipDraft,
  meta: { tabId: string; navLabel: string; color: string },
): ExplainFlowShot {
  const start = index * EXPLAIN_FLOW_CLIP_SECONDS;
  const end = start + EXPLAIN_FLOW_CLIP_SECONDS;
  return {
    id: draft.id,
    title: draft.title,
    startSeconds: start,
    endSeconds: end,
    flowPrompt: buildFloatingFlowPrompt({ ...meta, index, draft }),
    narration: draft.narration,
    super: draft.super,
  };
}

function script(
  partial: Omit<ExplainFlowScript, 'masterFlowPrompt' | 'narrationScript' | 'shots' | 'targetSeconds'> & {
    masterFlow: string;
    clips: ClipDraft[];
  },
): ExplainFlowScript {
  if (partial.clips.length !== EXPLAIN_FLOW_SHOT_COUNT) {
    throw new Error(`${partial.id} needs ${EXPLAIN_FLOW_SHOT_COUNT} eight-second clips`);
  }
  const meta = { tabId: partial.id, navLabel: partial.navLabel, color: partial.color };
  const shots = partial.clips.map((c, i) => clip(i, c, meta));
  return {
    id: partial.id,
    navLabel: partial.navLabel,
    title: partial.title,
    color: partial.color,
    targetSeconds: EXPLAIN_FLOW_SHOT_COUNT * EXPLAIN_FLOW_CLIP_SECONDS,
    logline: partial.logline,
    narrationScript: shots.map((s) => s.narration.trim()).join(' '),
    masterFlowPrompt: [
      `MASTER LOOK ONLY — do not generate one film from this. Generate twelve separate 8.00s Flow jobs.`,
      EXPLAIN_FLOW_BRAND_LOOK,
      partial.masterFlow,
      EXPLAIN_FLOW_HOLD,
      `Avoid: ${EXPLAIN_FLOW_NEGATIVE}`,
    ].join(' '),
    shots,
    music: partial.music,
    captionsNote: partial.captionsNote,
  };
}

export const EXPLAIN_FLOW_SCRIPTS: Record<ExplainFlowSlotId, ExplainFlowScript> = {
  ceo: script({
    id: 'ceo',
    navLabel: 'CEO',
    title: 'CEO dashboard',
    color: '#FF2E9A',
    logline: 'Twelve little 8s clips: the hot-pink builder button.',
    masterFlow: 'A chain of twelve eight-second hot-pink museum clips about the CEO pill. One tiny idea each. Giant cursor.',
    music: 'Soft pink night-light. Silence between sentences.',
    captionsNote: 'One short line per clip. Color the word PINK.',
    clips: [
      {
        id: '01-row',
        title: 'The colorful row',
        super: 'Buttons live at the top',
        narration:
          'Look at the very top of the screen. Do not look at the middle yet. Up there is a row of colorful buttons, like candy. Stay looking at the top. Do not click yet.',
        visual:
          'Wide 16:9 establishing shot of the ClearPath top bar on a black night sky that slowly fills with magenta museum dust. Seven candy pills sit in a perfectly straight line, each a different neon: violet house, hot-pink people, lava-orange chart, trophy-gold crown, electric-cyan play square, plus two more soft neons. The camera dollies left to right for the full eight seconds at walking speed, never rushing, never jump-cutting. Glass reflections slide across the pills. Huge rounded caption TOP OF THE SCREEN sits in the lower third the whole time. No cursor yet. No click. Hold the last pill in frame at 8.00.',
        beats: [
          'Start on empty night sky. Tilt up until the candy nav row enters from the top edge like a necklace of lights. Super already readable.',
          'Dolly left to right along the pills. Name them with light, not text: violet, pink, orange, gold, cyan. Child-slow.',
          'Continue the same dolly. Magenta dust. Reflections. Still no cursor.',
          'Hold on the full row. Super TOP OF THE SCREEN. Do not fade.',
        ],
      },
      {
        id: '02-find-pink',
        title: 'Find hot pink',
        super: 'Hot-pink = CEO',
        narration:
          'Now find the hot-pink button. It says C E O. Pink like bubblegum. The other buttons get darker so this one is easy to see.',
        visual:
          'The row darkens except one squishy hot-pink #FF2E9A pill stamped CEO with a tiny shield. A magenta spotlight breathes in and out. The camera pushes in for the full eight seconds until the three letters fill half the frame. Bubblegum-pink color wash on every rim. Glints crawl along the pill edge like candy wrapper. No other button competes. No click yet. Hold the extreme close-up.',
        beats: [
          'Row visible; every pill except CEO dims to charcoal. Pink one stays candy-bright.',
          'Slow push-in on CEO letters. Spotlight breathes.',
          'Letters grow to half the frame. Bubblegum wash.',
          'Hold the close-up. Super Hot-pink = CEO.',
        ],
      },
      {
        id: '03-who',
        title: 'Only the builder',
        super: 'Most people will not see this',
        narration:
          'Most people will not see this pink button. It is only for the person who built the website. If you are visiting, you can skip it.',
        visual:
          'Pink CEO pill stays small in the upper corner as a landmark. Center frame is a paper-cutout person at a simple desk under a warm lamp. Everyone else is drawn as faded gray silhouettes that stay faded the whole eight seconds — they do not pop back. A friendly construction-paper ribbon reads ONLY THE BUILDER. Slow parallax of paper layers. Kid poster, not secret-agent. Hold on the ribbon.',
        beats: [
          'Establish desk + faded crowd. Pink pill visible as a tiny corner landmark.',
          'Ribbon ONLY THE BUILDER unrolls slowly.',
          'Silhouettes stay faded on purpose. No scare lighting.',
          'Hold the ribbon and the still crowd.',
        ],
      },
      {
        id: '04-mouse',
        title: 'The little arrow',
        super: 'Mouse = little arrow',
        narration:
          'Your mouse is the little arrow on the screen. Slide that arrow onto the pink button. Do not press yet. Just rest the arrow on the pink.',
        visual:
          'A giant cartoon white-glove cursor, bigger than the CEO pill, enters from the right edge and crawls toward the pink button on a dotted sparkle path. The crawl takes almost the entire eight seconds so a child who has never used a computer can follow it. Caption LITTLE ARROW stays huge. Dark sky. Pink glow grows as the glove gets closer. The glove stops hovering, fingertip just above the pill. Do not click in this clip. Hold the hover.',
        beats: [
          'Glove enters from the right, already large. Path dots begin.',
          'Crawl halfway. Child can track every inch.',
          'Crawl to hover. Pink glow grows. Still no press.',
          'Hold the hover. Super Mouse = little arrow.',
        ],
      },
      {
        id: '05-click',
        title: 'Click pink',
        super: 'Click = left button',
        narration:
          'Now click. Click means press the left button on your mouse one time. Watch the pink button squish. Then let go.',
        visual:
          'The white-glove cursor presses the pink CEO pill. The pill squishes like bubblegum and slowly pops back. A soft ring of magenta light expands once, taking several seconds — not an explosion, not fireworks. Caption CLICK = LEFT BUTTON stays the whole time. Camera locked. After the squish, the pill glows and we hold. The page does not change yet. That is the next clip.',
        beats: [
          'Glove already hovering. Super on. Stillness for a beat.',
          'Press. Pill squishes like gum.',
          'Soft magenta ring expands slowly. Pill pops back.',
          'Hold the glowing pill. No page change.',
        ],
      },
      {
        id: '06-room',
        title: 'The pink room opens',
        super: 'A new room',
        narration:
          'The screen changes. This is a new pink room. Rooms on this website are just different pages. You did not break anything.',
        visual:
          'From the still-glowing pink pill, a magenta room unfolds like a paper pop-up book for the full eight seconds: glass panels, a glowing header CEO Dashboard — Founder Console, pink ambient museum light. The camera pushes through the unfolding paper. No data tables yet, no numbers as advice. Just the feeling of walking into a new room. Hold on the header glow.',
        beats: [
          'Pill in foreground. First paper panel unfolds.',
          'More panels. Header letters assemble.',
          'Camera pushes into the pink room. Soft light.',
          'Hold the header. Super A new room.',
        ],
      },
      {
        id: '07-checklists',
        title: 'Pink checklists',
        super: 'Lists of jobs',
        narration:
          'You will see pink checklists. A checklist is a list of jobs. These jobs are only for the builder, not for you.',
        visual:
          'Bright kid checklists on magenta paper, labeled Site, Marketing, End of day — boxes as big as cookies, not tiny UI. A crayon slowly draws one check mark across several seconds. Camera pans the list at walking speed. No streak counters, no gamified fireworks. Hold on the finished crayon check.',
        beats: [
          'Three huge lists enter. Boxes empty.',
          'Pan Site → Marketing → End of day.',
          'Crayon draws one check, slowly.',
          'Hold the finished check. Super Lists of jobs.',
        ],
      },
      {
        id: '08-backup',
        title: 'Photocopy button',
        super: 'Backup = photocopy',
        narration:
          'The teal button saves a backup copy. Backup means a photocopy of important papers, so they are not lost. You do not need this button.',
        visual:
          'A teal #00F5D4 Download disaster backup control is staged as a friendly stamp-and-photocopy machine. Blank papers feed through a lamp of copy-machine light and stack into a safe folder for the full eight seconds. Caption PHOTOCOPY. No passwords, no account lists readable on the papers — just friendly blank sheets with a lock doodle. Hold on the stacked folder.',
        beats: [
          'Teal stamp machine in a pink room. Papers waiting.',
          'First sheet feeds through the lamp.',
          'Sheets stack into a folder. Slow.',
          'Hold the folder. Super Backup = photocopy.',
        ],
      },
      {
        id: '09-not-store',
        title: 'Not a store',
        super: 'Not a store',
        narration:
          'This pink room does not buy anything. It does not sell anything. It is not a store. It is the builder’s desk.',
        visual:
          'Three big kid cards slide in one after another and stay: a shopping cart with a gentle X, flying money with a gentle X, a price chart that stays perfectly still. Soft icons, no gore, no slashed throats, no sirens. Magenta background. After the third card arrives, all three sit together like a poster. Hold that poster.',
        beats: [
          'Cart card slides in with a gentle X.',
          'Money card slides in with a gentle X.',
          'Still chart card slides in.',
          'Hold all three. Super Not a store.',
        ],
      },
      {
        id: '10-not-theirs',
        title: 'Not other people’s pictures',
        super: 'Theirs stay the same',
        narration:
          'This room does not change other people’s pictures on the website. Their pages stay the same. Only the builder’s jobs change.',
        visual:
          'A row of small portrait frames on a pink wall. The builder’s frame wiggles a little pink. Every other frame stays perfectly still for the entire eight seconds — that stillness is the lesson. Caption THEIRS STAY THE SAME. Hold the still row.',
        beats: [
          'Row of frames. All still.',
          'Only the builder frame wiggles pink.',
          'Others remain frozen. Teach the stillness.',
          'Hold. Super Theirs stay the same.',
        ],
      },
      {
        id: '11-missing',
        title: 'No pink? That is normal',
        super: 'No pink is okay',
        narration:
          'If you do not see a pink CEO button, that is normal. Most visitors will not see it. You did not do anything wrong.',
        visual:
          'The top candy row without a CEO pill. A question-mark thought bubble appears, then calmly turns into a happy nod sticker. No alarm color. No error siren. Near the end the purple HOME pill begins a tiny pulse as a hint for the next clip. Hold the quiet row.',
        beats: [
          'Row without CEO. Question bubble appears.',
          'Bubble becomes a nod sticker.',
          'Quiet hold. No alarm.',
          'Purple HOME begins a tiny pulse. Super No pink is okay.',
        ],
      },
      {
        id: '12-home',
        title: 'Click purple HOME',
        super: 'Click purple HOME',
        narration:
          'Click the purple HOME button when you want to keep going. Purple HOME is the front door. Take your time.',
        visual:
          'Giant white-glove cursor travels to the violet #4D00FF HOME pill with a little house icon. The travel fills most of the eight seconds. It clicks. A warm front-door porch light opens behind the pill. End still on the open purple door. Hold.',
        beats: [
          'Glove starts far from purple HOME. Path dots.',
          'Crawl onto the house-icon pill.',
          'Click. Door light opens slowly.',
          'Hold the open purple door.',
        ],
      },
    ],
  }),

  home: script({
    id: 'home',
    navLabel: 'HOME',
    title: 'Home',
    color: '#6C5CE7',
    logline: 'Twelve little 8s clips: the purple front door.',
    masterFlow: 'Twelve eight-second purple front-door clips. Candy cards. Giant cursor. One idea each.',
    music: 'Warm welcome hum. No beat drops.',
    captionsNote: 'Spell HOME huge. Point at PURPLE.',
    clips: [
      {
        id: '01-top',
        title: 'Top of the screen',
        super: 'Look up',
        narration:
          'Look at the top of the screen. That is where the colorful buttons live. If you cannot find a button, look up first. Do not click yet.',
        visual:
          'Camera starts on a dark empty night with no UI, then tilts UP for the full eight seconds until the candy nav row enters from the top edge like a necklace of lights. Caption LOOK UP stays huge. Slow enough to feel like raising your eyes. Hold on the full row. No cursor.',
        beats: [
          'Empty night. Super Look up. Begin the tilt.',
          'Tilt continues. First pills peek in.',
          'Full row arrives like a necklace.',
          'Hold the row. Do not click.',
        ],
      },
      {
        id: '02-row-is-walking',
        title: 'Buttons = walking',
        super: 'Buttons move you around',
        narration:
          'That row of buttons is how you walk around this website. Each color is a different room. You walk by clicking, not by moving your feet.',
        visual:
          'Each pill lights in rainbow order, left to right, about one per second, a gentle parade that fills eight seconds. Tiny colorful footprints appear under the row after each light. No click. After the last pill lights, hold the glowing parade.',
        beats: [
          'First two pills light. Tiny footprints.',
          'Middle pills light. Parade continues.',
          'Last pills light. Footprints complete.',
          'Hold the glowing row. Super Buttons move you around.',
        ],
      },
      {
        id: '03-purple',
        title: 'Find purple HOME',
        super: 'Purple = HOME',
        narration:
          'Find the purple one. It says HOME. Purple like a grape. The little picture on the button is a house. That house means front door.',
        visual:
          'Extreme close-up of the violet #4D00FF HOME pill and little house icon. Grape-purple wash on the whole frame. Other pills dim to charcoal. Camera orbits about ten degrees over eight seconds so the house icon catches light. Hold the close-up.',
        beats: [
          'Row dims except purple HOME.',
          'Push-in on house icon.',
          'Tiny orbit. Grape wash.',
          'Hold. Super Purple = HOME.',
        ],
      },
      {
        id: '04-front-door',
        title: 'Front door of the house',
        super: 'HOME is the front door',
        narration:
          'Purple HOME is the front door of the house. A front door is the way back in. You can always find it at the top.',
        visual:
          'The HOME pill morphs slowly into a storybook front door with a purple wreath and a warm porch lamp, then morphs back into the pill, using the whole eight seconds. No jump. Kid picture-book wood grain. Hold on the door at the end of the morph.',
        beats: [
          'Pill begins to grow a door frame.',
          'Wreath and porch light appear.',
          'Door is fully a storybook door, then eases back toward pill.',
          'Hold the door-pill hybrid. Super HOME is the front door.',
        ],
      },
      {
        id: '05-arrow',
        title: 'Slide the arrow',
        super: 'Arrow on purple',
        narration:
          'Slide your little arrow onto the purple button. The arrow is your mouse. Rest it on the purple. Do not press yet.',
        visual:
          'Giant white-glove cursor crawls from the bottom of the frame onto the purple HOME pill on a dotted sparkle path. The crawl lasts the full eight seconds. Hover, do not click. Hold the hover with the glove fingertip kissing the house icon.',
        beats: [
          'Glove enters from the bottom. Path dots.',
          'Crawl to mid-frame.',
          'Arrive at purple. Hover.',
          'Hold hover. Super Arrow on purple.',
        ],
      },
      {
        id: '06-click',
        title: 'Click the door',
        super: 'Click',
        narration:
          'Now click. Click means press the left mouse button one time. The purple door opens. You did it right.',
        visual:
          'Glove clicks. Pill squishes like grape candy. A purple storybook door swings open in slow motion for the rest of the eight seconds, revealing glowing cards inside like a toy box. Hold on the open door and the glow beyond.',
        beats: [
          'Hover. Then press. Squish.',
          'Door begins to swing.',
          'Cards glow inside the toy-box room.',
          'Hold the open door.',
        ],
      },
      {
        id: '07-cards',
        title: 'Big glowing cards',
        super: 'Big glowing cards',
        narration:
          'You will see big glowing cards. Some are orange. Some are gold. Some are cyan. Some are pink. They are pictures you can click later.',
        visual:
          'Four giant cards drift into a 2×2 grid, each lighting its color over eight seconds: lava-orange Charts, electric-cyan Education, trophy-gold Memberships, lava-pink Y.W.C. Soft lava corners. No prices. Hold the finished grid.',
        beats: [
          'First card drifts in and lights orange.',
          'Second card cyan.',
          'Third gold, fourth pink.',
          'Hold the 2×2 grid.',
        ],
      },
      {
        id: '08-doors',
        title: 'Each card is a room',
        super: 'One card = one room',
        narration:
          'Each card is a door to another room. Under the card is a tiny sentence. Read that sentence before you click.',
        visual:
          'Camera pushes into the sentence under the Charts card until the words are large enough for a child. A door-knob icon grows on the card. Eight-second push-in. Hold on the readable sentence.',
        beats: [
          'Grid still. Begin push toward Charts card.',
          'Sentence becomes readable.',
          'Knob icon grows. Keep pushing.',
          'Hold the sentence. Super One card = one room.',
        ],
      },
      {
        id: '09-one-card',
        title: 'Click only one',
        super: 'You can skip cards',
        narration:
          'Then click only the card you want. You do not have to click every card. Skipping is allowed.',
        visual:
          'Three cards stay perfectly still. Only the Charts card gets a gentle tap from the giant glove and a smile sticker. Eight seconds of “the others can wait.” Hold the smile on Charts and the still neighbors.',
        beats: [
          'Four cards. Three still. Glove approaches Charts.',
          'Gentle tap. Smile sticker lands.',
          'Neighbors remain still on purpose.',
          'Hold. Super You can skip cards.',
        ],
      },
      {
        id: '10-no-money',
        title: 'No money leaves',
        super: 'Nothing spends money',
        narration:
          'Nothing on this home page spends your money. Looking at cards is free. No credit card is used here.',
        visual:
          'A friendly piggy bank sits in front of the glowing cards. Coins stay inside — we see them through a window and they do not jump out. A soft X rests on a credit card. Eight-second hold. Friendly, not scary. Hold the still piggy.',
        beats: [
          'Piggy arrives in front of cards.',
          'Coins visible inside, not leaving.',
          'Credit card gets a gentle X.',
          'Hold. Super Nothing spends money.',
        ],
      },
      {
        id: '11-lost',
        title: 'If you get lost',
        super: 'Lost? Come back',
        narration:
          'If you get lost later, come back here. Lost just means you do not know which room you are in. Purple HOME finds you.',
        visual:
          'A simple colorful maze. A kid-dot walks the wrong way down a dead end, then a purple house magnet gently pulls them home over eight seconds. No panic colors. Hold on the house with the dot safe beside it.',
        beats: [
          'Maze. Kid-dot starts walking.',
          'Wrong turn. Soft, not scary.',
          'Purple house magnet pulls them home.',
          'Hold the house. Super Lost? Come back.',
        ],
      },
      {
        id: '12-again',
        title: 'Purple again',
        super: 'Always the front door',
        narration:
          'Click the purple HOME button again any time. You can always return to the front door. Take your time.',
        visual:
          'Cursor clicks purple HOME again. The front door fills the frame with warm porch light for the full eight seconds. End still. Hold the open door.',
        beats: [
          'Glove moves to purple HOME.',
          'Click. Door grows.',
          'Porch light fills the frame.',
          'Hold the open door.',
        ],
      },
    ],
  }),

  ywc: script({
    id: 'ywc',
    navLabel: 'Y.W.C.',
    title: 'Y.W.C. — Your World Connected',
    color: '#FF2E9A',
    logline: 'Twelve little 8s clips: the lava-pink story room.',
    masterFlow: 'Twelve eight-second lava-pink clips. Filter chips as crayons. One idea each.',
    music: 'Warm lava-pink pad. No news horns.',
    captionsNote: 'Write Your World Connected once in big letters.',
    clips: [
      {
        id: '01-find',
        title: 'Find orange-pink',
        super: 'Orange-pink button',
        narration:
          'Find the warm orange-pink button that says Y. W. C. Those are three letters with dots. It lives in the colorful row at the top.',
        visual:
          'Top candy row on a night sky. Giant white-glove cursor hunts along the pills, pausing a breath on each, and stops on the lava #FF4500 / #FF0080 Y.W.C. pill with a people icon. Sunset candy glow grows only on that pill. The search fills eight seconds. Hold on the found pill. No click yet.',
        beats: [
          'Row established. Glove starts at the left pills.',
          'Hover-pause on a wrong pill, then keep hunting.',
          'Land on Y.W.C. Sunset glow grows.',
          'Hold the lava pill. Super Orange-pink button.',
        ],
      },
      {
        id: '02-letters',
        title: 'What the letters mean',
        super: 'Your World Connected',
        narration:
          'Those letters mean Your World Connected. Say it with me: Your. World. Connected. That is the long name for this room.',
        visual:
          'Y. then W. then C. expand one letter at a time into the huge words YOUR, WORLD, CONNECTED. Magenta-orange wash. Each word gets time to be read. Hold all three words together at the end.',
        beats: [
          'Y grows into YOUR.',
          'W grows into WORLD.',
          'C grows into CONNECTED.',
          'Hold the three words. Super Your World Connected.',
        ],
      },
      {
        id: '03-click',
        title: 'Click it',
        super: 'Click the letters',
        narration:
          'Now click that orange-pink button. Click means press the left mouse button one time. Then wait for the room to open.',
        visual:
          'White-glove cursor clicks the lava Y.W.C. pill. The pill squishes. A sunset ripple expands slowly and we hold the ripple until 8.00. Camera locked. No other rooms yet.',
        beats: [
          'Glove hovers on Y.W.C.',
          'Press. Squish.',
          'Sunset ripple expands slowly.',
          'Hold the ripple. Super Click the letters.',
        ],
      },
      {
        id: '04-one-page',
        title: 'One page, not ten sites',
        super: 'One page',
        narration:
          'This room puts stories, magazines, and a little price picture on one page. One page means you can see them together.',
        visual:
          'Three objects fly in and sit on one lava desk: a magazine, a folded newspaper, a tiny educational chart. They land slowly across eight seconds so a child can name each one out loud. Hold the tidy desk.',
        beats: [
          'Magazine lands.',
          'Newspaper lands.',
          'Tiny chart lands.',
          'Hold all three. Super One page.',
        ],
      },
      {
        id: '05-not-ten',
        title: 'Not ten websites',
        super: 'Not ten tabs',
        narration:
          'So you do not have to open ten other websites. Ten websites would be ten different windows. Here they live in one room.',
        visual:
          'Ten cartoon browser windows start to slam open, then gently collapse and fold into the one lava desk. Eight seconds of tidy-up, not slapstick chaos. Hold on the single desk.',
        beats: [
          'Windows begin to appear.',
          'They fold inward, calmly.',
          'Last windows tuck into the desk.',
          'Hold the single desk. Super Not ten tabs.',
        ],
      },
      {
        id: '06-chips',
        title: 'Colorful chips',
        super: 'These are filters',
        narration:
          'See the colorful chips? Those are filters. A filter is a button that hides some stories and shows others.',
        visual:
          'Huge chips like piano keys: Sports, Magazines, Relief, Finance — each a different neon. They light left to right over eight seconds. Hold the glowing row of chips.',
        beats: [
          'Sports lights.',
          'Magazines lights.',
          'Relief then Finance light.',
          'Hold the row. Super These are filters.',
        ],
      },
      {
        id: '07-crayons',
        title: 'Like sorting crayons',
        super: 'Like sorting crayons',
        narration:
          'Filters are like sorting crayons by color. Click one chip. Only that color of stories stays on the desk.',
        visual:
          'Crayons hop into labeled cups that match the chips. The giant glove clicks Magazines. Other crayons sit down. Eight seconds. Hold on the chosen Magazines chip glowing alone.',
        beats: [
          'Crayons hop toward cups.',
          'Glove approaches Magazines.',
          'Click. Other chips dim.',
          'Hold Magazines. Super Like sorting crayons.',
        ],
      },
      {
        id: '08-story',
        title: 'Open a story',
        super: 'Click a story',
        narration:
          'Then click a story to read it. It opens like a picture book. You can stop reading whenever you want.',
        visual:
          'A story card unfolds like a picture book, pages turning slowly for eight seconds under a calm reading lamp. Huge type on the open page — never a real invented headline, just Sample story words. Hold the open page.',
        beats: [
          'Closed card on the desk.',
          'First page unfolds.',
          'Pages turn slowly. Lamp warm.',
          'Hold the open page. Super Click a story.',
        ],
      },
      {
        id: '09-chart',
        title: 'The little chart',
        super: 'Only a picture',
        narration:
          'The little chart on the side is only a picture of prices. A picture cannot make you buy. It is just a drawing of numbers.',
        visual:
          'A small educational chart with a cyan crosshair, labeled ONLY A PICTURE in huge type. Camera holds eight seconds. No arrows that say buy. No order ticket. Hold the still chart.',
        beats: [
          'Chart enters from the side.',
          'ONLY A PICTURE super locks on.',
          'Crosshair rests. No arrows.',
          'Hold. Super Only a picture.',
        ],
      },
      {
        id: '10-not-buy',
        title: 'Does not tell you what to buy',
        super: 'Not orders',
        narration:
          'This room does not tell you what to buy. Stories are not orders. Nobody here is the boss of your money.',
        visual:
          'A megaphone with a gentle X. A shopping cart with a gentle X. Lava-pink background. The two cards sit like a poster for eight seconds. Hold.',
        beats: [
          'Megaphone card with X.',
          'Cart card with X.',
          'Both sit as a poster.',
          'Hold. Super Not orders.',
        ],
      },
      {
        id: '11-loud',
        title: 'If it feels loud',
        super: 'Loud is okay',
        narration:
          'If the page feels loud or busy, that is okay. Your eyes can get tired. You are allowed to leave.',
        visual:
          'The lava desk pulses once, then a pair of kid earmuffs appears and settles on the desk. Eight seconds of “you can leave.” Soft, not scary. Hold the earmuffs.',
        beats: [
          'Desk pulses once.',
          'Earmuffs appear.',
          'They settle. Pulse fades.',
          'Hold. Super Loud is okay.',
        ],
      },
      {
        id: '12-leave',
        title: 'Purple HOME',
        super: 'Click HOME',
        narration:
          'Click the purple HOME button and leave when you want. The front door is always at the top. Take your time.',
        visual:
          'Cursor rises to purple #4D00FF HOME and clicks. Warm front door opens. The move fills eight seconds. Hold the open door.',
        beats: [
          'Glove leaves the desk, goes up.',
          'Arrives at purple HOME.',
          'Click. Door opens.',
          'Hold the door. Super Click HOME.',
        ],
      },
    ],
  }),

  indacreator: script({
    id: 'indacreator',
    navLabel: 'INDACREATOR',
    title: 'INDACREATOR',
    color: '#00E5FF',
    logline: 'Twelve little 8s clips: the long-word workshop.',
    masterFlow: 'Twelve eight-second cyan workshop clips. Recipe, compile, genie, charts.',
    music: 'Clean cyan. One school-bell ding on compile.',
    captionsNote: 'Show Compile and Apply in huge type.',
    clips: [
      {
        id: '01-find',
        title: 'The long word',
        super: 'Long word button',
        narration:
          'Find the button that says INDACREATOR. That is a long word. Sound it out slowly: in-da-cre-a-tor. It is cyan, like bright water.',
        visual:
          'Extreme close-up of cyan #00E5FF INDACREATOR letters marching on like train cars for eight seconds so a child can sound them out. Each syllable car lights as it arrives. Hold on the last letters. No click yet.',
        beats: [
          'First letters roll in like train cars.',
          'Middle syllables light.',
          'Last letters arrive.',
          'Hold the full word. Super Long word button.',
        ],
      },
      {
        id: '02-means',
        title: 'What it means',
        super: 'A workshop',
        narration:
          'It means indicator creator. That is a workshop that draws helper lines on pictures of prices. Helper lines are drawings, not orders.',
        visual:
          'A toy workshop: crayons draw glowing helper lines on a chart window. The drawing takes the full eight seconds. Caption WORKSHOP. No buy arrows. Hold the finished crayon lines.',
        beats: [
          'Workshop bench. Blank chart window.',
          'First crayon line draws.',
          'More helper lines glow.',
          'Hold. Super A workshop.',
        ],
      },
      {
        id: '03-click',
        title: 'Click the workshop',
        super: 'Click the long word',
        narration:
          'Click the long-word button. Click means press the left mouse button one time. Wait for the workshop room to open.',
        visual:
          'Glove clicks the cyan INDACREATOR pill. Squish. A cyan ripple expands for the rest of the eight seconds. Hold the ripple. Camera locked.',
        beats: [
          'Hover on the long word.',
          'Click. Squish.',
          'Cyan ripple expands.',
          'Hold. Super Click the long word.',
        ],
      },
      {
        id: '04-drop',
        title: 'Drop a file',
        super: 'File in the box',
        narration:
          'You can drop a file into the box. Or you can paste words. Or you can try the Gold Bar sample. Pick only one way.',
        visual:
          'A paper airplane labeled .pine flies for eight seconds and lands in a glowing drop box. A Gold Bar sticker waits quietly on the side, not flashing. Hold on the landed plane in the box.',
        beats: [
          'Airplane enters far left.',
          'Flight across the workshop.',
          'Lands in the drop box.',
          'Hold the box. Super File in the box.',
        ],
      },
      {
        id: '05-compile-word',
        title: 'The Compile button',
        super: 'Find Compile',
        narration:
          'Then find the button that says Compile. Compile is one word. Rest your little arrow on it. Do not press yet.',
        visual:
          'Huge friendly Compile button, cyan, like a school stamp. The giant glove approaches for eight seconds and hovers. Hold just before the click. That click is the next clip’s idea — this clip is only finding the word.',
        beats: [
          'Compile button fills the frame.',
          'Glove crawls toward it.',
          'Hover. No press.',
          'Hold the hover. Super Find Compile.',
        ],
      },
      {
        id: '06-recipe',
        title: 'Compile means check',
        super: 'Check this recipe',
        narration:
          'Now click Compile. Compile means please check this recipe. A recipe is a list of steps. The computer reads it.',
        visual:
          'A recipe card using a kid cooking metaphor — bowls labeled like ingredients, not real trading advice — gets a magnifying-glass inspection for eight seconds. Caption CHECK THE RECIPE. Hold the glass over the card.',
        beats: [
          'Recipe card on the bench.',
          'Magnifying glass enters.',
          'Glass inspects line by line.',
          'Hold. Super Check this recipe.',
        ],
      },
      {
        id: '07-error',
        title: 'Red error is okay',
        super: 'You did not break it',
        narration:
          'If the recipe is broken, you will see a red error. That is okay. You did not break the website. Red here means “fix this line,” not “you are in trouble.”',
        visual:
          'A calm red underline on one line of a notebook. A hug sticker: YOU DID NOT BREAK IT. Eight-second hold. No crash fire, no skull, no explosion. Hold the hug sticker.',
        beats: [
          'Notebook. One line underlines red, calmly.',
          'Hug sticker slides in.',
          'No fire. Still workshop.',
          'Hold. Super You did not break it.',
        ],
      },
      {
        id: '08-genie',
        title: 'River Genie',
        super: 'A helper',
        narration:
          'A helper named River Genie can fix the words. A helper suggests. You still choose. Then you can click Compile again.',
        visual:
          'Cute cyan lamp-genie writes in a notebook, then points back to the Compile stamp. Eight seconds. Hold on the pointing hand. Friendly, not magical-money.',
        beats: [
          'Lamp-genie appears.',
          'Writes in the notebook.',
          'Points to Compile.',
          'Hold the pointing hand. Super A helper.',
        ],
      },
      {
        id: '09-apply',
        title: 'Apply to All Charts',
        super: 'Apply means stick it on',
        narration:
          'When you are ready, click Apply to All Charts. Apply means stick the drawing onto the pictures. It still does not buy anything.',
        visual:
          'Gold-quiet Apply to All Charts button. Cursor clicks. Soft colorful stickers float onto a chart for eight seconds. Hold the stickered chart. No cash register.',
        beats: [
          'Apply button glows quietly.',
          'Click.',
          'Stickers float onto a chart.',
          'Hold. Super Apply means stick it on.',
        ],
      },
      {
        id: '10-orange',
        title: 'Then orange CHARTS',
        super: 'Go see the drawing',
        narration:
          'Then click the orange CHARTS button to see the drawing on the big picture. Orange is the charts room.',
        visual:
          'Orange #FF6A00 CHARTS pill pulses. Giant glove travels eight seconds and clicks. Hold on the orange pill after the click.',
        beats: [
          'Orange pill pulses in the top row.',
          'Glove travels.',
          'Click.',
          'Hold orange. Super Go see the drawing.',
        ],
      },
      {
        id: '11-no-money',
        title: 'Never spends money',
        super: 'No money',
        narration:
          'This workshop never spends money. Drawing helper lines is free on this page. There is no store here. There is no checkout.',
        visual:
          'Workshop still. Piggy bank closed. Gentle X on a shopping cart. Eight-second hold. Cyan wash. Hold the still bench.',
        beats: [
          'Workshop empty of commerce.',
          'Piggy closed.',
          'Cart gets X.',
          'Hold. Super No money.',
        ],
      },
      {
        id: '12-remember',
        title: 'Remember',
        super: 'Compile, then CHARTS',
        narration:
          'Remember the little steps: click the long-word button, click Compile, then click orange CHARTS. Take your time on each step.',
        visual:
          'Three huge recap stickers appear one by one across eight seconds: LONG WORD, then COMPILE, then ORANGE CHARTS. Hold all three together.',
        beats: [
          'LONG WORD sticker.',
          'COMPILE sticker.',
          'ORANGE CHARTS sticker.',
          'Hold all three.',
        ],
      },
    ],
  }),

  charts: script({
    id: 'charts',
    navLabel: 'CHARTS',
    title: 'Charts',
    color: '#FF7B00',
    logline: 'Twelve little 8s clips: orange building-block candles.',
    masterFlow: 'Twelve eight-second orange chart clips. Blocks of time. Colors for eyes. School, not store.',
    music: 'Soft orange air. Extra slow on candle colors.',
    captionsNote: 'Green-ish = finished higher. Red-ish = finished lower.',
    clips: [
      {
        id: '01-find',
        title: 'Find orange',
        super: 'Orange = CHARTS',
        narration:
          'Find the bright orange button that says CHARTS. Orange like a sunset. It lives in the colorful row at the top.',
        visual:
          'Lava-orange #FF6A00 CHARTS pill with a bar-chart icon, sunset candy lighting. Camera pushes in for eight seconds. Other pills dim. Hold the orange close-up. No click yet.',
        beats: [
          'Row. Orange pill singled out by light.',
          'Push-in begins.',
          'Icon and letters fill the frame.',
          'Hold. Super Orange = CHARTS.',
        ],
      },
      {
        id: '02-click',
        title: 'Click orange',
        super: 'Click orange',
        narration:
          'Click the orange button. Click means press the left mouse button one time. Then wait. The orange room will open.',
        visual:
          'Glove clicks the orange pill. Squish like sunset candy. An orange ripple expands for the rest of the eight seconds. Hold the ripple. Camera locked.',
        beats: [
          'Hover.',
          'Click. Squish.',
          'Ripple expands.',
          'Hold. Super Click orange.',
        ],
      },
      {
        id: '03-blocks',
        title: 'Building blocks',
        super: 'Boxes like blocks',
        narration:
          'You will see boxes that look like building blocks. They stand in a row. This is a picture of prices over time.',
        visual:
          'Toy building-block candlesticks assemble one by one for eight seconds on dark glass. Each block lands with a soft toy click of light, not a casino ding. Hold the finished row.',
        beats: [
          'First two blocks land.',
          'Middle blocks land.',
          'Last blocks complete the row.',
          'Hold the row. Super Boxes like blocks.',
        ],
      },
      {
        id: '04-candles-word',
        title: 'Grown-ups say candles',
        super: 'One block = one chunk',
        narration:
          'Grown-ups call them candles. Each block is one chunk of time. A chunk might be one minute or one day. You do not need that word yet.',
        visual:
          'A friendly analog clock melts into one block, then the next, eight seconds of “chunk of time.” Caption ONE BLOCK = ONE CHUNK. Hold the last melted block.',
        beats: [
          'Clock visible.',
          'Clock melts into first block.',
          'Next chunk becomes next block.',
          'Hold. Super One block = one chunk.',
        ],
      },
      {
        id: '05-green',
        title: 'Green-ish',
        super: 'Finished higher',
        narration:
          'A green-ish block means the price finished higher in that chunk of time. Higher is just a direction. It is not a command to buy.',
        visual:
          'One mint-green block grows upward like a plant for eight seconds. Kid label FINISHED HIGHER. No buy arrow. No rocket. Hold the grown plant-block.',
        beats: [
          'Short mint block.',
          'It grows upward slowly.',
          'Label FINISHED HIGHER appears.',
          'Hold. No arrows.',
        ],
      },
      {
        id: '06-red',
        title: 'Red-ish',
        super: 'Finished lower',
        narration:
          'A red-ish block means the price finished lower in that chunk of time. Lower is just a direction. It is not a command to sell.',
        visual:
          'One coral block shrinks downward slowly for eight seconds. Kid label FINISHED LOWER. No sell sign. Hold the shorter block.',
        beats: [
          'Tall coral block.',
          'It shrinks downward slowly.',
          'Label FINISHED LOWER.',
          'Hold. Super Finished lower.',
        ],
      },
      {
        id: '07-search',
        title: 'The search box',
        super: 'Type a name',
        narration:
          'At the top, click the search box. Type a name if you want a different picture. Letters appear as you type. Then wait for the new picture.',
        visual:
          'Giant search box. Cursor types slowly, letters appearing over eight seconds — a sample name like GOLD, not a trade call. Picture crossfades to another colorful chart. Hold the new picture.',
        beats: [
          'Empty search box. Glove clicks it.',
          'Letters type slowly.',
          'Chart crossfades.',
          'Hold the new picture. Super Type a name.',
        ],
      },
      {
        id: '08-profiles',
        title: 'Color buttons for eyes',
        super: 'Colors for your eyes',
        narration:
          'The colorful profile buttons change colors so the picture is easier on your eyes. Some people like calm cyan. Some people like fewer lights.',
        visual:
          'Same blocks try on three outfits over eight seconds: cyan Calm Focus, gray Low Stimulation, then red-green Standard. Hold on the last outfit. Museum lighting, not a rave.',
        beats: [
          'Calm Focus cyan outfit.',
          'Low Stimulation gray outfit.',
          'Standard red-green outfit.',
          'Hold. Super Colors for your eyes.',
        ],
      },
      {
        id: '09-not-price',
        title: 'Not the real price',
        super: 'Same price',
        narration:
          'Those color buttons do not change the real price. The number stays the same. Only the clothes on the picture change.',
        visual:
          'A price tag stays the same friendly sample number while clothes change around it. Eight-second hold. Caption SAME PRICE. Hold the still tag.',
        beats: [
          'Tag visible. First outfit around it.',
          'Outfit changes. Number does not.',
          'Another outfit. Number still same.',
          'Hold. Super Same price.',
        ],
      },
      {
        id: '10-crayons',
        title: 'Crayons on the picture',
        super: 'Drawing = crayons',
        narration:
          'Drawing tools are like crayons on the picture. You can mark the picture. This is school, not a store.',
        visual:
          'A crayon box on the left. A line is drawn slowly for eight seconds on the blocks. School desk. A store sign gets a gentle X. Hold the drawn line.',
        beats: [
          'Crayon box opens.',
          'Line begins.',
          'Line finishes. Store X appears.',
          'Hold. Super Drawing = crayons.',
        ],
      },
      {
        id: '11-cannot-buy',
        title: 'You cannot buy here',
        super: 'Cannot buy or sell',
        narration:
          'You cannot buy or sell from this page. There is no shop button hiding here. This is a picture room.',
        visual:
          'Shopping cart and sell sign both get gentle X stickers. Eight-second hold. Orange wash. Hold the two X cards.',
        beats: [
          'Cart appears.',
          'X on cart.',
          'Sell sign gets X.',
          'Hold. Super Cannot buy or sell.',
        ],
      },
      {
        id: '12-busy',
        title: 'Too busy?',
        super: 'Calm Focus or HOME',
        narration:
          'If the screen feels too busy, try Calm Focus, or click purple HOME. Both are allowed. Take your time.',
        visual:
          'Calm Focus button glows, then purple HOME pulses. Giant glove may hover either. Eight seconds. Hold both glowing options.',
        beats: [
          'Calm Focus glows.',
          'Purple HOME pulses.',
          'Glove hovers between them.',
          'Hold both. Super Calm Focus or HOME.',
        ],
      },
    ],
  }),

  news: script({
    id: 'news',
    navLabel: 'NEWS',
    title: 'News',
    color: '#4D6FFF',
    logline: 'Twelve little 8s clips: the blue headline list.',
    masterFlow: 'Twelve eight-second blue news clips. Honest empty. Posters, not orders.',
    music: 'Paper hush. No stingers.',
    captionsNote: 'Never invent a real headline. Use Sample story.',
    clips: [
      {
        id: '01-find',
        title: 'Find blue NEWS',
        super: 'Blue-purple NEWS',
        narration:
          'Find the blue-purple button that says NEWS. Blue like a library stamp. It lives in the colorful row at the top.',
        visual:
          'Blue #4D6FFF NEWS pill with a newspaper icon. Eight-second push-in. Other pills dim. Hold the close-up. No invented headlines on the pill. No click yet.',
        beats: [
          'Row. Blue pill singled out.',
          'Push-in on NEWS letters.',
          'Newspaper icon catches light.',
          'Hold. Super Blue-purple NEWS.',
        ],
      },
      {
        id: '02-click',
        title: 'Click',
        super: 'Click NEWS',
        narration:
          'Click the blue NEWS button. Click means press the left mouse button one time. Then wait for the list to open.',
        visual:
          'Glove clicks. Squish. A blue ripple expands for eight seconds. Hold the ripple. No sirens.',
        beats: [
          'Hover.',
          'Click. Squish.',
          'Blue ripple expands.',
          'Hold. Super Click NEWS.',
        ],
      },
      {
        id: '03-list',
        title: 'A list of headlines',
        super: 'A list',
        narration:
          'This page is a list of real headlines from the internet. A headline is the title of a story. We did not write those titles.',
        visual:
          'Cards stack like mail for eight seconds. Header NEWS. No sirens. Cards show only Sample story labels — never a fake breaking headline. Hold the stack.',
        beats: [
          'First cards drop like mail.',
          'Stack grows.',
          'Header NEWS visible.',
          'Hold the stack. Super A list.',
        ],
      },
      {
        id: '04-light',
        title: 'Look at the top',
        super: 'Look at the little light',
        narration:
          'Look at the very top. A little light tells you if the list is working, empty, or turned off. Read the light before you read the list.',
        visual:
          'A kid traffic light with three honest faces: working, empty, turned off. It cycles slowly once across eight seconds. Hold on working. Calm, not a cop siren.',
        beats: [
          'Light shows working.',
          'Then empty.',
          'Then turned off, then back to working.',
          'Hold working. Super Look at the little light.',
        ],
      },
      {
        id: '05-empty',
        title: 'Empty is honest',
        super: 'Empty ≠ fake stories',
        narration:
          'If the list is empty, we did not make up fake stories. Empty means the wire is quiet. Blank is honest.',
        visual:
          'An empty glass box. A liar-nose cartoon gets a gentle X. Caption WE DO NOT MAKE THEM UP. Eight-second hold. Blue wash.',
        beats: [
          'Empty glass box.',
          'Liar-nose appears.',
          'Gentle X on the nose.',
          'Hold. Super Empty ≠ fake stories.',
        ],
      },
      {
        id: '06-lying',
        title: 'Making news up is lying',
        super: 'That would be lying',
        narration:
          'Making up news would be lying. This website does not lie about headlines. If we do not have one, we leave the space blank.',
        visual:
          'A simple honest-kid poster: TELL THE TRUTH. Eight-second hold. Blue wash. No breaking-news ticker.',
        beats: [
          'Poster paper unrolls.',
          'TELL THE TRUTH paints on.',
          'Still poster.',
          'Hold. Super That would be lying.',
        ],
      },
      {
        id: '07-card-parts',
        title: 'Parts of a card',
        super: 'Who, when, title',
        narration:
          'Each card shows who wrote it, the date, and a short bit. Who. When. Title. Read those three parts.',
        visual:
          'One Sample story card. Three pastel chips light in order over eight seconds: WHO, DATE, SHORT BIT. Hold all three chips lit.',
        beats: [
          'WHO chip lights.',
          'DATE chip lights.',
          'SHORT BIT chip lights.',
          'Hold. Super Who, when, title.',
        ],
      },
      {
        id: '08-open',
        title: 'Click a title',
        super: 'Their website',
        narration:
          'Click a title if you want the whole story on their website. Their website is a different place. You can come back.',
        visual:
          'Cursor clicks Sample story. A door labeled THEIR WEBSITE opens over eight seconds. Hold the open door. No fake headline text.',
        beats: [
          'Glove on Sample story.',
          'Click.',
          'Door opens slowly.',
          'Hold. Super Their website.',
        ],
      },
      {
        id: '09-poster',
        title: 'Like a poster',
        super: 'Information on a wall',
        narration:
          'Headlines are just information, like a poster on a school wall. You can look. You do not have to do what a poster says.',
        visual:
          'Headline cards pin onto a school wall as posters over eight seconds. Hold the wall. Sample story only.',
        beats: [
          'First poster pins.',
          'Second pins.',
          'Third pins.',
          'Hold the wall. Super Information on a wall.',
        ],
      },
      {
        id: '10-not-orders',
        title: 'Not orders',
        super: 'Not orders',
        narration:
          'They are not orders. They do not tell you what to buy. A poster is not a shopping list.',
        visual:
          'A poster versus a shopping list. The shopping list gets a gentle X. Eight-second hold. Blue wash.',
        beats: [
          'Poster card.',
          'Shopping list card.',
          'X on the list.',
          'Hold. Super Not orders.',
        ],
      },
      {
        id: '11-done',
        title: 'When you are done',
        super: 'Done reading',
        narration:
          'When you are done reading, you can leave. Done means you have looked enough. You do not have to finish every card.',
        visual:
          'A book closes slowly for eight seconds. Hold on the closed book. Soft lamp.',
        beats: [
          'Open book.',
          'Pages begin to close.',
          'Almost closed.',
          'Hold closed. Super Done reading.',
        ],
      },
      {
        id: '12-home',
        title: 'Purple HOME',
        super: 'Click HOME',
        narration:
          'When you are finished with news, click the purple HOME button. That is the front door. Take your time.',
        visual:
          'Cursor clicks purple HOME. Front door opens. Eight seconds. Hold the door.',
        beats: [
          'Glove goes up to HOME.',
          'Click.',
          'Door opens.',
          'Hold. Super Click HOME.',
        ],
      },
    ],
  }),

  memberships: script({
    id: 'memberships',
    navLabel: 'MEMBERSHIPS',
    title: 'Memberships',
    color: '#FFE600',
    logline: 'Twelve little 8s clips: the gold trophy page. Looking is free.',
    masterFlow: 'Twelve eight-second gold clips. No prices. No timer. Looking is free.',
    music: 'Soft gold air. No cash register.',
    captionsNote: 'No dollar signs.',
    clips: [
      {
        id: '01-find',
        title: 'Find gold',
        super: 'Gold like a trophy',
        narration:
          'Find the shiny gold button that says MEMBERSHIPS. Gold like a trophy. It is a long word. It lives in the colorful row.',
        visual:
          'Trophy-gold #FFD700 crown pill. Slow sparkle for eight seconds, not a strobe, not a slot machine. Camera push. Hold the crown close-up. No dollar signs. No click yet.',
        beats: [
          'Row. Gold pill singled out.',
          'Push-in. Slow sparkle.',
          'Crown icon readable.',
          'Hold. Super Gold like a trophy.',
        ],
      },
      {
        id: '02-not-race',
        title: 'Not a race',
        super: 'Trophy, not a race',
        narration:
          'Gold like a trophy, not like a race. A trophy can sit still. You do not have to hurry because the button is gold.',
        visual:
          'A trophy stands perfectly still. A race clock gets a gentle X. Eight-second hold. Warm gold air. Hold the still trophy.',
        beats: [
          'Trophy in frame.',
          'Race clock appears.',
          'X on the clock.',
          'Hold the still trophy. Super Trophy, not a race.',
        ],
      },
      {
        id: '03-click',
        title: 'Click gold',
        super: 'Click gold',
        narration:
          'Click it. Click means press the left mouse button one time. Looking at this page will not charge a card.',
        visual:
          'Glove clicks the gold pill. Squish. A warm gold ripple expands for eight seconds. Hold the ripple. No cash register sound-picture.',
        beats: [
          'Hover.',
          'Click. Squish.',
          'Gold ripple expands.',
          'Hold. Super Click gold.',
        ],
      },
      {
        id: '04-chart',
        title: 'A chart of plans',
        super: 'What each plan includes',
        narration:
          'This page is a big chart of what each plan includes. A plan is a bundle of tools. The chart is for reading, not for racing.',
        visual:
          'Color columns Basic, Silver, Gold, Platinum fill like crayons over eight seconds. No prices, no dollar signs. Hold the four columns.',
        beats: [
          'Basic fills.',
          'Silver fills.',
          'Gold then Platinum fill.',
          'Hold. Super What each plan includes.',
        ],
      },
      {
        id: '05-pictures-school',
        title: 'Pictures and school',
        super: 'Pictures, lessons, tools',
        narration:
          'The chart talks about pictures, school lessons, and tools. Those are the kinds of things a plan can include. No prices on screen.',
        visual:
          'Three kid icons walk in: a chart, a book, a crayon. Eight seconds. They stand in a row. Hold the three icons.',
        beats: [
          'Chart icon walks in.',
          'Book walks in.',
          'Crayon walks in.',
          'Hold. Super Pictures, lessons, tools.',
        ],
      },
      {
        id: '06-checkout-off',
        title: 'Checkout is off',
        super: 'Checkout is off',
        narration:
          'Public checkout is turned off. Checkout means the shop desk. Off means you cannot pay here right now.',
        visual:
          'A store OPEN sign flips slowly to OFF over eight seconds. Hold on OFF. No prices. No countdown.',
        beats: [
          'OPEN sign visible.',
          'It begins to flip.',
          'OFF lands.',
          'Hold OFF. Super Checkout is off.',
        ],
      },
      {
        id: '07-no-charge',
        title: 'No card charge',
        super: 'Looking is free',
        narration:
          'Clicking here will not charge a credit card. You can look. Looking is free. Your card stays in your pocket.',
        visual:
          'A credit card with a soft X. A pair of friendly eyes looking at the gold chart. Eight-second hold. No dollar amounts.',
        beats: [
          'Card appears.',
          'Soft X on the card.',
          'Eyes looking, calm.',
          'Hold. Super Looking is free.',
        ],
      },
      {
        id: '08-no-pick',
        title: 'You do not have to pick',
        super: 'No picking required',
        narration:
          'You do not have to pick anything. You can just read the columns and leave. Skipping a plan is allowed.',
        visual:
          'Four columns, none circled. A sticker YOU CAN JUST LOOK places itself over eight seconds. Hold the uncircled columns.',
        beats: [
          'Four columns, none circled.',
          'Sticker enters.',
          'Sticker sits.',
          'Hold. Super No picking required.',
        ],
      },
      {
        id: '09-dots',
        title: 'Little dots',
        super: 'Working vs paper',
        narration:
          'The little dots tell you what is really working versus only written on the paper. Working means you can use it today. Paper means it is a plan for later.',
        visual:
          'Two stickers: REALLY WORKS and ONLY ON PAPER. They place themselves over eight seconds. Hold both stickers.',
        beats: [
          'REALLY WORKS sticker.',
          'ONLY ON PAPER sticker.',
          'Both sit as a key.',
          'Hold. Super Working vs paper.',
        ],
      },
      {
        id: '10-not-timer',
        title: 'Not a prize timer',
        super: 'Gold is just a color',
        narration:
          'Gold is just a color. It is not a prize timer. Nothing will expire if you sit and read. Nobody is rushing you.',
        visual:
          'A stopwatch with a gentle X. Gold still glows quietly for eight seconds. Hold the quiet glow. No countdown numbers.',
        beats: [
          'Stopwatch appears.',
          'X on the watch.',
          'Gold glow stays quiet.',
          'Hold. Super Gold is just a color.',
        ],
      },
      {
        id: '11-back',
        title: 'Back to the desk',
        super: 'Back to the desk',
        narration:
          'When you are done looking, click Back to the desk. That button takes you to the work rooms without buying.',
        visual:
          'Back to the desk control glows. Giant glove approaches for eight seconds. Hover or a gentle click. Hold the control.',
        beats: [
          'Control glows.',
          'Glove approaches.',
          'Hover or click.',
          'Hold. Super Back to the desk.',
        ],
      },
      {
        id: '12-home',
        title: 'Or purple HOME',
        super: 'Or HOME',
        narration:
          'Or click the purple HOME button instead. That is the front door of the website. Take your time. You do not have to pick a plan.',
        visual:
          'Purple HOME click. Front door opens. Eight seconds. Hold the door.',
        beats: [
          'Glove to purple HOME.',
          'Click.',
          'Door opens.',
          'Hold. Super Or HOME.',
        ],
      },
    ],
  }),

  explain: script({
    id: 'explain',
    navLabel: 'Explain on',
    title: 'Need extra understanding',
    color: '#00E5FF',
    logline: 'Twelve little 8s clips: the cyan play square and tiny TVs.',
    masterFlow: 'Twelve eight-second cyan clips about Explain Mode. Tiny TVs. One idea each.',
    music: 'Cyan shimmer. Long pauses.',
    captionsNote: 'Need extra understanding / Explain on.',
    clips: [
      {
        id: '01-square',
        title: 'Tiny movie square',
        super: 'A little TV',
        narration:
          'See the bright cyan button that looks like a tiny movie play square? Cyan is bright blue-green. That square is a little TV.',
        visual:
          'Extreme close-up of the cyan play-rectangle, eight-second breathe. Caption LITTLE TV. Hold the breathing square. No other idea.',
        beats: [
          'Square already huge in frame.',
          'It breathes — scale up a little, down a little.',
          'Keep breathing. Super on.',
          'Hold. Super A little TV.',
        ],
      },
      {
        id: '02-words',
        title: 'Need extra understanding',
        super: 'Need extra understanding',
        narration:
          'It says Need extra understanding. Read all four words. They mean “I want a slower movie about this website.”',
        visual:
          'The four words appear one by one, about two seconds each, filling eight seconds. Huge rounded type. Cyan fill. Hold on the completed sentence.',
        beats: [
          'Need',
          'extra',
          'understanding — then the last beat holds all four',
          'Hold the full sentence.',
        ],
      },
      {
        id: '03-click-once',
        title: 'Click one time',
        super: 'Click once',
        narration:
          'Click it one time. One time means once. Do not double-click. Press the left mouse button and let go.',
        visual:
          'Glove clicks once. Squish. Hold the pressed-and-released state until 8.00. No second click. Cyan ripple is slow.',
        beats: [
          'Hover.',
          'Single click. Squish.',
          'Released. Slow ripple.',
          'Hold. Super Click once.',
        ],
      },
      {
        id: '04-explain-on',
        title: 'Now it says Explain on',
        super: 'Explain on',
        narration:
          'Now the same button says Explain on. On means the help is awake. The words changed because you clicked.',
        visual:
          'Letters morph from Need extra understanding to Explain on over eight seconds. Cyan fill. Hold Explain on.',
        beats: [
          'Old words visible.',
          'Morph begins.',
          'Explain on lands.',
          'Hold. Super Explain on.',
        ],
      },
      {
        id: '05-badges',
        title: 'Tiny TVs appear',
        super: 'Tiny TVs',
        narration:
          'Little play badges appear next to every colorful button — like tiny TVs. Each color gets its own tiny TV.',
        visual:
          'Badges pop in one every two-thirds of a second, matching each pill color, for eight seconds. Not a strobe. Hold on the full row of badges.',
        beats: [
          'First few badges appear.',
          'Middle badges appear.',
          'Last badges appear.',
          'Hold the full row. Super Tiny TVs.',
        ],
      },
      {
        id: '06-help-movies',
        title: 'Extra help movies',
        super: 'Help movies',
        narration:
          'Those badges are extra help movies. A help movie shows how a room works. It does not tell you what to buy.',
        visual:
          'One badge grows into a tiny cinema screen showing a silent colorful tour of candy pills. Eight seconds. Hold the mini cinema.',
        beats: [
          'One badge selected.',
          'It grows into a screen.',
          'Silent colorful tour plays inside.',
          'Hold. Super Help movies.',
        ],
      },
      {
        id: '07-tiny-not-big',
        title: 'Click the tiny play',
        super: 'Not the big word',
        narration:
          'Click a tiny play badge — not the big word. The big word opens the room. The little play picture opens the help movie.',
        visual:
          'Two targets: big CHARTS word with a gentle X, and the tiny play with a star. Cursor picks the tiny play over eight seconds. Hold the chosen badge.',
        beats: [
          'Both targets visible.',
          'X on the big word.',
          'Glove travels to tiny play.',
          'Hold the badge. Super Not the big word.',
        ],
      },
      {
        id: '08-card',
        title: 'A big card pops up',
        super: 'A big card',
        narration:
          'A big card pops up with a movie, easy words, and one quiz. That card is this extra-understanding room.',
        visual:
          'Cinema overlay grows from the badge to fill the frame in eight seconds: 16:9 stage, easy words, one quiz. Hold the full overlay.',
        beats: [
          'Badge in place.',
          'Overlay begins to grow.',
          'Stage, words, quiz land.',
          'Hold. Super A big card.',
        ],
      },
      {
        id: '09-practice',
        title: 'Quiz is practice',
        super: 'You cannot fail',
        narration:
          'A quiz here is just practice. You cannot fail your account. A wrong answer does not lock you out. Try again if you want.',
        visual:
          'Three giant answer buttons. A gold star for trying. Eight-second hold. No red F. No angry buzzer picture.',
        beats: [
          'Three answers appear.',
          'A try happens.',
          'Gold star for trying.',
          'Hold. Super You cannot fail.',
        ],
      },
      {
        id: '10-no-movie',
        title: 'If the movie is not ready',
        super: 'Words still work',
        narration:
          'If the movie is not ready yet, you still get the words. The words say the same thing the movie will say later.',
        visual:
          'Empty storyboard frame, then easy words appear underneath for eight seconds. Hold the words under the empty frame.',
        beats: [
          'Empty 16:9 frame.',
          'First line of words.',
          'Rest of the words.',
          'Hold. Super Words still work.',
        ],
      },
      {
        id: '11-off',
        title: 'Hide the badges',
        super: 'Click cyan again',
        narration:
          'Click the same cyan button again to hide the badges. Again means one more click. The tiny TVs go to sleep.',
        visual:
          'Cyan pill clicks. Badges fade like museum lights-out over eight seconds. Hold on the quiet row.',
        beats: [
          'Badges still visible.',
          'Click cyan.',
          'Badges fade slowly.',
          'Hold the quiet row. Super Click cyan again.',
        ],
      },
      {
        id: '12-stay',
        title: 'You can leave it on',
        super: 'On or off is okay',
        narration:
          'You can leave the help on as long as you want. On or off is okay. Take your time.',
        visual:
          'Cyan pill stays Explain on. Soft smile sticker. Eight-second hold. Hold the smile.',
        beats: [
          'Explain on visible.',
          'Smile sticker lands.',
          'Stillness.',
          'Hold. Super On or off is okay.',
        ],
      },
    ],
  }),

  profile: script({
    id: 'profile',
    navLabel: 'PROFILE',
    title: 'Profile',
    color: '#FF2E9A',
    logline: 'Twelve little 8s clips: the pink locker.',
    masterFlow: 'Twelve eight-second pink locker clips. Name, photo optional, save.',
    music: 'Pink night-light.',
    captionsNote: 'No real email. No filled password.',
    clips: [
      {
        id: '01-row-two',
        title: 'Second row',
        super: 'Look at the second row',
        narration:
          'Look at the second row of buttons, under the first row. Some buttons live on the second shelf. Tilt your eyes down a little.',
        visual:
          'Camera drops from row one to row two over eight seconds like an elevator. Hold on row two. Pink dust. No click yet.',
        beats: [
          'Start on row one.',
          'Begin the drop.',
          'Row two enters.',
          'Hold row two. Super Look at the second row.',
        ],
      },
      {
        id: '02-find',
        title: 'Pink PROFILE',
        super: 'Pink locker',
        narration:
          'Find the pink button that says PROFILE. Profile means your locker on this website. Pink like bubblegum. It lives on the second row.',
        visual:
          'Pink PROFILE pill, nametag icon, eight-second push-in. Hold the nametag. No real email on screen.',
        beats: [
          'Row two. Pink pill singled out.',
          'Push-in.',
          'Nametag icon readable.',
          'Hold. Super Pink locker.',
        ],
      },
      {
        id: '03-click',
        title: 'Click',
        super: 'Click PROFILE',
        narration:
          'Click it. Click means press the left mouse button one time. Wait for the locker room to open.',
        visual:
          'Glove clicks. Squish. Pink ripple for eight seconds. Hold the ripple.',
        beats: [
          'Hover.',
          'Click. Squish.',
          'Ripple expands.',
          'Hold. Super Click PROFILE.',
        ],
      },
      {
        id: '04-locker',
        title: 'Your locker',
        super: 'A locker',
        narration:
          'This room is your locker. A locker is a box with your things. Other people have their own lockers.',
        visual:
          'A colorful school locker opens for eight seconds. Empty nametag inside. Hold the open locker. No passwords.',
        beats: [
          'Closed locker.',
          'Door begins to open.',
          'Empty nametag visible.',
          'Hold. Super A locker.',
        ],
      },
      {
        id: '05-type',
        title: 'Type a name',
        super: 'Type a name',
        narration:
          'Type the name you want people to see. Type means press letter keys. The letters appear in the box.',
        visual:
          'Huge letters type themselves slowly: A N N A, across eight seconds. Hold on the finished name. Sample only — not a real member.',
        beats: [
          'A',
          'N',
          'N then A',
          'Hold ANNA. Super Type a name.',
        ],
      },
      {
        id: '06-photo',
        title: 'Photo is optional',
        super: 'Photo or skip',
        narration:
          'You can add a photo of your face, or skip the photo. Skip means you do not have to. Both choices are okay.',
        visual:
          'Photo circle and a SKIP stamp share the frame for eight seconds. Hold both options.',
        beats: [
          'Photo circle appears.',
          'SKIP stamp appears.',
          'Both sit together.',
          'Hold. Super Photo or skip.',
        ],
      },
      {
        id: '07-bio',
        title: 'A short bio',
        super: 'Two or three sentences',
        narration:
          'You can write a short bio — two or three sentences about you. Bio means a tiny story. You can leave it blank.',
        visual:
          'Three short lines appear in a notebook over eight seconds. Hold the three lines. No real personal data.',
        beats: [
          'First line.',
          'Second line.',
          'Third line.',
          'Hold. Super Two or three sentences.',
        ],
      },
      {
        id: '08-private',
        title: 'You can stay private',
        super: 'Private',
        narration:
          'You can keep the locker private so strangers do not see it. Private means the curtain is closed. That is allowed.',
        visual:
          'A curtain closes over the locker for eight seconds. Hold on the closed curtain.',
        beats: [
          'Open locker.',
          'Curtain begins to close.',
          'Almost closed.',
          'Hold closed. Super Private.',
        ],
      },
      {
        id: '09-save',
        title: 'Click Save',
        super: 'Click Save',
        narration:
          'When you are done, click the Save button. Save means keep these words. The computer remembers the name.',
        visual:
          'Huge Save button. Cursor clicks. Soft star. Eight seconds. Hold the star. No checkout.',
        beats: [
          'Save button huge.',
          'Glove approaches.',
          'Click. Soft star.',
          'Hold. Super Click Save.',
        ],
      },
      {
        id: '10-not-shop',
        title: 'Save is not shopping',
        super: 'Save ≠ shopping',
        narration:
          'Saving your name does not buy anything. It does not sell anything. Save is not a store. It only keeps the words.',
        visual:
          'Nametag versus shopping cart with a gentle X. Eight-second hold. Pink wash.',
        beats: [
          'Nametag card.',
          'Cart card.',
          'X on the cart.',
          'Hold. Super Save ≠ shopping.',
        ],
      },
      {
        id: '11-leave',
        title: 'Go to other rooms',
        super: 'HOME or CHARTS',
        narration:
          'Then click purple HOME or orange CHARTS if you want another room. You can stay in the locker if you are not done.',
        visual:
          'Both pills pulse. Cursor hovers eight seconds. Hold the two glowing pills.',
        beats: [
          'HOME pulses.',
          'CHARTS pulses.',
          'Glove hovers between.',
          'Hold. Super HOME or CHARTS.',
        ],
      },
      {
        id: '12-remember',
        title: 'Remember',
        super: 'Pink, name, Save',
        narration:
          'Remember the little steps: open the pink locker, type a name, then click Save. Take your time on each step.',
        visual:
          'Three recap stickers over eight seconds: PINK, NAME, SAVE. Hold all three.',
        beats: [
          'PINK sticker.',
          'NAME sticker.',
          'SAVE sticker.',
          'Hold all three.',
        ],
      },
    ],
  }),

  affiliate: script({
    id: 'affiliate',
    navLabel: 'AFFILIATE',
    title: 'Affiliate',
    color: '#FF2E9A',
    logline: 'Twelve little 8s clips: the pink share-a-link room.',
    masterFlow: 'Twelve eight-second share-link clips. Sleeping link. Copy means remember. Optional.',
    music: 'Low lava. No cash.',
    captionsNote: 'Show /r/CODE as a cartoon. No yachts.',
    clips: [
      {
        id: '01-find',
        title: 'Find AFFILIATE',
        super: 'Pink share room',
        narration:
          'Find the pink button that says AFFILIATE. Affiliate is a long word. It means a share-a-link room. Pink like bubblegum.',
        visual:
          'Pink AFFILIATE pill, share icon, eight-second push. No money piles, no yachts. Hold the close-up. No click yet.',
        beats: [
          'Row. Pink pill singled out.',
          'Push-in.',
          'Share icon readable.',
          'Hold. Super Pink share room.',
        ],
      },
      {
        id: '02-click',
        title: 'Click',
        super: 'Click AFFILIATE',
        narration:
          'Click it. Click means press the left mouse button one time. Wait for the share room to open.',
        visual:
          'Glove clicks. Squish. Eight-second pink ripple. Hold the ripple.',
        beats: [
          'Hover.',
          'Click. Squish.',
          'Ripple expands.',
          'Hold. Super Click AFFILIATE.',
        ],
      },
      {
        id: '03-what',
        title: 'A special link',
        super: 'If you want to',
        narration:
          'This room is for sharing a special link with friends if you want to. If you want to means it is optional. You can skip the whole room.',
        visual:
          'Two kid paper-cutouts pass a glowing /r/ paper. An OPTIONAL sticker sits in the corner. Eight seconds. Hold the paper. No cash.',
        beats: [
          'Two kids. Paper between them.',
          'Paper glows /r/.',
          'OPTIONAL sticker lands.',
          'Hold. Super If you want to.',
        ],
      },
      {
        id: '04-looks',
        title: 'It looks like /r/',
        super: '/r/ plus letters',
        narration:
          'The link looks like slash r slash and then some letters. Those letters are a code. You do not have to memorize them yet.',
        visual:
          '/ r / C O D E writes itself over eight seconds in huge type. Hold the finished cartoon link. Not a real live code.',
        beats: [
          '/ r /',
          'C O',
          'D E',
          'Hold. Super /r/ plus letters.',
        ],
      },
      {
        id: '05-asleep',
        title: 'The link is asleep',
        super: 'Zzz',
        narration:
          'The link stays asleep until you read the rules and click yes. Asleep means it does not work yet. That is on purpose.',
        visual:
          'The /r/ block sleeps with Zzz for eight seconds. Hold the sleeping block. Soft night-light.',
        beats: [
          '/r/ block sits.',
          'Zzz appears.',
          'Sleeping still.',
          'Hold. Super Zzz.',
        ],
      },
      {
        id: '06-yes',
        title: 'Rules, then yes',
        super: 'Yes wakes it',
        narration:
          'Read the rules. Click yes. The link wakes up. Yes means you understand the rules. Do not click yes if you did not read.',
        visual:
          'Rules card. Yes click. A lamp turns on over eight seconds. Hold on a LIVE sticker. No yacht.',
        beats: [
          'Rules card readable (kid short lines).',
          'Glove clicks yes.',
          'Lamp turns on.',
          'Hold LIVE. Super Yes wakes it.',
        ],
      },
      {
        id: '07-copy',
        title: 'Copy the link',
        super: 'Copy',
        narration:
          'Then you can copy the link. Copy is a button on this page. Click copy one time. Wait for the paper to duplicate.',
        visual:
          'Copy button. A paper duplicate peels off over eight seconds. Hold the two papers.',
        beats: [
          'Copy button huge.',
          'Click.',
          'Duplicate peels.',
          'Hold. Super Copy.',
        ],
      },
      {
        id: '08-remember',
        title: 'Copy means remember',
        super: 'Computer remembers',
        narration:
          'Copy means the computer remembers the words so you can paste them later. Paste means put the words somewhere else.',
        visual:
          'Words fly into a pocket labeled REMEMBER, then a paste onto a blank page. Eight seconds. Hold the pasted page.',
        beats: [
          'Words lift off the link.',
          'They enter REMEMBER pocket.',
          'Paste onto blank page.',
          'Hold. Super Computer remembers.',
        ],
      },
      {
        id: '09-tallies',
        title: 'Numbers are tallies',
        super: 'Not a game',
        narration:
          'The numbers are just counts, like tally marks on a chalkboard. They are not a video game. There is no high score prize.',
        visual:
          'Tally marks versus a game controller with a gentle X. Eight-second hold. Pink wash.',
        beats: [
          'Tally marks.',
          'Controller appears.',
          'X on the controller.',
          'Hold. Super Not a game.',
        ],
      },
      {
        id: '10-not-market',
        title: 'Not buying in the market',
        super: 'Not a market',
        narration:
          'This room does not buy or sell in the market. Sharing a link is not placing a trade. No shop.',
        visual:
          'Store and chart both get gentle X cards. Eight-second hold.',
        beats: [
          'Store card.',
          'X on store.',
          'Chart card with X.',
          'Hold. Super Not a market.',
        ],
      },
      {
        id: '11-skip',
        title: 'Skipping is fine',
        super: 'Optional',
        narration:
          'If you do not want to share, that is fine. You can leave this room unused. Optional means no one is mad.',
        visual:
          'A shrug sticker and a smile. Eight seconds. Hold the smile.',
        beats: [
          'Shrug sticker.',
          'Smile sticker.',
          'Both sit.',
          'Hold. Super Optional.',
        ],
      },
      {
        id: '12-home',
        title: 'Purple HOME',
        super: 'Click HOME',
        narration:
          'Click the purple HOME button and leave this share room. The front door is at the top. Take your time. Sharing is optional.',
        visual:
          'HOME click. Front door opens. Eight seconds. Hold the door.',
        beats: [
          'Glove to HOME.',
          'Click.',
          'Door opens.',
          'Hold. Super Click HOME.',
        ],
      },
    ],
  }),

  cinema: script({
    id: 'cinema',
    navLabel: 'CLEARPATH CINEMA',
    title: 'ClearPath cinema',
    color: '#00E5FF',
    logline: 'Twelve little 8s clips: the cyan movie theater.',
    masterFlow: 'Twelve eight-second theater clips. Shelves, player box, one movie.',
    music: 'Theatre hush.',
    captionsNote: 'No YouTube logo. No fake P&L.',
    clips: [
      {
        id: '01-find',
        title: 'Find CINEMA',
        super: 'Cyan theater',
        narration:
          'Find the cyan button that says CLEARPATH CINEMA. Cinema means movie theater. Cyan is bright blue-green. It is a long label.',
        visual:
          'Cyan CINEMA pill, amber italic glow, TV icon. Eight-second push. Hold the close-up. No YouTube logo. No click yet.',
        beats: [
          'Row. Cyan pill singled out.',
          'Push-in.',
          'TV icon readable.',
          'Hold. Super Cyan theater.',
        ],
      },
      {
        id: '02-click',
        title: 'Click',
        super: 'Click CINEMA',
        narration:
          'Click it. Click means press the left mouse button one time. The lights will get softer, like a theater.',
        visual:
          'Click. Theater lights dim over eight seconds. Hold the dimmed room. No slot chime.',
        beats: [
          'Hover. Click.',
          'Lights begin to dim.',
          'House lights low. Screen waits.',
          'Hold. Super Click CINEMA.',
        ],
      },
      {
        id: '03-theater',
        title: 'A theater inside',
        super: 'Movie theater',
        narration:
          'This room is a movie theater inside the website. Seats are a picture. The glowing wall is the screen.',
        visual:
          'Rows of seats appear, screen glows. Eight seconds. Hold the theater. Kid museum, not a nightclub.',
        beats: [
          'Empty dark.',
          'Seats fade in.',
          'Screen glows.',
          'Hold. Super Movie theater.',
        ],
      },
      {
        id: '04-shelves',
        title: 'Shelves of pictures',
        super: 'Rows of pictures',
        narration:
          'You will see rows of pictures, like shelves of movies. Each picture is one movie you can pick. You do not have to pick them all.',
        visual:
          'Poster shelves slide by for eight seconds. Hold a still shelf. No fake P&L posters.',
        beats: [
          'First shelf slides in.',
          'Continue the slide.',
          'Settle on a row.',
          'Hold. Super Rows of pictures.',
        ],
      },
      {
        id: '05-click-picture',
        title: 'Click one picture',
        super: 'Pick one',
        narration:
          'Click one picture on the shelf. One means only one movie for now. Rest your little arrow on it, then press.',
        visual:
          'Cursor chooses one poster over eight seconds. Other posters dim. Hold on the chosen poster.',
        beats: [
          'Many posters.',
          'Glove travels.',
          'Click one. Others dim.',
          'Hold. Super Pick one.',
        ],
      },
      {
        id: '06-player',
        title: 'A player opens',
        super: 'Player = movie box',
        narration:
          'A player opens. Player means a box that shows the movie. The box has a play triangle and a bottom bar.',
        visual:
          'A movie box grows for eight seconds. Caption PLAYER = BOX. Hold the grown box.',
        beats: [
          'Tiny box.',
          'It grows.',
          'Play triangle visible.',
          'Hold. Super Player = movie box.',
        ],
      },
      {
        id: '07-bar',
        title: 'The little bar',
        super: 'Drag to skip',
        narration:
          'You can drag the little bar at the bottom to skip ahead. Drag means press, slide, let go. Skipping is allowed.',
        visual:
          'A crayon seek bar moves slowly for eight seconds. Hold the bar near the end. No scary jump-scare.',
        beats: [
          'Bar at the start.',
          'Glove presses the crayon handle.',
          'Slides slowly.',
          'Hold. Super Drag to skip.',
        ],
      },
      {
        id: '08-full',
        title: 'Full screen',
        super: 'Make it big',
        narration:
          'You can make it full screen so the movie is big. Full screen means the movie fills the whole window.',
        visual:
          'Corners stretch to full frame over eight seconds. Hold the big picture.',
        beats: [
          'Small player.',
          'Corners begin to stretch.',
          'Almost full.',
          'Hold full. Super Make it big.',
        ],
      },
      {
        id: '09-teach',
        title: 'Movies that teach',
        super: 'They teach',
        narration:
          'These movies teach. They do not tell you what to buy. Teaching is school. Buying is a store. This is school.',
        visual:
          'A lesson still. Cart with a gentle X. Eight-second hold. Cyan wash.',
        beats: [
          'Lesson still.',
          'Cart appears.',
          'X on cart.',
          'Hold. Super They teach.',
        ],
      },
      {
        id: '10-broken',
        title: 'If it is broken',
        super: 'It will say so',
        narration:
          'If a live show is broken, the page will say so in plain words. Broken means it is not playing. We do not hide that.',
        visual:
          'Honest sign: this show is not working. Eight-second hold. No siren. No fake “live now” badge.',
        beats: [
          'Empty stage.',
          'Honest sign unrolls.',
          'Words readable.',
          'Hold. Super It will say so.',
        ],
      },
      {
        id: '11-one',
        title: 'Watch one',
        super: 'One movie',
        narration:
          'Watch one movie. One is enough for this visit. You can come back for another later. Pausing is allowed.',
        visual:
          'One poster stays. Others dim. Eight seconds. Hold the one poster.',
        beats: [
          'Many posters.',
          'Others dim.',
          'One stays bright.',
          'Hold. Super One movie.',
        ],
      },
      {
        id: '12-next',
        title: 'Then school or pictures',
        super: 'EDUCATION or CHARTS',
        narration:
          'Then click cyan EDUCATION or orange CHARTS if you want another room. School or pictures. Take your time choosing.',
        visual:
          'Both pills pulse. Eight seconds. Hold the two glowing pills.',
        beats: [
          'EDUCATION pulses.',
          'CHARTS pulses.',
          'Glove hovers.',
          'Hold. Super EDUCATION or CHARTS.',
        ],
      },
    ],
  }),

  education: script({
    id: 'education',
    navLabel: 'CLEARPATH EDUCATION',
    title: 'ClearPath education',
    color: '#00E5FF',
    logline: 'Twelve little 8s clips: the cyan school.',
    masterFlow: 'Twelve eight-second school clips. Classroom doors. One lesson. Rest.',
    music: 'Classroom piano, very low.',
    captionsNote: 'No “you are a trader now.”',
    clips: [
      {
        id: '01-find',
        title: 'Find EDUCATION',
        super: 'Cyan school',
        narration:
          'Find the cyan button that says CLEARPATH EDUCATION. Education means school. Cyan is bright blue-green. It is a long label at the top.',
        visual:
          'Cyan book-pill. Eight-second push. Hold the book icon. No “you are a trader now” text. No click yet.',
        beats: [
          'Row. Cyan pill singled out.',
          'Push-in.',
          'Book icon readable.',
          'Hold. Super Cyan school.',
        ],
      },
      {
        id: '02-click',
        title: 'Click',
        super: 'Click EDUCATION',
        narration:
          'Click it. Click means press the left mouse button one time. Wait for the school hallway to open.',
        visual:
          'Click. School-bell light, not a slot chime. Eight seconds. Hold the soft bell glow.',
        beats: [
          'Hover. Click.',
          'Soft bell light.',
          'Hallway hint.',
          'Hold. Super Click EDUCATION.',
        ],
      },
      {
        id: '03-school',
        title: 'This is school',
        super: 'School inside the website',
        narration:
          'This is school inside the website. School means lessons and reading. It is not a store. It is not a broker.',
        visual:
          'A hallway of lockers in cyan. Eight seconds. Hold the hallway.',
        beats: [
          'Hallway empty.',
          'Lockers fade in.',
          'Cyan light.',
          'Hold. Super School inside the website.',
        ],
      },
      {
        id: '04-doors',
        title: 'Subject cards',
        super: 'Classroom doors',
        narration:
          'You will see subject cards — Crypto, Stocks, Forex — like classroom doors. Each door is one subject. You pick one.',
        visual:
          'Doors light one by one over eight seconds. Hold on the hallway of doors.',
        beats: [
          'First door lights.',
          'Second door lights.',
          'Third door lights.',
          'Hold. Super Classroom doors.',
        ],
      },
      {
        id: '05-one-subject',
        title: 'Click one subject',
        super: 'One door',
        narration:
          'Click one subject card. One classroom door is enough for now. The other doors can wait until another day.',
        visual:
          'Cursor picks Stocks. Other doors dim. Eight seconds. Hold the chosen door.',
        beats: [
          'Many doors.',
          'Glove to Stocks.',
          'Click. Others dim.',
          'Hold. Super One door.',
        ],
      },
      {
        id: '06-unlocked',
        title: 'Unlocked means open',
        super: 'Unlocked = open',
        narration:
          'Then click a lesson that is unlocked. Unlocked means the door is open. Locked means wait — try a different lesson.',
        visual:
          'A padlock turns teal and opens over eight seconds. Hold the open lock.',
        beats: [
          'Closed padlock.',
          'It turns teal.',
          'It opens.',
          'Hold. Super Unlocked = open.',
        ],
      },
      {
        id: '07-book',
        title: 'Read like a short book',
        super: 'A short book',
        narration:
          'Read it like a short book. Turn the page when you finish a screen. You can stop in the middle.',
        visual:
          'Huge-type pages turn slowly for eight seconds. Hold an open page.',
        beats: [
          'Closed short book.',
          'First page turns.',
          'Second page.',
          'Hold. Super A short book.',
        ],
      },
      {
        id: '08-quiz',
        title: 'A tiny quiz',
        super: 'Did the words click?',
        narration:
          'At the end there is a tiny quiz — just to see if the words made sense. A quiz here is practice. You cannot fail your account.',
        visual:
          'Three giant answers. Eight seconds. Hold the three buttons. No red F.',
        beats: [
          'Question appears.',
          'Three answers.',
          'Still, friendly.',
          'Hold. Super Did the words click?',
        ],
      },
      {
        id: '09-not-money',
        title: 'Passing is not spending',
        super: 'Not a license to spend',
        narration:
          'Passing does not mean you should spend money. It only means you understood that page. Understanding is not a shopping license.',
        visual:
          'A sticker I UNDERSTOOD THIS PAGE. Cart with a gentle X. Eight-second hold.',
        beats: [
          'Sticker lands.',
          'Cart appears.',
          'X on cart.',
          'Hold. Super Not a license to spend.',
        ],
      },
      {
        id: '10-libraries',
        title: 'Three libraries',
        super: 'Extra reading',
        narration:
          'There are also three libraries for extra reading. A library is a room of books. You can visit later.',
        visual:
          'Three library doors glow in order over eight seconds. Hold all three glowing.',
        beats: [
          'First library door.',
          'Second.',
          'Third.',
          'Hold. Super Extra reading.',
        ],
      },
      {
        id: '11-one-lesson',
        title: 'One lesson',
        super: 'Then rest',
        narration:
          'Do one lesson. Then rest. Rest means stop for a while. Your brain can take a break. That is part of school.',
        visual:
          'A pillow icon after one book. Eight seconds. Hold the pillow.',
        beats: [
          'One book.',
          'Book closes.',
          'Pillow appears.',
          'Hold. Super Then rest.',
        ],
      },
      {
        id: '12-tired',
        title: 'If your brain is tired',
        super: 'Click HOME',
        narration:
          'If your brain is tired, click the purple HOME button. The front door is at the top. Take your time.',
        visual:
          'HOME click. Front door opens. Eight seconds. Hold the door.',
        beats: [
          'Glove to HOME.',
          'Click.',
          'Door opens.',
          'Hold. Super Click HOME.',
        ],
      },
    ],
  }),

  exit: script({
    id: 'exit',
    navLabel: 'EXIT',
    title: 'Exit',
    color: '#FF4D4D',
    logline: 'Twelve little 8s clips: the red stop sign.',
    masterFlow: 'Twelve eight-second red stop-sign clips. Hang up, do not delete.',
    music: 'None. Soft door-close on the last clip only.',
    captionsNote: 'Red is a stop sign, not a siren.',
    clips: [
      {
        id: '01-second-row',
        title: 'Second row',
        super: 'Under the first row',
        narration:
          'Look at the second row of buttons, under the first row. EXIT lives on that second shelf. Tilt your eyes down.',
        visual:
          'Tilt from row one to row two over eight seconds. Hold on row two. Soft light. No click yet.',
        beats: [
          'Start on row one.',
          'Begin tilt down.',
          'Row two enters.',
          'Hold. Super Under the first row.',
        ],
      },
      {
        id: '02-last',
        title: 'The last button is red',
        super: 'Last button',
        narration:
          'The last button is red. It says EXIT. Exit means leave. Red is easy to see on purpose.',
        visual:
          'Pan along row two, land on red #FF4D4D EXIT, eight seconds. Hold the red pill. Not a siren. A stop-sign red.',
        beats: [
          'Start of row two.',
          'Pan continues.',
          'Land on EXIT.',
          'Hold. Super Last button.',
        ],
      },
      {
        id: '03-stop',
        title: 'Red means stop',
        super: 'Like a stop sign',
        narration:
          'Red means stop, like a stop sign on the street. You look at a stop sign before you move. Look at EXIT before you click it.',
        visual:
          'Pill morphs into a kid street stop sign and back over eight seconds. Hold the stop-sign hybrid.',
        beats: [
          'Red pill.',
          'Morphs toward stop sign.',
          'Fully a kid stop sign, then eases back.',
          'Hold. Super Like a stop sign.',
        ],
      },
      {
        id: '04-only-when',
        title: 'Only when you want to leave',
        super: 'Only when done',
        narration:
          'Click EXIT only when you want to leave this website for now. For now means today. You can come back later.',
        visual:
          'A leave-for-now suitcase versus a stay chair. Eight seconds. Hold both objects as a choice poster.',
        beats: [
          'Suitcase appears.',
          'Chair appears.',
          'They sit as a choice.',
          'Hold. Super Only when done.',
        ],
      },
      {
        id: '05-hang-up',
        title: 'Like hanging up a phone',
        super: 'Hang up',
        narration:
          'EXIT logs you out. That means the website forgets you are signed in, like hanging up a phone. The call ends. The phone still exists.',
        visual:
          'A colorful toy phone hangs up over eight seconds. Hold on the hung-up phone.',
        beats: [
          'Phone at the ear.',
          'It lowers.',
          'It hangs up.',
          'Hold. Super Hang up.',
        ],
      },
      {
        id: '06-not-delete',
        title: 'Does not delete your name',
        super: 'Your name stays',
        narration:
          'It does not delete your name. Delete would mean throw away. EXIT does not throw your locker away.',
        visual:
          'A nametag stays on a locker. Eight-second hold. The locker does not vanish.',
        beats: [
          'Locker and nametag.',
          'A trash can appears and gets a gentle X.',
          'Nametag still there.',
          'Hold. Super Your name stays.',
        ],
      },
      {
        id: '07-not-bank',
        title: 'Does not close a bank',
        super: 'Bank stays',
        narration:
          'It does not close a bank. If you have a bank somewhere else, that bank stays open. EXIT is only this website’s hang-up.',
        visual:
          'A toy bank building stays open. Eight-second hold. Doors remain open.',
        beats: [
          'Toy bank.',
          'Doors stay open.',
          'OPEN sign stays.',
          'Hold. Super Bank stays.',
        ],
      },
      {
        id: '08-not-shop',
        title: 'Does not buy or sell',
        super: 'No last purchase',
        narration:
          'It does not buy or sell anything. There is no last purchase hiding under the red button. Red is not a shop.',
        visual:
          'Cart and sell sign both get gentle X. Eight-second hold. Red wash, not a siren.',
        beats: [
          'Cart.',
          'X on cart.',
          'Sell sign with X.',
          'Hold. Super No last purchase.',
        ],
      },
      {
        id: '09-wrong-pictures',
        title: 'If you wanted pictures',
        super: 'Do not click EXIT',
        narration:
          'If you meant to look at pictures, do not click EXIT. Pictures live under orange CHARTS. Red is the wrong button for pictures.',
        visual:
          'EXIT gets a gentle X. Eight seconds. Hold the X on EXIT. Friendly, not scary.',
        beats: [
          'EXIT visible.',
          'Gentle X begins.',
          'X sits.',
          'Hold. Super Do not click EXIT.',
        ],
      },
      {
        id: '10-charts',
        title: 'Click orange CHARTS',
        super: 'CHARTS instead',
        narration:
          'Click the orange CHARTS button instead if you wanted pictures. Orange is the picture room. Red EXIT is the wrong button for pictures.',
        visual:
          'Orange CHARTS pulse. Cursor moves eight seconds. Hold after a hover or click on orange.',
        beats: [
          'Orange pulses.',
          'Glove travels.',
          'Arrives. Hover or click.',
          'Hold. Super CHARTS instead.',
        ],
      },
      {
        id: '11-home',
        title: 'Or purple HOME',
        super: 'Front door',
        narration:
          'If you meant the front door, click purple HOME. HOME is not EXIT. Purple means stay in the house. Red means hang up.',
        visual:
          'Purple HOME pulse. Eight seconds. Hold the purple pill.',
        beats: [
          'HOME pulses.',
          'Glove approaches.',
          'Hover.',
          'Hold. Super Front door.',
        ],
      },
      {
        id: '12-remember',
        title: 'Red is stop',
        super: 'Only when done',
        narration:
          'Remember: red is stop. Only click it when you are done for now. Take your time. You can sit and think first.',
        visual:
          'Stop sign plus a clock that says FOR NOW. Eight-second hold. Hold the poster.',
        beats: [
          'Stop sign.',
          'Clock FOR NOW.',
          'Both sit.',
          'Hold. Super Only when done.',
        ],
      },
    ],
  }),

  literacy: script({
    id: 'literacy',
    navLabel: 'Literacy OS',
    title: 'Literacy OS',
    color: '#00E5FF',
    logline: 'Twelve little 8s clips: the cyan notebook desk.',
    masterFlow: 'Twelve eight-second notebook-desk clips. One room, one idea.',
    music: 'Dawn-cyan.',
    captionsNote: 'Room chips are the lesson.',
    clips: [
      {
        id: '01-from-school',
        title: 'Open from school',
        super: 'From school',
        narration:
          'Literacy OS is a notebook desk you open from school. Literacy means reading and writing. OS here just means the desk tools.',
        visual:
          'Education grid. Literacy door glows for eight seconds. Hold the glowing door. Cyan wash.',
        beats: [
          'Education grid.',
          'Literacy door begins to glow.',
          'Glow holds.',
          'Hold. Super From school.',
        ],
      },
      {
        id: '02-click',
        title: 'Click the card',
        super: 'Click Literacy OS',
        narration:
          'Click the cyan Literacy OS card. Click means press the left mouse button one time. Wait for the notebook to open.',
        visual:
          'Click. Notebook opens for eight seconds. Hold the open notebook.',
        beats: [
          'Card. Glove approaches.',
          'Click.',
          'Notebook opens.',
          'Hold. Super Click Literacy OS.',
        ],
      },
      {
        id: '03-brief',
        title: 'Morning Brief',
        super: 'First page',
        narration:
          'Morning Brief is the first page. It shows what you already saved. Brief means a short look, not a yelling list.',
        visual:
          'A sunrise notebook page. Stickers of saved notes. Eight seconds. Hold the sunrise page.',
        beats: [
          'Sunrise page.',
          'First sticker.',
          'More saved-note stickers.',
          'Hold. Super First page.',
        ],
      },
      {
        id: '04-not-yell',
        title: 'Not a yelling list',
        super: 'It does not yell',
        narration:
          'It is not a to-do list that yells at you. No red badges counting down. You can read it quietly.',
        visual:
          'A megaphone list fades to a quiet page. Eight seconds. Hold the quiet page.',
        beats: [
          'Megaphone list.',
          'It fades.',
          'Quiet page remains.',
          'Hold. Super It does not yell.',
        ],
      },
      {
        id: '05-chips',
        title: 'Colorful room chips',
        super: 'Rooms',
        narration:
          'The colorful chips are rooms. Each chip is a door on this desk. You click one chip to enter one room.',
        visual:
          'Chips light one by one for eight seconds. Hold the lit row.',
        beats: [
          'First chips light.',
          'Middle chips light.',
          'Last chips light.',
          'Hold. Super Rooms.',
        ],
      },
      {
        id: '06-vault',
        title: 'Thesis Vault',
        super: 'Big ideas',
        narration:
          'Click Thesis Vault to keep your big ideas. A vault is a safe box. A thesis here means a big idea you want to remember.',
        visual:
          'A vault-shaped notebook. One idea card slides in. Eight seconds. Hold the card in the vault.',
        beats: [
          'Vault notebook.',
          'Door opens a little.',
          'Idea card slides in.',
          'Hold. Super Big ideas.',
        ],
      },
      {
        id: '07-wiki',
        title: 'Concept Wiki',
        super: 'Easy words',
        narration:
          'Click Concept Wiki for words explained in easy language. Wiki means a pile of explain-pages. Hard words become pictures.',
        visual:
          'A hard word becomes a simple picture over eight seconds. Hold the picture.',
        beats: [
          'Foggy hard word.',
          'Fog lifts.',
          'Simple picture appears.',
          'Hold. Super Easy words.',
        ],
      },
      {
        id: '08-sentinel',
        title: 'Source Sentinel',
        super: 'Page changes',
        narration:
          'Click Source Sentinel to notice when a page on the internet changes. Sentinel means a watcher. It watches for differences, not prices to buy.',
        visual:
          'Two pages; a gentle highlight of a changed line over eight seconds. Hold the highlight.',
        beats: [
          'Two pages side by side.',
          'A line highlights.',
          'The change is the only motion.',
          'Hold. Super Page changes.',
        ],
      },
      {
        id: '09-wait',
        title: 'Other rooms can wait',
        super: 'They can wait',
        narration:
          'Other rooms on this desk can wait. You do not have to visit every chip today. Waiting is allowed. One room is enough.',
        visual:
          'Dim chips stay dim on purpose. Eight seconds. Hold the dim row with one chip bright.',
        beats: [
          'Many chips.',
          'Most stay dim.',
          'One stays bright.',
          'Hold. Super They can wait.',
        ],
      },
      {
        id: '10-school',
        title: 'School, not a store',
        super: 'Not a store',
        narration:
          'This notebook desk is school. It is not a store. Saving a note does not buy or sell anything.',
        visual:
          'Book versus cart with a gentle X. Eight-second hold. Cyan wash.',
        beats: [
          'Book.',
          'Cart.',
          'X on cart.',
          'Hold. Super Not a store.',
        ],
      },
      {
        id: '11-one-idea',
        title: 'Save one idea',
        super: 'One idea',
        narration:
          'Save one idea on this desk. Then rest. One idea is enough. Rest means stop for now and come back later.',
        visual:
          'One sticky note, then a rest moon. Eight seconds. Hold the moon.',
        beats: [
          'Sticky note.',
          'It is saved.',
          'Moon appears.',
          'Hold. Super One idea.',
        ],
      },
      {
        id: '12-home',
        title: 'HOME if you want out',
        super: 'Click HOME',
        narration:
          'Purple HOME is always at the top if you want out. The front door waits. Take your time.',
        visual:
          'HOME pulse. Eight seconds. Hold the purple pill.',
        beats: [
          'HOME visible.',
          'It pulses.',
          'Glove may hover.',
          'Hold. Super Click HOME.',
        ],
      },
    ],
  }),

  encyclopedia: script({
    id: 'encyclopedia',
    navLabel: 'Encyclopedia of Finance',
    title: 'Encyclopedia of finance',
    color: '#00E5FF',
    logline: 'Twelve little 8s clips: the cyan money-words library.',
    masterFlow: 'Twelve eight-second library clips. Contents page. Beginner first.',
    music: 'Library hush.',
    captionsNote: 'Not a shopping list of companies.',
    clips: [
      {
        id: '01-library',
        title: 'A library',
        super: 'Money words',
        narration:
          'The Encyclopedia of Finance is a library of money words. Encyclopedia means a big book of explanations. Finance means money words.',
        visual:
          'Cyan glass shelves. Eight-second dolly past friendly book spines. Hold a still shelf. No ticker tape.',
        beats: [
          'Start of shelves.',
          'Dolly continues.',
          'Settle on a bay.',
          'Hold. Super Money words.',
        ],
      },
      {
        id: '02-school',
        title: 'Open from school',
        super: 'From school',
        narration:
          'Open it from school. School is the cyan EDUCATION room. The library is one of the extra doors.',
        visual:
          'Education door to library. Eight seconds. Hold the open door.',
        beats: [
          'School hallway.',
          'Library door glows.',
          'Door opens.',
          'Hold. Super From school.',
        ],
      },
      {
        id: '03-left',
        title: 'The left list',
        super: 'Contents page',
        narration:
          'The list on the left is the index — like the contents page in a book. Index means the list of topics. You pick from the list.',
        visual:
          'A book contents page lines up with the sidebar over eight seconds. Hold the lined-up pages.',
        beats: [
          'Paper contents page.',
          'Sidebar appears beside it.',
          'Lines match up.',
          'Hold. Super Contents page.',
        ],
      },
      {
        id: '04-one-topic',
        title: 'Click one topic',
        super: 'One topic',
        narration:
          'Click one topic on the left list. One topic is enough. The other topics can wait on the left until later.',
        visual:
          'Cursor picks Stocks. Others dim. Eight seconds. Hold the chosen topic.',
        beats: [
          'Many topics.',
          'Glove to Stocks.',
          'Click. Others dim.',
          'Hold. Super One topic.',
        ],
      },
      {
        id: '05-level',
        title: 'Reading level',
        super: 'Beginner first',
        narration:
          'Then pick a reading level. Beginner is the easy words. Start there even if you feel grown-up. Easy is allowed.',
        visual:
          'Beginner sticker glows first. Eight seconds. Hold the Beginner sticker.',
        beats: [
          'Level chips.',
          'Beginner glows.',
          'Others stay quieter.',
          'Hold. Super Beginner first.',
        ],
      },
      {
        id: '06-climb',
        title: 'You can climb later',
        super: 'Later',
        narration:
          'You can climb to a harder reading level later. Later means another day. You do not have to climb today.',
        visual:
          'A small ladder of levels. Kid on the first rung. Eight seconds. Hold the first rung.',
        beats: [
          'Ladder appears.',
          'Kid on first rung.',
          'Upper rungs wait.',
          'Hold. Super Later.',
        ],
      },
      {
        id: '07-chapter',
        title: 'The middle is a chapter',
        super: 'A chapter',
        narration:
          'The middle of the screen is the article, like a chapter. A chapter is one piece of the book. Read it slowly.',
        visual:
          'Huge-type chapter. Eight-second hold. Hold the readable type.',
        beats: [
          'Chapter title.',
          'First paragraph huge.',
          'Stillness for reading.',
          'Hold. Super A chapter.',
        ],
      },
      {
        id: '08-tutor',
        title: 'Ask the tutor',
        super: 'Foggy word?',
        narration:
          'If a word still feels foggy, open the Scholar Tutor and ask in regular English. Regular English means the words you already know.',
        visual:
          'A fog word clears in a speech bubble over eight seconds. Hold the clear bubble.',
        beats: [
          'Foggy word.',
          'Tutor bubble opens.',
          'Fog clears.',
          'Hold. Super Foggy word?',
        ],
      },
      {
        id: '09-learn',
        title: 'For learning',
        super: 'Teaching pages',
        narration:
          'These cards are for learning. Learning means understanding the money word. It is not a shopping list of companies.',
        visual:
          'A school apple on a card. Eight seconds. Hold the apple card.',
        beats: [
          'Card.',
          'Apple lands.',
          'Still teaching card.',
          'Hold. Super Teaching pages.',
        ],
      },
      {
        id: '10-not-buy-list',
        title: 'Not a buy list',
        super: 'Not companies you must buy',
        narration:
          'They are not a list of companies you must buy. Must buy is an order. This library does not give orders.',
        visual:
          'A shopping list with a gentle X. Eight-second hold. Cyan wash.',
        beats: [
          'Shopping list.',
          'X appears.',
          'Still poster.',
          'Hold. Super Not companies you must buy.',
        ],
      },
      {
        id: '11-one',
        title: 'Read one topic',
        super: 'One',
        narration:
          'Read one topic. Then click back. Back means return to the list. You can pick a new topic later.',
        visual:
          'Back arrow glows. Eight seconds. Hold the arrow.',
        beats: [
          'Chapter still.',
          'Back arrow glows.',
          'Glove may hover.',
          'Hold. Super One.',
        ],
      },
      {
        id: '12-home',
        title: 'Or HOME',
        super: 'Click HOME',
        narration:
          'Or click purple HOME if you want the front door. The front door is at the top. Take your time leaving the library.',
        visual:
          'HOME click. Eight seconds. Hold the open door.',
        beats: [
          'Glove to HOME.',
          'Click.',
          'Door opens.',
          'Hold. Super Click HOME.',
        ],
      },
    ],
  }),

  indicators: script({
    id: 'indicators',
    navLabel: 'Encyclopedia of Indicators',
    title: 'Encyclopedia of indicators',
    color: '#00E5FF',
    logline: 'Twelve little 8s clips: the teal picture-book of helpers.',
    masterFlow: 'Twelve eight-second helper-book clips. Yesterday, not tomorrow.',
    music: 'Quiet teal.',
    captionsNote: 'SVG pictures only.',
    clips: [
      {
        id: '01-book',
        title: 'A picture book',
        super: 'Chart helpers',
        narration:
          'The Encyclopedia of Indicators is a picture book of chart helpers. An indicator is a helper drawing. The book shows pictures of those helpers.',
        visual:
          'Teal SVG cards as a picture book opening over eight seconds. Hold the open book. No live prices as advice.',
        beats: [
          'Closed picture book.',
          'Cover opens.',
          'SVG cards visible.',
          'Hold. Super Chart helpers.',
        ],
      },
      {
        id: '02-names',
        title: 'Names like RSI',
        super: 'Helper names',
        narration:
          'Helpers have names like R S I or moving average. The names sound fancy. You can still look at the picture first.',
        visual:
          'Name stickers place themselves over eight seconds. Hold the sticker row.',
        beats: [
          'First name sticker.',
          'Second.',
          'Third.',
          'Hold. Super Helper names.',
        ],
      },
      {
        id: '03-school',
        title: 'Open from school',
        super: 'From school',
        narration:
          'Open this picture book from school. School is the cyan EDUCATION room. This book is one library door.',
        visual:
          'School door. Eight seconds. Hold the open door.',
        beats: [
          'Hallway.',
          'Door glows.',
          'Opens.',
          'Hold. Super From school.',
        ],
      },
      {
        id: '04-flavor',
        title: 'Filters like flavors',
        super: 'Pick a flavor',
        narration:
          'Use the filters on the left to search, like picking a flavor. A filter hides some cards and shows others. Click one flavor.',
        visual:
          'Ice-cream flavor chips. Eight seconds. Hold the chosen flavor chip.',
        beats: [
          'Flavor chips appear.',
          'They light in a row.',
          'One is chosen.',
          'Hold. Super Pick a flavor.',
        ],
      },
      {
        id: '05-card',
        title: 'Click a card',
        super: 'Click a card',
        narration:
          'Click a card. Click means press the left mouse button one time. The card will get bigger so you can read it.',
        visual:
          'One card zooms for eight seconds. Hold the zoomed card.',
        beats: [
          'Grid of cards.',
          'Glove picks one.',
          'Zoom.',
          'Hold. Super Click a card.',
        ],
      },
      {
        id: '06-parts',
        title: 'Picture, recipe, cannot do',
        super: 'Four parts',
        narration:
          'You will see a picture, a recipe, how to read it, and what it cannot do. Four parts. Read them in that order if you want.',
        visual:
          'Four quadrants light in order over eight seconds. Hold all four lit.',
        beats: [
          'Picture quadrant.',
          'Recipe quadrant.',
          'How-to-read, then cannot-do.',
          'Hold. Super Four parts.',
        ],
      },
      {
        id: '07-sticker',
        title: 'A sticker for Charts',
        super: 'Live overlay',
        narration:
          'A live-overlay badge means you can stick that helper on CHARTS. Stick means the drawing sits on the picture. It is still not a purchase.',
        visual:
          'A sticker flies toward orange CHARTS over eight seconds. Hold the sticker on the orange pill.',
        beats: [
          'Badge on the card.',
          'Sticker lifts off.',
          'Flies to orange CHARTS.',
          'Hold. Super Live overlay.',
        ],
      },
      {
        id: '08-yesterday',
        title: 'Already happened',
        super: 'Yesterday',
        narration:
          'A helper only talks about prices that already happened. Already happened means yesterday, or a minute ago — not a promise.',
        visual:
          'A calendar circles yesterday over eight seconds. Hold the circled day.',
        beats: [
          'Calendar.',
          'Hand moves to yesterday.',
          'Circle draws.',
          'Hold. Super Yesterday.',
        ],
      },
      {
        id: '09-tomorrow',
        title: 'Cannot promise tomorrow',
        super: 'No crystal ball',
        narration:
          'A helper cannot promise tomorrow. Tomorrow is not drawn yet. There is no crystal ball on this website.',
        visual:
          'Crystal ball with a gentle X. Eight-second hold. Teal wash.',
        beats: [
          'Crystal ball.',
          'X appears.',
          'Still poster.',
          'Hold. Super No crystal ball.',
        ],
      },
      {
        id: '10-no-buy',
        title: 'Still not buying',
        super: 'Sticker ≠ purchase',
        narration:
          'Sticking a helper on a picture still does not buy or sell. The sticker is a crayon. The shop stays closed.',
        visual:
          'Sticker on chart, cart with a gentle X. Eight seconds. Hold the pair.',
        beats: [
          'Sticker on chart.',
          'Cart appears.',
          'X on cart.',
          'Hold. Super Sticker ≠ purchase.',
        ],
      },
      {
        id: '11-cannot',
        title: 'Read what it cannot do',
        super: 'Read this part',
        narration:
          'Read the “what it cannot do” part. That box is the honest part. Do not skip it even if it feels boring.',
        visual:
          'Yellow CANNOT DO box. Eight-second hold. Hold the box.',
        beats: [
          'Card with four parts.',
          'Cannot-do box highlights.',
          'Type readable.',
          'Hold. Super Read this part.',
        ],
      },
      {
        id: '12-back',
        title: 'Back or CHARTS',
        super: 'Then leave',
        narration:
          'Then go back to the picture book, or click orange CHARTS. Both are allowed. Take your time choosing.',
        visual:
          'Back and CHARTS pulse. Eight seconds. Hold both glowing.',
        beats: [
          'Back pulses.',
          'CHARTS pulses.',
          'Glove hovers.',
          'Hold. Super Then leave.',
        ],
      },
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
