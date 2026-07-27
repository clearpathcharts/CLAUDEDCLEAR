/** ClearPath Social OS — shared types for site-owned scheduling */

export type SocialPlatform =
  | 'x'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'reddit';

export type PostStatus =
  | 'draft'
  | 'queued'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled';

/** Site-owned publisher — Buffer only (no Zapier). */
export type PublishMode = 'dry_run' | 'buffer';

export type SocialPost = {
  id: string;
  createdAt: string;
  updatedAt: string;
  platform: SocialPlatform;
  title?: string;
  body: string;
  linkUrl?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: string;
  status: PostStatus;
  publishMode: PublishMode;
  bufferProfileId?: string;
  externalIds?: {
    bufferUpdateId?: string;
  };
  lastError?: string;
  publishedAt?: string;
  source?: 'manual' | 'template' | 'growth_os' | 'api';
  meta?: Record<string, unknown>;
};

export type SocialOsConfig = {
  siteUrl: string;
  brandName: string;
  defaultLinkUrl: string;
  utmCampaign: string;
  dryRun: boolean;
  bufferConfigured: boolean;
  schedulerIntervalMs: number;
};

export type CreatePostInput = {
  platform: SocialPlatform;
  body: string;
  title?: string;
  linkUrl?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  scheduledAt?: string | null;
  status?: 'draft' | 'queued';
  publishMode?: PublishMode;
  bufferProfileId?: string;
  source?: SocialPost['source'];
  meta?: Record<string, unknown>;
};

export type TemplateKind =
  | 'clarity_cta'
  | 'education_tip'
  | 'founder_story'
  | 'feature_highlight'
  | 'market_lesson';
