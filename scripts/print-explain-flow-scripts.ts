/**
 * Print Google Flow production scripts for Explain Mode (one 45–60s film per tab).
 *
 *   npm run explain-flow:print
 *   npm run explain-flow:print -- --write-docs
 *   npm run explain-flow:print -- --write-vtt
 *
 * Workflow:
 * 1) Generate SIX ~8–10s shots in Google Flow / Veo using each FLOW PROMPT
 * 2) Stitch in order to the listed target length — never ship a single 3s clip
 * 3) Record NARRATION once over the stitch (fifth-grade, slow)
 * 4) Export 16:9 H.264 MP4 → public/explain-videos/{id}.mp4
 */
import fs from 'node:fs';
import path from 'node:path';
import { EXPLAIN_FLOW_SLOT_IDS } from '../src/components/explain/explainMedia.ts';
import {
  EXPLAIN_FLOW_BRAND_LOOK,
  EXPLAIN_FLOW_NAV_ORDER,
  EXPLAIN_FLOW_NEGATIVE,
  EXPLAIN_FLOW_SCRIPTS,
  EXPLAIN_FLOW_SHOT_COUNT,
  explainFlowToVtt,
  wordCount,
  type ExplainFlowScript,
} from '../src/components/explain/flowScripts.ts';

const args = new Set(process.argv.slice(2));
const writeDocs = args.has('--write-docs');
const writeVtt = args.has('--write-vtt');

function renderMarkdown(scripts: ExplainFlowScript[]): string {
  const lines: string[] = [
    '# Explain Mode — Google Flow scripts',
    '',
    'One **45–60 second** film per nav pill. Fifth-grade voice. Name the color. Say “click.” Assume they have never used a website.',
    '',
    'People tap **Need extra understanding**, then the little play badge beside a tab.',
    '',
    '## How to produce',
    '',
    '1. Open Google Flow (Veo). Aspect **16:9**. Very colorful museum lighting. Giant cartoon cursor.',
    '2. Generate **six shots** per tab (Flow still likes ~8–10 seconds each).',
    '3. Stitch them in numbered order to the listed target length. **Do not ship one 3-second clip.**',
    '4. Record the **continuous narration** once over the stitch. Fifth-grade. About 110 words per minute. Pause after every sentence.',
    '5. Export H.264 MP4 at 1280×720 or 1920×1080.',
    '6. Drop the file at `public/explain-videos/{id}.mp4`. Optional poster `{id}.jpg`. Captions `{id}.vtt` (this script can write them).',
    '',
    `**Look:** ${EXPLAIN_FLOW_BRAND_LOOK}`,
    '',
    `**Never on screen:** ${EXPLAIN_FLOW_NEGATIVE}`,
    '',
    'These films are extra explanation, not trading advice. ClearPath is not a broker.',
    '',
  ];

  for (const script of scripts) {
    lines.push(`---`, ``);
    lines.push(`## ${script.navLabel} — ${script.title}`);
    lines.push(``);
    lines.push(`| | |`);
    lines.push(`|---|---|`);
    lines.push(`| Slot / filename | \`${script.id}.mp4\` |`);
    lines.push(`| Accent | \`${script.color}\` |`);
    lines.push(`| Length | **${script.targetSeconds} seconds** |`);
    lines.push(`| Logline | ${script.logline} |`);
    lines.push(`| Music | ${script.music} |`);
    lines.push(`| Captions | ${script.captionsNote} |`);
    lines.push(``);
    lines.push(`### Continuous narration (record once)`);
    lines.push(``);
    lines.push(`> ${script.narrationScript}`);
    lines.push(``);
    lines.push(`_${wordCount(script.narrationScript)} words._`);
    lines.push(``);
    lines.push(`### Master Flow prompt`);
    lines.push(``);
    lines.push('```');
    lines.push(script.masterFlowPrompt);
    lines.push('```');
    lines.push(``);
    for (const shot of script.shots) {
      lines.push(
        `### Shot ${shot.id} · ${shot.startSeconds}–${shot.endSeconds}s · ${shot.title}`,
      );
      lines.push(``);
      if (shot.super) lines.push(`On-screen super (optional, ≤6 words): **${shot.super}**`);
      lines.push(``);
      lines.push(`**VO on this shot:** ${shot.narration}`);
      lines.push(``);
      lines.push('```');
      lines.push(shot.flowPrompt);
      lines.push('```');
      lines.push(``);
    }
  }

  lines.push(`---`, ``);
  lines.push(
    `Education-family extras (not top-nav pills, but same player): Literacy OS, Encyclopedia of Finance, Encyclopedia of Indicators.`,
  );
  lines.push(``);
  return lines.join('\n');
}

const navScripts = EXPLAIN_FLOW_NAV_ORDER.map((id) => EXPLAIN_FLOW_SCRIPTS[id]);
const extraIds = EXPLAIN_FLOW_SLOT_IDS.filter(
  (id) => !EXPLAIN_FLOW_NAV_ORDER.includes(id),
);
const extraScripts = extraIds.map((id) => EXPLAIN_FLOW_SCRIPTS[id]);
const all = [...navScripts, ...extraScripts];

if (writeDocs) {
  const dest = path.resolve('docs/explain-flow-scripts.md');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, renderMarkdown(all), 'utf8');
  console.log(`Wrote ${dest}`);
} else {
  console.log(renderMarkdown(all));
}

if (writeVtt) {
  const dir = path.resolve('public/explain-videos');
  fs.mkdirSync(dir, { recursive: true });
  for (const script of all) {
    const dest = path.join(dir, `${script.id}.vtt`);
    fs.writeFileSync(dest, explainFlowToVtt(script), 'utf8');
    console.log(`Wrote ${dest}`);
  }
}

console.log(
  `\n${all.length} films · ${all.length * EXPLAIN_FLOW_SHOT_COUNT} Flow shots · nav pills ${navScripts.length}`,
);
