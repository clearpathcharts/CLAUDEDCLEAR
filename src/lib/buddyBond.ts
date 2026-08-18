/** Shared C.P.T. Buddy bond / affect types (safe for client + server). */

export const AFFECT_LABELS = [
  'calm',
  'happiness',
  'sadness',
  'fear',
  'anger',
  'frustration',
  'overwhelm',
  'pain',
  'loneliness',
  'grief_loss',
  'love_care',
  'mixed',
  'unknown',
] as const;

export type AffectLabel = (typeof AFFECT_LABELS)[number];

export type BuddyBondProfile = {
  conversationDepth?: number;
  preferredPace?: 'short' | 'warm' | 'deep';
  knownNeuro?: string[];
  emotionalThemes?: string[];
  lastMood?: {
    primary: AffectLabel;
    intensity: number;
    at: number;
    note?: string;
  };
  likesDayCheckIn?: boolean;
  growthNotes?: string[];
};
