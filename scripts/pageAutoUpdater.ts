#!/usr/bin/env tsx
/**
 * Page Auto Updater — syncs River hero media + manifest for marketing surfaces.
 * Run: npm run page:auto-update
 *
 * Copies latest upload videos (if present) into public/river/ and writes manifest.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC_RIVER = path.join(ROOT, "public", "river");
const MANIFEST_PATH = path.join(PUBLIC_RIVER, "page-manifest.json");

const UPLOAD_CANDIDATES = [
  {
    key: "hero-tributaries-charts",
    patterns: [/Data_river_splits_into_tributaries/i, /tributaries/i],
  },
  {
    key: "hero-genie-workstation",
    patterns: [/River_current_animation/i, /genie.*workstation/i, /current_animation/i],
  },
] as const;

function findUploadsDir(): string | null {
  const candidates = [
    path.join(ROOT, "uploads"),
    "/home/ubuntu/.cursor/projects/workspace/uploads",
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

function copyHeroVideos(): string[] {
  const uploads = findUploadsDir();
  if (!uploads) {
    console.log("[page:auto-update] No uploads directory — keeping existing public/river videos.");
    return [];
  }

  fs.mkdirSync(PUBLIC_RIVER, { recursive: true });
  const files = fs.readdirSync(uploads).filter((f) => f.endsWith(".mp4"));
  const copied: string[] = [];

  for (const target of UPLOAD_CANDIDATES) {
    const match = files.find((f) => target.patterns.some((re) => re.test(f)));
    if (!match) continue;
    const dest = path.join(PUBLIC_RIVER, `${target.key}.mp4`);
    fs.copyFileSync(path.join(uploads, match), dest);
    copied.push(`${target.key}.mp4`);
    console.log(`[page:auto-update] Copied ${match} → public/river/${target.key}.mp4`);
  }

  return copied;
}

function writeManifest(copied: string[]) {
  fs.mkdirSync(PUBLIC_RIVER, { recursive: true });
  const manifest = {
    page: "river",
    version: "1.2.0",
    updatedAt: new Date().toISOString(),
    videos: {
      genieWorkstation: "/river/hero-genie-workstation.mp4",
      tributariesCharts: "/river/hero-tributaries-charts.mp4",
    },
    lastCopied: copied,
    contentSource: "src/river/marketing/riverPageContent.ts",
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`[page:auto-update] Wrote ${MANIFEST_PATH}`);
}

const copied = copyHeroVideos();
writeManifest(copied);
console.log("[page:auto-update] Done. Surfaces: RiverWorkstation hero, DiscoveryFeed tile.");
