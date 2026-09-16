/**
 * Print Google Flow prompts + narration for each section-guide beat.
 * Run: npm run section-guides:print
 *
 * Workflow:
 * 1) Paste each beat’s FLOW PROMPT into Google Flow / Veo (~10s)
 * 2) Use NARRATION as VO or on-screen calm captions
 * 3) Export MP4 ≈ 10 seconds per beat
 * 4) Upload to HTTPS host and set that beat’s videoUrl in src/sectionGuides/catalog.ts
 */
import {
  SECTION_GUIDE_BEAT_COUNT,
  SECTION_GUIDE_TAB_IDS,
  SECTION_GUIDES,
  sectionGuideBeatHasVideo,
  sectionGuideReadyBeatCount,
} from '../src/sectionGuides/catalog.ts';

let totalBeats = 0;
let readyBeats = 0;

for (const id of SECTION_GUIDE_TAB_IDS) {
  const g = SECTION_GUIDES[id];
  const ready = sectionGuideReadyBeatCount(g);
  console.log('\n' + '='.repeat(72));
  console.log(
    `${g.title}  [${id}]  ·  ${g.beats.length} beats · target ~${g.targetSeconds}s  ·  ${ready}/${g.beats.length} ready`
  );
  console.log(g.blurb);

  for (let i = 0; i < g.beats.length; i++) {
    const beat = g.beats[i];
    totalBeats += 1;
    const beatReady = sectionGuideBeatHasVideo(beat);
    if (beatReady) readyBeats += 1;
    console.log('\n' + '-'.repeat(72));
    console.log(
      `BEAT ${String(i + 1).padStart(2, '0')}/${g.beats.length}  ·  ${beat.title}  [${beat.id}]  ·  ~${beat.targetSeconds}s  ·  ${beatReady ? 'READY' : 'NEED VIDEO'}`
    );
    console.log('\nFLOW PROMPT:\n');
    console.log(beat.flowPrompt);
    console.log('\nNARRATION:\n');
    console.log(beat.narrationScript);
    if (beat.videoUrl) console.log('\nvideoUrl:', beat.videoUrl);
  }
}

console.log('\n' + '='.repeat(72));
console.log(
  `Printed ${SECTION_GUIDE_TAB_IDS.length} sections × ${SECTION_GUIDE_BEAT_COUNT} beats = ${totalBeats} clips (${readyBeats} ready).`
);
