/**
 * Google Flow drop slots for explain overlays.
 *
 * Export from Flow as 16:9 landscape (1280×720 or 1920×1080), H.264 MP4,
 * stitch six ~8–10s shots into one 45–60s film. Fifth-grade VO. No buy/sell text.
 * Optional still: same name .jpg. Production bible: flowScripts.ts.
 *
 * Files (not committed — drop on the host / Cloud Run volume or rebuild):
 *   public/explain-videos/{id}.mp4
 *   public/explain-videos/{id}.jpg
 *   public/explain-videos/{id}.vtt   (captions, optional)
 */
export const EXPLAIN_VIDEO_PUBLIC_DIR = '/explain-videos';

export const EXPLAIN_FLOW_SLOT_IDS = [
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
  'literacy',
  'encyclopedia',
  'indicators',
] as const;

export type ExplainFlowSlotId = (typeof EXPLAIN_FLOW_SLOT_IDS)[number];

export type ExplainFlowAspect = '16:9' | '9:16';

export function isExplainFlowSlotId(id: string): id is ExplainFlowSlotId {
  return (EXPLAIN_FLOW_SLOT_IDS as readonly string[]).includes(id);
}

export function explainVideoSrc(id: string, explicit?: string): string {
  const trimmed = (explicit || '').trim();
  if (trimmed) return trimmed;
  return `${EXPLAIN_VIDEO_PUBLIC_DIR}/${id}.mp4`;
}

export function explainPosterSrc(id: string, explicit?: string): string {
  const trimmed = (explicit || '').trim();
  if (trimmed) return trimmed;
  return `${EXPLAIN_VIDEO_PUBLIC_DIR}/${id}.jpg`;
}

export function explainCaptionsSrc(id: string): string {
  return `${EXPLAIN_VIDEO_PUBLIC_DIR}/${id}.vtt`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  const n = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const int = Number.parseInt(n, 16);
  if (!Number.isFinite(int)) return `rgba(0,229,255,${alpha})`;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
