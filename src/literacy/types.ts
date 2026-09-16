export type LiteracyPanelId =
  | "brief"
  | "vault"
  | "wiki"
  | "sentinel"
  | "lms"
  | "pantry"
  | "listen"
  | "truth"
  | "trust"
  | "coach"
  | "pins"
  | "patterns"
  | "encyclopedia"
  | "appealing";

export interface VaultItem {
  id: string;
  title: string;
  body: string;
  kind: "chart" | "note" | "lesson" | "podcast" | "mentor" | "other";
  tags: string[];
  sourceUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WikiNode {
  id: string;
  title: string;
  summary: string;
  body: string;
  links: string[];
  tags: string[];
  updatedAt: number;
}

export interface SentinelSource {
  id: string;
  label: string;
  url: string;
  agency: string;
}

export interface SentinelSnapshot {
  sourceId: string;
  url: string;
  hash: string;
  title: string;
  excerpt: string;
  checkedAt: number;
  changed: boolean;
  previousHash?: string;
}

export interface IdeaPin {
  id: string;
  title: string;
  note: string;
  relatedSymbol?: string;
  createdAt: number;
  expiresAt: number;
  lastVerifiedAt?: number;
  verified: boolean;
}

export interface CoachSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  stimLoad: 1 | 2 | 3 | 4 | 5;
  focusMinutes: number;
  notes: string;
}

export interface TrustRecord {
  id: string;
  question: string;
  answer: string;
  score: number;
  reasons: string[];
  createdAt: number;
}

export interface MediaFeedItem {
  id: string;
  title: string;
  link?: string;
  description?: string;
  timestamp: number;
  feedLabel: string;
}

export interface LiteracyProgress {
  passedLessonIds: string[];
  preferredNeuroProfileId?: string;
}

export interface LiteracyStore {
  vault: VaultItem[];
  wiki: WikiNode[];
  sentinel: Record<string, SentinelSnapshot>;
  pins: IdeaPin[];
  coachSessions: CoachSession[];
  trust: TrustRecord[];
  progress: LiteracyProgress;
  pantryFeedUrls: string[];
  listenQueue: Array<{ id: string; title: string; audioUrl?: string; notes: string; concepts: string[] }>;
}
