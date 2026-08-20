/**
 * Print Google Flow prompts + narration for each section guide.
 * Run: npm run section-guides:print
 *
 * Workflow:
 * 1) Paste flowPrompt into Google Flow / Veo
 * 2) Use narrationScript as VO or on-screen calm captions
 * 3) Export MP4 ≤ 3 minutes
 * 4) Upload to HTTPS host and set videoUrl in src/sectionGuides/catalog.ts
 */
import { SECTION_GUIDE_TAB_IDS, SECTION_GUIDES } from '../src/sectionGuides/catalog.ts';

for (const id of SECTION_GUIDE_TAB_IDS) {
  const g = SECTION_GUIDES[id];
  const ready = g.videoUrl ? 'READY' : 'NEED VIDEO';
  console.log('\n' + '='.repeat(72));
  console.log(`${g.title}  [${id}]  target ~${g.targetSeconds}s  ·  ${ready}`);
  console.log('-'.repeat(72));
  console.log('FLOW PROMPT:\n');
  console.log(g.flowPrompt);
  console.log('\nNARRATION:\n');
  console.log(g.narrationScript);
  if (g.videoUrl) console.log('\nvideoUrl:', g.videoUrl);
}

console.log('\n' + '='.repeat(72));
console.log(`Printed ${SECTION_GUIDE_TAB_IDS.length} section guides.`);
